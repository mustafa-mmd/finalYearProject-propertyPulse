import { Schema, model, models } from "mongoose";
import { BOOKING_STATUSES } from "@/config/commerce";

const BookingSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
  propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
  guestId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  status: { type: String, enum: BOOKING_STATUSES, default: "REQUESTED", index: true },
  checkIn: { type: Date, required: true }, checkOut: { type: Date, required: true }, nights: { type: Number, required: true, min: 1, max: 365 }, guests: { type: Number, required: true, min: 1, max: 50 },
  currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 },
  nightlyRate: { type: Number, required: true, min: 0 }, subtotal: { type: Number, required: true, min: 0 }, fees: { type: Number, default: 0, min: 0 }, taxes: { type: Number, default: 0, min: 0 }, total: { type: Number, required: true, min: 0 },
  message: { type: String, maxlength: 1000 }, cancellationReason: { type: String, maxlength: 500 },
  statusHistory: [{ status: { type: String, enum: BOOKING_STATUSES }, changedBy: { type: Schema.Types.ObjectId, ref: "User" }, reason: { type: String, maxlength: 500 }, at: { type: Date, default: Date.now } }],
  deletedAt: Date,
}, { timestamps: true });
BookingSchema.index({ propertyId: 1, checkIn: 1, checkOut: 1, status: 1 });
const Booking = models.Booking || model("Booking", BookingSchema);
export default Booking;
