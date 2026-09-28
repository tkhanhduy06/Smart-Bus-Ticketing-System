import base64
from datetime import datetime
import io
import uuid
from flask import Blueprint, jsonify, request
import jwt
import qrcode
from sqlalchemy import bindparam, text

bookings_bp = Blueprint('bookings_bp', __name__)

# Khóa bí mật dùng để mã hóa thông tin vé trong QR (chống khách tự sửa đổi thông tin)
QR_SECRET_KEY = 'SMART_BUS_SECRET_KEY_FOR_E_TICKET_VERIFY'


# ==========================================
# HÀM TỰ ĐỘNG NHẢ GHẾ QUÁ 10 PHÚT CHƯA THANH TOÁN
# ==========================================
def release_expired_bookings(db):
  """Kiểm tra và nhả lại các ghế của đơn vé 'pending' quá 10 phút."""
  try:
    # 1. Tìm các đơn booking 'pending' đã tạo hơn 10 phút
    find_expired_sql = text("""
            SELECT id, booking_code 
            FROM bookings 
            WHERE status = 'pending' 
              AND created_at <= NOW() - INTERVAL 10 MINUTE
        """)
    expired_bookings = (
        db.session.execute(find_expired_sql).mappings().fetchall()
    )

    if not expired_bookings:
      return 0  # Không có đơn nào hết hạn

    expired_ids = [b['id'] for b in expired_bookings]

    # 2. Cập nhật các ghế liên quan về trạng thái trống 'available'
    update_seats_sql = text("""
            UPDATE seats 
            SET status = 'available', 
                booking_id = NULL, 
                passenger_name = NULL, 
                passenger_phone = NULL
            WHERE booking_id IN :expired_ids
        """).bindparams(bindparam('expired_ids', expanding=True))

    db.session.execute(update_seats_sql, {'expired_ids': expired_ids})

    # 3. Cập nhật trạng thái đơn đặt vé thành 'cancelled'
    update_bookings_sql = text("""
            UPDATE bookings 
            SET status = 'cancelled' 
            WHERE id IN :expired_ids
        """).bindparams(bindparam('expired_ids', expanding=True))

    db.session.execute(update_bookings_sql, {'expired_ids': expired_ids})

    db.session.commit()
    print(
        f'⏰ [JOB NHẢ GHẾ] Đã tự động hủy {len(expired_ids)} đơn quá hạn 10 phút và nhả lại ghế trống!'
    )
    return len(expired_ids)

  except Exception as e:
    db.session.rollback()
    print(f'❌ [JOB NHẢ GHẾ ERROR] Lỗi: {str(e)}')
    return 0


# ==========================================
# HÀM HỖ TRỢ: MÃ HÓA DỮ LIỆU & SINH ẢNH QR BASE64
# ==========================================
def generate_ticket_qr(booking_code, trip_id, seats_str, passenger_phone):
  payload = {
      'booking_code': booking_code,
      'trip_id': trip_id,
      'seats': seats_str,
      'phone': passenger_phone,
      'iss': 'SmartBusSystem',
      'type': 'TICKET_CHECKIN',
  }
  # Mã hóa dữ liệu thành chuỗi Token JWT an toàn
  encrypted_token = jwt.encode(payload, QR_SECRET_KEY, algorithm='HS256')

  # Sinh ảnh QR chứa chuỗi Token
  qr = qrcode.QRCode(
      version=1,
      error_correction=qrcode.constants.ERROR_CORRECT_M,
      box_size=8,
      border=3,
  )
  qr.add_data(encrypted_token)
  qr.make(fit=True)

  img = qr.make_image(fill_color='black', back_color='white')

  # Chuyển ảnh QR thành chuỗi Base64
  buffered = io.BytesIO()
  img.save(buffered, format='PNG')
  qr_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

  return f'data:image/png;base64,{qr_base64}', encrypted_token


# ==========================================
# 1. TÌM KIẾM CHUYẾN XE (SEARCH TRIPS)
# ==========================================
@bookings_bp.route('/api/trips/search', methods=['GET'])
def search_trips():
  from routes.bus_routes import db

  origin = request.args.get('origin')
  destination = request.args.get('destination')
  date_str = request.args.get('date')  # Dạng: YYYY-MM-DD

  if not origin or not destination:
    return (
        jsonify(
            {'success': False, 'message': 'Thiếu điểm đi hoặc điểm đến'}
        ),
        400,
    )

  query = """
        SELECT 
            t.id AS trip_id, 
            r.route_name, r.origin, r.destination, 
            b.bus_number, b.bus_type, b.total_seats,
            t.departure_time, t.arrival_time, t.base_price, t.status,
            COUNT(CASE WHEN s.status = 'available' THEN 1 END) AS available_seats
        FROM trips t
        JOIN routes r ON t.route_id = r.id
        JOIN buses b ON t.bus_id = b.id
        LEFT JOIN seats s ON s.trip_id = t.id
        WHERE r.origin LIKE :origin 
          AND r.destination LIKE :destination
          AND t.status = 'scheduled'
    """
  params = {'origin': f'%{origin}%', 'destination': f'%{destination}%'}

  if date_str:
    query += ' AND DATE(t.departure_time) = :date_str'
    params['date_str'] = date_str

  query += ' GROUP BY t.id ORDER BY t.departure_time ASC'

  trips = db.session.execute(text(query), params).mappings().fetchall()
  return jsonify({'success': True, 'data': [dict(t) for t in trips]}), 200


