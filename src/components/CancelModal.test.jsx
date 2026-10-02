import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CancelModal from "./CancelModal";

const ticket = { code: "VE001", route: "Hà Nội → Thái Nguyên" };

describe("CancelModal", () => {
  it("không hiển thị khi chưa có vé", () => {
    const { container } = render(<CancelModal ticket={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hiển thị mã vé và chuyến cần hủy", () => {
    render(<CancelModal ticket={ticket} onClose={() => {}} onConfirm={() => {}} />);
    expect(screen.getByText("VE001")).toBeInTheDocument();
    expect(screen.getByText("Hà Nội → Thái Nguyên")).toBeInTheDocument();
  });

  it("xác nhận hủy vé", () => {
    const onConfirm = vi.fn();
    render(<CancelModal ticket={ticket} onClose={() => {}} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Đồng ý hủy" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("đóng popup", () => {
    const onClose = vi.fn();
    render(<CancelModal ticket={ticket} onClose={onClose} onConfirm={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
