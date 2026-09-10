import connectDB from "@/config/database";
import Payment from "@/models/Payment";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = (
      searchParams.get("transactionId") ||
      searchParams.get("tid") ||
      ""
    ).trim();

    if (!/^[0-9a-f-]{36}$/i.test(transactionId)) {
      return Response.json(
        { success: false, error: "Valid transaction ID required" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    await connectDB();
    const payment = await Payment.findOne({ transactionId })
      .select(
        "transactionId propertyName amount currency paymentType paymentStatus paidAt cancelledAt createdAt updatedAt"
      )
      .lean();

    if (!payment) {
      return Response.json(
        { success: false, error: "Payment not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } }
      );
    }

    return Response.json(
      {
        success: true,
        payment: {
          transactionId: payment.transactionId,
          propertyName: payment.propertyName,
          amount: payment.amount,
          currency: payment.currency || "ZAR",
          paymentType: payment.paymentType,
          paymentStatus: payment.paymentStatus,
          paidAt: payment.paidAt || null,
          cancelledAt: payment.cancelledAt || null,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
        },
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[payment] Could not fetch payment status", {
      name: error?.name,
      code: error?.code,
    });
    return Response.json(
      { success: false, error: "Payment status is temporarily unavailable" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
