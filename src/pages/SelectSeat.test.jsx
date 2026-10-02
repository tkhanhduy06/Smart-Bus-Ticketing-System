import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import SelectSeat from "./SelectSeat";

describe("SelectSeat", () => {
  afterEach(() => vi.useRealTimers());

  it("hiển thị màn hình và sơ đồ chọn ghế", () => {
    render(<SelectSeat />);
    expect(screen.getByRole("heading", { name: "Chọn ghế của bạn" })).toBeInTheDocument();
    expect(screen.getByLabelText("Sơ đồ ghế")).toBeInTheDocument();
  });

  it("không cho giữ chỗ khi chưa chọn ghế", () => {
    render(<SelectSeat />);
    expect(screen.getByRole("button", { name: /Giữ ghế/ })).toBeDisabled();
  });

  it("chọn và bỏ chọn một ghế trống", () => {
    render(<SelectSeat />);
    const seat = screen.getByRole("button", { name: "Ghế A01 còn trống" });
    fireEvent.click(seat);
    expect(screen.getByRole("button", { name: "Ghế A01 đã chọn" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Ghế A01 đã chọn" }));
    expect(screen.getByText("Chưa chọn ghế")).toBeInTheDocument();
  });

  it("không cho chọn ghế đã đặt", () => {
    render(<SelectSeat />);
    expect(screen.getByRole("button", { name: "Ghế A08 đã đặt" })).toBeDisabled();
  });

  it("bắt đầu giữ chỗ với countdown 10 phút", () => {
    render(<SelectSeat />);
    fireEvent.click(screen.getByRole("button", { name: "Ghế A01 còn trống" }));
    fireEvent.click(screen.getByRole("button", { name: /Giữ ghế/ }));
    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("Giữ chỗ")).toBeInTheDocument();
  });

  it("dừng phiên và chuyển trạng thái khi thanh toán thành công", () => {
    render(<SelectSeat />);
    fireEvent.click(screen.getByRole("button", { name: "Ghế A01 còn trống" }));
    fireEvent.click(screen.getByRole("button", { name: /Giữ ghế/ }));
    fireEvent.click(screen.getByRole("button", { name: "Thanh toán thành công" }));
    expect(screen.getByText("Thanh toán hoàn tất")).toBeInTheDocument();
    expect(screen.getAllByText(/Đã thanh toán/).length).toBeGreaterThan(0);
  });

  it("trả ghế và quay lại màn hình chọn ghế khi hết hạn", () => {
    vi.useFakeTimers();
    render(<SelectSeat countdownDuration={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Ghế A01 còn trống" }));
    fireEvent.click(screen.getByRole("button", { name: /Giữ ghế/ }));
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole("alert")).toHaveTextContent("Phiên giữ chỗ đã hết hạn");
    expect(screen.getByRole("heading", { name: "Chọn ghế của bạn" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ghế A01 còn trống" })).toBeEnabled();
  });
});
