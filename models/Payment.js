import { Schema, model, models } from "mongoose";

const PaymentSchema = new Schema(
  {
    // Payment Transaction Details
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentId: {
      type: String,
      required: true,
    },
    
    // User Information
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    userPhone: {
      type: String,
    },
    
    // Property Information
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    propertyName: {
      type: String,
      required: true,
    },
    propertyAddress: {
      type: String,
    },
    
    // Payment Details
    amount: {
      type: Number,
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["nightly", "weekly", "monthly"],
      required: true,
    },
    currency: {
      type: String,
      default: "PKR",
    },
    
    // Payment Status
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled", "refunded"],
      default: "pending",
    },
    
    // PayFast Specific Data
    payfastData: {
      merchant_id: String,
      pf_payment_id: String,
      payment_status: String,
      item_name: String,
      amount_gross: String,
      amount_fee: String,
      amount_net: String,
      signature: String,
    },
    
    // Booking Period (optional - can be added later)
    bookingStartDate: {
      type: Date,
    },
    bookingEndDate: {
      type: Date,
    },
    
    // Additional Info
    notes: {
      type: String,
    },
    
    // Timestamps for tracking
    paidAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Indexes for faster queries
PaymentSchema.index({ userEmail: 1 });
PaymentSchema.index({ propertyId: 1 });
PaymentSchema.index({ paymentStatus: 1 });
PaymentSchema.index({ transactionId: 1 });

const Payment = models.Payment || model("Payment", PaymentSchema);

export default Payment;