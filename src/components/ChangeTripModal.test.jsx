import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ChangeTripModal from "./ChangeTripModal";

const ticket = { code: "VE001" };
const trips = [
  { id: 2, route: "Hà Nội → Bắc Ninh", departureLabel: "08:00 02/10/2026", availableSeats: 5 },
  { id: 3, route: "Hà Nội → Hải Phòng", departureLabel: "09:00 03/10/2026", availableSeats: 0 },
];

describe("ChangeTripModal", () => {
  it("không hiển thị khi chưa có vé", () => {
    const { container } = render(<ChangeTripModal ticket={null} trips={trips} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hiển thị danh sách chuyến mới", () => {
    render(<ChangeTripModal ticket={ticket} trips={trips} onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.getByRole("option", { name: /Bắc Ninh/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Hải Phòng/ })).toBeInTheDocument();
  });

  it("hiển thị số ghế trống", () => {
    render(<ChangeTripModal ticket={ticket} trips={trips} onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.getByText("Còn 5 ghế trống")).toBeInTheDocument();
  });

  it("không cho xác nhận chuyến hết ghế", () => {
    render(<ChangeTripModal ticket={ticket} trips={trips} onClose={() => {}} onConfirm={() => {}} />);
    fireEvent.change(screen.getByLabelText("Chuyến mới"), { target: { value: "3" } });
    expect(screen.getByRole("button", { name: "Xác nhận đổi" })).toBeDisabled();
    expect(screen.getByText("Chuyến này đã hết ghế")).toBeInTheDocument();
  });

  it("gửi id chuyến còn ghế khi xác nhận", () => {
    const onConfirm = vi.fn();
    render(<ChangeTripModal ticket={ticket} trips={trips} onClose={() => {}} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận đổi" }));
    expect(onConfirm).toHaveBeenCalledWith(2);
  });

  it("thông báo khi không có chuyến thay thế", () => {
    render(<ChangeTripModal ticket={ticket} trips={[]} onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.getByText("Hiện chưa có chuyến thay thế phù hợp.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xác nhận đổi" })).toBeDisabled();
  });
});
