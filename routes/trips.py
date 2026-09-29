from flask import Blueprint, jsonify
from sqlalchemy import bindparam, text

from database.db import session_local


trips_bp = Blueprint(
    "trips",
    __name__,
    url_prefix="/api/trips"
)


@trips_bp.route("/<int:trip_id>/seats", methods=["GET"])
def get_trip_seats(trip_id):
    db = session_local()

    try:
        seats_query = text("""
            SELECT
                id AS seat_id,
                seat_number,
                status,
                booking_id,
                passenger_name,
                passenger_phone
            FROM seats
            WHERE trip_id = :trip_id
            ORDER BY seat_number ASC
        """).bindparams(
            bindparam("trip_id")
        )

        seats_result = db.execute(
            seats_query,
            {"trip_id": trip_id}
        )

        seats = []

        for row in seats_result:
            seats.append({
                "seat_id": row.seat_id,
                "seat_number": row.seat_number,
                "status": row.status,
                "booking_id": row.booking_id,
                "passenger_name": row.passenger_name,
                "passenger_phone": row.passenger_phone
            })

        # Không tìm thấy ghế của chuyến xe
        if not seats:
            return jsonify({
                "success": False,
                "message": "Chuyến xe chưa có ghế"
            }), 404

        # Lấy danh sách ghế thành công
        return jsonify({
            "success": True,
            "message": "Lấy danh sách ghế thành công",
            "data": seats
        }), 200

    except Exception as error:
        print(f"Error getting trip seats: {error}")

        return jsonify({
            "success": False,
            "message": "Có lỗi xảy ra khi lấy danh sách ghế"
        }), 500

    finally:
        db.close()