import connectDB from "@/config/database";
import Image from "next/image";
import ViewingAppointment from "@/models/ViewingAppointment";
import { requireActor } from "@/utils/authorization";
import WorkflowStatusAction from "@/components/WorkflowStatusAction";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Property Viewings",
  description: "Manage your property viewing appointments.",
};

function statusColor(status) {
  const map = {
    REQUESTED: "bg-amber-100 text-amber-800",
    CONFIRMED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-red-100 text-red-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    NO_SHOW: "bg-slate-100 text-slate-600",
  };
  return map[status] || "bg-slate-100 text-slate-600";
}

function viewingTypeLabel(type) {
  const map = {
    IN_PERSON: "In-person viewing",
    VIRTUAL: "Virtual / video tour",
    SELF_GUIDED: "Self-guided tour",
  };
  return map[type] || type?.replace(/_/g, " ") || "Viewing";
}

export default async function ViewingsPage() {
  const actor = await requireActor();
  await connectDB();

  const viewings = await ViewingAppointment.find({
    $or: [{ requesterId: actor.id }, { ownerId: actor.id }],
    deletedAt: { $exists: false },
  })
    .populate("propertyId", "name listingReference images location")
    .populate("requesterId", "name email image")
    .populate("ownerId", "name email image")
    .sort({ scheduledStart: 1 })
    .lean();

  const upcoming = viewings.filter(
    (v) => new Date(v.scheduledStart) >= new Date() && v.status !== "CANCELLED"
  );
  const past = viewings.filter(
    (v) => new Date(v.scheduledStart) < new Date() || v.status === "CANCELLED"
  );

  const ViewingCard = ({ viewing }) => {
    const isOwner = viewing.ownerId?._id?.toString() === actor.id;
    const requester = viewing.requesterId;
    const property = viewing.propertyId;
    const startDate = new Date(viewing.scheduledStart);

    return (
      <article className="pp-card rounded-2xl p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            {property?.images?.[0] && (
              <Image
                src={property.images[0]}
                alt=""
                width={96}
                height={64}
                className="h-16 w-24 flex-none rounded-xl object-cover"
              />
            )}
            <div>
              <h3 className="font-bold text-slate-900">{property?.name || "Property"}</h3>
              <p className="mt-1 text-sm font-medium text-blue-700">
                {viewingTypeLabel(viewing.type)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {startDate.toLocaleDateString("en-ZA", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                at{" "}
                {startDate.toLocaleTimeString("en-ZA", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: viewing.timezone || "Africa/Johannesburg",
                })}
              </p>
              {isOwner && requester && (
                <p className="mt-1 text-sm text-slate-500">
                  Requested by: {requester.name} ({requester.email})
                </p>
              )}
              {property?.listingReference && (
                <p className="mt-1 font-mono text-xs text-slate-400">
                  {property.listingReference}
                </p>
              )}
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusColor(viewing.status)}`}>
            {viewing.status}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {isOwner && viewing.status === "REQUESTED" && (
            <>
              <WorkflowStatusAction
                endpoint={`/api/viewings/${viewing._id}`}
                action="confirm"
                label="Confirm viewing"
                className="btn-success text-xs"
              />
              <WorkflowStatusAction
                endpoint={`/api/viewings/${viewing._id}`}
                action="decline"
                label="Decline"
                className="btn-danger text-xs"
              />
            </>
          )}
          {!isOwner && ["REQUESTED", "CONFIRMED"].includes(viewing.status) && (
            <WorkflowStatusAction
              endpoint={`/api/viewings/${viewing._id}`}
              action="cancel"
              label="Cancel viewing"
              className="btn-ghost border border-slate-200 text-xs"
            />
          )}
          {property?._id && (
            <Link
              href={`/properties/${property._id}`}
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="pp-page-header">
            <p className="pp-page-header__eyebrow">Property viewings</p>
            <h1 className="pp-page-header__title">Your viewing appointments</h1>
            <p className="pp-page-header__subtitle">
              Requested and hosted viewings appear here. Confirm, decline, or cancel as needed.
            </p>
          </div>
          <Link href="/viewings/request" className="btn-primary shrink-0">
            + Schedule a viewing
          </Link>
        </div>

        {viewings.length === 0 && (
          <div className="pp-empty mt-8">
            <div className="pp-empty__icon text-3xl">🏠</div>
            <p className="pp-empty__title">No viewings scheduled</p>
            <p className="pp-empty__body">Browse a property and request an in-person or virtual viewing.</p>
            <Link href="/properties" className="btn-primary mt-6">
              Browse properties
            </Link>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="mt-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
              Upcoming ({upcoming.length})
            </p>
            <div className="space-y-4">
              {upcoming.map((v) => (
                <ViewingCard key={v._id.toString()} viewing={v} />
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div className="mt-10">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
              Past & cancelled ({past.length})
            </p>
            <div className="space-y-4 opacity-80">
              {past.map((v) => (
                <ViewingCard key={v._id.toString()} viewing={v} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
