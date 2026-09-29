function CancelModal({ open, onClose, onConfirm }) {

  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        background: "white",
        padding: "20px",
        borderRadius: "10px"
      }}>
        <h3>Xác nhận hủy vé?</h3>

        <button onClick={onConfirm}>
          Đồng ý
        </button>

        <button
          onClick={onClose}
          style={{ marginLeft: "10px" }}
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

export default CancelModal;