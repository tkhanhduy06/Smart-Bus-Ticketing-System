from datetime import datetime
import hashlib
import hmac
import urllib.parse
from flask import Blueprint, jsonify, request
from sqlalchemy import text

payments_bp = Blueprint('payments_bp', __name__)

# --- KHAI BÁO CẤU HÌNH VNPAY SANDBOX CHUẨN ---
VNP_TMN_CODE = 'JHUXA09P'  # Mã Website Sandbox
VNP_HASH_SECRET = 'YFLGVGQNWDBDAXPCVLWYSMQZKDFXGVNB'  # Chuỗi bí mật HashSecret
VNP_PAYMENT_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
VNP_RETURN_URL = 'http://127.0.0.1:5000/api/payments/callback'


# ==========================================
# 1. TẠO URL THANH TOÁN VNPAY (POST)
# ==========================================
@payments_bp.route('/api/payments/create', methods=['POST'])
def create_payment():
  from routes.bus_routes import db

  data = request.json or {}
  booking_id = data.get('booking_id')

  if not booking_id:
    return jsonify({'success': False, 'message': 'Thiếu booking_id'}), 400

  try:
    # Lấy thông tin đơn hàng
    booking_sql = text(
        'SELECT id, booking_code, total_amount, status FROM bookings WHERE id ='
        ' :id'
    )
    booking = (
        db.session.execute(booking_sql, {'id': booking_id}).mappings().first()
    )

    if not booking:
      return (
          jsonify(
              {'success': False, 'message': 'Không tìm thấy đơn đặt vé'}
          ),
          404,
      )

    if booking['status'] == 'confirmed':
      return (
          jsonify(
              {'success': False, 'message': 'Đơn hàng này đã thanh toán'}
          ),
          400,
      )

    vnp_txn_ref = booking['booking_code']
    amount = int(float(booking['total_amount']) * 100)  # VNPay tính theo VNĐ x100

    vnp_params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': VNP_TMN_CODE,
        'vnp_Amount': str(amount),
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': str(vnp_txn_ref),
        'vnp_OrderInfo': f'Thanh toan ve xe bus {vnp_txn_ref}',
        'vnp_OrderType': 'other',
        'vnp_Locale': 'vn',
        'vnp_ReturnUrl': VNP_RETURN_URL,
        'vnp_IpAddr': request.remote_addr or '127.0.0.1',
        'vnp_CreateDate': datetime.now().strftime('%Y%m%d%H%M%S'),
    }

    # Sắp xếp tham số theo alphabet
    sorted_params = sorted(vnp_params.items())
    query_string = urllib.parse.urlencode(sorted_params)

    # Tạo mã băm chữ ký SecureHash SHA512
    hash_secret = VNP_HASH_SECRET.encode('utf-8')
    secure_hash = hmac.new(
        hash_secret, query_string.encode('utf-8'), hashlib.sha512
    ).hexdigest()

    payment_url = (
        f'{VNP_PAYMENT_URL}?{query_string}&vnp_SecureHash={secure_hash}'
    )

    return (
        jsonify({
            'success': True,
            'message': 'Khởi tạo URL thanh toán thành công.',
            'data': {
                'booking_id': booking['id'],
                'transaction_id': vnp_txn_ref,
                'payment_url': payment_url,
            },
        }),
        200,
    )

  except Exception as e:
    return jsonify({'success': False, 'error': str(e)}), 500


# ==========================================
# 2. XỬ LÝ CALLBACK TRẢ VỀ TỪ VNPAY (GET)
# ==========================================
@payments_bp.route('/api/payments/callback', methods=['GET'])
def vnpay_callback():
  from routes.bus_routes import db

  input_data = request.args.to_dict()
  vnp_secure_hash = input_data.get('vnp_SecureHash')

  # Loại bỏ các tham số hash để xác minh chữ ký
  if 'vnp_SecureHash' in input_data:
    del input_data['vnp_SecureHash']
  if 'vnp_SecureHashType' in input_data:
    del input_data['vnp_SecureHashType']

  # Sắp xếp và tạo lại chữ ký
  sorted_params = sorted(input_data.items())
  query_string = urllib.parse.urlencode(sorted_params)
  hash_secret = VNP_HASH_SECRET.encode('utf-8')
  calculated_hash = hmac.new(
      hash_secret, query_string.encode('utf-8'), hashlib.sha512
  ).hexdigest()

  # ĐÃ SỬA: Chuyển cả 2 về chữ thường (.lower()) trước khi so sánh
  if calculated_hash.lower() != (vnp_secure_hash or '').lower():
    return (
        jsonify({
            'success': False,
            'message': 'Chữ ký không hợp lệ (Invalid Checksum)',
        }),
        400,
    )

  vnp_response_code = input_data.get('vnp_ResponseCode')
  vnp_txn_ref = input_data.get('vnp_TxnRef')
  vnp_transaction_no = input_data.get('vnp_TransactionNo')

  try:
    # Lấy đơn hàng tương ứng
    booking = (
        db.session.execute(
            text(
                'SELECT id, total_amount, status FROM bookings WHERE'
                ' booking_code = :code'
            ),
            {'code': vnp_txn_ref},
        )
        .mappings()
        .first()
    )

    if not booking:
      return (
          jsonify(
              {'success': False, 'message': 'Không tìm thấy đơn hàng'}
          ),
          404,
      )

    # MÃ '00' LÀ THANH TOÁN THÀNH CÔNG TRÊN VNPAY
    if vnp_response_code == '00':
      if booking['status'] != 'confirmed':
        # 1. Đổi trạng thái Booking -> confirmed
        db.session.execute(
            text(
                "UPDATE bookings SET status = 'confirmed' WHERE id = :id"
            ),
            {'id': booking['id']},
        )

        # 2. Đổi trạng thái Ghế -> booked
        db.session.execute(
            text(
                "UPDATE seats SET status = 'booked' WHERE booking_id = :id"
            ),
            {'id': booking['id']},
        )

        # 3. Ghi log lịch sử thanh toán
        db.session.execute(
            text("""
                    INSERT INTO payments (booking_id, payment_method, transaction_id, amount, status)
                    VALUES (:booking_id, 'vnpay', :trans_id, :amount, 'success')
                """),
            {
                'booking_id': booking['id'],
                'trans_id': vnp_transaction_no or vnp_txn_ref,
                'amount': booking['total_amount'],
            },
        )

        db.session.commit()

      return (
          jsonify({
              'success': True,
              'message': 'Thanh toán VNPay thành công!',
              'data': {
                  'booking_id': booking['id'],
                  'booking_code': vnp_txn_ref,
                  'transaction_id': vnp_transaction_no,
                  'status': 'confirmed',
              },
          }),
          200,
      )
    else:
      # Thanh toán thất bại hoặc hủy giao dịch
      db.session.execute(
          text("UPDATE bookings SET status = 'cancelled' WHERE id = :id"),
          {'id': booking['id']},
      )
      db.session.execute(
          text(
              "UPDATE seats SET status = 'available', booking_id = NULL WHERE"
              ' booking_id = :id'
          ),
          {'id': booking['id']},
      )
      db.session.commit()

      return (
          jsonify({
              'success': False,
              'message': (
                  f'Thanh toán không thành công. Mã lỗi: {vnp_response_code}'
              ),
          }),
          400,
      )

  except Exception as e:
    db.session.rollback()
    return jsonify({'success': False, 'error': str(e)}), 500