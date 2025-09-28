import { FaBed, FaBath, FaRulerCombined, FaTimes, FaCheck, FaMapMarker } from "react-icons/fa";
import PropertyMap from "./PropertyMap";

const PropertyDetails = ({ property }) => {
  return (
    <main>
      <div className="bg-white p-6 rounded-lg shadow-md text-center md:text-left">
        <div className="text-gray-500 mb-4">{property.type}</div>
        <h1 className="text-3xl font-bold mb-4">{property.name}</h1>
        <div className="text-gray-500 mb-4 flex align-middle justify-center md:justify-start">
          <FaMapMarker className="text-orange-700 mr-2" />
          <p className="text-orange-700">
            {property.location.street}, {property.location.city},{" "}
            {property.location.state}
          </p>
        </div>

        <h3 className="text-lg font-bold my-6 bg-gray-800 text-white p-2">
          Rates & Options
        </h3>
        <div className="flex flex-col md:flex-row justify-around">
          <div className="flex items-center justify-center mb-4 border-b border-gray-200 md:border-b-0 pb-4 md:pb-0">
            <div className="text-gray-500 mr-2 font-bold">Nightly</div>
            <div className="text-2xl font-bold text-blue-500">
              {property.rates.nightly ? (
                `${property.rates.nightly.toLocaleString()}`
              ) : (
                <FaTimes className=" text-red-700" />
              )}
            </div>
          </div>
          <div className="flex items-center justify-center mb-4 border-b border-gray-200 md:border-b-0 pb-4 md:pb-0">
            <div className="text-gray-500 mr-2 font-bold">Weekly</div>
            <div className="text-2xl font-bold text-blue-500">
              {property.rates.weekly ? (
                `${property.rates.weekly.toLocaleString()}`
              ) : (
                <FaTimes className=" text-red-700" />
              )}
            </div>
          </div>
          <div className="flex items-center justify-center mb-4 pb-4 md:pb-0">
            <div className="text-gray-500 mr-2 font-bold">Monthly</div>
            <div className="text-2xl font-bold text-blue-500">
              {property.rates.monthly ? (
                `${property.rates.monthly.toLocaleString()}`
              ) : (
                <FaTimes className=" text-red-700" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h3 className="text-lg font-bold mb-6">Description & Details</h3>
        <div className="flex justify-center gap-4 text-blue-500 mb-4 text-xl space-x-9">
          <p>
            <FaBed className="inline-block mr-2" />
            {property.beds} <span className="hidden sm:inline"> Beds</span>
          </p>
          <p>
            <FaBath className="inline-block mr-2" />
            {property.baths} <span className="hidden sm:inline"> Baths</span>
          </p>
          <p>
            <FaRulerCombined className="inline-block mr-2" />
            {property.square_feet} <span className="hidden sm:inline"> sqft</span>
          </p>
        </div>
        <p className="text-gray-500 mb-4 text-center">
          {property.description || "No description available for this property."}
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h3 className="text-lg font-bold mb-6">Amenities</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 list-none">
          {property.amenities.map((amenity, index) => (
            <li key={index} className="flex items-center mb-2 text-gray-700">
              <FaCheck className="text-green-500 mr-2" />
              {amenity}
            </li>
          ))}
        </ul>
      </div>

      {/* ✅ Seller Information */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h3 className="text-lg font-bold mb-6">Seller Information</h3>
        <ul className="space-y-2 text-gray-700">
          <li>
            <strong>Name:</strong> {property.seller_info?.name || "N/A"}
          </li>
          <li>
            <strong>Email:</strong> {property.seller_info?.email || "N/A"}
          </li>
          <li>
            <strong>Phone:</strong> {property.seller_info?.phone || "N/A"}
          </li>
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <PropertyMap property={property} />
      </div>
    </main>
  );
};

export default PropertyDetails;






// import {
//   FaBed,
//   FaBath,
//   FaRulerCombined,
//   FaTimes,
//   FaCheck,
//   FaMapMarker,
// } from "react-icons/fa";
// import PropertyMap from "./PropertyMap";

// const PropertyDetails = ({ property }) => {
//   return (
//     <main>
//       {/* ✅ Show first image */}
//       {property.images?.length > 0 && (
//         <div className="mb-6">
//           <img
//             src={property.images[0]} // ✅ first image only
//             alt={property.name}
//             className="w-full h-96 object-cover rounded-lg shadow-md"
//           />
//         </div>
//       )}

//       <div className="bg-white p-6 rounded-lg shadow-md text-center md:text-left">
//         <div className="text-gray-500 mb-4">{property.type}</div>
//         <h1 className="text-3xl font-bold mb-4">{property.name}</h1>
//         <div className="text-gray-500 mb-4 flex align-middle justify-center md:justify-start">
//           <FaMapMarker className="text-orange-700 mr-2" />
//           <p className="text-orange-700">
//             {property.location.street}, {property.location.city},{" "}
//             {property.location.state}
//           </p>
//         </div>

//         <h3 className="text-lg font-bold my-6 bg-gray-800 text-white p-2">
//           Rates & Options
//         </h3>
//         <div className="flex flex-col md:flex-row justify-around">
//           {/* Nightly */}
//           <div className="flex items-center justify-center mb-4 border-b border-gray-200 md:border-b-0 pb-4 md:pb-0">
//             <div className="text-gray-500 mr-2 font-bold">Nightly</div>
//             <div className="text-2xl font-bold text-blue-500">
//               {property.rates.nightly ? (
//                 `${property.rates.nightly.toLocaleString()}`
//               ) : (
//                 <FaTimes className=" text-red-700" />
//               )}
//             </div>
//           </div>

//           {/* Weekly */}
//           <div className="flex items-center justify-center mb-4 border-b border-gray-200 md:border-b-0 pb-4 md:pb-0">
//             <div className="text-gray-500 mr-2 font-bold">Weekly</div>
//             <div className="text-2xl font-bold text-blue-500">
//               {property.rates.weekly ? (
//                 `${property.rates.weekly.toLocaleString()}`
//               ) : (
//                 <FaTimes className=" text-red-700" />
//               )}
//             </div>
//           </div>

//           {/* Monthly */}
//           <div className="flex items-center justify-center mb-4 pb-4 md:pb-0">
//             <div className="text-gray-500 mr-2 font-bold">Monthly</div>
//             <div className="text-2xl font-bold text-blue-500">
//               {property.rates.monthly ? (
//                 `${property.rates.monthly.toLocaleString()}`
//               ) : (
//                 <FaTimes className=" text-red-700" />
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* ✅ Description & Details */}
//       <div className="bg-white p-6 rounded-lg shadow-md mt-6">
//         <h3 className="text-lg font-bold mb-6">Description & Details</h3>
//         <div className="flex justify-center gap-4 text-blue-500 mb-4 text-xl space-x-9">
//           <p>
//             <FaBed className="inline-block mr-2" />
//             {property.beds} <span className="hidden sm:inline"> Beds</span>
//           </p>
//           <p>
//             <FaBath className="inline-block mr-2" />
//             {property.baths} <span className="hidden sm:inline"> Baths</span>
//           </p>
//           <p>
//             <FaRulerCombined className="inline-block mr-2" />
//             {property.square_feet}{" "}
//             <span className="hidden sm:inline"> sqft</span>
//           </p>
//         </div>
//         <p className="text-gray-500 mb-4 text-center">
//           {property.description || "No description available for this property."}
//         </p>
//       </div>

//       {/* ✅ Amenities */}
//       <div className="bg-white p-6 rounded-lg shadow-md mt-6">
//         <h3 className="text-lg font-bold mb-6">Amenities</h3>
//         <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 list-none">
//           {property.amenities.map((amenity, index) => (
//             <li key={index} className="flex items-center mb-2 text-gray-700">
//               <FaCheck className="text-green-500 mr-2" />
//               {amenity}
//             </li>
//           ))}
//         </ul>
//       </div>

//       {/* ✅ Seller Information */}
//       <div className="bg-white p-6 rounded-lg shadow-md mt-6">
//         <h3 className="text-lg font-bold mb-6">Seller Information</h3>
//         <ul className="space-y-2 text-gray-700">
//           <li>
//             <strong>Name:</strong> {property.seller_info?.name || "N/A"}
//           </li>
//           <li>
//             <strong>Email:</strong> {property.seller_info?.email || "N/A"}
//           </li>
//           <li>
//             <strong>Phone:</strong> {property.seller_info?.phone || "N/A"}
//           </li>
//         </ul>
//       </div>

//       {/* ✅ Gallery (skip first image, show only if more than 1) */}
//       {property.images?.length > 1 && (
//         <div className="bg-white p-6 rounded-lg shadow-md mt-6">
//           <h3 className="text-lg font-bold mb-4">Gallery</h3>
//           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//             {property.images.slice(1).map((img, index) => (
//               <img
//                 key={index}
//                 src={img}
//                 alt={`${property.name} ${index + 2}`}
//                 className="w-full h-48 object-cover rounded-lg shadow"
//               />
//             ))}
//           </div>
//         </div>
//       )}

//       {/* ✅ Map */}
//       <div className="bg-white p-6 rounded-lg shadow-md mt-6">
//         <PropertyMap property={property} />
//       </div>
//     </main>
//   );
// };

// export default PropertyDetails;

