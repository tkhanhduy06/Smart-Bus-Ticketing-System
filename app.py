from flask import Flask

from routes.trips import trips_bp
from routes.bookings import bookings_bp


app = Flask(__name__)

app.register_blueprint(trips_bp)
app.register_blueprint(bookings_bp)


if __name__ == "__main__":
    app.run(debug=True)