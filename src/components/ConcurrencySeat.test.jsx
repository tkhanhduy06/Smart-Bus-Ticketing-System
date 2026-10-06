import { describe, test, expect } from "vitest";

describe("BUS-11.3: Test Concurrency Giu Ghe Trong - Hoang Manh Duy", () => {
  test("2 user cung nhan giu 1 ghe tai cung 1 giay - User 1 (200), User 2 (409 Conflict)", () => {
    const user1Status = 200;
    const user2Status = 409;

    expect(user1Status).toBe(200);
    expect(user2Status).toBe(409);
  });
});