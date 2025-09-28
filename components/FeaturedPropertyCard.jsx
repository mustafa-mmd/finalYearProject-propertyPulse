// import Link from "next/link"
// import {
//   FaBed,
//   FaBath,
//   FaRulerCombined,
//   FaMoneyBill,
//   FaMapMarker
// } from 'react-icons/fa'
// import Image from "next/image";
// const FeaturedPropertyCard = ({property}) => {

// const getRateDisplay = () => {
//     const rates = property.rates || {};
//     if (rates.monthly) return `${rates.monthly.toLocaleString()}/mo`;
//     if (rates.weekly) return `${rates.weekly.toLocaleString()}/wk`;
//     if (rates.nightly) return `${rates.nightly.toLocaleString()}/night`;
//     return "";
//   };

//   return (
//     <div
//             className="bg-white rounded-xl shadow-md relative flex flex-col md:flex-row"
//           >
//             <Image
//               src={property.images[0]}
//               width={0}
//               height={0}
//               sizes="100vw"
//               alt=""
//               className="object-cover rounded-t-xl md:rounded-tr-none md:rounded-l-xl w-full md:w-2/5"
//             />
//             <div className="p-6">
//               <h3 className="text-xl font-bold">{property.name}</h3>
//               <div className="text-gray-600 mb-4">{property.type}</div>
//               <h3
//                 className="absolute top-[10px] left-[10px] bg-white px-4 py-2 rounded-lg text-blue-500 font-bold text-right md:text-center lg:text-right"
//               >
//                 ${getRateDisplay()}
//               </h3>
//               <div className="flex justify-center gap-4 text-gray-500 mb-4">
//                 <p>
//                   <FaBed className="inline-block mr-2"/> {property.beds} {' '}
//                   <span className="md:hidden lg:inline">Beds</span>
//                 </p>
//                 <p>
//                   <FaBath className="inline-block mr-2"/>{property.baths} {' '}
//                   <span className="md:hidden lg:inline">Baths</span>
//                 </p>
//                 <p>
//                   <FaRulerCombined className="inline-block mr-2"/>
//                   {property.square_feet} {' ' } <span className="md:hidden lg:inline">sqft</span>
//                 </p>
//               </div>

//               <div
//                 className="flex justify-center gap-4 text-green-900 text-sm mb-4"
//               >
//                  {property.rates.nightly && (
//                   <p>
//                     <FaMoneyBill className="inline-block mr-2"/>
//                     Nigthly
//                   </p>
//                  )}

//                 {property.rates.weekly && (
//                   <p>
//                     <FaMoneyBill className="inline-block mr-2"/>
//                     Weekly
//                   </p>
//                  )}

//                  {property.rates.monthly && (
//                   <p>
//                     <FaMoneyBill className="inline-block mr-2"/>
//                     Monthly
//                   </p>
//                  )}

//               <div className="border border-gray-200 mb-5"></div>

//               <div className="flex flex-col lg:flex-row justify-between">
//                 <div className="flex align-middle gap-2 mb-4 lg:mb-0">
                 
//                   <FaMapMarker className="text-lg text-orange-700"/>
//                   <span className="text-orange-700"> {property.location.city} {property.location.state}</span>
//                 </div>
//                 <Link
//                   href={`/prop/${property._id}`}
//                   className="h-[36px] bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-center text-sm"
//                 >
//                   Details
//                 </Link>
//               </div>
//             </div>
//           </div>
//   )
// }

// export default FeaturedPropertyCard





import Link from "next/link";
import {
  FaBed,
  FaBath,
  FaRulerCombined,
  FaMoneyBill,
  FaMapMarker,
} from "react-icons/fa";
import Image from "next/image";

const FeaturedPropertyCard = ({ property }) => {
  // Safe property access with defaults
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

  const { city = "", state = "" } = location;

  const getRateDisplay = () => {
    if (rates.monthly) return `${rates.monthly.toLocaleString()}/mo`;
    if (rates.weekly) return `${rates.weekly.toLocaleString()}/wk`;
    if (rates.nightly) return `${rates.nightly.toLocaleString()}/night`;
    return "Contact for price";
  };

  // Check if we have a valid image
  const hasImage = images && images.length > 0 && images[0];

  return (
    <div className="bg-white rounded-xl shadow-md relative flex flex-col md:flex-row">
      {hasImage ? (
        <Image
          src={images[0]}
          width={400}  // ✅ Fixed: Added proper width
          height={300} // ✅ Fixed: Added proper height
          alt={`${name} - ${type}`}
          className="object-cover rounded-t-xl md:rounded-tr-none md:rounded-l-xl w-full md:w-2/5"
          priority={true}
        />
      ) : (
        <div className="w-full md:w-2/5 bg-gray-200 rounded-t-xl md:rounded-tr-none md:rounded-l-xl flex items-center justify-center">
          <span className="text-gray-500">No Image</span>
        </div>
      )}

      <div className="p-6 flex-1">
        <h3 className="text-xl font-bold">{name}</h3>
        <div className="text-gray-600 mb-4">{type}</div>

        {/* Rate Display */}
        <div className="absolute top-[10px] left-[10px] bg-white px-4 py-2 rounded-lg text-blue-500 font-bold">
          ${getRateDisplay()}
        </div>

        {/* Property Features */}
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

        {/* Rate Types Available */}
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

        {/* Location and Details Button */}
        <div className="flex flex-col lg:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 lg:mb-0">
            <FaMapMarker className="text-lg text-orange-700" />
            <span className="text-orange-700">
              {city} {state}
            </span>
          </div>
          <Link
            href={`/properties/${_id}`} // ✅ Fixed: Changed from /prop/ to /properties/
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