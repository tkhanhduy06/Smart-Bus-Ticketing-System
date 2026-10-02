import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CountdownTimer from "./CountdownTimer";
import { formatCountdown, getCountdownTone } from "../utils/countdown";

describe("CountdownTimer", () => {
  afterEach(() => vi.useRealTimers());

  it("định dạng thời gian mm:ss", () => {
    expect(formatCountdown(600)).toBe("10:00");
  });

  it("hiển thị thời gian ban đầu 10 phút", () => {
    render(<CountdownTimer />);
    expect(screen.getByText("10:00")).toBeInTheDocument();
  });

  it("giảm thời gian sau mỗi giây", () => {
    vi.useFakeTimers();
    render(<CountdownTimer duration={600} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText("09:59")).toBeInTheDocument();
  });

  it("dùng màu xanh khi còn trên 5 phút", () => {
    render(<CountdownTimer duration={301} />);
    expect(screen.getByTestId("countdown")).toHaveAttribute("data-tone", "safe");
  });

  it("dùng màu vàng từ 5 phút trở xuống và đỏ từ 1 phút", () => {
    expect(getCountdownTone(300)).toBe("warning");
    expect(getCountdownTone(60)).toBe("danger");
  });

  it("gọi onExpire đúng một lần khi hết giờ", () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    render(<CountdownTimer duration={1} onExpire={onExpire} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
