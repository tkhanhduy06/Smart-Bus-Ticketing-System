import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function SearchTrip() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ from: "Hà Nội", to: "Thái Nguyên", date: "" });

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    navigate("/seat");
  }

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow eyebrow--light">ĐẶT VÉ TRỰC TUYẾN 24/7</span>
            <h1>Mỗi hành trình,<br /><em>một trải nghiệm an tâm.</em></h1>
            <p>Tìm chuyến, chọn ghế và quản lý vé xe buýt chỉ trong vài thao tác.</p>
            <div className="hero-highlights" aria-label="Ưu điểm dịch vụ">
              <span>✓ Giữ ghế 10 phút</span>
              <span>✓ Quản lý vé dễ dàng</span>
            </div>
          </div>
          <form className="search-card" onSubmit={handleSubmit}>
            <div>
              <span className="eyebrow">BẮT ĐẦU HÀNH TRÌNH</span>
              <h2>Tìm chuyến xe</h2>
            </div>
            <label className="field-label" htmlFor="from">Điểm đi</label>
            <input id="from" name="from" value={form.from} onChange={updateField} required />
            <span className="route-line" aria-hidden="true">↓</span>
            <label className="field-label" htmlFor="to">Điểm đến</label>
            <input id="to" name="to" value={form.to} onChange={updateField} required />
            <label className="field-label" htmlFor="date">Ngày đi</label>
            <input id="date" name="date" type="date" value={form.date} onChange={updateField} />
            <button className="button button--primary button--large" type="submit">Tìm chuyến phù hợp →</button>
          </form>
        </div>
      </section>
      <section className="features-section" aria-label="Các chức năng chính">
        <div className="container">
          <div className="features-header">
            <span className="eyebrow">QUY TRÌNH ĐẶT VÉ THÔNG MINH</span>
            <h2>3 bước dễ dàng cho hành trình trọn vẹn</h2>
            <p>Hệ thống tự động hóa giúp bạn chọn chỗ ưng ý, giữ vé an toàn và chủ động quản lý mọi lúc mọi nơi.</p>
          </div>

          <div className="features-grid">
            {/* Card 1: Chọn ghế trực quan */}
            <article className="feature-card">
              <div className="feature-card__top">
                <span className="feature-step-pill">BƯỚC 01</span>
                <div className="feature-icon-wrapper" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 18v3" />
                    <path d="M8 18v3" />
                    <path d="M4 11h11a3 3 0 0 1 3 3v4H4v-7z" />
                    <path d="M7 4h5a3 3 0 0 1 3 3v4H7V4z" />
                  </svg>
                </div>
              </div>

              {/* Visual preview: Sơ đồ ghế */}
              <div className="feature-visual" aria-hidden="true">
                <div className="mini-seat-demo">
                  <div className="mini-bus-head">
                    <span>ĐẦU XE</span>
                    <span className="mini-wheel">◉</span>
                  </div>
                  <div className="mini-seats-row">
                    <div className="mini-seat mini-seat--available">A1</div>
                    <div className="mini-seat mini-seat--selected">
                      <span>A2</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <div className="mini-aisle">Lối đi</div>
                    <div className="mini-seat mini-seat--occupied">A3</div>
                    <div className="mini-seat mini-seat--available">A4</div>
                  </div>
                  <div className="mini-seat-caption">
                    <span className="mini-dot mini-dot--coral"></span> Ghế A2 đang chọn (Real-time)
                  </div>
                </div>
              </div>

              <div className="feature-card__body">
                <h3>Chọn ghế trực quan</h3>
                <p>Sơ đồ xe 2D rõ ràng theo thời gian thực. Dễ dàng quan sát vị trí đầu/cuối xe, lối đi và chọn đúng ghế yêu thích.</p>
              </div>

              <Link to="/seat" className="feature-card__cta">
                <span>Chọn ghế ngay</span>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 10h10M11 6l4 4-4 4" />
                </svg>
              </Link>
            </article>

            {/* Card 2: Giữ chỗ an toàn */}
            <article className="feature-card">
              <div className="feature-card__top">
                <span className="feature-step-pill">BƯỚC 02</span>
                <div className="feature-icon-wrapper" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
              </div>

              {/* Visual preview: Bộ đếm 10 phút */}
              <div className="feature-visual" aria-hidden="true">
                <div className="mini-hold-demo">
                  <div className="mini-hold-status">
                    <span className="pulse-indicator"></span>
                    <span>Đang giữ chỗ cho bạn</span>
                  </div>
                  <div className="mini-countdown-timer">10:00</div>
                  <div className="mini-timer-progress">
                    <div className="mini-timer-bar"></div>
                  </div>
                  <div className="mini-timer-sub">Tự động bảo lưu · Không lo mất vé</div>
                </div>
              </div>

              <div className="feature-card__body">
                <h3>Giữ chỗ an toàn</h3>
                <p>Bạn có 10 phút trọn vẹn để hoàn tất thanh toán. Hệ thống tự động khóa ghế giúp bạn hoàn toàn an tâm.</p>
              </div>

              <Link to="/seat" className="feature-card__cta feature-card__cta--ghost">
                <span>Trải nghiệm đặt vé</span>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 10h10M11 6l4 4-4 4" />
                </svg>
              </Link>
            </article>

            {/* Card 3: Linh hoạt hành trình */}
            <article className="feature-card">
              <div className="feature-card__top">
                <span className="feature-step-pill">BƯỚC 03</span>
                <div className="feature-icon-wrapper" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 9a3 3 0 0 1 0 6v3a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3a3 3 0 0 1 0-6V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
                    <path d="M13 5v2" />
                    <path d="M13 11v2" />
                    <path d="M13 17v2" />
                  </svg>
                </div>
              </div>

              {/* Visual preview: Quản lý đổi vé */}
              <div className="feature-visual" aria-hidden="true">
                <div className="mini-ticket-demo">
                  <div className="mini-ticket-head">
                    <span className="mini-ticket-badge">VÉ ĐÃ XÁC NHẬN</span>
                    <span className="mini-ticket-id">#SB-8921</span>
                  </div>
                  <div className="mini-ticket-route">Hà Nội ➔ Thái Nguyên</div>
                  <div className="mini-ticket-actions">
                    <span className="mini-action-pill mini-action-pill--change">Đổi chuyến</span>
                    <span className="mini-action-pill mini-action-pill--cancel">Hủy vé 24/7</span>
                  </div>
                </div>
              </div>

              <div className="feature-card__body">
                <h3>Linh hoạt hành trình</h3>
                <p>Chủ động tra cứu mã vé, thực hiện đổi giờ xe hoặc hủy vé trực tuyến nhanh chóng trước giờ khởi hành.</p>
              </div>

              <Link to="/tickets" className="feature-card__cta">
                <span>Quản lý vé của tôi</span>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 10h10M11 6l4 4-4 4" />
                </svg>
              </Link>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
