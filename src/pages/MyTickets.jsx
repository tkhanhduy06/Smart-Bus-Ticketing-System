import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import CancelModal from "../components/CancelModal";
import ChangeTripModal from "../components/ChangeTripModal";

import {
  getMyTickets,
  cancelTicket,
  changeTicket,
  canCancelTicket,
  canChangeTicket
} from "../services/ticketService";

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [selectedTicket, setSelectedTicket] =
    useState(null);

  const [showCancel, setShowCancel] =
    useState(false);

  const [showChange, setShowChange] =
    useState(false);

  const [loading, setLoading] = useState(true);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  // =============================
  // TẢI DANH SÁCH VÉ
  // =============================
  const loadTickets = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMyTickets();

      setTickets(data);
    } catch (err) {
      setError(
        err.message ||
          "Không thể tải danh sách vé."
      );
    } finally {
      setLoading(false);
    }
  };

  // =============================
  // ĐỊNH DẠNG GIỜ KHỞI HÀNH
  // =============================
  const formatDepartureTime = (
    departureTime
  ) => {
    if (!departureTime) {
      return "Chưa xác định";
    }

    return new Date(
      departureTime
    ).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // =============================
  // TRA CỨU VÉ
  // =============================
  const filteredTickets = tickets.filter(
    (ticket) => {
      if (searchCode.trim() === "") {
        return true;
      }

      const keyword = searchCode
        .trim()
        .toLowerCase();

      const ticketCode = `VE${ticket.id
        .toString()
        .padStart(3, "0")}`.toLowerCase();

      const electronicCode =
        ticket.electronicTicketCode
          ?.toLowerCase() || "";

      return (
        ticketCode.includes(keyword) ||
        electronicCode.includes(keyword)
      );
    }
  );

  // =============================
  // MỞ POPUP HỦY VÉ
  // =============================
  const handleOpenCancel = (ticket) => {
    if (ticket.status === "Đã hủy") {
      alert("Vé này đã được hủy.");
      return;
    }

    if (!canCancelTicket(ticket)) {
      alert(
        "Không thể hủy vé vì vé không còn đủ điều kiện hủy trước giờ khởi hành."
      );

      return;
    }

    setSelectedTicket(ticket);
    setShowCancel(true);
  };

  // =============================
  // ĐÓNG POPUP HỦY
  // =============================
  const handleCloseCancel = () => {
    if (processing) {
      return;
    }

    setShowCancel(false);
    setSelectedTicket(null);
  };

  // =============================
  // XÁC NHẬN HỦY
  // =============================
  const handleConfirmCancel = async () => {
    if (!selectedTicket) {
      return;
    }

    try {
      setProcessing(true);
      setError("");

      const result = await cancelTicket(
        selectedTicket.id
      );

      const updatedTickets =
        await getMyTickets();

      setTickets(updatedTickets);

      alert(
        `Đã hủy vé VE${selectedTicket.id
          .toString()
          .padStart(3, "0")}.\n\n${
          result.refundMessage
        }`
      );

      setShowCancel(false);
      setSelectedTicket(null);
    } catch (err) {
      setError(
        err.message || "Không thể hủy vé."
      );
    } finally {
      setProcessing(false);
    }
  };

  // =============================
  // MỞ POPUP ĐỔI VÉ
  // =============================
  const handleOpenChange = (ticket) => {
    if (ticket.status === "Đã hủy") {
      alert(
        "Không thể đổi chuyến cho vé đã hủy."
      );

      return;
    }

    if (!canChangeTicket(ticket)) {
      alert(
        "Không thể đổi vé vì chuyến xe đã đến hoặc qua giờ khởi hành."
      );

      return;
    }

    setSelectedTicket(ticket);
    setShowChange(true);
  };

  // =============================
  // ĐÓNG POPUP ĐỔI
  // =============================
  const handleCloseChange = () => {
    if (processing) {
      return;
    }

    setShowChange(false);
    setSelectedTicket(null);
  };

  // =============================
  // XÁC NHẬN ĐỔI VÉ
  // =============================
  const handleConfirmChange = async (
    newTrip
  ) => {
    if (!selectedTicket) {
      return;
    }

    if (!newTrip || newTrip.trim() === "") {
      alert("Vui lòng chọn chuyến mới.");
      return;
    }

    try {
      setProcessing(true);
      setError("");

      const result = await changeTicket(
        selectedTicket.id,
        newTrip.trim()
      );

      const updatedTickets =
        await getMyTickets();

      setTickets(updatedTickets);

      alert(
        `Đổi vé thành công!\n\nChuyến mới: ${newTrip.trim()}\nMã vé điện tử mới: ${
          result.electronicTicketCode
        }`
      );

      setShowChange(false);
      setSelectedTicket(null);
    } catch (err) {
      setError(
        err.message || "Không thể đổi vé."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="container">
        <h1
          style={{
            marginBottom: "20px"
          }}
        >
          Vé của tôi
        </h1>

        {/* =====================
            TRA CỨU
        ====================== */}
        <div className="card">
          <h3>Tra cứu vé</h3>

          <input
            type="text"
            placeholder="Nhập mã vé, ví dụ: VE001 hoặc DT..."
            value={searchCode}
            onChange={(e) =>
              setSearchCode(e.target.value)
            }
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "10px",
              border: "1px solid #ccc",
              borderRadius: "6px"
            }}
          />
        </div>

        {/* =====================
            LỖI
        ====================== */}
        {error && (
          <div
            className="card"
            style={{
              color: "#dc3545",
              borderLeft:
                "4px solid #dc3545"
            }}
          >
            {error}
          </div>
        )}

        {/* =====================
            DANH SÁCH VÉ
        ====================== */}
        {loading ? (
          <div className="card">
            <p>
              Đang tải danh sách vé...
            </p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="card">
            <p>
              Không tìm thấy vé phù hợp.
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const ticketCode = `VE${ticket.id
              .toString()
              .padStart(3, "0")}`;

            const isCancelled =
              ticket.status === "Đã hủy";

            const allowCancel =
              canCancelTicket(ticket);

            const allowChange =
              canChangeTicket(ticket);

            return (
              <div
                key={ticket.id}
                className="card"
              >
                <h3>
                  Mã vé: {ticketCode}
                </h3>

                <p
                  style={{
                    marginTop: "10px"
                  }}
                >
                  Chuyến:{" "}
                  <strong>
                    {ticket.route}
                  </strong>
                </p>

                <p
                  style={{
                    marginTop: "10px"
                  }}
                >
                  Ghế:{" "}
                  <strong>
                    {ticket.seat}
                  </strong>
                </p>

                {/* GIỜ KHỞI HÀNH */}
                <p
                  style={{
                    marginTop: "10px"
                  }}
                >
                  Giờ khởi hành:{" "}
                  <strong>
                    {formatDepartureTime(
                      ticket.departureTime
                    )}
                  </strong>
                </p>

                {/* MÃ VÉ ĐIỆN TỬ MỚI */}
                {ticket.electronicTicketCode && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "12px",
                      background: "#e7f1ff",
                      borderRadius: "6px",
                      borderLeft:
                        "4px solid #0d6efd"
                    }}
                  >
                    <p>
                      Mã vé điện tử mới:
                    </p>

                    <strong
                      style={{
                        color: "#0d6efd"
                      }}
                    >
                      {
                        ticket.electronicTicketCode
                      }
                    </strong>
                  </div>
                )}

                <p
                  style={{
                    marginTop: "10px"
                  }}
                >
                  Giá vé:{" "}
                  <strong>
                    {ticket.price.toLocaleString(
                      "vi-VN"
                    )}{" "}
                    VNĐ
                  </strong>
                </p>

                {/* TRẠNG THÁI */}
                <p
                  style={{
                    marginTop: "10px"
                  }}
                >
                  Trạng thái:{" "}
                  <strong
                    style={{
                      color: isCancelled
                        ? "#dc3545"
                        : "#198754"
                    }}
                  >
                    {ticket.status}
                  </strong>
                </p>

                {/* HOÀN TIỀN */}
                <p
                  style={{
                    marginTop: "10px"
                  }}
                >
                  Hoàn tiền:{" "}
                  <strong>
                    {ticket.refundStatus}
                  </strong>
                </p>

                {/* ĐIỀU KIỆN THAO TÁC */}
                {!isCancelled && (
                  <div
                    style={{
                      marginTop: "12px",
                      marginBottom: "15px",
                      padding: "10px",
                      borderRadius: "6px",
                      background:
                        allowCancel &&
                        allowChange
                          ? "#d1e7dd"
                          : "#f8d7da",
                      color:
                        allowCancel &&
                        allowChange
                          ? "#0f5132"
                          : "#842029"
                    }}
                  >
                    {allowCancel &&
                    allowChange ? (
                      <strong>
                        ✓ Vé còn trong thời
                        gian cho phép hủy/đổi.
                      </strong>
                    ) : (
                      <strong>
                        Vé không còn đủ điều
                        kiện hủy/đổi.
                      </strong>
                    )}
                  </div>
                )}

                {/* NÚT HỦY */}
                <button
                  type="button"
                  className="btn btn-danger"
                  disabled={
                    processing ||
                    !allowCancel
                  }
                  onClick={() =>
                    handleOpenCancel(ticket)
                  }
                  style={{
                    opacity:
                      processing ||
                      !allowCancel
                        ? 0.6
                        : 1,

                    cursor:
                      processing ||
                      !allowCancel
                        ? "not-allowed"
                        : "pointer"
                  }}
                >
                  {isCancelled
                    ? "Đã hủy"
                    : "Hủy vé"}
                </button>

                {/* NÚT ĐỔI */}
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={
                    processing ||
                    !allowChange
                  }
                  onClick={() =>
                    handleOpenChange(ticket)
                  }
                  style={{
                    marginLeft: "10px",

                    opacity:
                      processing ||
                      !allowChange
                        ? 0.6
                        : 1,

                    cursor:
                      processing ||
                      !allowChange
                        ? "not-allowed"
                        : "pointer"
                  }}
                >
                  Đổi vé
                </button>
              </div>
            );
          })
        )}

        {/* =====================
            POPUP HỦY
        ====================== */}
        <CancelModal
          open={showCancel}
          onClose={handleCloseCancel}
          onConfirm={handleConfirmCancel}
        />

        {/* =====================
            POPUP ĐỔI
        ====================== */}
        <ChangeTripModal
          open={showChange}
          onClose={handleCloseChange}
          onConfirm={handleConfirmChange}
        />
      </div>
    </>
  );
}

export default MyTickets;