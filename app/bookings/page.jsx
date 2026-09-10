import { redirect } from "next/navigation";
import Image from "next/image";
import connectDB from "@/config/database";
import Booking from "@/models/Booking";
import WorkflowStatusAction from "@/components/WorkflowStatusAction";
import PayBookingButton from "@/components/PayBookingButton";
import { getActor } from "@/utils/authorization";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bookings",
  description: "Manage your short-term rental bookings.",
};

function statusColor(status) {
  const map = {
    REQUESTED: "bg-amber-100 text-amber-800",
    CONFIRMED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-red-100 text-red-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    DECLINED: "bg-slate-100 text-slate-700",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

export default async function BookingsPage() {
  const actor = await getActor();
  if (!actor) redirect("/api/auth/signin?callbackUrl=/bookings");

  await connectDB();
  const items = await Booking.find({
    $or: [{ guestId: actor.id }, { ownerId: actor.id }],
  })
    .populate("propertyId", "name listingReference images location")
    .sort({ createdAt: -1 })
    .lean();

  const asOwner = items.filter((b) => b.ownerId?.toString() === actor.id);
  const asGuest = items.filter((b) => b.guestId?.toString() === actor.id);

  const Section = ({ title, bookings }) =>
    bookings.length === 0 ? null : (
      <div className="mt-8">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <div className="mt-4 space-y-4">
          {bookings.map((item) => {
            const isOwner = item.ownerId?.toString() === actor.id;
            return (
              <article key={item._id.toString()} className="pp-card rounded-2xl p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    {item.propertyId?.images?.[0] && (
                      <Image
                        src={item.propertyId.images[0]}
                        alt=""
                        width={96}
                        height={64}
                        className="h-16 w-24 flex-none rounded-xl object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900">
                        {item.propertyId?.name || "Property"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {new Date(item.checkIn).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        →{" "}
                        {new Date(item.checkOut).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        · {item.nights} night{item.nights !== 1 ? "s" : ""}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {item.currency} {Number(item.total).toLocaleString()}
                      </p>
                      {item.propertyId?.listingReference && (
                        <p className="mt-1 font-mono text-xs text-slate-400">
                          {item.propertyId.listingReference}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  {!isOwner && item.status === "REQUESTED" && (
                    <PayBookingButton
                      bookingId={item._id.toString()}
                      amount={item.total}
                      currency={item.currency}
                      label="Pay & Confirm Stay"
                    />
                  )}
                  {isOwner && item.status === "REQUESTED" && (
                    <>
                      <WorkflowStatusAction
                        endpoint={`/api/bookings/${item._id}`}
                        action="confirm"
                        label="Confirm booking"
                        className="btn-success text-xs"
                      />
                      <WorkflowStatusAction
                        endpoint={`/api/bookings/${item._id}`}
                        action="decline"
                        label="Decline"
                        className="btn-danger text-xs"
                      />
                    </>
                  )}
                  {!isOwner && ["REQUESTED", "CONFIRMED"].includes(item.status) && (
                    <WorkflowStatusAction
                      endpoint={`/api/bookings/${item._id}`}
                      action="cancel"
                      label="Cancel booking"
                      className="btn-ghost border border-red-200 text-red-700 text-xs"
                    />
                  )}
                  {item.propertyId?._id && (
                    <Link
                      href={`/properties/${item.propertyId._id}`}
                      className="btn-ghost border border-slate-200 text-xs"
                    >
                      View property
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="pp-page-header">
          <p className="pp-page-header__eyebrow">Accommodation</p>
          <h1 className="pp-page-header__title">Your bookings</h1>
          <p className="pp-page-header__subtitle">
            Manage your short-term rental requests as both a guest and a host.
          </p>
        </div>

        {items.length === 0 && (
          <div className="pp-empty mt-8">
            <div className="pp-empty__icon text-3xl">🛏️</div>
            <p className="pp-empty__title">No bookings yet</p>
            <p className="pp-empty__body mt-1">
              Browse short-term rental listings and request your first stay.
            </p>
            <Link href="/properties?purpose=SHORT_TERM_RENT" className="btn-primary mt-6">
              Find short-term rentals
            </Link>
          </div>
        )}

        <Section title={`Hosted bookings (${asOwner.length})`} bookings={asOwner} />
        <Section title={`Your stays (${asGuest.length})`} bookings={asGuest} />
      </div>
    </main>
  );
}
