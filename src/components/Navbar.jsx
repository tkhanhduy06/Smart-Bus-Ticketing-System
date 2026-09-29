import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav
      style={{
        background: "#0d6efd",
        padding: "15px"
      }}
    >
      <Link
        to="/"
        style={{
          color: "white",
          marginRight: "20px",
          textDecoration: "none"
        }}
      >
        Trang chủ
      </Link>

      <Link
        to="/seat"
        style={{
          color: "white",
          marginRight: "20px",
          textDecoration: "none"
        }}
      >
        Chọn ghế
      </Link>

      <Link
        to="/tickets"
        style={{
          color: "white",
          textDecoration: "none"
        }}
      >
        Vé của tôi
      </Link>
    </nav>
  );
}

export default Navbar;