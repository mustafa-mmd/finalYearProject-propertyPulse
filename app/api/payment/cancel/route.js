import connectDB from "@/config/database";
import Payment from "@/models/Payment";

export async function POST(req) {
  try {
    await connectDB();

    const { transactionId } = await req.json();

    if (!transactionId) {
      return new Response(
        JSON.stringify({ success: false, error: "Transaction ID required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const payment = await Payment.findOne({ transactionId });

    if (!payment) {
      return new Response(
        JSON.stringify({ success: false, error: "Payment not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ Update payment status to cancelled
    payment.paymentStatus = "cancelled";
    payment.cancelledAt = new Date();
    await payment.save();

    console.log("✅ Payment marked as cancelled:", transactionId);

    return new Response(
      JSON.stringify({ success: true, message: "Payment cancelled" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error cancelling payment:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}