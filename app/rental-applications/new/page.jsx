import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import mongoose from "mongoose";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import PropertyWorkflowForm from "@/components/PropertyWorkflowForm";
import { listingPublicFilter } from "@/config/listings";
import { getActor } from "@/utils/authorization";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Apply to rent – PropertyPulse" };
}

function getTomorrowDateString() {
  return new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
}

export default async function NewApplicationPage({ searchParams }) {
  const actor = await getActor();
  const { propertyId } = await searchParams;

  if (!actor)
    redirect(
      `/api/auth/signin?callbackUrl=/rental-applications/new?propertyId=${propertyId || ""}`
    );

  if (!mongoose.isValidObjectId(propertyId)) notFound();

  await connectDB();
  const property = await Property.findOne({
    _id: propertyId,
    ...listingPublicFilter(),
  })
    .select("name images pricing rates currency location beds baths type listingPurpose")
    .lean();

  const { isPropertyOwner } = await import("@/utils/authorization");
  const isOwner = isPropertyOwner(property, actor);

  const monthlyRent =
    Number(property.pricing?.monthlyRent || property.rates?.monthly || 0) ||
    (property.rates?.nightly ? property.rates.nightly * 30 : 0);
  const currency    = property.currency || "ZAR";
  const coverImage  = property.images?.[0] || null;
  const address     =
    property.location?.formattedAddress ||
    [property.location?.city, property.location?.state]
      .filter(Boolean)
      .join(", ") ||
    "Location not specified";

  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowStr = getTomorrowDateString();

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
            You are listed as the owner of <strong>{property.name}</strong>. As the owner/landlord, you cannot submit a rental application to your own listing.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href={`/properties/${propertyId}`}
              className="rounded-xl border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
            >
              View listing
            </a>
            <a
              href="/rental-applications"
              className="rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
            >
              View applicant pipeline
            </a>
          </div>
        </div>
      </main>
    );
  }


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
              Rental application
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
            {monthlyRent > 0 ? (
              <p className="mt-6 text-xl font-bold">
                {currency}{" "}
                <span className="text-white">
                  {monthlyRent.toLocaleString()}
                </span>
                <span className="ml-1 text-sm font-normal text-slate-400">
                  / month
                </span>
              </p>
            ) : (
              <p className="mt-6 text-sm text-slate-500 italic">
                Rent negotiable – contact the landlord.
              </p>
            )}

            {/* Trust badge */}
            <div className="mt-6 flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-xs text-slate-300">
              <span className="text-green-400 text-base">🔒</span>
              Your details are shared only with the property owner after review.
            </div>
          </div>
        </div>

        {/* ── Right: Application form ── */}
        <PropertyWorkflowForm
          mode="application"
          listingPurpose={property.listingPurpose || "LONG_TERM_RENT"}
          propertyId={propertyId}
          currency={currency}
          defaultCheckIn={tomorrowStr}
          minCheckIn={todayStr}
        />
      </div>
    </main>
  );
}
