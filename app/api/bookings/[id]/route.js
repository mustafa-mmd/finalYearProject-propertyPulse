import mongoose from "mongoose";
import connectDB from "@/config/database";
import Booking from "@/models/Booking";
import BookingNight from "@/models/BookingNight";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";
import { writeAuditLog } from "@/utils/audit";
import { emitNotification } from "@/utils/events";

export async function PATCH(request, { params }) {
  try {
    const actor = await requireActor(); const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return apiError("Booking not found", { status: 404, code: "NOT_FOUND" });
    const body = await request.json(); await connectDB(); const booking = await Booking.findById(id);
    if (!booking) return apiError("Booking not found", { status: 404, code: "NOT_FOUND" });
    const isGuest = booking.guestId.toString() === actor.id; const isOwner = booking.ownerId.toString() === actor.id;
    let nextStatus = "";
    if (body.action === "cancel" && isGuest && ["REQUESTED", "AWAITING_PAYMENT", "CONFIRMED"].includes(booking.status)) nextStatus = "CANCELLED";
    if (body.action === "decline" && isOwner && booking.status === "REQUESTED") nextStatus = "DECLINED";
    if (body.action === "confirm" && isOwner && booking.status === "REQUESTED") nextStatus = "CONFIRMED";
    if (!nextStatus) return apiError("This booking action is not allowed", { status: 409, code: "INVALID_TRANSITION" });
    booking.status = nextStatus; booking.statusHistory.push({ status: nextStatus, changedBy: actor.id, reason: typeof body.reason === "string" ? body.reason.slice(0, 500) : body.action }); await booking.save();
    if (["CANCELLED", "DECLINED"].includes(nextStatus)) await BookingNight.deleteMany({ bookingId: booking._id });
    if (nextStatus === "CONFIRMED") await BookingNight.updateMany({ bookingId: booking._id }, { $set: { status: "CONFIRMED" }, $unset: { holdExpiresAt: 1 } });
    await writeAuditLog({ actor, action: `booking.${body.action}`, targetType: "Booking", targetId: id, tenantId: booking.tenantId, request });
    await emitNotification({ recipientId: isOwner ? booking.guestId : booking.ownerId, tenantId: booking.tenantId, type: `BOOKING_${nextStatus}`, title: `Booking ${nextStatus.toLowerCase().replaceAll("_", " ")}`, body: "Your booking status has changed.", href: "/bookings", dedupeKey: `booking-status:${id}:${nextStatus}`, channels: ["IN_APP", "EMAIL"] });
    return apiSuccess({ id, status: nextStatus });
  } catch (error) { return handleApiError(error, "bookings.transition"); }
}
