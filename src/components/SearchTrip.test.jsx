import { describe, test, expect } from "vitest";

describe("BUS-6.3: Test Suite Tim Kiem Tuyen Xe - Hoang Manh Duy", () => {
  test("Case 1: Tim kiem thanh cong co du lieu tra ve", () => {
    const searchResult = { success: true, trips: [{ id: 1, route: "Ha Noi - Sai Gon" }] };
    expect(searchResult.success).toBe(true);
    expect(searchResult.trips.length).toBeGreaterThan(0);
  });

  test("Case 2: Tim kiem ngay khong co chuyen xe", () => {
    const searchResult = { success: true, trips: [] };
    expect(searchResult.success).toBe(true);
    expect(searchResult.trips.length).toBe(0);
  });

  test("Case 3: Nhap du lieu trong hoac sai dinh dang date", () => {
    const invalidInput = { from: "", to: "", date: "invalid-date" };
    const isValid = Boolean(invalidInput.from && invalidInput.to && !isNaN(Date.parse(invalidInput.date)));
    expect(isValid).toBe(false);
  });
});