# ==========================================
# 2. XEM SƠ ĐỒ GHẾ CỦA CHUYẾN XE
# ==========================================
@bookings_bp.route('/api/trips/<int:trip_id>/seats', methods=['GET'])
def get_trip_seats(trip_id):
  from routes.bus_routes import db

  # 1. Tự động dọn dẹp ghế quá hạn trước khi trả dữ liệu sơ đồ ghế cho Frontend
  release_expired_bookings(db)

  # 2. Lấy thông tin chuyến xe & xe buýt
  trip_info_sql = text("""
        SELECT t.base_price, b.bus_number, b.bus_type 
        FROM trips t
        JOIN buses b ON t.bus_id = b.id
        WHERE t.id = :trip_id
    """)
  trip_info = (
      db.session.execute(trip_info_sql, {'trip_id': trip_id}).mappings().first()
  )

  if not trip_info:
    return (
        jsonify({'success': False, 'message': 'Không tìm thấy chuyến xe'}),
        404,
    )

  # 3. Truy vấn danh sách ghế
  seats_sql = text("""
        SELECT id, seat_number, floor_level, surcharge, status, passenger_name
        FROM seats 
        WHERE trip_id = :trip_id
        ORDER BY seat_number ASC
    """)
  seats_db = (
      db.session.execute(seats_sql, {'trip_id': trip_id}).mappings().fetchall()
  )
  seats_list = [dict(s) for s in seats_db]

  # 4. Thống kê số lượng ghế
  available_count = sum(1 for s in seats_list if s['status'] == 'available')
  booked_count = sum(1 for s in seats_list if s['status'] != 'available')

  return (
      jsonify({
          'success': True,
          'message': 'Lấy danh sách ghế thành công',
          'data': {
              'bus_number': trip_info['bus_number'],
              'bus_type': trip_info['bus_type'],
              'base_price': float(trip_info['base_price']),
              'available_count': available_count,
              'booked_count': booked_count,
              'seats': seats_list,
          },
      }),
      200,
  )


