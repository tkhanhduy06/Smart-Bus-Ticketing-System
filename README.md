# Smart Bus Ticketing System

## Frontend Sprint 1

**Sinh viên thực hiện:** Luân Khánh Duy  
**Vai trò:** Frontend Developer  
**Đơn vị:** Trường Đại học Công nghệ Thông tin và Truyền thông - Đại học Thái Nguyên (ICTU)

---

## 1. Giới thiệu

Đây là phần Frontend Sprint 1 của đề tài:

**Smart Bus Ticketing System - Hệ thống bán vé xe buýt thông minh**

Phần source này tập trung vào các nhiệm vụ Frontend của Luân Khánh Duy:

1. Đồng hồ đếm ngược giữ chỗ 10 phút.
2. Giao diện hủy/đổi vé.

---

## 2. Công nghệ sử dụng

- React
- Vite
- JavaScript
- React Router
- CSS
- Vitest
- React Testing Library
- jest-dom
- jsdom

---

## 3. Chức năng Countdown giữ chỗ

Hệ thống hỗ trợ:

- Hiển thị danh sách ghế.
- Người dùng chọn ghế.
- Bắt đầu phiên giữ chỗ sau khi chọn ghế.
- Countdown bắt đầu từ 10:00.
- Countdown tự động giảm từng giây.
- Màu xanh khi còn trên 5 phút.
- Màu vàng khi còn từ 5 phút trở xuống.
- Màu đỏ khi còn từ 1 phút trở xuống.
- Hiển thị trạng thái giữ chỗ.
- Thanh toán thành công sẽ dừng countdown.
- Chuyển trạng thái sang "Đã thanh toán".
- Khi hết 10 phút:
  - Thông báo hết hạn.
  - Hủy giữ chỗ.
  - Trả ghế về trạng thái trống ở phía Frontend.
  - Quay lại giao diện chọn ghế.

---

## 4. Chức năng Hủy/Đổi vé

Hệ thống hỗ trợ:

- Tra cứu vé theo mã.
- Hiển thị thông tin vé.
- Hiển thị giờ khởi hành.
- Kiểm tra điều kiện trước giờ khởi hành.
- Hủy vé.
- Popup xác nhận hủy.
- Cập nhật trạng thái vé thành "Đã hủy".
- Tạo trạng thái yêu cầu hoàn tiền theo quy định.
- Đổi chuyến.
- Hiển thị danh sách chuyến mới.
- Kiểm tra số ghế trống.
- Không cho đổi sang chuyến hết ghế.
- Không cho hủy/đổi vé đã qua giờ khởi hành.
- Không cho đổi vé đã hủy.
- Sinh mã vé điện tử mới sau khi đổi chuyến.
- Tra cứu bằng mã vé điện tử mới.

---

## 5. Cấu trúc chính

```text
SmartBusFrontend/
│
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── CancelModal.jsx
│   │   ├── ChangeTripModal.jsx
│   │   ├── CountdownTimer.jsx
│   │   ├── CancelModal.test.jsx
│   │   ├── ChangeTripModal.test.jsx
│   │   └── CountdownTimer.test.jsx
│   │
│   ├── hooks/
│   │   └── useCountdown.js
│   │
│   ├── pages/
│   │   ├── SearchTrip.jsx
│   │   ├── SelectSeat.jsx
│   │   ├── MyTickets.jsx
│   │   └── SelectSeat.test.jsx
│   │
│   ├── services/
│   │   ├── ticketService.js
│   │   └── ticketService.test.js
│   │
│   ├── styles/
│   │   └── global.css
│   │
│   ├── App.jsx
│   ├── main.jsx
│   ├── router.jsx
│   └── setupTests.js
│
├── SPRINT1_LUAN_KHANH_DUY.md
├── package.json
├── vite.config.js
└── README.md
```

---

## 6. Cài đặt project

Yêu cầu máy đã cài:

- Node.js
- npm

Mở Terminal tại thư mục:

```text
SmartBusFrontend
```

Cài thư viện:

```bash
npm install
```

---

## 7. Chạy project

Sử dụng:

```bash
npm run dev
```

Sau đó mở địa chỉ mà Vite hiển thị trên Terminal.

Ví dụ:

```text
http://localhost:5173/
```

Nếu cổng 5173 đang được sử dụng, Vite có thể tự chuyển sang cổng khác như:

```text
http://localhost:5174/
```

---

## 8. Các đường dẫn chính

```text
/          Trang chủ
/seat      Chọn ghế và giữ chỗ
/tickets   Vé của tôi - Tra cứu/Hủy/Đổi vé
```

---

## 9. Chạy Unit Test

Sử dụng:

```bash
npm test
```

Kết quả kiểm thử cuối:

```text
Test Files  5 passed (5)
Tests       31 passed (31)
```

Các phần đã được kiểm thử gồm:

- CancelModal.
- ChangeTripModal.
- SelectSeat.
- CountdownTimer.
- ticketService.

---

## 10. Kiểm tra Build

Chạy:

```bash
npm run build
```

Kết quả kiểm tra cuối:

```text
PASS
```

---

## 11. Kiểm tra Lint

Chạy:

```bash
npm run lint
```

Kết quả kiểm tra cuối:

```text
PASS
```

---

## 12. Dữ liệu Mock

Frontend Sprint 1 hiện sử dụng dữ liệu mô phỏng.

Dữ liệu vé, chuyến và số ghế trống được xử lý tại:

```text
src/services/ticketService.js
```

Dữ liệu giờ khởi hành trong bản demo cũng được tạo dưới dạng Mock Data.

Project chưa kết nối Backend API hoặc cơ sở dữ liệu thật trong phần source Frontend này.

Service được tách riêng để thuận tiện thay thế bằng Backend API khi API chính thức được cung cấp.

---

## 13. Hoàn tiền

Luồng hủy vé có xử lý trạng thái hoàn tiền.

Trạng thái hiện tại:

```text
Chờ xử lý theo quy định
```

Không tự đặt tỷ lệ hoặc số tiền hoàn vì tài liệu nhiệm vụ không cung cấp công thức/tỷ lệ hoàn tiền cụ thể.

---

## 14. Tài liệu bàn giao

Chi tiết nhiệm vụ, wireframe, luồng nghiệp vụ và tiêu chí nghiệm thu nằm tại:

```text
SPRINT1_LUAN_KHANH_DUY.md
```

Tài liệu gồm:

- Wireframe giao diện Countdown.
- Wireframe giao diện Hủy/Đổi vé.
- Mô tả nghiệp vụ.
- Luồng xử lý chức năng.
- Tiêu chí kiểm thử nghiệm thu.

---

## 15. Kiểm tra cuối

Trạng thái kiểm tra source:

```text
npm test       -> PASS - 31/31 tests
npm run build  -> PASS
npm run lint   -> PASS
```

---

## 16. Người thực hiện

**Luân Khánh Duy**  
Frontend Developer - Sprint 1  
Smart Bus Ticketing System