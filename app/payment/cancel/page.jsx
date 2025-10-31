
// "use client";
// import { useSearchParams } from "next/navigation";

// export default function Cancel() {
//   const searchParams = useSearchParams();

//   // ✅ Extract values from URL
//   const propertyId = searchParams.get("propertyId");
//   const nightly = searchParams.get("nightly");
//   const weekly = searchParams.get("weekly");
//   const monthly = searchParams.get("monthly");

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-red-100 via-red-50 to-white px-4">
//       <div className="bg-white shadow-2xl rounded-3xl p-10 max-w-lg w-full text-center relative overflow-hidden">
//         {/* ❌ Animated Cross Icon */}
//         <div className="flex justify-center mb-6">
//           <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
//             <svg
//               xmlns="http://www.w3.org/2000/svg"
//               className="h-12 w-12 text-red-600"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="currentColor"
//               strokeWidth={2}
//             >
//               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </div>
//         </div>

//         {/* ❌ Cancel Text */}
//         <h1 className="text-4xl font-extrabold text-red-600 mb-4 drop-shadow">
//           Payment Cancelled
//         </h1>
//         <p className="text-gray-600 text-lg leading-relaxed mb-8">
//           Your payment was not completed.  
//           If this was a mistake, please try again or choose another property.
//         </p>

//         {/* Call-to-action buttons */}
//         <div className="flex flex-col sm:flex-row gap-4 justify-center">
//           <a
//             href={`/payment?propertyId=${propertyId}${nightly ? `&nightly=${nightly}` : ""}${weekly ? `&weekly=${weekly}` : ""}${monthly ? `&monthly=${monthly}` : ""}`}
//             className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition font-medium"
//           >
//              Try Again
//           </a>

          



//           <a
//             href="/properties"
//             className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg shadow-md hover:bg-gray-200 transition font-medium"
//           >
//             Browse Properties
//           </a>
//         </div>

//         {/* Decorative gradient bottom */}
//         <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 via-red-500 to-red-600 rounded-b-3xl" />
//       </div>
//     </div>
//   );
// }





"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Cancel() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  const transactionId = searchParams.get("tid") || searchParams.get("transactionId");
  const propertyId = searchParams.get("propertyId") || searchParams.get("pid");
  const nightly = searchParams.get("nightly");
  const weekly = searchParams.get("weekly");
  const monthly = searchParams.get("monthly");
  const amount = searchParams.get("amount");
  const type = searchParams.get("type");

  useEffect(() => {
    if (transactionId) {
      updatePaymentStatus();
    }
  }, [transactionId]);

  const updatePaymentStatus = async () => {
    try {
      await fetch("/api/payment/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });
    } catch (err) {
      console.error("Error updating payment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-red-100 via-red-50 to-white px-4">
      <div className="bg-white shadow-2xl rounded-3xl p-10 max-w-lg w-full text-center relative overflow-hidden">
        {/* ❌ Animated Cross Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        {/* ❌ Cancel Text */}
        <h1 className="text-4xl font-extrabold text-red-600 mb-4 drop-shadow">
          Payment Cancelled
        </h1>
        <p className="text-gray-600 text-lg leading-relaxed mb-4">
          Your payment was not completed.  
        </p>

        {transactionId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Transaction ID:</span>
              <br />
              <span className="font-mono text-xs">{transactionId}</span>
            </p>
            {amount && type && (
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-semibold">Cancelled Amount:</span> ${amount} ({type})
              </p>
            )}
          </div>
        )}

        <p className="text-gray-500 mb-8">
          If this was a mistake, please try again or choose another property.
        </p>

        {/* Call-to-action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={`/payment?propertyId=${propertyId}${nightly ? `&nightly=${nightly}` : ""}${weekly ? `&weekly=${weekly}` : ""}${monthly ? `&monthly=${monthly}` : ""}`}
            className="px-6 py-3 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 transition font-medium"
          >
            Try Again
          </a>

          <a
            href="/properties"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg shadow-md hover:bg-gray-200 transition font-medium"
          >
            Browse Properties
          </a>
        </div>

        {/* Decorative gradient bottom */}
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 via-red-500 to-red-600 rounded-b-3xl" />
      </div>
    </div>
  );
}