export const BOOKING_STATUSES = Object.freeze(["REQUESTED", "AWAITING_PAYMENT", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "DECLINED", "EXPIRED"]);
export const APPLICATION_STATUSES = Object.freeze(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "DECLINED", "WITHDRAWN"]);
export const LEASE_STATUSES = Object.freeze(["DRAFT", "AWAITING_SIGNATURES", "ACTIVE", "ENDED", "TERMINATED", "CANCELLED"]);
export const MAINTENANCE_STATUSES = Object.freeze(["OPEN", "TRIAGED", "ASSIGNED", "IN_PROGRESS", "ON_HOLD", "RESOLVED", "CLOSED", "CANCELLED"]);
export const OFFER_STATUSES = Object.freeze(["DRAFT", "SUBMITTED", "COUNTERED", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"]);

export function dateOnly(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function enumerateNights(checkIn, checkOut, maximum = 365) {
  const start = dateOnly(checkIn);
  const end = dateOnly(checkOut);
  if (!start || !end || end <= start) return [];
  const nights = [];
  for (let date = start; date < end && nights.length <= maximum; date = new Date(date.getTime() + 86_400_000)) nights.push(new Date(date));
  return nights.length <= maximum ? nights : [];
}