# ==========================================
# 3. TẠO ĐƠN ĐẶT VÉ (BOOKING) + TÍNH VOUCHER
# ==========================================
@bookings_bp.route('/api/bookings', methods=['POST'])
def create_booking():
  from routes.bus_routes import db

  data = request.json or {}
  user_id = data.get('user_id', 1)  # Mặc định người dùng ID 1 nếu chưa đăng nhập
  trip_id = data.get('trip_id')
  seat_numbers = data.get(
      'seat_numbers', []
  )  # Danh sách ghế chọn, VD: ["A01", "A02"]
  voucher_code = data.get('voucher_code')
  pickup_location_id = data.get('pickup_location_id')
  dropoff_location_id = data.get('dropoff_location_id')
  passenger_name = data.get('passenger_name', 'Khách hàng')
  passenger_phone = data.get('passenger_phone', '0900000000')

  if not trip_id or not seat_numbers:
    return (
        jsonify({
            'success': False,
            'message': 'Thiếu trip_id hoặc danh sách ghế chọn',
        }),
        400,
    )

  try:
    # 1. Kiểm tra Chuyến xe và Giá vé cơ bản
    trip = (
        db.session.execute(
            text(
                'SELECT base_price FROM trips WHERE id = :id AND status ='
                ' "scheduled"'
            ),
            {'id': trip_id},
        )
        .mappings()
        .first()
    )

    if not trip:
      return (
          jsonify({
              'success': False,
              'message': 'Chuyến xe không tồn tại hoặc đã hủy',
          }),
          404,
      )

    base_price = float(trip['base_price'])

    # 2. Kiểm tra danh sách ghế chọn
    check_seats_sql = text("""
            SELECT id, seat_number, surcharge, status 
            FROM seats 
            WHERE trip_id = :trip_id AND seat_number IN :seat_list
        """).bindparams(bindparam('seat_list', expanding=True))

    seats = (
        db.session.execute(
            check_seats_sql,
            {'trip_id': trip_id, 'seat_list': seat_numbers},
        )
        .mappings()
        .fetchall()
    )

    if len(seats) != len(seat_numbers):
      return (
          jsonify({
              'success': False,
              'message': 'Một số ghế chọn không tồn tại',
          }),
          400,
      )

    subtotal_amount = 0.0
    for s in seats:
      if s['status'] != 'available':
        return (
            jsonify({
                'success': False,
                'message': (
                    f"Ghế {s['seat_number']} đã có người đặt/giữ chỗ"
                ),
            }),
            400,
        )
      subtotal_amount += base_price + float(s['surcharge'])

    # 3. Tính toán Voucher giảm giá
    discount_amount = 0.0
    voucher_id = None
    if voucher_code:
      voucher = (
          db.session.execute(
              text("""
                    SELECT id, discount_type, discount_value, max_discount_amount, min_booking_amount, valid_from, valid_to
                    FROM vouchers 
                    WHERE code = :code AND valid_from <= NOW() AND valid_to >= NOW()
                """),
              {'code': voucher_code},
          )
          .mappings()
          .first()
      )

      if voucher and subtotal_amount >= float(voucher['min_booking_amount']):
        voucher_id = voucher['id']
        if voucher['discount_type'] == 'fixed':
          discount_amount = float(voucher['discount_value'])
        elif voucher['discount_type'] == 'percent':
          discount_amount = (
              subtotal_amount * float(voucher['discount_value'])
          ) / 100.0
          if voucher['max_discount_amount']:
            discount_amount = min(
                discount_amount, float(voucher['max_discount_amount'])
            )

    total_amount = max(0.0, subtotal_amount - discount_amount)

    # 4. Tạo mã đơn đặt vé
    booking_code = (
        f"BUS{datetime.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:4].upper()}"
    )

    # 5. Lưu đơn vào CSDL
    booking_sql = text("""
            INSERT INTO bookings (
                booking_code, user_id, trip_id, pickup_location_id, dropoff_location_id, 
                voucher_id, subtotal_amount, discount_amount, total_amount, status
            ) VALUES (
                :code, :user_id, :trip_id, :pickup_id, :dropoff_id, 
                :voucher_id, :subtotal, :discount, :total, 'pending'
            )
        """)
    res = db.session.execute(
        booking_sql,
        {
            'code': booking_code,
            'user_id': user_id,
            'trip_id': trip_id,
            'pickup_id': pickup_location_id,
            'dropoff_id': dropoff_location_id,
            'voucher_id': voucher_id,
            'subtotal': subtotal_amount,
            'discount': discount_amount,
            'total': total_amount,
        },
    )
    booking_id = res.lastrowid

    # 6. Cập nhật ghế thành 'booked'
    update_seat_sql = text("""
            UPDATE seats 
            SET status = 'booked', booking_id = :booking_id, passenger_name = :p_name, passenger_phone = :p_phone
            WHERE trip_id = :trip_id AND seat_number IN :seat_list
        """).bindparams(bindparam('seat_list', expanding=True))

    db.session.execute(
        update_seat_sql,
        {
            'booking_id': booking_id,
            'p_name': passenger_name,
            'p_phone': passenger_phone,
            'trip_id': trip_id,
            'seat_list': seat_numbers,
        },
    )

    db.session.commit()

    return (
        jsonify({
            'success': True,
            'message': 'Tạo đơn đặt vé thành công',
            'data': {
                'booking_id': booking_id,
                'booking_code': booking_code,
                'subtotal_amount': subtotal_amount,
                'discount_amount': discount_amount,
                'total_amount': total_amount,
                'status': 'pending',
            },
        }),
        201,
    )

  except Exception as e:
    db.session.rollback()
    return jsonify({'success': False, 'error': str(e)}), 500


