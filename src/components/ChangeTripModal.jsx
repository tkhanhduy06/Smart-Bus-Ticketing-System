import { useEffect, useState } from "react";
import { getAvailableTrips } from "../services/ticketService";

function ChangeTripModal({
  open,
  onClose,
  onConfirm
}) {
  const [newTrip, setNewTrip] = useState("");
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setNewTrip("");

    const loadTrips = async () => {
      try {
        setLoading(true);

        const data = await getAvailableTrips();

        setTrips(data);
      } catch {
        setTrips([]);
      } finally {
        setLoading(false);
      }
    };

    loadTrips();
  }, [open]);

  if (!open) {
    return null;
  }

  const selectedTrip = trips.find(
    (trip) => trip.route === newTrip
  );

  const handleConfirm = () => {
    if (!newTrip) {
      alert("Vui lòng chọn chuyến mới.");
      return;
    }

    if (
      selectedTrip &&
      selectedTrip.availableSeats <= 0
    ) {
      alert(
        "Chuyến này đã hết ghế. Vui lòng chọn chuyến khác."
      );
      return;
    }

    onConfirm(newTrip);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000
      }}
    >
      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "10px",
          width: "400px",
          maxWidth: "90%"
        }}
      >
        <h3 style={{ marginBottom: "15px" }}>
          Đổi chuyến xe
        </h3>

        {loading ? (
          <p>Đang tải danh sách chuyến...</p>
        ) : (
          <>
            <label>
              Chọn chuyến mới:
            </label>

            <select
              value={newTrip}
              onChange={(e) =>
                setNewTrip(e.target.value)
              }
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "8px",
                marginBottom: "15px",
                border: "1px solid #ccc",
                borderRadius: "6px"
              }}
            >
              <option value="">
                -- Chọn chuyến --
              </option>

              {trips.map((trip) => (
                <option
                  key={trip.id}
                  value={trip.route}
                >
                  {trip.route} - Còn{" "}
                  {trip.availableSeats} ghế
                </option>
              ))}
            </select>

            {selectedTrip && (
              <div
                style={{
                  marginBottom: "15px",
                  padding: "10px",
                  background: "#f4f6f9",
                  borderRadius: "6px"
                }}
              >
                {selectedTrip.availableSeats > 0 ? (
                  <p
                    style={{
                      color: "#198754"
                    }}
                  >
                    Còn{" "}
                    <strong>
                      {selectedTrip.availableSeats}
                    </strong>{" "}
                    ghế trống.
                  </p>
                ) : (
                  <p
                    style={{
                      color: "#dc3545"
                    }}
                  >
                    Chuyến này đã hết ghế.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={
            loading ||
            !newTrip ||
            selectedTrip?.availableSeats <= 0
          }
        >
          Xác nhận
        </button>

        <button
          className="btn"
          onClick={onClose}
          style={{
            marginLeft: "10px",
            background: "#6c757d",
            color: "white"
          }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

export default ChangeTripModal;