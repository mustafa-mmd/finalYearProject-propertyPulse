
import connectDB from "@/config/database";
import Payment from "@/models/Payment";

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get("transactionId") || searchParams.get("tid");

    if (!transactionId) {
      return new Response(
        JSON.stringify({ success: false, error: "Transaction ID required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const payment = await Payment.findOne({ transactionId }).populate("propertyId");

    if (!payment) {
      return new Response(
        JSON.stringify({ success: false, error: "Payment not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, payment }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error fetching payment:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}