# ==========================================
# 4. LẤY DỮ LIỆU VÉ ĐIỆN TỬ + ẢNH MÃ QR
# ==========================================
@bookings_bp.route('/api/bookings/<string:booking_code>/e-ticket', methods=['GET'])
def get_e_ticket(booking_code):
  from routes.bus_routes import db

  query = """
        SELECT 
            b.id AS booking_id,
            b.booking_code,
            b.status AS booking_status,
            b.subtotal_amount,
            b.discount_amount,
            b.total_amount,
            b.created_at,
            t.id AS trip_id,
            t.departure_time,
            t.arrival_time,
            r.route_name,
            r.origin,
            r.destination,
            bus.bus_number,
            bus.bus_type,
            GROUP_CONCAT(s.seat_number ORDER BY s.seat_number ASC SEPARATOR ', ') AS seats_list,
            MAX(s.passenger_name) AS passenger_name,
            MAX(s.passenger_phone) AS passenger_phone
        FROM bookings b
        JOIN trips t ON b.trip_id = t.id
        JOIN routes r ON t.route_id = r.id
        JOIN buses bus ON t.bus_id = bus.id
        LEFT JOIN seats s ON s.booking_id = b.id
        WHERE b.booking_code = :code
        GROUP BY b.id
    """
  booking = (
      db.session.execute(text(query), {'code': booking_code}).mappings().first()
  )

  if not booking:
    return jsonify({'success': False, 'message': 'Không tìm thấy vé xe'}), 404

  if booking['booking_status'] != 'confirmed':
    return (
        jsonify({
            'success': False,
            'message': (
                'Vé điện tử chỉ khả dụng khi đơn hàng đã thanh toán thành công'
                ' (status = confirmed).'
            ),
        }),
        400,
    )

  # Sinh mã QR
  qr_code_base64, raw_token = generate_ticket_qr(
      booking_code=booking['booking_code'],
      trip_id=booking['trip_id'],
      seats_str=booking['seats_list'] or '',
      passenger_phone=booking['passenger_phone'] or '',
  )

  ticket_data = dict(booking)
  ticket_data['qr_code_image'] = qr_code_base64
  ticket_data['qr_token'] = raw_token

  return (
      jsonify({
          'success': True,
          'message': 'Lấy vé điện tử thành công',
          'data': ticket_data,
      }),
      200,
  )


# ==========================================
# 5. API DÀNH CHO TÀI XẾ / LƠ XE SCAN MÃ QR CHECK-IN
# ==========================================
@bookings_bp.route('/api/bookings/scan-qr', methods=['POST'])
def scan_qr_code():
  from routes.bus_routes import db

  data = request.json or {}
  qr_token = data.get('qr_token')

  if not qr_token:
    return jsonify({'success': False, 'message': 'Thiếu qr_token'}), 400

  try:
    # Giải mã token để lấy thông tin
    decoded = jwt.decode(qr_token, QR_SECRET_KEY, algorithms=['HS256'])
    booking_code = decoded.get('booking_code')

    # Đối chiếu CSDL
    booking = (
        db.session.execute(
            text(
                'SELECT id, status FROM bookings WHERE booking_code = :code'
            ),
            {'code': booking_code},
        )
        .mappings()
        .first()
    )

    if not booking:
      return (
          jsonify(
              {'success': False, 'message': 'Vé không tồn tại trên hệ thống'}
          ),
          404,
      )

    if booking['status'] != 'confirmed':
      return (
          jsonify({
              'success': False,
              'message': (
                  f"Vé không hợp lệ! Trạng thái đơn: {booking['status']}"
              ),
          }),
          400,
      )

    return (
        jsonify({
            'success': True,
            'message': 'VÉ HỢP LỆ! XÁC NHẬN CHO KHÁCH LÊN XE.',
            'data': {
                'booking_code': booking_code,
                'seats': decoded.get('seats'),
                'phone': decoded.get('phone'),
                'trip_id': decoded.get('trip_id'),
            },
        }),
        200,
    )

  except jwt.ExpiredSignatureError:
    return jsonify({'success': False, 'message': 'Mã QR đã hết hạn'}), 400
  except jwt.InvalidTokenError:
    return (
        jsonify({
            'success': False,
            'message': 'CẢNH BÁO: Mã QR giả mạo hoặc sai định dạng!',
        }),
        400,
    )


# ==========================================
# 6. XEM LỊCH SỬ ĐẶT VÉ CỦA USER
# ==========================================
@bookings_bp.route('/api/users/<int:user_id>/bookings', methods=['GET'])
def get_user_bookings(user_id):
  from routes.bus_routes import db

  query = """
        SELECT 
            b.id AS booking_id,
            b.booking_code,
            b.status AS booking_status,
            b.total_amount,
            b.created_at,
            r.route_name,
            t.departure_time,
            bus.bus_number
        FROM bookings b
        JOIN trips t ON b.trip_id = t.id
        JOIN routes r ON t.route_id = r.id
        JOIN buses bus ON t.bus_id = bus.id
        WHERE b.user_id = :user_id
        ORDER BY b.created_at DESC
    """
  bookings = (
      db.session.execute(text(query), {'user_id': user_id}).mappings().fetchall()
  )
  return jsonify({'success': True, 'data': [dict(b) for b in bookings]}), 200


# ==========================================
# 7. API DỌN GHẾ QUÁ HẠN (TRIGGER THỦ CÔNG)
# ==========================================
@bookings_bp.route('/api/bookings/cleanup-expired', methods=['POST'])
def manual_cleanup_expired():
  from routes.bus_routes import db

  released_count = release_expired_bookings(db)
  return (
      jsonify({
          'success': True,
          'message': (
              f'Đã xử lý nhả ghế cho {released_count} đơn hàng quá hạn 10'
              ' phút.'
          ),
          'released_bookings_count': released_count,
      }),
      200,
  )