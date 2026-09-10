import { Schema, model, models } from "mongoose";

const InvoiceSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Organization", index: true },
    invoiceNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: ["RENT", "DEPOSIT", "BOOKING", "SUBSCRIPTION", "MAINTENANCE", "OTHER"], required: true, index: true },
    leaseId: { type: Schema.Types.ObjectId, ref: "Lease", index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", index: true },
    payerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    payeeId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: { type: String, enum: ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "VOID", "REFUNDED"], default: "ISSUED", index: true },
    currency: { type: String, required: true },
    lineItems: [{ description: { type: String, required: true, maxlength: 300 }, quantity: { type: Number, min: 0.01, default: 1 }, unitAmount: { type: Number, min: 0 }, total: { type: Number, min: 0 } }],
    subtotal: { type: Number, required: true, min: 0 }, tax: { type: Number, default: 0, min: 0 }, fees: { type: Number, default: 0, min: 0 }, total: { type: Number, required: true, min: 0 }, amountPaid: { type: Number, default: 0, min: 0 },
    issuedAt: { type: Date, default: Date.now }, dueAt: { type: Date, required: true, index: true }, paidAt: Date,
    periodKey: { type: String, maxlength: 30 }, notes: { type: String, maxlength: 2000 },
  },
  { timestamps: true }
);
InvoiceSchema.index({ leaseId: 1, type: 1, periodKey: 1, payerId: 1 }, { unique: true, sparse: true });
InvoiceSchema.index({ status: 1, dueAt: 1 });
const Invoice = models.Invoice || model("Invoice", InvoiceSchema);
export default Invoice;
