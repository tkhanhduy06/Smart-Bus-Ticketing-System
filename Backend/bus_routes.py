from flask import Blueprint, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text

bus_bp = Blueprint('bus_bp', __name__)
db = SQLAlchemy()


# 1. API Lấy danh sách tuyến đường
@bus_bp.route('/api/routes', methods=['GET'])
def get_routes():
  try:
    sql = text("""
            SELECT id, route_name, origin, destination, distance_km, estimated_duration_min 
            FROM routes
        """)
    result = db.session.execute(sql).mappings().all()
    return jsonify({'success': True, 'data': [dict(row) for row in result]}), 200
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)}), 500


# 2. API Tìm kiếm chuyến xe
@bus_bp.route('/api/trips/search', methods=['GET'])
def search_trips():
  origin = request.args.get('origin')
  destination = request.args.get('destination')
  departure_date = request.args.get('date')

  try:
    query = """
            SELECT 
                t.id AS trip_id,
                r.route_name,
                r.origin,
                r.destination,
                t.departure_time,
                t.arrival_time,
                t.base_price,
                b.bus_number,
                b.bus_type
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            JOIN buses b ON t.bus_id = b.id
            WHERE (:origin IS NULL OR r.origin LIKE :origin)
              AND (:destination IS NULL OR r.destination LIKE :destination)
              AND (:departure_date IS NULL OR DATE(t.departure_time) = :departure_date)
              AND t.status = 'scheduled'
            ORDER BY t.departure_time ASC
        """

    params = {
        'origin': f'%{origin}%' if origin else None,
        'destination': f'%{destination}%' if destination else None,
        'departure_date': departure_date if departure_date else None,
    }

    result = db.session.execute(text(query), params).mappings().all()
    trips_list = [dict(row) for row in result]
    return (
        jsonify(
            {'success': True, 'total': len(trips_list), 'data': trips_list}
        ),
        200,
    )
  except Exception as e:
    return jsonify({'success': False, 'error': str(e)}), 500


# 3. API Lấy sơ đồ ghế và trạng thái đặt ghế của một chuyến xe
@bus_bp.route('/api/trips/<int:trip_id>/seats', methods=['GET'])
def get_trip_seats(trip_id):
  try:
    bus_sql = text("""
            SELECT b.total_seats, b.bus_number, b.bus_type, t.base_price
            FROM trips t
            JOIN buses b ON t.bus_id = b.id
            WHERE t.id = :trip_id
        """)
    bus_info = (
        db.session.execute(bus_sql, {'trip_id': trip_id}).mappings().first()
    )

    if not bus_info:
      return (
          jsonify({'success': False, 'message': 'Không tìm thấy chuyến xe'}),
          404,
      )

    total_seats = bus_info['total_seats'] or 36

    seats_sql = text("""
            SELECT seat_number, floor_level, surcharge, status 
            FROM seats 
            WHERE trip_id = :trip_id
            ORDER BY floor_level ASC, seat_number ASC
        """)
    db_seats = (
        db.session.execute(seats_sql, {'trip_id': trip_id}).mappings().all()
    )

    seats_layout = []

    if db_seats:
      seats_layout = [dict(s) for s in db_seats]
    else:
      seats_per_floor = total_seats // 2
      for i in range(1, total_seats + 1):
        if i <= seats_per_floor:
          floor = 'A'
          seat_code = f'A{i:02d}'
        else:
          floor = 'B'
          seat_code = f'B{(i - seats_per_floor):02d}'

        seats_layout.append({
            'seat_number': seat_code,
            'floor_level': floor,
            'surcharge': 0.0,
            'status': 'available',
        })

    booked_count = sum(
        1 for s in seats_layout if s['status'] != 'available'
    )
    available_count = len(seats_layout) - booked_count

    return (
        jsonify({
            'success': True,
            'data': {
                'trip_id': trip_id,
                'bus_number': bus_info['bus_number'],
                'bus_type': bus_info['bus_type'],
                'base_price': float(bus_info['base_price']),
                'total_seats': len(seats_layout),
                'booked_count': booked_count,
                'available_count': available_count,
                'seats': seats_layout,
            },
        }),
        200,
    )

  except Exception as e:
    return jsonify({'success': False, 'error': str(e)}), 500


