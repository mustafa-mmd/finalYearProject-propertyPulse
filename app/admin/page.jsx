import Link from "next/link";
import {
  FaArrowRight,
  FaBuilding,
  FaCheckCircle,
  FaClipboardCheck,
  FaCreditCard,
  FaExclamationTriangle,
  FaFlag,
  FaHome,
  FaLifeRing,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";
import connectDB from "@/config/database";
import { visibleAdminItems } from "@/config/admin";
import User from "@/models/User";
import Property from "@/models/Property";
import Payment from "@/models/Payment";
import VerificationRequest from "@/models/VerificationRequest";
import Organization from "@/models/Organization";
import SupportTicket from "@/models/SupportTicket";
import FraudCase from "@/models/FraudCase";
import OperationalError from "@/models/OperationalError";
import { requireAdminPageAccess } from "@/utils/pageAuthorization";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin | PropertyPulse",
  description: "Permission-aware platform operations control center.",
};

const QUICK_ICONS = {
  "/admin/verifications": FaClipboardCheck,
  "/admin/listings": FaHome,
  "/admin/users": FaUsers,
  "/admin/organizations": FaBuilding,
  "/admin/payments": FaCreditCard,
  "/admin/reports": FaFlag,
  "/admin/fraud-cases": FaShieldAlt,
  "/admin/support": FaLifeRing,
};

