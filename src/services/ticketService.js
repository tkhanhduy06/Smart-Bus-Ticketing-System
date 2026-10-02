const minute = 60 * 1000;

function futureDate(minutesFromNow) {
  return new Date(Date.now() + minutesFromNow * minute).toISOString();
}

function createInitialData() {
  return {
    tickets: [
      {
        code: "VE001",
        electronicCode: "DT-2026-0001",
        route: "Hà Nội → Thái Nguyên",
        tripId: 1,
        seat: "A01",
        price: 120000,
        departureTime: futureDate(24 * 60),
        status: "paid",
        refundStatus: "Chưa yêu cầu",
      },
      {
        code: "VE002",
        electronicCode: "DT-2026-0002",
        route: "Hà Nội → Bắc Giang",
        tripId: 4,
        seat: "B04",
        price: 95000,
        departureTime: futureDate(-60),
        status: "paid",
        refundStatus: "Chưa yêu cầu",
      },
    ],
    trips: [
      {
        id: 2,
        route: "Hà Nội → Bắc Ninh",
        departureTime: futureDate(30 * 60),
        price: 90000,
        availableSeats: 5,
      },
      {
        id: 3,
        route: "Hà Nội → Hải Phòng",
        departureTime: futureDate(48 * 60),
        price: 150000,
        availableSeats: 0,
      },
      {
        id: 5,
        route: "Hà Nội → Thái Nguyên",
        departureTime: futureDate(72 * 60),
        price: 125000,
        availableSeats: 8,
      },
    ],
  };
}

let store = createInitialData();
let electronicCodeSequence = 100;

function clone(value) {
  return value ? structuredClone(value) : value;
}

function decorateTrip(trip) {
  return {
    ...clone(trip),
    departureLabel: formatDateTime(trip.departureTime),
  };
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function canModifyTicket(ticket, now = new Date()) {
  return Boolean(
    ticket
      && ticket.status !== "cancelled"
      && new Date(ticket.departureTime).getTime() > now.getTime(),
  );
}

export function findTicket(code) {
  const normalizedCode = code?.trim().toUpperCase();
  if (!normalizedCode) return null;
  const ticket = store.tickets.find(
    (item) => item.code.toUpperCase() === normalizedCode
      || item.electronicCode.toUpperCase() === normalizedCode,
  );
  return clone(ticket ?? null);
}

export function getAlternativeTrips(currentTripId) {
  return store.trips
    .filter((trip) => trip.id !== currentTripId && new Date(trip.departureTime) > new Date())
    .map(decorateTrip);
}

export function cancelTicket(code) {
  const ticket = store.tickets.find(
    (item) => item.code === code || item.electronicCode === code,
  );
  if (!ticket) throw new Error("Không tìm thấy vé.");
  if (ticket.status === "cancelled") throw new Error("Vé đã được hủy trước đó.");
  if (!canModifyTicket(ticket)) throw new Error("Vé đã đến hoặc qua giờ khởi hành.");

  ticket.status = "cancelled";
  ticket.refundStatus = "Chờ xử lý theo quy định";
  return clone(ticket);
}

export function changeTicket(code, tripId) {
  const ticket = store.tickets.find(
    (item) => item.code === code || item.electronicCode === code,
  );
  if (!ticket) throw new Error("Không tìm thấy vé.");
  if (ticket.status === "cancelled") throw new Error("Vé đã hủy không thể đổi chuyến.");
  if (!canModifyTicket(ticket)) throw new Error("Vé đã đến hoặc qua giờ khởi hành.");

  const trip = store.trips.find((item) => item.id === Number(tripId));
  if (!trip) throw new Error("Không tìm thấy chuyến mới.");
  if (trip.availableSeats <= 0) throw new Error("Chuyến mới đã hết ghế.");

  trip.availableSeats -= 1;
  electronicCodeSequence += 1;
  ticket.tripId = trip.id;
  ticket.route = trip.route;
  ticket.departureTime = trip.departureTime;
  ticket.price = trip.price;
  ticket.electronicCode = `DT-${new Date().getFullYear()}-${electronicCodeSequence}`;
  return clone(ticket);
}

export function resetTicketService() {
  store = createInitialData();
  electronicCodeSequence = 100;
}

export const ticketService = {
  findTicket,
  getAlternativeTrips,
  cancelTicket,
  changeTicket,
};
