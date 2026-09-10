import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import mongoose from "mongoose";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import OfferForm from "@/components/OfferForm";
import { listingPublicFilter } from "@/config/listings";
import { getActor } from "@/utils/authorization";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return { title: "Submit an Offer – PropertyPulse" };
}

export default async function NewOfferPage({ searchParams }) {
  const actor = await getActor();
  const { propertyId } = await searchParams;

  if (!actor)
    redirect(`/api/auth/signin?callbackUrl=/offers/new?propertyId=${propertyId || ""}`);

  if (!mongoose.isValidObjectId(propertyId)) notFound();

  await connectDB();

  // ── Fetch property — images MUST be included (was missing — caused the black box) ──
  const property = await Property.findOne({
    _id: propertyId,
    ...listingPublicFilter(),
    listingPurpose: "SALE",
  })
    .select("name images pricing currency location beds baths type listingCategory square_feet seller_info")
    .lean();

  if (!property) notFound();

  const askingPrice = Number(property.pricing?.salePrice || 0);
  const currency = property.currency || "ZAR";
  const coverImage = property.images?.[0] || null;

  const address =
    property.location?.formattedAddress ||
    [property.location?.city, property.location?.state]
      .filter(Boolean)
      .join(", ") ||
    "Location not specified";

  const formatter = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 lg:grid-cols-[1fr_1.4fr]">

        {/* ── Left: Property summary card ── */}
        <div className="h-fit rounded-2xl bg-slate-950 text-white overflow-hidden shadow-xl sticky top-6">

          {/* Cover image */}
          {coverImage ? (
            <div className="relative h-56 w-full">
              <Image
                src={coverImage}
                alt={property.name}
                fill
                priority
                unoptimized={coverImage.startsWith("http")}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              {/* Listing type badge */}
              <div className="absolute left-4 top-4">
                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                  For Sale
                </span>
              </div>
            </div>
          ) : (
            <div className="flex h-56 items-center justify-center bg-gradient-to-br from-slate-800 to-slate-700 text-6xl">
              🏡
            </div>
          )}

          {/* Info */}
          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Property Purchase
              </p>
              <h2 className="mt-2 text-xl font-bold leading-snug">
                {property.name}
              </h2>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                {address}
              </p>
            </div>

            {/* Property meta badges */}
            <div className="flex flex-wrap gap-2">
              {property.type && (
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  {property.type.replaceAll("_", " ")}
                </span>
              )}
              {property.beds != null && (
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  🛏 {property.beds} bed{property.beds !== 1 ? "s" : ""}
                </span>
              )}
              {property.baths != null && (
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  🚿 {property.baths} bath{property.baths !== 1 ? "s" : ""}
                </span>
              )}
              {Number(property.square_feet) > 0 && (
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                  📐 {Number(property.square_feet).toLocaleString()} sq ft
                </span>
              )}
            </div>

            {/* Asking price */}
            {askingPrice > 0 && (
              <div className="rounded-xl bg-emerald-900/40 border border-emerald-700/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">
                  Asking Price
                </p>
                <p className="text-2xl font-extrabold text-emerald-300">
                  {formatter.format(askingPrice)}
                </p>
              </div>
            )}

            {/* Trust badge */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-xs text-slate-300">
              <span className="text-emerald-400 text-base">🔒</span>
              Your offer details are submitted securely and privately.
            </div>
          </div>
        </div>

        {/* ── Right: Offer form ── */}
        <OfferForm
          propertyId={propertyId}
          currency={currency}
          askingPrice={askingPrice}
        />
      </div>
    </main>
  );
}
