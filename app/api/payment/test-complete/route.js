import connectDB from "@/config/database";
import Payment from "@/models/Payment";

export async function POST(req) {
  try {
    await connectDB();
    const { transactionId } = await req.json();

    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }

    payment.paymentStatus = "completed";
    payment.paidAt = new Date();
    await payment.save();

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}