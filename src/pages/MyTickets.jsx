import { useState } from "react";
import CancelModal from "../components/CancelModal";
import ChangeTripModal from "../components/ChangeTripModal";
import {
  canModifyTicket,
  cancelTicket,
  changeTicket,
  findTicket,
  formatCurrency,
  formatDateTime,
  getAlternativeTrips,
} from "../services/ticketService";

const statusLabels = { paid: "Đã thanh toán", cancelled: "Đã hủy" };

export default function MyTickets() {
  const [query, setQuery] = useState("");
  const [ticket, setTicket] = useState(null);
  const [searched, setSearched] = useState(false);
  const [modal, setModal] = useState(null);
  const [message, setMessage] = useState(null);

  function handleSearch(event) {
    event.preventDefault();
    const result = findTicket(query);
    setTicket(result);
    setSearched(true);
    setModal(null);
    setMessage(result ? null : { type: "error", text: "Không tìm thấy vé với mã đã nhập." });
  }

  function handleCancel() {
    try {
      const updated = cancelTicket(ticket.code);
      setTicket(updated);
      setModal(null);
      setMessage({ type: "success", text: "Hủy vé thành công. Yêu cầu hoàn tiền đã được tạo." });
    } catch (error) {
      setModal(null);
      setMessage({ type: "error", text: error.message });
    }
  }

  function handleChange(tripId) {
    try {
      const updated = changeTicket(ticket.code, tripId);
      setTicket(updated);
      setQuery(updated.electronicCode);
      setModal(null);
      setMessage({
        type: "success",
        text: `Đổi chuyến thành công. Mã vé điện tử mới: ${updated.electronicCode}`,
      });
    } catch (error) {
      setModal(null);
      setMessage({ type: "error", text: error.message });
    }
  }

  const modifiable = canModifyTicket(ticket);
  const restriction = ticket && !modifiable
    ? ticket.status === "cancelled"
      ? "Vé đã hủy không thể tiếp tục hủy hoặc đổi."
      : "Vé đã đến hoặc qua giờ khởi hành, không thể hủy hoặc đổi."
    : "";

  return (
    <section className="page-section ticket-page">
      <div className="container">
        <div className="page-heading page-heading--center">
          <span className="eyebrow">QUẢN LÝ HÀNH TRÌNH</span>
          <h1>Vé của tôi</h1>
          <p>Tra cứu bằng mã vé hoặc mã vé điện tử để hủy và đổi chuyến.</p>
        </div>
        <form className="ticket-search" onSubmit={handleSearch}>
          <label className="sr-only" htmlFor="ticket-code">Mã vé</label>
          <input
            id="ticket-code"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nhập VE001 hoặc mã DT..."
            required
          />
          <button className="button button--primary" type="submit">Tra cứu vé</button>
        </form>
        <p className="demo-hint">Mã dùng thử: <button type="button" onClick={() => setQuery("VE001")}>VE001</button></p>

        {message && <div className={`alert alert--${message.type}`} role={message.type === "error" ? "alert" : "status"}>{message.text}</div>}

        {ticket && (
          <article className="ticket-card">
            <div className="ticket-card__accent" />
            <div className="ticket-card__main">
              <div className="ticket-topline">
                <div><span className="eyebrow">MÃ VÉ</span><strong>{ticket.code}</strong></div>
                <span className={`status-badge status-badge--${ticket.status}`}>{statusLabels[ticket.status]}</span>
              </div>
              <div className="ticket-route">
                <span className="route-dot" />
                <h2>{ticket.route}</h2>
              </div>
              <dl className="ticket-details">
                <div><dt>Mã vé điện tử</dt><dd>{ticket.electronicCode}</dd></div>
                <div><dt>Ghế</dt><dd>{ticket.seat}</dd></div>
                <div><dt>Giờ khởi hành</dt><dd>{formatDateTime(ticket.departureTime)}</dd></div>
                <div><dt>Giá vé</dt><dd>{formatCurrency(ticket.price)}</dd></div>
                <div><dt>Hoàn tiền</dt><dd>{ticket.refundStatus}</dd></div>
              </dl>
              {modifiable ? (
                <div className="eligibility eligibility--ok">✓ Vé còn trong thời gian cho phép hủy/đổi</div>
              ) : (
                <div className="eligibility eligibility--blocked">! {restriction}</div>
              )}
              <div className="ticket-actions">
                <button className="button button--danger-outline" type="button" disabled={!modifiable} onClick={() => setModal("cancel")}>Hủy vé</button>
                <button className="button button--primary" type="button" disabled={!modifiable} onClick={() => setModal("change")}>Đổi vé</button>
              </div>
            </div>
          </article>
        )}

        {searched && !ticket && !message && <p className="empty-state">Không tìm thấy vé.</p>}
      </div>

      {modal === "cancel" && (
        <CancelModal ticket={ticket} onClose={() => setModal(null)} onConfirm={handleCancel} />
      )}
      {modal === "change" && (
        <ChangeTripModal
          ticket={ticket}
          trips={getAlternativeTrips(ticket.tripId)}
          onClose={() => setModal(null)}
          onConfirm={handleChange}
        />
      )}
    </section>
  );
}
