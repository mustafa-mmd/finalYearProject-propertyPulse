import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/authOptions";
import connectDB from "@/config/database";
import Subscription from "@/models/Subscription";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Subscription Activated — PropertyPulse",
};

export default async function SubscribeSuccessPage({ searchParams }) {
  const params = await searchParams;
  const planCode = params?.plan || "";
  const session = await getServerSession(authOptions);

  let subscription = null;
  if (session?.user?.id) {
    await connectDB();
    subscription = await Subscription.findOne({
      userId: session.user.id,
      planCode: planCode.toUpperCase(),
    })
      .sort({ createdAt: -1 })
      .lean();
  }

  const planNames = {
    FREE: "Free",
    LANDLORD: "Individual Landlord",
    PROFESSIONAL: "Professional",
    AGENCY: "Agency",
    PROPERTY_MANAGEMENT: "Property Management",
    ENTERPRISE: "Enterprise",
  };
  const planName = planNames[planCode?.toUpperCase()] || planCode || "your plan";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Green success header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-10 text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-white/20 flex items-center justify-center mb-4">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Subscription Activated!</h1>
          <p className="mt-2 text-emerald-100 text-sm">
            Welcome to PropertyPulse <strong>{planName}</strong>
          </p>
        </div>

        <div className="px-8 py-8">
          {subscription?.status === "PENDING" ? (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 mb-6">
              ⏳ Your payment is being processed. Your plan will activate within a few minutes. Check back soon.
            </div>
          ) : (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 mb-6">
              ✅ Your <strong>{planName}</strong> plan is now active.
              {subscription?.trialEndsAt && (
                <span>
                  {" "}Your 14-day free trial runs until{" "}
                  <strong>{new Date(subscription.trialEndsAt).toLocaleDateString()}</strong>.
                </span>
              )}
            </div>
          )}

          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-xl">🏠</span>
              <div>
                <p className="font-semibold text-slate-800">Start listing properties</p>
                <p className="text-xs">Create and publish your first property listing</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-xl">📊</span>
              <div>
                <p className="font-semibold text-slate-800">View your dashboard</p>
                <p className="text-xs">Track views, leads, and analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-xl">⚙️</span>
              <div>
                <p className="font-semibold text-slate-800">Manage your subscription</p>
                <p className="text-xs">View billing details and usage from your profile</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/properties/add"
              className="block w-full rounded-xl bg-blue-600 px-6 py-3 text-center font-bold text-white shadow hover:bg-blue-700 transition"
            >
              Add Your First Property
            </Link>
            <Link
              href="/profile"
              className="block w-full rounded-xl border border-slate-200 px-6 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Go to My Profile
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            A receipt has been sent to your email. Manage billing at{" "}
            <Link href="/profile" className="text-blue-500 hover:underline">
              your profile
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