# 4. API Hủy vé chủ động cho Khách hàng
@bus_bp.route('/api/bookings/cancel', methods=['POST'])
def cancel_booking():
  data = request.json or {}
  booking_code = data.get('booking_code')

  if not booking_code:
    return jsonify({'success': False, 'message': 'Thiếu mã booking_code'}), 400

  try:
    booking_sql = text("""
            SELECT id, status 
            FROM bookings 
            WHERE booking_code = :code
        """)
    booking = (
        db.session.execute(booking_sql, {'code': booking_code})
        .mappings()
        .first()
    )

    if not booking:
      return (
          jsonify(
              {'success': False, 'message': 'Không tìm thấy đơn đặt vé này'}
          ),
          404,
      )

    if booking['status'] == 'cancelled':
      return (
          jsonify(
              {'success': False, 'message': 'Đơn hàng này đã bị hủy từ trước'}
          ),
          400,
      )

    # 1. Cập nhật trạng thái booking -> cancelled
    db.session.execute(
        text("UPDATE bookings SET status = 'cancelled' WHERE id = :id"),
        {'id': booking['id']},
    )

    # 2. Giải phóng ghế về trống
    db.session.execute(
        text("""
            UPDATE seats 
            SET status = 'available', booking_id = NULL 
            WHERE booking_id = :id
        """),
        {'id': booking['id']},
    )

    db.session.commit()

    return (
        jsonify({
            'success': True,
            'message': (
                f'Hủy đơn hàng {booking_code} thành công. Đã giải phóng các ghế'
                ' về trạng thái trống!'
            ),
        }),
        200,
    )

  except Exception as e:
    db.session.rollback()
    return jsonify({'success': False, 'error': str(e)}), 500


# 5. API Admin Tạo chuyến xe & Sinh ghế tự động tầng A/B
@bus_bp.route('/api/trips', methods=['POST'])
def create_trip():
  data = request.json or {}
  route_id = data.get('route_id')
  bus_id = data.get('bus_id')
  departure_time = data.get('departure_time')
  arrival_time = data.get('arrival_time')
  base_price = data.get('base_price')

  if not all([route_id, bus_id, departure_time, arrival_time, base_price]):
    return (
        jsonify({
            'success': False,
            'message': (
                'Thiếu tham số: route_id, bus_id, departure_time, arrival_time,'
                ' base_price'
            ),
        }),
        400,
    )

  try:
    bus_sql = text('SELECT total_seats FROM buses WHERE id = :bus_id')
    bus = db.session.execute(bus_sql, {'bus_id': bus_id}).mappings().first()

    if not bus:
      return (
          jsonify(
              {'success': False, 'message': 'Xe buýt không tồn tại trên hệ thống'}
          ),
          404,
      )

    total_seats = bus['total_seats'] or 36

    # 1. Thêm chuyến xe vào DB
    insert_trip_sql = text("""
            INSERT INTO trips (route_id, bus_id, departure_time, arrival_time, base_price, status)
            VALUES (:route_id, :bus_id, :departure_time, :arrival_time, :base_price, 'scheduled')
        """)
    res = db.session.execute(
        insert_trip_sql,
        {
            'route_id': route_id,
            'bus_id': bus_id,
            'departure_time': departure_time,
            'arrival_time': arrival_time,
            'base_price': base_price,
        },
    )
    new_trip_id = res.lastrowid

    # 2. Sinh ghế tự động chia đều tầng A (A01..) và tầng B (B01..)
    seats_per_floor = total_seats // 2

    for i in range(1, total_seats + 1):
      if i <= seats_per_floor:
        floor = 'A'
        seat_code = f'A{i:02d}'
      else:
        floor = 'B'
        seat_code = f'B{(i - seats_per_floor):02d}'

      insert_seat_sql = text("""
                INSERT INTO seats (trip_id, seat_number, floor_level, surcharge, status)
                VALUES (:trip_id, :seat_number, :floor_level, 0.0, 'available')
            """)
      db.session.execute(
          insert_seat_sql,
          {
              'trip_id': new_trip_id,
              'seat_number': seat_code,
              'floor_level': floor,
          },
      )

    db.session.commit()

    return (
        jsonify({
            'success': True,
            'message': (
                f'Tạo thành công chuyến xe ID: {new_trip_id} và sinh'
                f' {total_seats} ghế tầng A/B!'
            ),
            'data': {'trip_id': new_trip_id, 'total_seats': total_seats},
        }),
        201,
    )

  except Exception as e:
    db.session.rollback()
    return jsonify({'success': False, 'error': str(e)}), 500