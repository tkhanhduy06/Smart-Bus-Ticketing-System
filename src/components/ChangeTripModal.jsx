import { useMemo, useState } from "react";

export default function ChangeTripModal({ ticket, trips = [], onConfirm, onClose }) {
  const firstAvailableId = useMemo(
    () => trips.find((trip) => trip.availableSeats > 0)?.id ?? "",
    [trips],
  );
  const [selectedTripId, setSelectedTripId] = useState(firstAvailableId);
  const selectedTrip = trips.find((trip) => String(trip.id) === String(selectedTripId));
  const canConfirm = Boolean(selectedTrip && selectedTrip.availableSeats > 0);

  if (!ticket) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Đóng hộp thoại">×</button>
        <span className="eyebrow">ĐỔI HÀNH TRÌNH</span>
        <h2 id="change-title">Chọn chuyến xe mới</h2>
        {trips.length > 0 ? (
          <>
            <label className="field-label" htmlFor="new-trip">Chuyến mới</label>
            <select
              id="new-trip"
              value={selectedTripId}
              onChange={(event) => setSelectedTripId(event.target.value)}
            >
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.route} · {trip.departureLabel} · {trip.availableSeats > 0 ? `Còn ${trip.availableSeats} ghế` : "Hết ghế"}
                </option>
              ))}
            </select>
            {selectedTrip && (
              <div className={`availability ${selectedTrip.availableSeats ? "availability--ok" : "availability--full"}`}>
                {selectedTrip.availableSeats > 0
                  ? `Còn ${selectedTrip.availableSeats} ghế trống`
                  : "Chuyến này đã hết ghế"}
              </div>
            )}
          </>
        ) : (
          <p className="empty-state">Hiện chưa có chuyến thay thế phù hợp.</p>
        )}
        <div className="modal-actions">
          <button className="button button--ghost" type="button" onClick={onClose}>Đóng</button>
          <button
            className="button button--primary"
            type="button"
            disabled={!canConfirm}
            onClick={() => onConfirm(selectedTrip.id)}
          >
            Xác nhận đổi
          </button>
        </div>
      </section>
    </div>
  );
}