export default async function AdminDashboardPage() {
  const actor = await requireAdminPageAccess("/admin");
  const allowed = new Set(actor.permissions);
  const can = (permission) => allowed.has(permission);

  await connectDB();
  const [
    users,
    listings,
    publishedListings,
    pendingReviews,
    highRiskReviews,
    completedPayments,
    organizations,
    openTickets,
    openFraudCases,
    openErrors,
    recentPayments,
  ] = await Promise.all([
    can("users.read") ? User.countDocuments({ accountStatus: { $ne: "DELETED" } }) : null,
    can("properties.review") ? Property.countDocuments({ deletedAt: { $exists: false } }) : null,
    can("properties.review") ? Property.countDocuments({ listingStatus: "PUBLISHED", deletedAt: { $exists: false } }) : null,
    can("verifications.read") ? VerificationRequest.countDocuments({ status: { $in: ["QUEUED", "AI_REVIEW", "MANUAL_REVIEW", "ESCALATED"] } }) : null,
    can("verifications.read") ? VerificationRequest.countDocuments({ status: { $in: ["AI_REVIEW", "MANUAL_REVIEW", "ESCALATED"] }, riskLevel: { $in: ["HIGH", "CRITICAL"] } }) : null,
    can("payments.read") ? Payment.countDocuments({ paymentStatus: "completed" }) : null,
    can("organizations.read") ? Organization.countDocuments({ status: "ACTIVE", deletedAt: { $exists: false } }) : null,
    can("support.manage") ? SupportTicket.countDocuments({ status: { $in: ["OPEN", "IN_PROGRESS"] } }) : null,
    can("risk_rules.manage") ? FraudCase.countDocuments({ status: { $in: ["OPEN", "TRIAGED", "INVESTIGATING"] } }) : null,
    can("system_errors.read") ? OperationalError.countDocuments({ status: { $in: ["OPEN", "ACKNOWLEDGED"] } }) : null,
    can("payments.read")
      ? Payment.find({ paymentStatus: "completed" }).select("amount currency propertyName paidAt createdAt").sort({ paidAt: -1, createdAt: -1 }).limit(5).lean()
      : [],
  ]);

  const metrics = [
    users !== null && { label: "Platform users", value: users, detail: "Non-deleted accounts", icon: FaUsers, tone: "blue" },
    listings !== null && { label: "Listings", value: listings, detail: publishedListings + " currently published", icon: FaHome, tone: "violet" },
    pendingReviews !== null && { label: "Review queue", value: pendingReviews, detail: highRiskReviews + " high-risk cases", icon: FaClipboardCheck, tone: highRiskReviews > 0 ? "red" : "amber", attention: highRiskReviews > 0 },
    completedPayments !== null && { label: "Completed payments", value: completedPayments, detail: "Provider-confirmed records", icon: FaCheckCircle, tone: "emerald" },
    organizations !== null && { label: "Organizations", value: organizations, detail: "Active workspaces", icon: FaBuilding, tone: "indigo" },
    openTickets !== null && { label: "Support workload", value: openTickets, detail: "Open or in progress", icon: FaLifeRing, tone: openTickets > 0 ? "amber" : "emerald", attention: openTickets > 0 },
    openFraudCases !== null && { label: "Fraud cases", value: openFraudCases, detail: "Awaiting human resolution", icon: FaShieldAlt, tone: openFraudCases > 0 ? "red" : "emerald", attention: openFraudCases > 0 },
    openErrors !== null && { label: "System errors", value: openErrors, detail: "Open or acknowledged", icon: FaExclamationTriangle, tone: openErrors > 0 ? "red" : "emerald", attention: openErrors > 0 },
  ].filter(Boolean);

  const quickLinks = visibleAdminItems(actor.permissions)
    .filter((item) => item.href !== "/admin" && QUICK_ICONS[item.href])
    .slice(0, 8);

  return (
    <div className="space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 p-7 text-white shadow-xl sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Secure session
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Operations control center</h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              Welcome back, {actor.name}. Your dashboard only includes data and controls allowed by your assigned roles.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current access</p>
            <p className="mt-1 max-w-md text-sm font-semibold text-white">{actor.roles.join(" · ")}</p>
          </div>
        </div>
      </header>

      <section aria-labelledby="health-heading">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">Live platform data</p>
            <h2 id="health-heading" className="mt-1 text-2xl font-black tracking-tight text-slate-950">Operational health</h2>
          </div>
          <p className="hidden text-sm text-slate-500 sm:block">Permission-filtered for your role</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            const toneClasses = {
              blue: "bg-blue-50 text-blue-700",
              violet: "bg-violet-50 text-violet-700",
              indigo: "bg-indigo-50 text-indigo-700",
              emerald: "bg-emerald-50 text-emerald-700",
              amber: "bg-amber-50 text-amber-700",
              red: "bg-red-50 text-red-700",
            };
            return (
              <article key={metric.label} className={metric.attention ? "rounded-2xl border border-red-200 bg-white p-5 shadow-sm" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
                <div className="flex items-start justify-between">
                  <span className={"flex h-11 w-11 items-center justify-center rounded-xl " + toneClasses[metric.tone]}>
                    <Icon aria-hidden="true" />
                  </span>
                  {metric.attention && <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-700">Needs attention</span>}
                </div>
                <p className="mt-5 text-3xl font-black tracking-tight text-slate-950">{Number(metric.value).toLocaleString()}</p>
                <h3 className="mt-1 font-bold text-slate-800">{metric.label}</h3>
                <p className="mt-1 text-sm text-slate-500">{metric.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      {quickLinks.length > 0 && (
        <section aria-labelledby="quick-heading">
          <h2 id="quick-heading" className="mb-4 text-xl font-black text-slate-950">Your workspaces</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((item) => {
              const Icon = QUICK_ICONS[item.href];
              return (
                <Link key={item.href} href={item.href} className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg">
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-blue-600 group-hover:text-white">
                      <Icon aria-hidden="true" />
                    </span>
                    <span className="font-bold text-slate-900">{item.label}</span>
                  </span>
                  <FaArrowRight className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {recentPayments.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="payments-heading">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Financial activity</p>
              <h2 id="payments-heading" className="mt-1 text-xl font-black text-slate-950">Recent completed payments</h2>
            </div>
            <Link href="/admin/payments" className="text-sm font-bold text-blue-700 hover:text-blue-900">View finance</Link>
          </div>
          <div className="mt-5 divide-y divide-slate-100">
            {recentPayments.map((payment) => (
              <div key={payment._id.toString()} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">{payment.propertyName || "Property payment"}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{new Date(payment.paidAt || payment.createdAt).toLocaleString("en-ZA")}</p>
                </div>
                <p className="shrink-0 font-black text-emerald-700">{payment.currency || "ZAR"} {Number(payment.amount || 0).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
