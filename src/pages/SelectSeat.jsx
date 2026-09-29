import { useState } from "react";
import Navbar from "../components/Navbar";
import CountdownTimer from "../components/CountdownTimer";

function SelectSeat() {
  const [selectedSeat, setSelectedSeat] =
    useState(null);

  const [holdStarted, setHoldStarted] =
    useState(false);

  const seats = [
    "A01",
    "A02",
    "A03",
    "A04",
    "B01",
    "B02",
    "B03",
    "B04"
  ];

  const handleSelectSeat = (seat) => {
    if (holdStarted) {
      return;
    }

    setSelectedSeat(seat);
  };

  const handleStartHold = () => {
    if (!selectedSeat) {
      alert(
        "Vui lòng chọn ghế trước khi tiếp tục."
      );

      return;
    }

    setHoldStarted(true);
  };

  const handleHoldExpired = () => {
    // Hủy phiên giữ chỗ
    setHoldStarted(false);

    // Trả ghế về trạng thái trống
    setSelectedSeat(null);
  };

  const handlePaymentSuccess = () => {
    // Sau khi thanh toán thành công
    // giữ nguyên ghế đã chọn
    setHoldStarted(true);
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
          Chọn ghế
        </h1>

        {!holdStarted ? (
          <>
            <div className="card">
              <h2>Danh sách ghế</h2>

              <p
                style={{
                  marginTop: "10px",
                  marginBottom: "15px"
                }}
              >
                Vui lòng chọn một ghế để bắt
                đầu phiên giữ chỗ.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(4, 1fr)",
                  gap: "12px"
                }}
              >
                {seats.map((seat) => {
                  const isSelected =
                    selectedSeat === seat;

                  return (
                    <button
                      key={seat}
                      type="button"
                      onClick={() =>
                        handleSelectSeat(seat)
                      }
                      style={{
                        padding: "15px",
                        borderRadius: "8px",
                        border: isSelected
                          ? "2px solid #0d6efd"
                          : "1px solid #ccc",
                        background: isSelected
                          ? "#0d6efd"
                          : "white",
                        color: isSelected
                          ? "white"
                          : "#212529",
                        cursor: "pointer",
                        fontWeight: "bold"
                      }}
                    >
                      {seat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <p>
                Ghế đã chọn:{" "}
                <strong>
                  {selectedSeat ||
                    "Chưa chọn ghế"}
                </strong>
              </p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartHold}
                disabled={!selectedSeat}
                style={{
                  marginTop: "15px",
                  opacity: selectedSeat
                    ? 1
                    : 0.6,
                  cursor: selectedSeat
                    ? "pointer"
                    : "not-allowed"
                }}
              >
                Giữ ghế và tiếp tục thanh toán
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="card">
              <h3>
                Ghế đang giữ:{" "}
                <span
                  style={{
                    color: "#0d6efd"
                  }}
                >
                  {selectedSeat}
                </span>
              </h3>
            </div>

            <CountdownTimer
              seat={selectedSeat}
              onExpired={handleHoldExpired}
              onPaymentSuccess={
                handlePaymentSuccess
              }
            />
          </>
        )}
      </div>
    </>
  );
}

export default SelectSeat;