import { NavLink } from "react-router-dom";

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `nav-link${isActive ? " nav-link--active" : ""}`;

  return (
    <header className="site-header">
      <nav className="navbar container" aria-label="Điều hướng chính">
        <NavLink className="brand" to="/" aria-label="SmartBus - Trang chủ">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>SmartBus</span>
        </NavLink>
        <div className="nav-links">
          <NavLink className={linkClass} to="/">Tìm chuyến</NavLink>
          <NavLink className={linkClass} to="/seat">Chọn ghế</NavLink>
          <NavLink className={linkClass} to="/tickets">Vé của tôi</NavLink>
        </div>
      </nav>
    </header>
  );
}
