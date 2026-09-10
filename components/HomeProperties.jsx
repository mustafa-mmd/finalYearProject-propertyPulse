// import Link from "next/link";
// // import properties from "../properties.json";
// import PropertyCard from "./PropertyCard";
// import {getProperties} from "../utils/requests";



// const HomeProperties = async () => {
//   const data = await getProperties();
//   const recentProperties = data.properties.sort(() => Math.random() - Math.random()).slice(0, 3);

//   return (
//     <>
//       <section className="px-4 py-6">
//         <div className="container-xl lg:container m-auto">
//           <h2 className="text-3xl font-bold text-blue-500 mb-6 text-center">
//             Recent Properties
            
            
//           </h2>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
//             {recentProperties.length === 0 ? (
//               <p className="text-center col-span-3">
//                 No properties available at the moment
//               </p>
//             ) : (
//               recentProperties.map((property) => (
//                 <PropertyCard key={property._id} property={property} />
//               ))
//             )}
//           </div>
//         </div>
//       </section>

//       <section className="m-auto max-w-lg my-10 px-6">
//         <Link
//         href="/properties"
//         className="block bg-black text-white text-center py-4 px-6 rounded-xl hover:bg-gray-700"
//         >View All Properties</Link >
//       </section>
//     </>
//   );
// };

// export default HomeProperties;




import Link from "next/link";
import PropertyCard from "./PropertyCard";
import { queryProperties } from "@/utils/propertyQueries";
import { FaHome, FaClock, FaArrowRight } from "react-icons/fa";

const HomeProperties = async () => {
  try {
    const data = await queryProperties();
    
    if (!data?.properties?.length) {
      return (
        <section className="px-4 py-6">
          <div className="container-xl lg:container m-auto text-center">
            <div className="bg-blue-50 rounded-lg p-8 max-w-2xl mx-auto">
              <FaHome className="text-6xl text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-blue-600 mb-2">
                No Properties Yet
              </h2>
              <p className="text-gray-600 mb-4">
                Be the first to list your property and stand out from the crowd!
              </p>
              <Link
                href="/properties/add"
                className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Your Property
              </Link>
            </div>
          </div>
        </section>
      );
    }

   
    const recentProperties = data.properties
      .filter(property => property?.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    // Calculate how recent (in days)
    const getRecencyBadge = (property) => {
      const created = new Date(property.createdAt);
      const now = new Date();
      const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return { text: "TODAY", color: "bg-green-500" };
      if (diffDays === 1) return { text: "YESTERDAY", color: "bg-green-400" };
      if (diffDays <= 7) return { text: "THIS WEEK", color: "bg-blue-500" };
      return { text: "NEW", color: "bg-gray-500" };
    };

    return (
      <>
        <section className="px-4 py-6 bg-gradient-to-br from-blue-50 to-gray-50 relative z-10">
          <div className="container-xl lg:container m-auto">
            <div className="text-center mb-6"> {/* Reduced margin */}
              <div className="flex items-center justify-center gap-3 mb-2"> {/* Reduced margin */}
                <FaClock className="text-2xl text-blue-500" />
                <h2 className="text-3xl font-bold text-blue-700"> {/* Changed to solid color */}
                  Fresh Listings
                </h2>
              </div>
              <p className="text-gray-600 max-w-2xl mx-auto mb-8"> {/* Added bottom margin */}
                Explore our latest property additions. New opportunities added daily!
              </p>
            </div>
            
            {/* Property Cards Container with Height Control */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[400px]"> {/* Added min-height */}
              {recentProperties.map((property, index) => {
                const recency = getRecencyBadge(property);
                return (
                  <div key={property._id} className="group relative h-full"> {/* Added h-full */}
                    {/* Recency Badge */}
                    <div className={`absolute -top-2 -right-2 ${recency.color} text-white px-3 py-1 rounded-full text-xs font-bold z-20 shadow-lg`}>
                      {recency.text}
                    </div>
                    
                    {/* Highlight the first property */}
                    {index === 0 && (
                      <div className="absolute -top-2 -left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-bold z-20">
                        RECENT NEW
                      </div>
                    )}
                    
                    {/* Property Card Container */}
                    <div className="h-full transform group-hover:scale-102 transition-transform duration-300"> {/* Reduced scale */}
                      <PropertyCard property={property} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Button Section - Ensure it's visible */}
        <section className="m-auto max-w-lg py-8 px-6 relative z-20 bg-white"> {/* Added background and padding */}
          <Link
            href="/properties"
            className="group flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
          >
            View Complete Collection
            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </section>
      </>
    );
    
  } catch (error) {
    return (
      <section className="px-4 py-6">
        <div className="container-xl lg:container m-auto text-center">
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-red-600 mb-3">
              Temporary Unavailable
            </h2>
            <p className="text-gray-600 mb-4">
              We&apos;re experiencing high demand. Please check back in a few moments.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }
};

export default HomeProperties;
