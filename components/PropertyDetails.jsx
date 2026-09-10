"use client";

import {
  FaBed,
  FaBath,
  FaRulerCombined,
  FaCheck,
  FaMapMarker,
  FaMoon,
  FaCalendarWeek,
  FaCalendarAlt,
  FaTag,
  FaHandshake,
  FaHome,
  FaKey,
  FaBuilding,
} from "react-icons/fa";
import dynamic from "next/dynamic";
// maplibre-gl uses browser-only APIs (new URL + WebWorker). Must not run SSR.
const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[430px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-sm font-medium text-slate-500">
      Loading map…
    </div>
  ),
});
import Link from "next/link";
import { buildLocationLabel, normalizeLocation } from "@/utils/location";

/* ── helpers ─────────────────────────────────────────────── */

function purposeLabel(purpose) {
  const MAP = {
    LONG_TERM_RENT: "Long-term Rental",
    SHORT_TERM_RENT: "Short-term / Holiday",
    SALE: "For Sale",
    COMMERCIAL_LEASE: "Commercial Lease",
  };
  return MAP[purpose] || (purpose || "RENT").replaceAll("_", " ");
}

function purposeIcon(purpose) {
  if (purpose === "SALE") return FaHome;
  if (purpose === "SHORT_TERM_RENT") return FaMoon;
  if (purpose === "COMMERCIAL_LEASE") return FaBuilding;
  return FaKey;
}

function purposeColor(purpose) {
  if (purpose === "SALE") return "bg-emerald-100 text-emerald-800";
  if (purpose === "SHORT_TERM_RENT") return "bg-violet-100 text-violet-800";
  if (purpose === "COMMERCIAL_LEASE") return "bg-orange-100 text-orange-800";
  return "bg-blue-100 text-blue-800";
}

/* ── Rates / Price section rendered conditionally ─────────── */

