import { beforeEach, describe, expect, it } from "vitest";
import {
  canModifyTicket,
  cancelTicket,
  changeTicket,
  findTicket,
  formatCurrency,
  getAlternativeTrips,
  resetTicketService,
} from "./ticketService";

describe("ticketService", () => {
  beforeEach(() => resetTicketService());

  it("tra cứu vé theo mã vé không phân biệt chữ hoa thường", () => {
    expect(findTicket(" ve001 ").code).toBe("VE001");
  });

  it("tra cứu vé bằng mã điện tử", () => {
    expect(findTicket("DT-2026-0001").seat).toBe("A01");
  });

  it("trả về null khi mã vé không tồn tại", () => {
    expect(findTicket("SAI-MA")).toBeNull();
  });

  it("xác định vé còn thời gian hủy đổi", () => {
    expect(canModifyTicket(findTicket("VE001"))).toBe(true);
    expect(canModifyTicket(findTicket("VE002"))).toBe(false);
  });

  it("hủy vé và tạo trạng thái hoàn tiền", () => {
    const ticket = cancelTicket("VE001");
    expect(ticket.status).toBe("cancelled");
    expect(ticket.refundStatus).toBe("Chờ xử lý theo quy định");
  });

  it("không cho hủy lại vé đã hủy", () => {
    cancelTicket("VE001");
    expect(() => cancelTicket("VE001")).toThrow("đã được hủy");
  });

  it("đổi chuyến và sinh mã vé điện tử mới có thể tra cứu", () => {
    const oldCode = findTicket("VE001").electronicCode;
    const updated = changeTicket("VE001", 2);
    expect(updated.route).toBe("Hà Nội → Bắc Ninh");
    expect(updated.electronicCode).not.toBe(oldCode);
    expect(findTicket(updated.electronicCode).code).toBe("VE001");
  });

  it("không cho đổi sang chuyến hết ghế và định dạng đúng giá vé", () => {
    expect(() => changeTicket("VE001", 3)).toThrow("hết ghế");
    expect(getAlternativeTrips(1)).toHaveLength(3);
    expect(formatCurrency(120000)).toContain("120.000");
  });
});
