import { useState } from "react";
import CountdownTimer from "../components/CountdownTimer";

const seats = [
  "A01", "A02", "A03", "A04",
  "A05", "A06", "A07", "A08",
  "A09", "A10", "A11", "A12",
  "B01", "B02", "B03", "B04",
  "B05", "B06", "B07", "B08",
];
const occupiedSeats = new Set(["A08", "A10", "B03"]);

export default function SelectSeat({ countdownDuration = 600 }) {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [session, setSession] = useState(null);
  const [notice, setNotice] = useState("");

  function toggleSeat(seat) {
    setNotice("");
    setSelectedSeats((current) => (
      current.includes(seat)
        ? current.filter((item) => item !== seat)
        : [...current, seat].sort()
    ));
  }

  function startHold() {
    if (selectedSeats.length === 0) return;
    setSession({ status: "held", id: Date.now() });
    setNotice("");
  }

  function handlePayment() {
    setSession((current) => ({ ...current, status: "paid" }));
    setNotice("Thanh toán thành công. Vé của bạn đã được xác nhận.");
  }

  function handleExpire() {
    setSelectedSeats([]);
    setSession(null);
    setNotice("Phiên giữ chỗ đã hết hạn. Ghế đã được trả về trạng thái trống, vui lòng chọn lại.");
  }

  if (session) {
    const isPaid = session.status === "paid";
    return (
      <section className="page-section container narrow-page">
        <div className="page-heading page-heading--center">
          <span className="eyebrow">PHIÊN ĐẶT VÉ</span>
          <h1>{isPaid ? "Thanh toán hoàn tất" : "Thời gian giữ chỗ"}</h1>
          <p>{isPaid ? "Ghế của bạn đã được xác nhận." : "Vui lòng hoàn tất thanh toán trong thời gian còn lại."}</p>
        </div>

        <article className={`hold-card${isPaid ? " hold-card--paid" : ""}`}>
          <span className="status-pill">{isPaid ? "✓ Đã thanh toán" : "● Đang giữ chỗ"}</span>
          <CountdownTimer
            key={session.id}
            duration={countdownDuration}
            isActive={!isPaid}
            onExpire={handleExpire}
          />
          <div className="hold-meta">
            <div><span>Ghế</span><strong>{selectedSeats.join(", ")}</strong></div>
            <div><span>Trạng thái ghế</span><strong>{isPaid ? "Đã thanh toán" : "Giữ chỗ"}</strong></div>
          </div>
          {notice && <div className="alert alert--success" role="status">{notice}</div>}
          {!isPaid && (
            <button className="button button--primary button--large" type="button" onClick={handlePayment}>
              Thanh toán thành công
            </button>
          )}
        </article>
      </section>
    );
  }

  return (
    <section className="page-section container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">BƯỚC 2 / 3</span>
          <h1>Chọn ghế của bạn</h1>
          <p>Chuyến Hà Nội → Thái Nguyên · 08:00</p>
        </div>
        <div className="trip-badge"><span>Giá vé từ</span><strong>120.000 ₫</strong></div>
      </div>

      {notice && <div className="alert alert--warning" role="alert">{notice}</div>}

      <div className="seat-layout">
        <div className="seat-panel">
          <div className="seat-legend" aria-label="Chú thích trạng thái ghế">
            <span><i className="legend-box legend-box--available" />Ghế trống</span>
            <span><i className="legend-box legend-box--selected" />Đã chọn</span>
            <span><i className="legend-box legend-box--occupied" />Đã đặt</span>
          </div>
          <div className="bus-shell">
            <div className="bus-front"><span>ĐẦU XE</span><span className="steering" aria-label="Vị trí tài xế">◉</span></div>
            <div className="seat-map" aria-label="Sơ đồ ghế">
              {seats.map((seat, index) => {
                const occupied = occupiedSeats.has(seat);
                const selected = selectedSeats.includes(seat);
                return (
                  <button
                    key={seat}
                    type="button"
                    className={`seat${selected ? " seat--selected" : ""}${occupied ? " seat--occupied" : ""}${index % 4 === 2 ? " seat--aisle" : ""}`}
                    disabled={occupied}
                    aria-pressed={selected}
                    aria-label={`Ghế ${seat}${occupied ? " đã đặt" : selected ? " đã chọn" : " còn trống"}`}
                    onClick={() => toggleSeat(seat)}
                  >
                    {seat}
                  </button>
                );
              })}
            </div>
            <div className="bus-back">CUỐI XE</div>
          </div>
        </div>

        <aside className="selection-card">
          <span className="eyebrow">THÔNG TIN LỰA CHỌN</span>
          <h2>Ghế đã chọn</h2>
          <div className="selected-seat-list" aria-live="polite">
            {selectedSeats.length > 0
              ? selectedSeats.map((seat) => <span key={seat}>{seat}</span>)
              : <p>Chưa chọn ghế</p>}
          </div>
          <div className="summary-row"><span>Số lượng</span><strong>{selectedSeats.length} ghế</strong></div>
          <div className="summary-row summary-row--total"><span>Tạm tính</span><strong>{(selectedSeats.length * 120000).toLocaleString("vi-VN")} ₫</strong></div>
          <button
            className="button button--primary button--large"
            type="button"
            disabled={selectedSeats.length === 0}
            onClick={startHold}
          >
            Giữ ghế và tiếp tục →
          </button>
          <p className="secure-note">⌛ Ghế được giữ trong 10 phút</p>
        </aside>
      </div>
    </section>
  );
}
