import os
import uuid
import hmac
import hashlib

import requests
from flask import Blueprint, jsonify, request
from dotenv import load_dotenv
from sqlalchemy import text

from database.db import session_local


load_dotenv()

bookings_bp = Blueprint(
    "bookings",
    __name__,
    url_prefix="/api/payments"
)


# =========================================================
# TẠO CHỮ KÝ HMAC SHA256
# =========================================================
def create_signature(raw_signature):
    secret_key = os.getenv("MOMO_SECRET_KEY", "")

    return hmac.new(
        secret_key.encode("utf-8"),
        raw_signature.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()


# =========================================================
# XỬ LÝ WEBHOOK MOMO
# =========================================================
def process_momo_webhook(data):
    db = session_local()

    try:
        # -------------------------------------------------
        # Lấy dữ liệu từ MoMo
        # -------------------------------------------------
        partner_code = data.get("partnerCode", "")
        access_key = data.get("accessKey", "")
        request_id = data.get("requestId", "")
        amount = data.get("amount", 0)
        order_id = data.get("orderId", "")
        order_info = data.get("orderInfo", "")
        order_type = data.get("orderType", "")
        trans_id = data.get("transId", "")
        result_code = data.get("resultCode", "")
        message = data.get("message", "")
        pay_type = data.get("payType", "")
        response_time = data.get("responseTime", "")
        extra_data = data.get("extraData", "")
        signature = data.get("signature", "")

        # -------------------------------------------------
        # Kiểm tra signature
        # -------------------------------------------------
        raw_signature = (
            f"accessKey={access_key}"
            f"&amount={amount}"
            f"&extraData={extra_data}"
            f"&message={message}"
            f"&orderId={order_id}"
            f"&orderInfo={order_info}"
            f"&orderType={order_type}"
            f"&partnerCode={partner_code}"
            f"&payType={pay_type}"
            f"&requestId={request_id}"
            f"&responseTime={response_time}"
            f"&resultCode={result_code}"
            f"&transId={trans_id}"
        )

        expected_signature = create_signature(raw_signature)

        if not hmac.compare_digest(
            signature,
            expected_signature
        ):
            return {
                "success": False,
                "message": "Chữ ký MoMo không hợp lệ"
            }, 400

        # -------------------------------------------------
        # Lấy booking_code từ order_id
        #
        # Ví dụ:
        # BK001_a1b2c3d4
        #
        # => BK001
        # -------------------------------------------------
        if "_" not in order_id:
            return {
                "success": False,
                "message": "order_id không hợp lệ"
            }, 400

        booking_code = order_id.rsplit("_", 1)[0]

        # -------------------------------------------------
        # Tìm booking
        # -------------------------------------------------
        booking = db.execute(
            text("""
                SELECT
                    id,
                    booking_code,
                    trip_id,
                    total_amount,
                    status
                FROM bookings
                WHERE booking_code = :booking_code
            """),
            {
                "booking_code": booking_code
            }
        ).mappings().first()

        if not booking:
            return {
                "success": False,
                "message": "Không tìm thấy booking"
            }, 404

        # -------------------------------------------------
        # Kiểm tra số tiền
        # -------------------------------------------------
        try:
            momo_amount = float(amount)
            booking_amount = float(booking["total_amount"])
        except (ValueError, TypeError):
            return {
                "success": False,
                "message": "Số tiền thanh toán không hợp lệ"
            }, 400

        if momo_amount != booking_amount:
            return {
                "success": False,
                "message": "Số tiền thanh toán không khớp với booking"
            }, 400

        # -------------------------------------------------
        # Thanh toán thất bại
        # -------------------------------------------------
        if str(result_code) != "0":
            return {
                "success": False,
                "message": f"Thanh toán thất bại: {message}",
                "momo_result_code": result_code
            }, 400

        # -------------------------------------------------
        # Kiểm tra idempotency
        #
        # Nếu webhook gửi lại nhưng booking đã confirmed
        # thì không cập nhật lại.
        # -------------------------------------------------
        if booking["status"] == "confirmed":
            db.rollback()

            return {
                "success": True,
                "message": "Booking đã được xác nhận trước đó"
            }, 200

        # -------------------------------------------------
        # TRANSACTION
        #
        # Booking -> confirmed
        # Seats   -> booked
        # -------------------------------------------------

        db.execute(
            text("""
                UPDATE bookings
                SET status = 'confirmed'
                WHERE id = :booking_id
            """),
            {
                "booking_id": booking["id"]
            }
        )

        db.execute(
            text("""
                UPDATE seats
                SET status = 'booked'
                WHERE booking_id = :booking_id
            """),
            {
                "booking_id": booking["id"]
            }
        )

        # -------------------------------------------------
        # COMMIT
        # -------------------------------------------------
        db.commit()

        return {
            "success": True,
            "message": "Thanh toán thành công",
            "data": {
                "booking_id": booking["id"],
                "booking_code": booking["booking_code"],
                "amount": booking_amount,
                "status": "confirmed"
            }
        }, 200

    except Exception as error:
        # -------------------------------------------------
        # ROLLBACK nếu có lỗi
        # -------------------------------------------------
        db.rollback()

        print("Error processing MoMo webhook:", error)

        return {
            "success": False,
            "message": "Có lỗi xảy ra khi xử lý webhook MoMo"
        }, 500

    finally:
        db.close()


# =========================================================
# 1. TẠO GIAO DỊCH MOMO
# POST /api/payments/momo/create
# =========================================================
@bookings_bp.route("/momo/create", methods=["POST"])
def create_momo_payment():

    db = session_local()

    try:
        # -------------------------------------------------
        # Lấy JSON
        # -------------------------------------------------
        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "message": "Request body không hợp lệ"
            }), 400

        booking_id = data.get("booking_id")

        if not booking_id:
            return jsonify({
                "success": False,
                "message": "Thiếu booking_id"
            }), 400

        # -------------------------------------------------
        # Tìm booking
        # -------------------------------------------------
        booking = db.execute(
            text("""
                SELECT
                    id,
                    booking_code,
                    total_amount,
                    status
                FROM bookings
                WHERE id = :booking_id
            """),
            {
                "booking_id": booking_id
            }
        ).mappings().first()

        if not booking:
            return jsonify({
                "success": False,
                "message": "Không tìm thấy booking"
            }), 404

        # -------------------------------------------------
        # Chỉ cho phép booking pending thanh toán
        # -------------------------------------------------
        if booking["status"] != "pending":
            return jsonify({
                "success": False,
                "message": "Booking không ở trạng thái pending"
            }), 400

        # -------------------------------------------------
        # Tạo order_id và request_id
        # -------------------------------------------------
        order_id = (
            f"{booking['booking_code']}_"
            f"{uuid.uuid4().hex[:8]}"
        )

        request_id = str(uuid.uuid4())

        amount = int(float(booking["total_amount"]))

        # -------------------------------------------------
        # Lấy cấu hình từ .env
        # -------------------------------------------------
        partner_code = os.getenv(
            "MOMO_PARTNER_CODE",
            ""
        )

        access_key = os.getenv(
            "MOMO_ACCESS_KEY",
            ""
        )

        redirect_url = os.getenv(
            "MOMO_REDIRECT_URL",
            "http://localhost:5000/api/payments/momo/return"
        )

        ipn_url = os.getenv(
            "MOMO_IPN_URL",
            "http://localhost:5000/api/payments/momo/webhook"
        )

        momo_api_url = os.getenv(
            "MOMO_API_URL",
            "https://test-payment.momo.vn/v2/gateway/api/create"
        )

        request_type = "payWithMethod"

        order_info = (
            f"Thanh toan booking {booking['booking_code']}"
        )

        extra_data = ""

        # -------------------------------------------------
        # RAW SIGNATURE
        # -------------------------------------------------
        raw_signature = (
            f"accessKey={access_key}"
            f"&amount={amount}"
            f"&extraData={extra_data}"
            f"&ipnUrl={ipn_url}"
            f"&orderId={order_id}"
            f"&orderInfo={order_info}"
            f"&partnerCode={partner_code}"
            f"&redirectUrl={redirect_url}"
            f"&requestId={request_id}"
            f"&requestType={request_type}"
        )

        signature = create_signature(raw_signature)

        # -------------------------------------------------
        # PAYLOAD GỬI MOMO
        # -------------------------------------------------
        request_payload = {
            "partnerCode": partner_code,
            "partnerName": "Smart Bus",
            "storeId": "SmartBusStore",
            "requestId": request_id,
            "amount": amount,
            "orderId": order_id,
            "orderInfo": order_info,
            "redirectUrl": redirect_url,
            "ipnUrl": ipn_url,
            "lang": "vi",
            "extraData": extra_data,
            "requestType": request_type,
            "signature": signature
        }

        # =================================================
        # MOCK MOMO
        # =================================================
        mock_mode = os.getenv(
            "MOMO_MOCK",
            "false"
        ).lower() == "true"

        if mock_mode:

            mock_pay_url = (
                "http://localhost:5000"
                "/api/payments/momo/mock-payment"
                f"?order_id={order_id}"
            )

            return jsonify({
                "success": True,
                "message": "Tạo giao dịch MoMo Mock thành công",
                "data": {
                    "order_id": order_id,
                    "request_id": request_id,
                    "amount": amount,
                    "pay_url": mock_pay_url,
                    "mock": True
                }
            }), 200

        # =================================================
        # MOMO THẬT
        # =================================================
        response = requests.post(
            momo_api_url,
            json=request_payload,
            timeout=30
        )

        response.raise_for_status()

        momo_data = response.json()

        if momo_data.get("resultCode") != 0:
            return jsonify({
                "success": False,
                "message": momo_data.get(
                    "message",
                    "MoMo từ chối giao dịch"
                ),
                "momo_result_code": momo_data.get(
                    "resultCode"
                )
            }), 400

        return jsonify({
            "success": True,
            "message": "Tạo yêu cầu thanh toán MoMo thành công",
            "data": {
                "order_id": order_id,
                "request_id": request_id,
                "amount": amount,
                "pay_url": momo_data.get(
                    "payUrl"
                )
            }
        }), 200

    except requests.RequestException as error:

        print("Error creating MoMo payment:", error)

        return jsonify({
            "success": False,
            "message": "Không thể kết nối MoMo"
        }), 502

    except Exception as error:

        print("Error creating MoMo payment:", error)

        return jsonify({
            "success": False,
            "message": "Có lỗi xảy ra khi tạo giao dịch MoMo"
        }), 500

    finally:
        db.close()


