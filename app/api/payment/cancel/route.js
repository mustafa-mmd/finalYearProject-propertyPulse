import mongoose from "mongoose";
import connectDB from "@/config/database";
import Payment from "@/models/Payment";
import { requireActor } from "@/utils/authorization";
import { apiError, apiSuccess, handleApiError } from "@/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const actor = await requireActor();
    const body = await request.json();
    const { paymentId, action } = body;

    if (!paymentId) {
      return apiError("Payment ID is required", { status: 422, code: "VALIDATION_ERROR" });
    }

    await connectDB();

    const query = mongoose.isValidObjectId(paymentId)
      ? { $or: [{ _id: paymentId }, { transactionId: paymentId }] }
      : { transactionId: paymentId };

    const payment = await Payment.findOne(query);
    if (!payment) {
      return apiError("Payment record not found", { status: 404, code: "NOT_FOUND" });
    }

    const isOwnerOrAdmin =
      payment.userId?.toString() === actor.id ||
      payment.userEmail?.toLowerCase() === actor.email?.toLowerCase() ||
      actor.email?.toLowerCase() === "mustafajamalshabqadar@gmail.com" ||
      actor.roles?.includes("SUPER_ADMIN") ||
      actor.roles?.includes("PLATFORM_OWNER");

    if (!isOwnerOrAdmin) {
      return apiError("Unauthorized to modify this payment record", { status: 403, code: "FORBIDDEN" });
    }

    if (action === "REMOVE" || action === "DELETE") {
      await Payment.deleteOne({ _id: payment._id });
      return apiSuccess({ message: "Payment transaction removed", id: payment._id.toString() });
    }

    if (action === "MARK_PAID") {
      payment.paymentStatus = "completed";
      payment.updatedAt = new Date();
      await payment.save();
      return apiSuccess({ message: "Payment marked as completed", payment });
    }

    // Default: Cancel
    payment.paymentStatus = "cancelled";
    payment.updatedAt = new Date();
    await payment.save();

    return apiSuccess({ message: "Payment transaction cancelled", payment });
  } catch (error) {
    return handleApiError(error, "payment.cancel");
  }
}

export async function GET() {
  return Response.json(
    {
      success: true,
      message: "Payment cancel endpoint active",
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}
