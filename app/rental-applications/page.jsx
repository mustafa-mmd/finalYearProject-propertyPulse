import { redirect } from "next/navigation";
import Image from "next/image";
import connectDB from "@/config/database";
import RentalApplication from "@/models/RentalApplication";
import Property from "@/models/Property";
import User from "@/models/User";
import WorkflowStatusAction from "@/components/WorkflowStatusAction";
import PayApplicationButton from "@/components/PayApplicationButton";
import { getActor } from "@/utils/authorization";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rental Applications",
  description: "Manage your rental application pipeline.",
};

function statusColor(status) {
  const map = {
    DRAFT: "bg-slate-100 text-slate-600",
    SUBMITTED: "bg-amber-100 text-amber-800",
    UNDER_REVIEW: "bg-blue-100 text-blue-800",
    APPROVED: "bg-emerald-100 text-emerald-800",
    DECLINED: "bg-red-100 text-red-800",
    WITHDRAWN: "bg-slate-100 text-slate-500",
    LEASE_DRAFTED: "bg-violet-100 text-violet-800",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

export default async function ApplicationsPage() {
  const actor = await getActor();
  if (!actor) redirect("/api/auth/signin?callbackUrl=/rental-applications");

  await connectDB();
  const items = await RentalApplication.find({
    $or: [{ applicantId: actor.id }, { ownerId: actor.id }],
    deletedAt: { $exists: false },
  })
    .populate("propertyId", "name listingReference images location pricing rates currency")
    .populate("applicantId", "name email image")
    .sort({ createdAt: -1 })
    .lean();

  const asOwner = items.filter(
    (i) => i.ownerId?.toString() === actor.id && i.applicantId?._id?.toString() !== actor.id
  );
  const asApplicant = items.filter(
    (i) => i.applicantId?._id?.toString() === actor.id
  );

  const renderCard = (item) => {
    const isOwner = item.ownerId?.toString() === actor.id && item.applicantId?._id?.toString() !== actor.id;
    const applicant = item.applicantId;
    const prop = item.propertyId || {};
    const rentAmount = prop.pricing?.monthlyRent || prop.rates?.monthly || prop.rates?.nightly || 0;

    return (
      <article key={item._id.toString()} className="pp-card rounded-2xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            {prop?.images?.[0] && (
              <Image
                src={prop.images[0]}
                alt=""
                width={96}
                height={64}
                className="h-16 w-24 flex-none rounded-xl object-cover"
              />
            )}
            <div>
              <h3 className="font-bold text-slate-900">
                {prop?.name || "Property"}
              </h3>
              {isOwner && applicant && (
                <div className="mt-1 flex items-center gap-2">
                  {applicant.image && (
                    <Image src={applicant.image} alt="" width={20} height={20} className="h-5 w-5 rounded-full" />
                  )}
                  <p className="text-sm text-slate-600">
                    {applicant.name} · {applicant.email}
                  </p>
                </div>
              )}
              <p className="mt-1 text-sm text-slate-500">
                Desired move-in:{" "}
                {item.desiredMoveIn
                  ? new Date(item.desiredMoveIn).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Not specified"}
              </p>
              {item.monthlyIncomeZAR && (
                <p className="mt-1 text-sm text-slate-500">
                  Stated income: R {Number(item.monthlyIncomeZAR).toLocaleString()}/month
                </p>
              )}
              {prop?.listingReference && (
                <p className="mt-1 font-mono text-xs text-slate-400">
                  {prop.listingReference}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor(item.status)}`}>
              {item.status.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-slate-400">
              Applied {new Date(item.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
          {!isOwner && item.status === "APPROVED" && (
            <PayApplicationButton
              applicationId={item._id.toString()}
              amount={rentAmount}
              currency={prop.currency || "ZAR"}
              label="Pay Holding Deposit (1 Month Rent)"
            />
          )}
          {isOwner && ["SUBMITTED", "UNDER_REVIEW"].includes(item.status) && (
            <>
              <WorkflowStatusAction
                endpoint={`/api/rental-applications/${item._id}`}
                action="approve"
                label="Approve & draft lease"
                className="btn-success text-xs"
              />
              <WorkflowStatusAction
                endpoint={`/api/rental-applications/${item._id}`}
                action="decline"
                label="Decline"
                className="btn-danger text-xs"
              />
            </>
          )}
          {!isOwner && ["SUBMITTED", "UNDER_REVIEW", "APPROVED"].includes(item.status) && (
            <WorkflowStatusAction
              endpoint={`/api/rental-applications/${item._id}`}
              action="withdraw"
              label="Withdraw application"
              className="btn-ghost border border-slate-200 text-xs"
            />
          )}
          {["WITHDRAWN", "DECLINED"].includes(item.status) && (
            <WorkflowStatusAction
              endpoint={`/api/rental-applications/${item._id}`}
              action="delete"
              label="Remove"
              className="bg-red-600 text-white hover:bg-red-700 text-xs font-bold shadow-sm"
            />
          )}
          {prop?._id && (
            <Link
              href={`/properties/${prop._id}`}
              className="btn-ghost border border-slate-200 text-xs"
            >
              View listing
            </Link>
          )}
        </div>
      </article>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-4">
        <div className="pp-page-header">
          <p className="pp-page-header__eyebrow">Rental pipeline</p>
          <h1 className="pp-page-header__title">Rental applications</h1>
          <p className="pp-page-header__subtitle">
            Track, review and action rental applications — whether you&apos;re a landlord or an applicant.
          </p>
        </div>

        {items.length === 0 && (
          <div className="pp-empty mt-8">
            <div className="pp-empty__icon text-3xl">📋</div>
            <p className="pp-empty__title">No applications yet</p>
            <p className="pp-empty__body">
              Find a long-term rental and submit your first application.
            </p>
            <Link href="/properties?purpose=RENT" className="btn-primary mt-6">
              Browse rental listings
            </Link>
          </div>
        )}

        {asOwner.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-slate-800">
              Applications for your properties ({asOwner.length})
            </h2>
            <div className="mt-4 space-y-4">{asOwner.map(renderCard)}</div>
          </div>
        )}

        {asApplicant.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-slate-800">
              Your applications ({asApplicant.length})
            </h2>
            <div className="mt-4 space-y-4">{asApplicant.map(renderCard)}</div>
          </div>
        )}
      </div>
    </main>
  );
}
