import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import mongoose from "mongoose";
import Property from "@/models/Property";
import connectDB from "@/config/database";
import PropertyWorkflowForm from "@/components/PropertyWorkflowForm";
import { getActor } from "@/utils/authorization";
import { listingPublicFilter } from "@/config/listings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }) {
  return { title: "Request a booking – PropertyPulse" };
}

function getFutureDateStrings() {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const tomorrowStr = new Date(now.getTime() + 86_400_000).toISOString().slice(0, 10);
  const dayAfterStr = new Date(now.getTime() + 2 * 86_400_000).toISOString().slice(0, 10);
  return { todayStr, tomorrowStr, dayAfterStr };
}

export default async function NewBookingPage({ searchParams }) {
  const actor = await getActor();
  const { propertyId } = await searchParams;

  if (!actor)
    redirect(
      `/api/auth/signin?callbackUrl=/bookings/new?propertyId=${propertyId || ""}`
    );

  if (!mongoose.isValidObjectId(propertyId)) notFound();

  await connectDB();
  const property = await Property.findOne({
    _id: propertyId,
    ...listingPublicFilter(),
    $or: [
      {
        listingPurpose: {
          $in: [
            "SHORT_TERM_RENT",
            "LONG_TERM_RENT",
            "SHARED_ACCOMMODATION",
            "STUDENT_ACCOMMODATION",
          ],
        },
      },
      { listingPurpose: { $exists: false } },
    ],
  })
    .select("name images location rates pricing currency beds baths type listingPurpose")
    .lean();

  if (!property) notFound();

  const { isPropertyOwner } = await import("@/utils/authorization");
  const isOwner = isPropertyOwner(property, actor);

  if (isOwner) {
    return (
      <main className="min-h-screen bg-slate-50 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-lg">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
            🏠
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            You own this property
          </h1>
          <p className="mt-2 text-slate-600">
            You are listed as the host/owner of <strong>{property.name}</strong>. As the host, you cannot request a stay booking at your own listing.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href={`/properties/${propertyId}`}
              className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              View listing
            </a>
            <a
              href="/bookings"
              className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
            >
              View guest bookings
            </a>
          </div>
        </div>
      </main>
    );
  }

  // Calculate effective rates with fallbacks so every listing displays pricing correctly

  const nightlyRate =
    Number(property.rates?.nightly || 0) ||
    (property.rates?.weekly ? Math.round(property.rates.weekly / 7) : 0) ||
    (property.rates?.monthly ? Math.round(property.rates.monthly / 30) : 0) ||
    (property.pricing?.monthlyRent ? Math.round(property.pricing.monthlyRent / 30) : 0);

  const weeklyRate =
    Number(property.rates?.weekly || 0) ||
    (nightlyRate > 0 ? nightlyRate * 7 : 0);

  const monthlyRate =
    Number(property.rates?.monthly || 0) ||
    Number(property.pricing?.monthlyRent || 0) ||
    (nightlyRate > 0 ? nightlyRate * 30 : 0);

  const currency = property.currency || "ZAR";
  const coverImage = property.images?.[0] || null;
  const address =
    property.location?.formattedAddress ||
    [property.location?.city, property.location?.state]
      .filter(Boolean)
      .join(", ") ||
    "Location not specified";

  const { todayStr, tomorrowStr, dayAfterStr } = getFutureDateStrings();

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-[1fr_1.4fr]">
        {/* ── Left: Property summary card ── */}
        <div className="h-fit rounded-2xl bg-slate-950 text-white overflow-hidden shadow-xl">
          {/* Cover image */}
          {coverImage ? (
            <div className="relative h-52 w-full">
              <Image
                src={coverImage}
                alt={property.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
            </div>
          ) : (
            <div className="flex h-52 items-center justify-center bg-slate-800 text-5xl">
              🏠
            </div>
          )}

          {/* Info */}
          <div className="p-6">
            <p className="text-sm font-medium text-blue-400 tracking-wide uppercase">
              Booking request
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-snug">
              {property.name}
            </h2>
            <p className="mt-2 text-sm text-slate-400">{address}</p>

            {/* Property meta */}
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
              {property.type && (
                <span className="rounded-full bg-slate-800 px-3 py-1">
                  {property.type}
                </span>
              )}
              {property.beds != null && (
                <span className="rounded-full bg-slate-800 px-3 py-1">
                  🛏 {property.beds} bed{property.beds !== 1 ? "s" : ""}
                </span>
              )}
              {property.baths != null && (
                <span className="rounded-full bg-slate-800 px-3 py-1">
                  🚿 {property.baths} bath{property.baths !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Price */}
            {nightlyRate > 0 ? (
              <p className="mt-6 text-xl font-bold">
                {currency}{" "}
                <span className="text-white">
                  {nightlyRate.toLocaleString()}
                </span>
                <span className="ml-1 text-sm font-normal text-slate-400">
                  / night
                </span>
              </p>
            ) : (
              <p className="mt-6 text-sm text-slate-500 italic">
                Rate not set – contact the host.
              </p>
            )}

            {/* Trust badge */}
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-xs text-slate-300">
              <span className="text-green-400 text-base">🔒</span>
              Your personal details are only shared after confirmation.
            </div>
          </div>
        </div>

        {/* ── Right: Booking form ── */}
        <PropertyWorkflowForm
          mode="booking"
          listingPurpose={property.listingPurpose || "SHORT_TERM_RENT"}
          propertyId={propertyId}
          nightlyRate={nightlyRate}
          weeklyRate={weeklyRate}
          monthlyRate={monthlyRate}
          currency={currency}
          defaultCheckIn={tomorrowStr}
          defaultCheckOut={dayAfterStr}
          minCheckIn={todayStr}
        />
      </div>
    </main>
  );
}