# =========================================================
# 2. WEBHOOK MOMO
# POST /api/payments/momo/webhook
# =========================================================
@bookings_bp.route("/momo/webhook", methods=["POST"])
def momo_webhook():

    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "message": "Webhook body không hợp lệ"
        }), 400

    result, status_code = process_momo_webhook(data)

    return jsonify(result), status_code


# =========================================================
# 3. MOCK PAYMENT
#
# GET /api/payments/momo/mock-payment
#
# Dùng để giả lập MoMo khi chưa có tài khoản MoMo.
# =========================================================
@bookings_bp.route(
    "/momo/mock-payment",
    methods=["GET"]
)
def mock_momo_payment():

    order_id = request.args.get("order_id")

    if not order_id:
        return jsonify({
            "success": False,
            "message": "Thiếu order_id"
        }), 400

    # -----------------------------------------------------
    # Lấy thông tin order
    # -----------------------------------------------------
    db = session_local()

    try:
        if "_" not in order_id:
            return jsonify({
                "success": False,
                "message": "order_id không hợp lệ"
            }), 400

        booking_code = order_id.rsplit(
            "_",
            1
        )[0]

        booking = db.execute(
            text("""
                SELECT
                    id,
                    booking_code,
                    total_amount
                FROM bookings
                WHERE booking_code = :booking_code
            """),
            {
                "booking_code": booking_code
            }
        ).mappings().first()

        if not booking:
            return jsonify({
                "success": False,
                "message": "Không tìm thấy booking"
            }), 404

        # -------------------------------------------------
        # Tạo dữ liệu giả giống webhook MoMo
        # -------------------------------------------------
        partner_code = os.getenv(
            "MOMO_PARTNER_CODE",
            "mock_partner_code"
        )

        access_key = os.getenv(
            "MOMO_ACCESS_KEY",
            "mock_access_key"
        )

        request_id = str(uuid.uuid4())

        amount = int(
            float(booking["total_amount"])
        )

        order_info = (
            f"Thanh toan booking "
            f"{booking['booking_code']}"
        )

        order_type = "momo_wallet"

        trans_id = str(
            int(uuid.uuid4().int % 1000000000)
        )

        result_code = 0

        message = "Successful."

        pay_type = "qr"

        response_time = "20261001130000"

        extra_data = ""

        # -------------------------------------------------
        # Tạo signature giống webhook MoMo
        # -------------------------------------------------
        raw_signature = (
            f"accessKey={access_key}"
            f"&amount={amount}"
            f"&extraData={extra_data}"
            f"&message={message}"
            f"&orderId={order_id}"
            f"&orderInfo={order_info}"
            f"&orderType={order_type}"
            f"&partnerCode={partner_code}"
            f"&payType={pay_type}"
            f"&requestId={request_id}"
            f"&responseTime={response_time}"
            f"&resultCode={result_code}"
            f"&transId={trans_id}"
        )

        signature = create_signature(
            raw_signature
        )

        webhook_data = {
            "partnerCode": partner_code,
            "accessKey": access_key,
            "requestId": request_id,
            "amount": amount,
            "orderId": order_id,
            "orderInfo": order_info,
            "orderType": order_type,
            "transId": trans_id,
            "resultCode": result_code,
            "message": message,
            "payType": pay_type,
            "responseTime": response_time,
            "extraData": extra_data,
            "signature": signature
        }

    finally:
        db.close()

    # -----------------------------------------------------
    # Gọi xử lý webhook
    # -----------------------------------------------------
    result, status_code = process_momo_webhook(
        webhook_data
    )

    return jsonify({
        "mock_payment": True,
        "webhook_result": result
    }), status_code


# =========================================================
# 4. MOMO RETURN
# GET/POST /api/payments/momo/return
# =========================================================
@bookings_bp.route(
    "/momo/return",
    methods=["GET", "POST"]
)
def momo_return():

    if request.method == "POST":
        data = request.get_json(
            silent=True
        ) or {}
    else:
        data = request.args.to_dict()

    return jsonify({
        "success": True,
        "message": "MoMo return",
        "data": data
    }), 200