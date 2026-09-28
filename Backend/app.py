from apscheduler.schedulers.background import BackgroundScheduler
from config import Config
from flask import Flask
from flask_cors import CORS
from routes.admin import admin_bp
from routes.bookings import bookings_bp, release_expired_bookings
from routes.bus_routes import bus_bp, db
from routes.payments import payments_bp

app = Flask(__name__)
app.config.from_object(Config)

# Cấu hình chuỗi kết nối MySQL chuẩn
app.config['SQLALCHEMY_DATABASE_URI'] = (
    'mysql+pymysql://root:27032006@localhost/smart_bus_db'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.json.ensure_ascii = False

# Khởi tạo Middleware & Extensions
CORS(app)
db.init_app(app)

# Đăng ký các Router / Blueprint
app.register_blueprint(bus_bp)
app.register_blueprint(bookings_bp)
app.register_blueprint(payments_bp)
app.register_blueprint(admin_bp)


# ==============================================================================
# BACKGROUND JOB (APScheduler): TỰ ĐỘNG THU HỒI GHẾ QUÁ HẠN 10 PHÚT
# ==============================================================================
def run_seat_cleanup_job():
  """Chạy hàm dọn ghế tự động trong Flask Application Context."""
  with app.app_context():
    release_expired_bookings(db)


# Lập lịch chạy mỗi 60 giây một lần
scheduler = BackgroundScheduler()
scheduler.add_job(
    func=run_seat_cleanup_job, trigger='interval', seconds=60, id='cleanup_seats'
)
scheduler.start()


@app.route('/')
def index():
  return 'Smart Bus System Backend API Version 1.0 Ready.'


if __name__ == '__main__':
  app.run(debug=True, port=5000)