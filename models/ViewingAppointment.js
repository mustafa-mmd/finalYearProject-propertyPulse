import { Schema, model, models } from "mongoose";

const ViewingAppointmentSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["IN_PERSON", "VIRTUAL"], default: "IN_PERSON" },
    status: {
      type: String,
      enum: ["REQUESTED", "CONFIRMED", "RESCHEDULE_PROPOSED", "COMPLETED", "CANCELLED", "REJECTED", "NO_SHOW"],
      default: "REQUESTED",
      index: true,
    },
    scheduledStart: { type: Date, required: true, index: true },
    scheduledEnd: { type: Date, required: true },
    timezone: { type: String, required: true, maxlength: 100 },
    message: { type: String, maxlength: 1000 },
    meetingUrl: { type: String, maxlength: 2000 },
    decisionReason: { type: String, maxlength: 1000 },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        reason: { type: String, maxlength: 1000 },
        at: { type: Date, default: Date.now },
      },
    ],
    deletedAt: Date,
  },
  { timestamps: true }
);

ViewingAppointmentSchema.index({ ownerId: 1, status: 1, scheduledStart: 1 });
ViewingAppointmentSchema.index({ requesterId: 1, status: 1, scheduledStart: 1 });
ViewingAppointmentSchema.index({ propertyId: 1, status: 1, scheduledStart: 1 });
ViewingAppointmentSchema.index(
  { propertyId: 1, requesterId: 1, scheduledStart: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["REQUESTED", "CONFIRMED", "RESCHEDULE_PROPOSED"] } },
  }
);

const ViewingAppointment =
  models.ViewingAppointment || model("ViewingAppointment", ViewingAppointmentSchema);
export default ViewingAppointment;
