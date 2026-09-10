import Link from "next/link";
import {
  FaBed,
  FaBath,
  FaRulerCombined,
  FaMoneyBill,
  FaMapMarker,
} from "react-icons/fa";
import Image from "next/image";
import { buildLocationLabel, normalizeLocation } from "@/utils/location";
import { formatPropertyImage } from "@/utils/imageHelper";

const FeaturedPropertyCard = ({ property }) => {
  const { 
    images = [], 
    name = "Property", 
    type = "", 
    rates = {}, 
    beds = 0, 
    baths = 0, 
    square_feet = 0,
    location = {},
    _id 
  } = property || {};

  const normalizedLocation = normalizeLocation(location);
  const locationLabel =
    normalizedLocation.city && normalizedLocation.state
      ? `${normalizedLocation.city}, ${normalizedLocation.state}`
      : normalizedLocation.formattedAddress ||
        buildLocationLabel(normalizedLocation);

  const getRateDisplay = () => {
    if (rates.monthly) return `${rates.monthly.toLocaleString()}/mo`;
    if (rates.weekly) return `${rates.weekly.toLocaleString()}/wk`;
    if (rates.nightly) return `${rates.nightly.toLocaleString()}/night`;
    return "Contact for price";
  };

  const imgSrc = formatPropertyImage(images?.[0]);

  return (
    <div className="bg-white rounded-xl shadow-md relative flex flex-col md:flex-row">
      <div className="relative w-full md:w-2/5 h-64 md:h-auto min-h-[220px]">
        <Image
          src={imgSrc}
          fill
          priority
          quality={95}
          sizes="(max-width: 768px) 100vw, 40vw"
          alt={`${name} - ${type}`}
          className="object-cover rounded-t-xl md:rounded-tr-none md:rounded-l-xl w-full h-full"
        />
      </div>

      <div className="p-6 flex-1">
        <h3 className="text-xl font-bold">{name}</h3>
        <div className="text-gray-600 mb-4">{type}</div>

        <div className="absolute top-[10px] left-[10px] bg-white px-4 py-2 rounded-lg text-blue-500 font-bold">
          ${getRateDisplay()}
        </div>

        <div className="flex justify-center gap-4 text-gray-500 mb-4">
          <p className="flex items-center">
            <FaBed className="mr-2" /> 
            {beds} <span className="md:hidden lg:inline">Beds</span>
          </p>
          <p className="flex items-center">
            <FaBath className="mr-2" />
            {baths} <span className="md:hidden lg:inline">Baths</span>
          </p>
          <p className="flex items-center">
            <FaRulerCombined className="mr-2" />
            {square_feet.toLocaleString()} <span className="md:hidden lg:inline">sqft</span>
          </p>
        </div>

        <div className="flex justify-center gap-4 text-green-900 text-sm mb-4">
          {rates.nightly && (
            <p className="flex items-center">
              <FaMoneyBill className="mr-2" />
              Nightly
            </p>
          )}
          {rates.weekly && (
            <p className="flex items-center">
              <FaMoneyBill className="mr-2" />
              Weekly
            </p>
          )}
          {rates.monthly && (
            <p className="flex items-center">
              <FaMoneyBill className="mr-2" />
              Monthly
            </p>
          )}
        </div>

        <div className="border border-gray-200 mb-5"></div>

        <div className="flex flex-col lg:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 lg:mb-0">
            <FaMapMarker className="text-lg text-orange-700" />
            <span className="text-orange-700">{locationLabel}</span>
          </div>
          <Link
            href={`/properties/${_id}`}
            className="h-[36px] bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-center text-sm transition duration-200"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FeaturedPropertyCard;
