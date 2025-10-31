// export default function Success() {
//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 via-green-50 to-white px-4">
//       <div className="bg-white shadow-2xl rounded-3xl p-10 max-w-lg w-full text-center relative overflow-hidden">
//         {/* ✅ Animated Check Circle */}
//         <div className="flex justify-center mb-6">
//           <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               className="h-12 w-12 text-green-600"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//               strokeWidth={2}
//             >
//               <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//             </svg>
//           </div>
//         </div>

//         {/* ✅ Success Text */}
//         <h1 className="text-4xl font-extrabold text-green-700 mb-4 drop-shadow">
//           Payment Successful!
//         </h1>
//         <p className="text-gray-600 text-lg leading-relaxed mb-8">
//            Thank you for your payment.  
//           Your transaction was processed securely and successfully.
//         </p>

//         {/* ✅ Call-to-action buttons */}
//         <div className="flex flex-col sm:flex-row gap-4 justify-center">
//           <a
//             href="/"
//             className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition font-medium"
//           >
//             Go to Homepage
//           </a>
//           <a
//             href="/properties"
//             className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg shadow-md hover:bg-gray-200 transition font-medium"
//           >
//             Browse Properties
//           </a>
//         </div>

//         {/* ✅ Decorative gradient bottom */}
//         <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-b-3xl" />
//       </div>
//     </div>
//   );
// }





"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Success() {
  const searchParams = useSearchParams();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const transactionId = searchParams.get("tid") || searchParams.get("transactionId");
  const amount = searchParams.get("amount");
  const type = searchParams.get("type");

  useEffect(() => {
    if (transactionId) {
      updateStatusAndFetch();
    }
  }, [transactionId]);

  const updateStatusAndFetch = async () => {
    try {
      // First: Mark as completed
      await fetch("/api/payment/test-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });
      
      // Wait for DB update
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Then fetch updated details
      const res = await fetch(`/api/payment/details?transactionId=${transactionId}`);
      const data = await res.json();
      if (data.success) {
        setPaymentData(data.payment);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-100 via-green-50 to-white px-4">
      <div className="bg-white shadow-2xl rounded-3xl p-10 max-w-2xl w-full text-center relative overflow-hidden">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-extrabold text-green-600 mb-4 drop-shadow">
          Payment Successful!
        </h1>

        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          Your payment has been processed successfully. Thank you for your booking!
        </p>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : paymentData ? (
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              Payment Details
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Transaction ID:</span>
                <span className="text-gray-900 font-mono text-sm">
                  {paymentData.transactionId}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Property:</span>
                <span className="text-gray-900 font-semibold">
                  {paymentData.propertyName}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Customer:</span>
                <span className="text-gray-900">{paymentData.userName}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="text-gray-900">{paymentData.userEmail}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Payment Type:</span>
                <span className="text-gray-900 capitalize">
                  {paymentData.paymentType} Rent
                </span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-gray-600 font-medium text-lg">Amount Paid:</span>
                <span className="text-green-600 font-bold text-2xl">
                  ${paymentData.amount}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 font-medium">Payment Date:</span>
                <span className="text-gray-900">
                  {new Date(paymentData.paidAt || paymentData.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Status:</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  {paymentData.paymentStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <p className="text-gray-600">Payment details will be available shortly.</p>
            <p className="text-sm text-gray-500 mt-2">
              Amount: ${amount} | Type: {type}
            </p>
          </div>
        )}

        {/* ✅ FIXED: Links must use <Link> instead of plain text */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/properties"
            className="px-8 py-3 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition font-medium"
          >
            Browse More Properties
          </Link>

          <Link
            href="/"
            className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg shadow-md hover:bg-gray-200 transition font-medium"
          >
            Go to Homepage
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-green-500 to-green-600 rounded-b-3xl" />
      </div>
    </div>
  );
}
