import { useEffect, useState } from "react";
import useCountdown from "../hooks/useCountdown";

function CountdownTimer({
  seat,
  onExpired,
  onPaymentSuccess
}) {
  const [paymentSuccess, setPaymentSuccess] =
    useState(false);

  const [seatStatus, setSeatStatus] =
    useState("Giữ chỗ");

  const seconds = useCountdown(
    10,
    !paymentSuccess
  );

  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;

  const getTimerColor = () => {
    if (paymentSuccess) {
      return "#198754";
    }

    if (seconds <= 60) {
      return "#dc3545";
    }

    if (seconds <= 300) {
      return "#ffc107";
    }

    return "#198754";
  };

  useEffect(() => {
    if (
      seconds === 0 &&
      !paymentSuccess
    ) {
      setSeatStatus("Trống");

      alert(
        `Thời gian giữ ghế ${seat} đã hết. Ghế đã được trả về trạng thái trống.`
      );

      if (onExpired) {
        onExpired();
      }
    }
  }, [
    seconds,
    paymentSuccess,
    seat,
    onExpired
  ]);

  const handlePayment = () => {
    if (seconds <= 0) {
      alert(
        "Thời gian giữ chỗ đã hết. Không thể thanh toán."
      );

      return;
    }

    setPaymentSuccess(true);
    setSeatStatus("Đã thanh toán");

    if (onPaymentSuccess) {
      onPaymentSuccess();
    }

    alert(
      `Thanh toán thành công ghế ${seat}! Countdown đã dừng.`
    );
  };

  return (
    <div className="card">
      <h2>Thời gian giữ chỗ</h2>

      <p
        style={{
          marginTop: "10px"
        }}
      >
        Ghế: <strong>{seat}</strong>
      </p>

      <div
        style={{
          marginTop: "15px",
          marginBottom: "15px",
          padding: "15px",
          borderRadius: "8px",
          background: getTimerColor(),
          color: "white",
          textAlign: "center"
        }}
      >
        <h1>
          {minutes}:
          {remain
            .toString()
            .padStart(2, "0")}
        </h1>
      </div>

      <p>
        Trạng thái ghế:{" "}
        <strong>{seatStatus}</strong>
      </p>

      {!paymentSuccess ? (
        <>
          <p
            style={{
              marginTop: "10px",
              marginBottom: "15px"
            }}
          >
            Vui lòng hoàn tất thanh toán
            trước khi thời gian giữ chỗ kết
            thúc.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePayment}
            disabled={seconds <= 0}
          >
            Thanh toán thành công
          </button>
        </>
      ) : (
        <div
          style={{
            marginTop: "15px",
            padding: "12px",
            background: "#d1e7dd",
            borderRadius: "6px",
            color: "#0f5132"
          }}
        >
          <strong>
            ✓ Thanh toán thành công
          </strong>

          <p style={{ marginTop: "5px" }}>
            Ghế {seat} đã được xác nhận.
          </p>
        </div>
      )}
    </div>
  );
}

export default CountdownTimer;