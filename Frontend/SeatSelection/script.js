// Lấy tất cả các ghế có thể thao tác
const seats = document.querySelectorAll(".seat:not(.occupied)");

// Lấy phần hiển thị thông tin
const selectedSeatsElement =
    document.getElementById("selected-seats");

const selectedCountElement =
    document.getElementById("selected-count");

// Danh sách ghế đang được chọn
let selectedSeats = [];

// Xử lý khi người dùng click ghế
seats.forEach(function (seat) {

    seat.addEventListener("click", function () {

        const seatNumber = seat.dataset.seat;

        // Nếu ghế đã được chọn
        if (seat.classList.contains("selected")) {

            // Bỏ trạng thái selected
            seat.classList.remove("selected");

            // Xóa ghế khỏi danh sách
            selectedSeats = selectedSeats.filter(
                function (item) {
                    return item !== seatNumber;
                }
            );

        }

        // Nếu ghế chưa được chọn
        else {

            // Thêm trạng thái selected
            seat.classList.add("selected");

            // Thêm ghế vào danh sách
            selectedSeats.push(seatNumber);
        }

        // Cập nhật giao diện
        updateSelectedSeats();
    });
});


// Hàm cập nhật thông tin ghế
function updateSelectedSeats() {

    // Sắp xếp danh sách ghế
    selectedSeats.sort();

    // Cập nhật số lượng
    selectedCountElement.textContent =
        selectedSeats.length;

    // Nếu chưa chọn ghế
    if (selectedSeats.length === 0) {

        selectedSeatsElement.textContent =
            "Chưa chọn";

        return;
    }

    // Hiển thị danh sách ghế
    selectedSeatsElement.textContent =
        selectedSeats.join(", ");
}