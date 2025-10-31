// import crypto from "crypto";

// export async function POST(req) {
//   const { PAYFAST_PASSPHRASE } = process.env;

//   const body = Object.fromEntries(await req.formData()); // PayFast sends form data

//   const sorted = Object.keys(body)
//     .sort()
//     .filter((k) => k !== "signature")
//     .map((k) => `${k}=${encodeURIComponent(body[k])}`)
//     .join("&");

//   const stringToHash = PAYFAST_PASSPHRASE
//     ? `${sorted}&passphrase=${encodeURIComponent(PAYFAST_PASSPHRASE)}`
//     : sorted;

//   const calculatedSig = crypto
//     .createHash("md5")
//     .update(stringToHash)
//     .digest("hex");

//   if (calculatedSig !== body.signature) {
//     console.error("❌ Invalid PayFast Signature");
//     return new Response("Invalid signature", { status: 400 });
//   }

//   console.log("✅ Payment Notification Received:", body);

//   return new Response("OK", { status: 200 });
// }




import crypto from "crypto";
import connectDB from "@/config/database";
import Payment from "@/models/Payment";

export async function POST(req) {
  try {
    await connectDB();

    const { PAYFAST_PASSPHRASE } = process.env;
    const body = Object.fromEntries(await req.formData());

    console.log("📥 PayFast Notification Received:", body);

    // ✅ Verify signature
    const sorted = Object.keys(body)
      .sort()
      .filter((k) => k !== "signature")
      .map((k) => `${k}=${encodeURIComponent(body[k])}`)
      .join("&");

    const stringToHash = PAYFAST_PASSPHRASE
      ? `${sorted}&passphrase=${encodeURIComponent(PAYFAST_PASSPHRASE)}`
      : sorted;

    const calculatedSig = crypto
      .createHash("md5")
      .update(stringToHash)
      .digest("hex");

    if (calculatedSig !== body.signature) {
      console.error("❌ Invalid PayFast Signature");
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("✅ Signature Verified");

    // ✅ Find payment by m_payment_id
    const payment = await Payment.findOne({ paymentId: body.m_payment_id });

    if (!payment) {
      console.error("❌ Payment record not found:", body.m_payment_id);
      return new Response("Payment not found", { status: 404 });
    }

    // ✅ Update payment based on PayFast status
    // const payfastStatus = body.payment_status;
    const payfastStatus = body.payment_status?.toUpperCase();

    let newStatus = "pending";
    let paidAt = null;

    switch (payfastStatus) {
      case "COMPLETE":
        newStatus = "completed";
        paidAt = new Date();
        console.log("✅ Payment Completed Successfully");
        break;
      case "FAILED":
        newStatus = "failed";
        console.log("❌ Payment Failed");
        break;
      case "CANCELLED":
        newStatus = "cancelled";
        console.log("⚠️ Payment Cancelled");
        break;
      default:
        console.log("⏳ Payment Pending");
    }

    // ✅ Update payment record
    payment.paymentStatus = newStatus;
    payment.paidAt = paidAt;
    payment.payfastData = {
      merchant_id: body.merchant_id,
      pf_payment_id: body.pf_payment_id,
      payment_status: body.payment_status,
      item_name: body.item_name,
      amount_gross: body.amount_gross,
      amount_fee: body.amount_fee,
      amount_net: body.amount_net,
      signature: body.signature,
    };

    await payment.save();

    console.log("✅ Payment Updated:", {
      transactionId: payment.transactionId,
      status: newStatus,
      amount: payment.amount,
    });

    // TODO: You can add email notification here
    // await sendPaymentConfirmationEmail(payment);

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("❌ Notify Error:", err);
    return new Response("Server error", { status: 500 });
  }
}