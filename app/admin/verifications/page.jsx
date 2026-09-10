import Link from "next/link";
import Image from "next/image";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import VerificationRequest from "@/models/VerificationRequest";
import ReviewDecisionActions from "@/components/admin/ReviewDecisionActions";
import { requirePagePermission } from "@/utils/pageAuthorization";
import { runListingRules } from "@/utils/listingVerification";

export const dynamic = "force-dynamic";

function riskClasses(level) {
  if (level === "CRITICAL" || level === "HIGH") return "bg-red-100 text-red-800 border-red-200";
  if (level === "MEDIUM") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-emerald-100 text-emerald-800 border-emerald-200";
}

function statusBadge(status) {
  const map = {
    APPROVED: "bg-emerald-100 text-emerald-800",
    MANUAL_REVIEW: "bg-blue-100 text-blue-800",
    AI_REVIEW: "bg-purple-100 text-purple-800",
    QUEUED: "bg-amber-100 text-amber-800",
    REJECTED: "bg-red-100 text-red-800",
    CHANGES_REQUESTED: "bg-orange-100 text-orange-800",
    ESCALATED: "bg-rose-100 text-rose-800",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

async function syncUnreviewedProperties() {
  try {
    const unreviewedProps = await Property.find({
      deletedAt: { $exists: false },
      listingStatus: { $in: ["DRAFT", "PENDING_AI_REVIEW", "PENDING_MANUAL_REVIEW", "CHANGES_REQUESTED"] },
    })
      .select("_id tenantId owner name listingPurpose listingCategory location images beds baths description rates pricing seller_info createdAt")
      .lean();

    if (!unreviewedProps.length) return;

    const propIds = unreviewedProps.map((p) => p._id);
    const existingRequests = await VerificationRequest.find({
      propertyId: { $in: propIds },
    })
      .select("propertyId")
      .lean();

    const existingPropIdSet = new Set(existingRequests.map((r) => r.propertyId.toString()));
    const missingProps = unreviewedProps.filter((p) => !existingPropIdSet.has(p._id.toString()));

    if (!missingProps.length) return;

    const docsToInsert = missingProps.map((prop) => {
      const rules = runListingRules(prop);
      const ownerId = Array.isArray(prop.owner) ? prop.owner[0] : prop.owner;
      return {
        propertyId: prop._id,
        tenantId: prop.tenantId || undefined,
        requestedBy: ownerId,
        status: "MANUAL_REVIEW",
        overallRiskScore: rules.overallRiskScore || 10,
        riskLevel: rules.riskLevel || "LOW",
        recommendedAction: rules.recommendedAction || "STANDARD_MANUAL_REVIEW",
        findings: rules.findings || [],
        missingInformation: rules.missingInformation || [],
        positiveSignals: rules.positiveSignals || [],
        adminSummary: rules.findings?.length
          ? `Automated safety scan identified ${rules.findings.length} item(s) for review.`
          : "Property complete and ready for verification review.",
        submittedAt: prop.createdAt || new Date(),
      };
    });

    await VerificationRequest.insertMany(docsToInsert, { ordered: false }).catch(() => null);
  } catch (err) {
    console.error("[VerificationQueue] Sync error:", err);
  }
}

export default async function VerificationQueuePage({ searchParams }) {
  const params = await searchParams;
  const actor = await requirePagePermission("verifications.read", "/admin/verifications");
  await connectDB();

  // Automatically sync unreviewed properties so the queue is never empty when properties exist
  await syncUnreviewedProperties();

  const tab = params?.tab || "PENDING";
  const riskLevel = params?.riskLevel || "";

  let statusQuery;
  if (tab === "APPROVED") {
    statusQuery = { $in: ["APPROVED"] };
  } else if (tab === "REJECTED") {
    statusQuery = { $in: ["REJECTED", "CHANGES_REQUESTED", "CANCELLED"] };
  } else if (tab === "ALL") {
    statusQuery = { $exists: true };
  } else {
    // Default PENDING
    statusQuery = { $in: ["QUEUED", "AI_REVIEW", "MANUAL_REVIEW", "ESCALATED"] };
  }

  const filter = {
    status: statusQuery,
    ...(riskLevel ? { riskLevel } : {}),
  };

  const queue = await VerificationRequest.find(filter)
    .populate("propertyId", "name listingReference listingPurpose listingCategory listingStatus location images completenessScore")
    .populate("requestedBy", "name email verification")
    .sort({ overallRiskScore: -1, submittedAt: -1 })
    .limit(50)
    .lean();

  const TABS = [
    { label: "Pending Review", value: "PENDING" },
    { label: "Approved & Live", value: "APPROVED" },
    { label: "Rejected / Changes", value: "REJECTED" },
    { label: "All Records", value: "ALL" },
  ];

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end border-b border-slate-200 pb-5">
        <div>
          <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">Trust &amp; Safety Operations</p>
          <h2 className="mt-1 text-3xl font-extrabold text-slate-950">Verification Queue</h2>
          <p className="mt-1.5 text-sm text-slate-600">
            Real-time listing moderation &amp; automated risk inspection. Approving a property publishes it live instantly.
          </p>
        </div>

        {/* Risk Level Filter Form */}
        <form method="GET" action="/admin/verifications" className="flex items-center gap-2">
          {tab && <input type="hidden" name="tab" value={tab} />}
          <select
            name="riskLevel"
            defaultValue={riskLevel}
            className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
          >
            <option value="">All Risk Levels</option>
            <option value="CRITICAL">🔴 Critical Risk</option>
            <option value="HIGH">🟠 High Risk</option>
            <option value="MEDIUM">🟡 Medium Risk</option>
            <option value="LOW">🟢 Low Risk</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            Filter
          </button>
          {riskLevel && (
            <Link
              href={`/admin/verifications${tab ? `?tab=${tab}` : ""}`}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Reset
            </Link>
          )}
        </form>
      </div>

      {/* Tabs Bar */}
      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.value;
          return (
            <Link
              key={t.value}
              href={`/admin/verifications?tab=${t.value}${riskLevel ? `&riskLevel=${riskLevel}` : ""}`}
              className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
                active
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Queue Items */}
      <div className="mt-6 space-y-4">
        {!queue.length && (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-12 text-center">
            <p className="text-3xl mb-2">🛡️</p>
            <p className="font-bold text-slate-800 text-base">No listings match this queue or risk filter</p>
            <p className="text-xs text-slate-500 mt-1">
              {riskLevel
                ? `No properties found with risk level "${riskLevel}".`
                : "All properties in this category have been processed."}
            </p>
            {riskLevel && (
              <Link
                href={`/admin/verifications${tab ? `?tab=${tab}` : ""}`}
                className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
              >
                Clear Risk Filter
              </Link>
            )}
          </div>
        )}

        {queue.map((review) => {
          const property = review.propertyId;
          const owner = review.requestedBy;
          const isDecided = ["APPROVED", "REJECTED", "CANCELLED"].includes(review.status);

          return (
            <article
              key={review._id.toString()}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="flex items-start gap-4">
                  {/* Property Cover Thumbnail */}
                  {property?.images?.[0] && (
                    <Image
                      src={property.images[0]}
                      alt=""
                      width={112}
                      height={80}
                      className="h-20 w-28 flex-none rounded-xl object-cover border border-slate-200"
                    />
                  )}
                  <div>
                    {/* Status & Risk Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-3 py-0.5 text-xs font-extrabold ${riskClasses(review.riskLevel)}`}>
                        {review.riskLevel} RISK · {review.overallRiskScore}/100
                      </span>
                      <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${statusBadge(review.status)}`}>
                        {review.status}
                      </span>
                      {property?.listingStatus && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                          Listing: {property.listingStatus}
                        </span>
                      )}
                    </div>

                    {/* Listing Title */}
                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                      {property?.name || "Untitled Property"}
                    </h3>

                    {/* Meta Subtitle */}
                    <p className="mt-1 text-xs text-slate-500 font-medium">
                      Ref: <span className="font-mono text-slate-700">{property?.listingReference || "N/A"}</span>
                      {" · "}
                      Purpose: <span className="text-slate-700 font-semibold">{property?.listingPurpose?.replace(/_/g, " ")}</span>
                      {" · "}
                      Submitted by: <span className="text-slate-700 font-semibold">{owner?.name || owner?.email || "System Owner"}</span>
                    </p>

                    {/* Admin Summary */}
                    {review.adminSummary && (
                      <p className="mt-3 text-xs text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-200">
                        💬 <span className="font-semibold text-slate-900">Risk Assessment:</span> {review.adminSummary}
                      </p>
                    )}

                    {/* Findings & Risk Factors */}
                    {!!review.findings?.length && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-bold text-slate-800">Inspection Findings ({review.findings.length}):</p>
                        <ul className="space-y-1">
                          {review.findings.slice(0, 5).map((item, index) => (
                            <li key={`${item.code}-${index}`} className="flex items-center gap-2 text-xs text-slate-600">
                              <span className={`h-1.5 w-1.5 rounded-full ${item.severity === "HIGH" ? "bg-red-500" : "bg-amber-500"}`} />
                              <span>{item.message}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inspect Listing Button */}
                {property?._id && (
                  <Link
                    href={`/properties/${property._id}`}
                    target="_blank"
                    className="h-fit rounded-xl border border-blue-600 px-4 py-2 text-center text-xs font-bold text-blue-700 hover:bg-blue-50 transition shrink-0"
                  >
                    Inspect Public Page ↗
                  </Link>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                {actor.permissions.includes("verifications.review") ||
                actor.roles?.includes("PLATFORM_OWNER") ||
                actor.roles?.includes("SUPER_ADMIN") ? (
                  <ReviewDecisionActions
                    verificationId={review._id.toString()}
                    isDecided={isDecided}
                  />
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                    🔒 View-only permission.
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
