'use client'
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import PropertyCard from "@/components/PropertyCard"
import Spinner from "@/components/Spinner"
import PropertySearchForm from "@/components/PropertySearchForm"
import Link from "next/link"

const SearchResultspage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const location = decodeURIComponent(searchParams.get("location") || "");
  const propertyType = decodeURIComponent(searchParams.get("propertyType") || "All");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError("");
        
        const params = new URLSearchParams();
        if (location) params.append("location", location);
        if (propertyType && propertyType !== "All") params.append("propertyType", propertyType);

        console.log("🌐 Calling API: /api/search?" + params.toString());
        
        const res = await fetch(`/api/search?${params.toString()}`, {
          cache: "no-store",
        });

        console.log("📨 API Response status:", res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log("📊 API Response data:", data);
          setProperties(data);
        } else {
          const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
          setError(errorData.message || "Failed to fetch properties");
          setProperties([]);
        }
      } catch (err) {
        console.error("❌ Search error:", err);
        setError("Network error. Please try again.");
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    if (location || propertyType !== "All") {
      fetchProperties();
    } else {
      setLoading(false);
      setProperties([]);
    }
  }, [location, propertyType]);

  const handleSuggestionClick = (suggestedTerm) => {
    const params = new URLSearchParams();
    if (suggestedTerm) params.set("location", suggestedTerm);
    if (propertyType && propertyType !== "All") params.set("propertyType", propertyType);
    router.push(`/properties/search-results?${params.toString()}`);
  };

  return (
    <>
      <section className="bg-blue-700 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-start sm:px-6 lg:px-8">
          <PropertySearchForm />
        </div>
      </section>

      {loading ? (
        <Spinner loading={loading} />
      ) : (
        <section className="px-4 py-6">
          <div className="container-xl lg:container m-auto px-4 py-6">
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">Search Criteria:</h2>
              <p><strong>Location:</strong> {location || "Any"}</p>
              <p><strong>Property Type:</strong> {propertyType}</p>
              {error && <p className="text-red-500 mt-2"><strong>Error:</strong> {error}</p>}
            </div>
            
            {properties.length === 0 ? (
              <div className="text-center py-8">
                <h1 className="text-2xl font-bold mb-4">No Properties Found</h1>
                <p className="text-gray-600 mb-6">
                  No properties found matching: <strong>{location || "Any location"}</strong>
                </p>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-3">Search Suggestions:</h3>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => handleSuggestionClick("peshawar")}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      Try "peshawar" instead of "{location}"
                    </button>
                    <button
                      onClick={() => handleSuggestionClick("kpk")}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      Try "kpk"
                    </button>
                    <button
                      onClick={() => handleSuggestionClick("")}
                      className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                    >
                      Show All {propertyType !== "All" ? propertyType + "s" : "Properties"}
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                  Or browse our <Link href="/properties" className="text-blue-600 hover:underline">all properties</Link>
                </p>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-6">
                  Found {properties.length} property{properties.length !== 1 ? 'ies' : ''}
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <PropertyCard key={property._id} property={property} />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
};

export default SearchResultspage;