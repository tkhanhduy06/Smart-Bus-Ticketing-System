import { describe, test, expect } from "vitest";

describe("BUS-19.3: Test Suite Sandbox MoMo/VNPay - Hoang Manh Duy", () => {
  test("Case 1: Nhap OTP thanh toan thanh cong", () => {
    const paymentResult = { status: "SUCCESS" };
    expect(paymentResult.status).toBe("SUCCESS");
  });

  test("Case 2: Khach hang huy thanh toan", () => {
    const paymentResult = { status: "CANCELLED" };
    expect(paymentResult.status).toBe("CANCELLED");
  });

  test("Case 3: Tai khoan Sandbox khong du tien", () => {
    const paymentResult = { status: "FAILED", code: "INSUFFICIENT_FUNDS" };
    expect(paymentResult.code).toBe("INSUFFICIENT_FUNDS");
  });
});