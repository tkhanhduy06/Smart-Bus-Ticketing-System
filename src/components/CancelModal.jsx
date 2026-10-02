export default function CancelModal({ ticket, onConfirm, onClose }) {
  if (!ticket) return null;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose} aria-label="Đóng hộp thoại">×</button>
        <span className="modal-icon modal-icon--danger" aria-hidden="true">!</span>
        <h2 id="cancel-title">Xác nhận hủy vé?</h2>
        <p>
          Vé <strong>{ticket.code}</strong> cho chuyến <strong>{ticket.route}</strong> sẽ bị hủy.
        </p>
        <p className="muted">Yêu cầu hoàn tiền sẽ được tạo và chờ xử lý theo quy định.</p>
        <div className="modal-actions">
          <button className="button button--ghost" type="button" onClick={onClose}>Đóng</button>
          <button className="button button--danger" type="button" onClick={onConfirm}>Đồng ý hủy</button>
        </div>
      </section>
    </div>
  );
}