function PricingSection({ property, formatter }) {
  const purpose = property.listingPurpose;
  const rates = property.rates || {};
  const pricing = property.pricing || {};

  /* SALE */
  if (purpose === "SALE") {
    const price =
      pricing.salePrice ||
      pricing.price ||
      property.price ||
      property.salePrice;
    if (!price) return null;
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">Sale price</p>
        <p className="text-3xl font-extrabold text-emerald-700">
          {formatter.format(Number(price))}
        </p>
        <p className="mt-1 text-sm text-emerald-600">One-time purchase price</p>
      </div>
    );
  }

  /* SHORT_TERM_RENT — show only rates that were actually set */
  if (purpose === "SHORT_TERM_RENT") {
    const items = [
      { label: "Nightly", icon: FaMoon, value: rates.nightly },
      { label: "Weekly", icon: FaCalendarWeek, value: rates.weekly },
      { label: "Monthly", icon: FaCalendarAlt, value: rates.monthly },
    ].filter((r) => Number(r.value) > 0);

    if (!items.length) return null;

    return (
      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-3">Booking rates</p>
        <div className="flex flex-wrap gap-4">
          {items.map(({ label, icon: Icon, value }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <Icon aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold text-violet-500">{label}</p>
                <p className="font-extrabold text-violet-800">{formatter.format(Number(value))}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* LONG_TERM_RENT / COMMERCIAL_LEASE — monthly rent */
  const monthlyRent =
    pricing.monthlyRent ||
    pricing.monthly ||
    rates.monthly ||
    property.monthlyRent;

  if (!monthlyRent) return null;

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">Monthly rent</p>
      <p className="text-3xl font-extrabold text-blue-700">
        {formatter.format(Number(monthlyRent))}
        <span className="text-base font-semibold text-blue-400"> / month</span>
      </p>
      {property.listingPurpose === "COMMERCIAL_LEASE" && (
        <p className="mt-1 text-sm text-blue-600">Commercial lease — contact owner for lease terms</p>
      )}
    </div>
  );
}

/* ── Booking action button(s) by purpose ─────────────────── */

function BookingActions({ property }) {
  const purpose = property.listingPurpose;
  const id = property._id;

  if (purpose === "SALE") {
    return (
      <div className="flex flex-wrap gap-3">
        <Link
          href={`/offers/new?propertyId=${id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3.5 font-semibold text-white shadow-lg hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl transition-all duration-200"
        >
          <FaHandshake aria-hidden="true" />
          Submit an Offer
        </Link>
        <Link
          href={`/viewings/request?propertyId=${id}`}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-600 px-6 py-3.5 font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          <FaCalendarAlt aria-hidden="true" />
          Schedule Viewing
        </Link>
      </div>
    );
  }

  if (purpose === "SHORT_TERM_RENT") {
    const rates = property.rates || {};
    const hasNightly = Number(rates.nightly) > 0;
    const hasWeekly = Number(rates.weekly) > 0;
    const hasMonthly = Number(rates.monthly) > 0;

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-3">
          {hasNightly && (
            <Link
              href={`/bookings/new?propertyId=${id}&type=NIGHTLY`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3.5 font-semibold text-white shadow-lg hover:from-violet-700 hover:to-purple-700 transition-all"
            >
              <FaMoon aria-hidden="true" />
              Book Nightly
            </Link>
          )}
          {hasWeekly && (
            <Link
              href={`/bookings/new?propertyId=${id}&type=WEEKLY`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg hover:from-indigo-700 hover:to-blue-700 transition-all"
            >
              <FaCalendarWeek aria-hidden="true" />
              Book Weekly
            </Link>
          )}
          {hasMonthly && (
            <Link
              href={`/bookings/new?propertyId=${id}&type=MONTHLY`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 px-6 py-3.5 font-semibold text-white shadow-lg hover:from-blue-700 hover:to-sky-700 transition-all"
            >
              <FaCalendarAlt aria-hidden="true" />
              Book Monthly
            </Link>
          )}
          <Link
            href={`/bookings/new?propertyId=${id}&type=CUSTOM`}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-violet-600 px-6 py-3.5 font-semibold text-violet-700 transition hover:bg-violet-50"
          >
            <FaTag aria-hidden="true" />
            Custom Dates
          </Link>
        </div>
        <Link
          href={`/viewings/request?propertyId=${id}`}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
        >
          <FaCalendarAlt aria-hidden="true" />
          Schedule Viewing
        </Link>
      </div>
    );
  }

  /* LONG_TERM_RENT / COMMERCIAL_LEASE */
  return (
    <div className="flex flex-wrap gap-3">
      <Link
        href={`/rental-applications/new?propertyId=${id}`}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transition-all duration-200"
      >
        <FaKey aria-hidden="true" />
        {purpose === "COMMERCIAL_LEASE" ? "Enquire / Apply" : "Apply to Rent"}
      </Link>
      <Link
        href={`/viewings/request?propertyId=${id}`}
        className="inline-flex items-center gap-2 rounded-xl border-2 border-blue-600 px-6 py-3.5 font-semibold text-blue-700 transition hover:bg-blue-50"
      >
        <FaCalendarAlt aria-hidden="true" />
        Schedule Viewing
      </Link>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */

const PropertyDetails = ({ property }) => {
  const location = normalizeLocation(property.location);
  const currencyFormatter = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: property.currency || "ZAR",
    maximumFractionDigits: 0,
  });
  const locationLabel =
    location.formattedAddress ||
    buildLocationLabel(location) ||
    "Location details available from the owner";

  const PurposeIcon = purposeIcon(property.listingPurpose);
  const purpose = property.listingPurpose;

  return (
    <main className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${purposeColor(purpose)}`}>
            <PurposeIcon aria-hidden="true" />
            {purposeLabel(purpose)}
          </span>
          {property.listingCategory && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {property.listingCategory.replaceAll("_", " ")}
            </span>
          )}
          {property.verification?.status === "VERIFIED" && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              ✓ Verified property
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {property.listingStatus || "PUBLISHED"}
          </span>
        </div>

        <h1 className="mt-4 text-3xl font-bold text-slate-950">{property.name}</h1>

        {property.listingReference && (
          <p className="mt-1 font-mono text-xs text-slate-400">Ref: {property.listingReference}</p>
        )}

        <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
          <FaMapMarker className="shrink-0 text-orange-500" aria-hidden="true" />
          <span>{locationLabel}</span>
        </div>

        {/* Room stats */}
        <div className="mt-5 flex flex-wrap gap-5 border-t border-slate-100 pt-5">
          {Number(property.beds) > 0 && (
            <div className="flex items-center gap-2 text-slate-700">
              <FaBed className="text-blue-500" aria-hidden="true" />
              <span className="font-semibold">{property.beds}</span>
              <span className="text-sm text-slate-500">Bedroom{Number(property.beds) !== 1 ? "s" : ""}</span>
            </div>
          )}
          {Number(property.baths) > 0 && (
            <div className="flex items-center gap-2 text-slate-700">
              <FaBath className="text-blue-500" aria-hidden="true" />
              <span className="font-semibold">{property.baths}</span>
              <span className="text-sm text-slate-500">Bathroom{Number(property.baths) !== 1 ? "s" : ""}</span>
            </div>
          )}
          {Number(property.square_feet) > 0 && (
            <div className="flex items-center gap-2 text-slate-700">
              <FaRulerCombined className="text-blue-500" aria-hidden="true" />
              <span className="font-semibold">{Number(property.square_feet).toLocaleString()}</span>
              <span className="text-sm text-slate-500">sq ft</span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing — context-aware (only relevant rates shown) */}
      <PricingSection property={property} formatter={currencyFormatter} />

      {/* Booking / action buttons — context-aware */}
      <BookingActions property={property} />

      {/* Description */}
      {property.description && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">Description</h2>
          <p className="whitespace-pre-line leading-7 text-slate-600">{property.description}</p>
        </div>
      )}

      {/* Amenities */}
      {property.amenities?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Amenities</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {property.amenities.map((amenity) => (
              <li key={amenity} className="flex items-center gap-2.5 text-sm text-slate-700">
                <FaCheck className="shrink-0 text-emerald-500" aria-hidden="true" />
                {amenity}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Seller / Contact info */}
      {(property.seller_info?.name || property.seller_info?.email || property.seller_info?.phone) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Contact information</h2>
          <ul className="space-y-2 text-sm text-slate-700">
            {property.seller_info.name && (
              <li><span className="font-semibold">Name:</span> {property.seller_info.name}</li>
            )}
            {property.seller_info.email && (
              <li>
                <span className="font-semibold">Email:</span>{" "}
                <a href={`mailto:${property.seller_info.email}`} className="text-blue-600 hover:underline">
                  {property.seller_info.email}
                </a>
              </li>
            )}
            {property.seller_info.phone && (
              <li>
                <span className="font-semibold">Phone:</span>{" "}
                <a href={`tel:${property.seller_info.phone}`} className="text-blue-600 hover:underline">
                  {property.seller_info.phone}
                </a>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Map */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Property location</h2>
          <p className="mt-1 text-sm text-slate-500">{locationLabel}</p>
        </div>
        <PropertyMap property={property} />
      </div>
    </main>
  );
};

export default PropertyDetails;
