import { Schema, model, models } from "mongoose";
const BookingNightSchema = new Schema({ propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true }, bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true }, date: { type: Date, required: true }, status: { type: String, enum: ["HELD", "CONFIRMED"], default: "HELD" }, holdExpiresAt: Date }, { timestamps: true });
BookingNightSchema.index({ propertyId: 1, date: 1 }, { unique: true });
BookingNightSchema.index({ holdExpiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: "HELD" } });
const BookingNight = models.BookingNight || model("BookingNight", BookingNightSchema);
export default BookingNight;
