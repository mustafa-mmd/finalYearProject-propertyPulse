import { Schema, model, models } from "mongoose";

const SaleTransactionSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    acceptedOfferId: { type: Schema.Types.ObjectId, ref: "Offer", required: true, unique: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: [
        "UNDER_OFFER",
        "DUE_DILIGENCE",
        "FINANCING",
        "CONVEYANCING",
        "READY_TO_CLOSE",
        "CLOSED",
        "CANCELLED",
        "FALLEN_THROUGH",
      ],
      default: "UNDER_OFFER",
      index: true,
    },
    currency: { type: String, required: true },
    purchasePrice: { type: Number, required: true, min: 1 },
    targetClosingDate: Date,
    milestones: [
      {
        key: { type: String, required: true, maxlength: 60 },
        label: { type: String, required: true, maxlength: 120 },
        status: {
          type: String,
          enum: ["PENDING", "IN_PROGRESS", "COMPLETED", "WAIVED", "FAILED"],
          default: "PENDING",
        },
        dueAt: Date,
        completedAt: Date,
        completedBy: { type: Schema.Types.ObjectId, ref: "User" },
        notes: { type: String, maxlength: 1000 },
      },
    ],
    closing: {
      conveyancerReference: { type: String, maxlength: 200 },
      confirmedBy: { type: Schema.Types.ObjectId, ref: "User" },
      confirmedAt: Date,
    },
    closedAt: Date,
    cancelledAt: Date,
    deletedAt: Date,
  },
  { timestamps: true }
);

SaleTransactionSchema.index({ propertyId: 1, status: 1 });

const SaleTransaction =
  models.SaleTransaction || model("SaleTransaction", SaleTransactionSchema);
export default SaleTransaction;
