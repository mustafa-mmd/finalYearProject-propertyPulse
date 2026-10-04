import Image from "next/image";
import Link from "next/link";
import { FaBed, FaBath, FaRulerCombined, FaMoneyBill, FaMapMarker } from "react-icons/fa";
import { buildLocationLabel, normalizeLocation } from "@/utils/location";
import { formatPropertyImage } from "@/utils/imageHelper";
import CompareButton from "@/components/CompareButton";

const PropertyCard = ({ property }) => {
  const location = normalizeLocation(property.location);
  const money = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: property.currency || "ZAR",
    maximumFractionDigits: 0,
  });
  const getRateDisplay = () => {
    const rates = property.rates || {};
    if (property.listingPurpose === "SALE" && property.pricing?.salePrice) {
      return money.format(property.pricing.salePrice);
    }
    if (rates.monthly) return `${money.format(rates.monthly)}/mo`;
    if (rates.weekly) return `${money.format(rates.weekly)}/wk`;
    if (rates.nightly) return `${money.format(rates.nightly)}/night`;
    return "Price on request";
  };

  const imgSrc = formatPropertyImage(property.images?.[0]);

  return (
    <div className="rounded-xl shadow-md relative bg-white">
      <div className="relative w-full h-64 overflow-hidden rounded-t-xl">
        <Image
          src={imgSrc}
          alt={property.name || "Property image"}
          fill
          quality={95}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover rounded-t-xl hover:scale-105 transition duration-300"
        />
      </div>

      <div className="p-4">
        <div className="text-left md:text-center lg:text-left mb-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span>{property.listingCategory?.replaceAll("_", " ") || property.type}</span>
            {property.listingPurpose && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                {property.listingPurpose.replaceAll("_", " ")}
              </span>
            )}
            {property.verification?.status === "VERIFIED" && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                ✓ Verified
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold">{property.name}</h3>
        </div>

        <h3 className="absolute top-[10px] right-[10px] bg-white px-4 py-2 rounded-lg text-blue-500 font-bold text-right md:text-center lg:text-right">
          {getRateDisplay()}
        </h3>

        <div className="flex justify-center gap-4 text-gray-500 mb-4">
          <p>
            <FaBed className="inline mr-2" /> {property.beds}{" "}
            <span className="md:hidden lg:inline">Beds</span>
          </p>
          <p>
            <FaBath className="inline mr-2" /> {property.baths}{" "}
            <span className="md:hidden lg:inline">Baths</span>
          </p>
          <p>
            <FaRulerCombined className="inline mr-2" /> {property.square_feet}{" "}
            <span className="md:hidden lg:inline">sqft</span>
          </p>
        </div>

        <div className="flex justify-center gap-4 text-green-900 text-sm mb-4">
          {property.rates?.nightly && (
            <p>
              <FaMoneyBill className="inline mr-2" /> Nightly
            </p>
          )}
          {property.rates?.weekly && (
            <p>
              <FaMoneyBill className="inline mr-2" /> Weekly
            </p>
          )}
          {property.rates?.monthly && (
            <p>
              <FaMoneyBill className="inline mr-2" /> Monthly
            </p>
          )}
        </div>

        <div className="border border-gray-100 mb-5"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FaMapMarker className="shrink-0 text-orange-700" />
            <span className="truncate text-sm font-medium text-orange-700">
              {location.city && location.state
                ? `${location.city}, ${location.state}`
                : location.formattedAddress || buildLocationLabel(location)}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CompareButton propertyId={property._id.toString()} compact />
            <Link
              href={`/properties/${property._id}`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-blue-700 shadow-sm hover:shadow"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
