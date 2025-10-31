// import crypto from "crypto";

// export async function POST(req) {
//   try {
//     const {
//       PAYFAST_MERCHANT_ID,
//       PAYFAST_MERCHANT_KEY,
//       PAYFAST_PASSPHRASE,
//       PAYFAST_RETURN_URL,
//       PAYFAST_CANCEL_URL,
//       PAYFAST_NOTIFY_URL,
//       PAYFAST_URL,
//     } = process.env;

//     // 🔹 Extract values from request body
//     const { amount, propertyId, type, nightly, weekly, monthly } = await req.json();

//     const formattedAmount = parseFloat(amount).toFixed(2);

//     // 🔹 Build dynamic return & cancel URLs
//     const returnUrl = `${PAYFAST_RETURN_URL}?type=${type}&amount=${formattedAmount}&propertyId=${propertyId}&nightly=${nightly || ""}&weekly=${weekly || ""}&monthly=${monthly || ""}`;
//     const cancelUrl = `${PAYFAST_CANCEL_URL}?type=${type}&amount=${formattedAmount}&propertyId=${propertyId}&nightly=${nightly || ""}&weekly=${weekly || ""}&monthly=${monthly || ""}`;

//     // 🔹 Payment data object
//     let paymentData = {
//       merchant_id: PAYFAST_MERCHANT_ID,
//       merchant_key: PAYFAST_MERCHANT_KEY,
//       return_url: returnUrl,
//       cancel_url: cancelUrl,
//       notify_url: PAYFAST_NOTIFY_URL,
//       m_payment_id: `property-${propertyId}-${Date.now()}`,
//       amount: formattedAmount,
//       item_name: `Property Payment - ${propertyId}`,
//     };

//     // 1️⃣ Build query string in strict format
//     const queryString = Object.entries(paymentData)
//       .map(([key, value]) => `${key}=${encodeURIComponent(value).replace(/%20/g, "+")}`)
//       .join("&");

//     // 2️⃣ Add passphrase at the END before hashing
//     const stringToHash = PAYFAST_PASSPHRASE
//       ? `${queryString}&passphrase=${encodeURIComponent(PAYFAST_PASSPHRASE).replace(/%20/g, "+")}`
//       : queryString;

//     // 3️⃣ Generate MD5 signature
//     const signature = crypto.createHash("md5").update(stringToHash).digest("hex");

//     // 4️⃣ Attach signature to paymentData
//     paymentData.signature = signature;

//     // 5️⃣ Final redirect URL
//     const redirectUrl = `${PAYFAST_URL}?${new URLSearchParams(paymentData).toString()}`;

//     return new Response(JSON.stringify({ redirectUrl }), {
//       status: 200,
//       headers: { "Content-Type": "application/json" },
//     });
//   } catch (err) {
//     console.error("PayFast init error:", err);
//     return new Response(JSON.stringify({ error: "Payment failed" }), {
//       status: 500,
//       headers: { "Content-Type": "application/json" },
//     });
//   }
// }







import crypto from "crypto";
import connectDB from "@/config/database";
import Payment from "@/models/Payment";
import Property from "@/models/Property";

export async function POST(req) {
  try {
    console.log("🔵 Payment API called");
    
    await connectDB();
    console.log("✅ Database connected");

    const {
      PAYFAST_MERCHANT_ID,
      PAYFAST_MERCHANT_KEY,
      PAYFAST_PASSPHRASE,
      PAYFAST_RETURN_URL,
      PAYFAST_CANCEL_URL,
      PAYFAST_NOTIFY_URL,
      PAYFAST_URL,
    } = process.env;

    const { 
      amount, 
      propertyId, 
      type, 
      nightly, 
      weekly, 
      monthly,
      userName,
      userEmail,
      userPhone 
    } = await req.json();

    console.log("📥 Received data:", { amount, propertyId, type, userName, userEmail });

    if (!propertyId || !amount || !type || !userName || !userEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const property = await Property.findById(propertyId);
    
    if (!property) {
      return new Response(
        JSON.stringify({ error: "Property not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const formattedAmount = parseFloat(amount).toFixed(2);
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const paymentId = `property-${propertyId}-${Date.now()}`;

    const newPayment = await Payment.create({
      transactionId,
      paymentId,
      userName,
      userEmail,
      userPhone: userPhone || "",
      propertyId,
      propertyName: property.name,
      propertyAddress: `${property.location.street}, ${property.location.city}, ${property.location.state}`,
      amount: formattedAmount,
      paymentType: type,
      paymentStatus: "pending",
    });

    console.log("✅ Payment record created:", newPayment._id);

    // URLs with all necessary parameters
    const returnUrl = `${PAYFAST_RETURN_URL}?tid=${transactionId}`;
    const cancelUrl = `${PAYFAST_CANCEL_URL}?tid=${transactionId}&propertyId=${propertyId}&nightly=${property.rates.nightly || ""}&weekly=${property.rates.weekly || ""}&monthly=${property.rates.monthly || ""}`;

    // PayFast payment data - Order matters!
    const paymentData = {
      merchant_id: PAYFAST_MERCHANT_ID,
      merchant_key: PAYFAST_MERCHANT_KEY,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: PAYFAST_NOTIFY_URL,
      name_first: userName.split(" ")[0] || userName,
      name_last: userName.split(" ").slice(1).join(" ") || "",
      email_address: userEmail,
      m_payment_id: paymentId,
      amount: formattedAmount,
      item_name: `${property.name.substring(0, 50)} - ${type}`,
    };

    // Build signature string
    const params = [];
    for (const key in paymentData) {
      if (paymentData[key] !== "" && paymentData[key] !== null) {
        params.push(`${key}=${encodeURIComponent(paymentData[key]).replace(/%20/g, "+")}`);
      }
    }
    
    const signatureString = params.join("&");
    console.log("📝 Signature string:", signatureString);

    // Add passphrase if exists
    let stringToHash = signatureString;
    if (PAYFAST_PASSPHRASE) {
      stringToHash += `&passphrase=${encodeURIComponent(PAYFAST_PASSPHRASE).replace(/%20/g, "+")}`;
    }
    
    console.log("🔐 String to hash:", stringToHash);

    // Generate MD5 signature
    const signature = crypto
      .createHash("md5")
      .update(stringToHash)
      .digest("hex");

    console.log("✅ Generated signature:", signature);

    // Add signature to data
    paymentData.signature = signature;

    // Build final URL
    const urlParams = new URLSearchParams();
    for (const key in paymentData) {
      urlParams.append(key, paymentData[key]);
    }

    const redirectUrl = `${PAYFAST_URL}?${urlParams.toString()}`;
    console.log(" Final URL:", redirectUrl);

    return new Response(JSON.stringify({ 
      redirectUrl,
      transactionId,
      paymentId: newPayment._id 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error:", err);
    return new Response(JSON.stringify({ 
      error: "Payment failed", 
      details: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}