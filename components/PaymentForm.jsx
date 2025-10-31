

// 'use client';
// import { useState } from "react";

// export default function PaymentForm({ propertyId, nightly, weekly, monthly }) {
//   const [amount, setAmount] = useState(null);
//   const [loading, setLoading] = useState(false);

//   // ✅ Parse and validate the values
//   const nightlyRate = nightly && nightly !== "null" && nightly !== "undefined" && nightly !== "" ? parseFloat(nightly) : null;
//   const weeklyRate = weekly && weekly !== "null" && weekly !== "undefined" && weekly !== "" ? parseFloat(weekly) : null;
//   const monthlyRate = monthly && monthly !== "null" && monthly !== "undefined" && monthly !== "" ? parseFloat(monthly) : null;

//   const handlePayment = async (selectedAmount, type) => {
//     setAmount(selectedAmount);
//     setLoading(true);

//     try {
//       const res = await fetch("/api/payment/pay", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ 
//           propertyId, 
//           amount: selectedAmount,
//           type,
//           nightly: nightlyRate,
//           weekly: weeklyRate,
//           monthly: monthlyRate
//         }),
//       });

//       const data = await res.json();
//       if (data.redirectUrl) {
//         window.location.href = data.redirectUrl; // Redirect to PayFast
//       }
//     } catch (err) {
//       console.error("Payment error:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="space-y-6 max-w-md mx-auto bg-white shadow-lg rounded-xl p-6">
//       <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
//         Choose Rent Option
//       </h2>

//       <div className="space-y-3">
//         {nightlyRate && (
//           <button
//             onClick={() => handlePayment(nightlyRate, "nightly")}
//             disabled={loading}
//             className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading && amount === nightlyRate ? "Processing..." : `Pay Nightly Rent - $${nightlyRate}`}
//           </button>
//         )}

//         {weeklyRate && (
//           <button
//             onClick={() => handlePayment(weeklyRate, "weekly")}
//             disabled={loading}
//             className="w-full bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading && amount === weeklyRate ? "Processing..." : `Pay Weekly Rent - $${weeklyRate}`}
//           </button>
//         )}

//         {monthlyRate && (
//           <button
//             onClick={() => handlePayment(monthlyRate, "monthly")}
//             disabled={loading}
//             className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {loading && amount === monthlyRate ? "Processing..." : `Pay Monthly Rent - $${monthlyRate}`}
//           </button>
//         )}
//       </div>

//       {/* ⚠️ Show warning if no rates available */}
//       {!nightlyRate && !weeklyRate && !monthlyRate && (
//         <div className="text-center text-red-600 font-semibold p-4 bg-red-50 rounded-lg">
//           ⚠️ No payment options available for this property.
//         </div>
//       )}
//     </div>
//   );
// }




'use client';
import { useState } from "react";

export default function PaymentForm({ propertyId, nightly, weekly, monthly }) {
  const [amount, setAmount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedAmount, setSelectedAmount] = useState(null);
  
  const [formData, setFormData] = useState({
    userName: "",
    userEmail: "",
    userPhone: "",
  });

  // ✅ Parse and validate the values
  const nightlyRate = nightly && nightly !== "null" && nightly !== "undefined" && nightly !== "" ? parseFloat(nightly) : null;
  const weeklyRate = weekly && weekly !== "null" && weekly !== "undefined" && weekly !== "" ? parseFloat(weekly) : null;
  const monthlyRate = monthly && monthly !== "null" && monthly !== "undefined" && monthly !== "" ? parseFloat(monthly) : null;

  const handleSelectPayment = (rate, type) => {
    setSelectedAmount(rate);
    setSelectedType(type);
    setShowUserForm(true);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBack = () => {
    setShowUserForm(false);
    setSelectedAmount(null);
    setSelectedType(null);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setAmount(selectedAmount);
    setLoading(true);

    try {
      const res = await fetch("/api/payment/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          propertyId, 
          amount: selectedAmount,
          type: selectedType,
          nightly: nightlyRate,
          weekly: weeklyRate,
          monthly: monthlyRate,
          userName: formData.userName,
          userEmail: formData.userEmail,
          userPhone: formData.userPhone,
        }),
      });

      const text = await res.text();
      console.log("API Response:", text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse JSON:", e);
        alert("Server error. Please check console and try again.");
        return;
      }

      if (res.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl; // Redirect to PayFast
      } else {
        alert(`Payment failed: ${data.error || data.details || "Unknown error"}`);
        console.error("Payment error:", data);
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto bg-white shadow-lg rounded-xl p-6">
      {!showUserForm ? (
        <>
          <h2 className="text-xl font-bold text-gray-800 text-center mb-4">
            Choose Rent Option
          </h2>

          <div className="space-y-3">
            {nightlyRate && (
              <button
                onClick={() => handleSelectPayment(nightlyRate, "nightly")}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pay Nightly Rent - ${nightlyRate}
              </button>
            )}

            {weeklyRate && (
              <button
                onClick={() => handleSelectPayment(weeklyRate, "weekly")}
                disabled={loading}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pay Weekly Rent - ${weeklyRate}
              </button>
            )}

            {monthlyRate && (
              <button
                onClick={() => handleSelectPayment(monthlyRate, "monthly")}
                disabled={loading}
                className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Pay Monthly Rent - ${monthlyRate}
              </button>
            )}
          </div>

          {/* ⚠️ Show warning if no rates available */}
          {!nightlyRate && !weeklyRate && !monthlyRate && (
            <div className="text-center text-red-600 font-semibold p-4 bg-red-50 rounded-lg">
              ⚠️ No payment options available for this property.
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back
            </button>
            <h2 className="text-xl font-bold text-gray-800">
              Your Details
            </h2>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Selected:</span> {selectedType} Rent
            </p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              ${selectedAmount}
            </p>
          </div>

          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="userEmail"
                value={formData.userEmail}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                name="userPhone"
                value={formData.userPhone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1 234 567 8900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Proceed to Payment"
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            🔒 Your payment is secured by PayFast
          </p>
        </>
      )}
    </div>
  );
}