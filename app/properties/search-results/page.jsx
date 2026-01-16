// 'use client'
// import { useState, useEffect } from "react"
// import { useSearchParams, useRouter } from "next/navigation"
// import PropertyCard from "@/components/PropertyCard"
// import Spinner from "@/components/Spinner"
// import PropertySearchForm from "@/components/PropertySearchForm"
// import Link from "next/link"

// const SearchResultspage = () => {
//   const searchParams = useSearchParams();
//   const router = useRouter();
//   const [properties, setProperties] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const location = decodeURIComponent(searchParams.get("location") || "");
//   const propertyType = decodeURIComponent(searchParams.get("propertyType") || "All");

//   useEffect(() => {
//     const fetchProperties = async () => {
//       try {
//         setLoading(true);
//         setError("");
        
//         const params = new URLSearchParams();
//         if (location) params.append("location", location);
//         if (propertyType && propertyType !== "All") params.append("propertyType", propertyType);

//         console.log("🌐 Calling API: /api/search?" + params.toString());
        
//         const res = await fetch(`/api/search?${params.toString()}`, {
//           cache: "no-store",
//         });

//         console.log("📨 API Response status:", res.status);
        
//         if (res.ok) {
//           const data = await res.json();
//           console.log("📊 API Response data:", data);
//           setProperties(data);
//         } else {
//           const errorData = await res.json().catch(() => ({ message: "Unknown error" }));
//           setError(errorData.message || "Failed to fetch properties");
//           setProperties([]);
//         }
//       } catch (err) {
//         console.error("❌ Search error:", err);
//         setError("Network error. Please try again.");
//         setProperties([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (location || propertyType !== "All") {
//       fetchProperties();
//     } else {
//       setLoading(false);
//       setProperties([]);
//     }
//   }, [location, propertyType]);

//   const handleSuggestionClick = (suggestedTerm) => {
//     const params = new URLSearchParams();
//     if (suggestedTerm) params.set("location", suggestedTerm);
//     if (propertyType && propertyType !== "All") params.set("propertyType", propertyType);
//     router.push(`/properties/search-results?${params.toString()}`);
//   };

//   return (
//     <>
//       <section className="bg-blue-700 py-4">
//         <div className="max-w-7xl mx-auto px-4 flex flex-col items-start sm:px-6 lg:px-8">
//           <PropertySearchForm />
//         </div>
//       </section>

//       {loading ? (
//         <Spinner loading={loading} />
//       ) : (
//         <section className="px-4 py-6">
//           <div className="container-xl lg:container m-auto px-4 py-6">
//             <div className="mb-6 p-4 bg-gray-100 rounded-lg">
//               <h2 className="text-lg font-semibold mb-2">Search Criteria:</h2>
//               <p><strong>Location:</strong> {location || "Any"}</p>
//               <p><strong>Property Type:</strong> {propertyType}</p>
//               {error && <p className="text-red-500 mt-2"><strong>Error:</strong> {error}</p>}
//             </div>
            
//             {properties.length === 0 ? (
//               <div className="text-center py-8">
//                 <h1 className="text-2xl font-bold mb-4">No Properties Found</h1>
//                 <p className="text-gray-600 mb-6">
//                   No properties found matching: <strong>{location || "Any location"}</strong>
//                 </p>
                
//                 <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
//                   <h3 className="text-lg font-semibold mb-3">Search Suggestions:</h3>
//                   <div className="flex flex-wrap gap-2 justify-center">
//                     <button
//                       onClick={() => handleSuggestionClick("peshawar")}
//                       className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
//                     >
//                       Try "peshawar" instead of "{location}"
//                     </button>
//                     <button
//                       onClick={() => handleSuggestionClick("kpk")}
//                       className="px-4 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors"
//                     >
//                       Try "kpk"
//                     </button>
//                     <button
//                       onClick={() => handleSuggestionClick("")}
//                       className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
//                     >
//                       Show All {propertyType !== "All" ? propertyType + "s" : "Properties"}
//                     </button>
//                   </div>
//                 </div>

//                 <p className="text-sm text-gray-500 mb-4">
//                   Or browse our <Link href="/properties" className="text-blue-600 hover:underline">all properties</Link>
//                 </p>
//               </div>
//             ) : (
//               <>
//                 <h1 className="text-2xl font-bold mb-6">
//                   Found {properties.length} property{properties.length !== 1 ? 'ies' : ''}
//                 </h1>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                   {properties.map((property) => (
//                     <PropertyCard key={property._id} property={property} />
//                   ))}
//                 </div>
//               </>
//             )}
//           </div>
//         </section>
//       )}
//     </>
//   );
// };

// export default SearchResultspage;





//new updated code after deployment
'use client'
import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import PropertyCard from "@/components/PropertyCard"
import Spinner from "@/components/Spinner"
import PropertySearchForm from "@/components/PropertySearchForm"
import Link from "next/link"
import { Search, MapPin, Building2, Home } from "lucide-react"

const SearchResultspage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState({ textSuggestions: [], propertySuggestions: [] });
  const [showSuggestions, setShowSuggestions] = useState(false);

  const location = decodeURIComponent(searchParams.get("location") || "");
  const propertyType = decodeURIComponent(searchParams.get("propertyType") || "All");

  // Fetch ALL properties for suggestion database
  useEffect(() => {
    const fetchAllProperties = async () => {
      try {
        const res = await fetch('/api/properties?limit=100', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setAllProperties(data);
        }
      } catch (err) {
        console.error("❌ Failed to fetch properties for suggestions:", err);
      }
    };
    
    fetchAllProperties();
  }, []);

  // Extract unique locations, property names, etc. for suggestions
  const suggestionDatabase = useMemo(() => {
    const data = {
      cities: new Set(),
      states: new Set(),
      propertyNames: new Set(),
      streets: new Set(),
      zipcodes: new Set(),
      allProperties: allProperties
    };
    
    allProperties.forEach(property => {
      if (property.location?.city) data.cities.add(property.location.city.toLowerCase());
      if (property.location?.state) data.states.add(property.location.state.toLowerCase());
      if (property.name) data.propertyNames.add(property.name.toLowerCase());
      if (property.location?.street) data.streets.add(property.location.street.toLowerCase());
      if (property.location?.zipcode) data.zipcodes.add(property.location.zipcode);
    });
    
    return {
      cities: Array.from(data.cities),
      states: Array.from(data.states),
      propertyNames: Array.from(data.propertyNames),
      streets: Array.from(data.streets),
      zipcodes: Array.from(data.zipcodes),
      allProperties: data.allProperties
    };
  }, [allProperties]);

  // Generate real-time suggestions based on input
  const generateSuggestions = useCallback((inputText) => {
    if (!inputText || inputText.trim().length < 2) {
      return { textSuggestions: [], propertySuggestions: [] };
    }
    
    const searchTerm = inputText.toLowerCase().trim();
    const textSuggestions = new Set();
    
    // 1. Match cities
    suggestionDatabase.cities.forEach(city => {
      if (city.includes(searchTerm) || searchTerm.includes(city)) {
        textSuggestions.add(city.charAt(0).toUpperCase() + city.slice(1));
      }
    });
    
    // 2. Match states
    suggestionDatabase.states.forEach(state => {
      if (state.includes(searchTerm) || searchTerm.includes(state)) {
        textSuggestions.add(state.toUpperCase());
      }
    });
    
    // 3. Match property names
    suggestionDatabase.propertyNames.forEach(name => {
      if (name.includes(searchTerm) || searchTerm.includes(name)) {
        textSuggestions.add(name.charAt(0).toUpperCase() + name.slice(1));
      }
    });
    
    // 4. Match streets
    suggestionDatabase.streets.forEach(street => {
      if (street.includes(searchTerm)) {
        textSuggestions.add(street.charAt(0).toUpperCase() + street.slice(1));
      }
    });
    
    // 5. Match zipcodes
    suggestionDatabase.zipcodes.forEach(zip => {
      if (zip.includes(searchTerm)) {
        textSuggestions.add(zip);
      }
    });
    
    // 6. Generate intelligent variations
    if (searchTerm.length >= 3) {
      // Common abbreviations - Updated to include Karachi
      const abbreviations = {
        'ny': 'new york',
        'la': 'los angeles',
        'sf': 'san francisco',
        'chi': 'chicago',
        'mia': 'miami',
        'kar': 'karachi',  // Changed from 'pwr': 'peshawar'
        'khi': 'karachi',  // Alternative abbreviation
        'isb': 'islamabad',
        'lhr': 'lahore'
      };
      
      Object.entries(abbreviations).forEach(([abbr, full]) => {
        if (searchTerm.includes(abbr) || abbr.includes(searchTerm)) {
          textSuggestions.add(full.charAt(0).toUpperCase() + full.slice(1));
        }
      });
      
      // Add "city" or "town" suffix
      textSuggestions.add(`${searchTerm} city`);
      textSuggestions.add(`${searchTerm} town`);
      
      // Remove common suffixes and search
      const suffixes = [' city', ' town', ' street', ' road', ' avenue', ' drive'];
      suffixes.forEach(suffix => {
        if (searchTerm.endsWith(suffix)) {
          const base = searchTerm.replace(suffix, '').trim();
          if (base.length >= 2) textSuggestions.add(base.charAt(0).toUpperCase() + base.slice(1));
        }
      });
    }
    
    // 7. Show properties that match the search term
    const matchingProperties = suggestionDatabase.allProperties.filter(property => {
      const searchFields = [
        property.name?.toLowerCase(),
        property.location?.city?.toLowerCase(),
        property.location?.state?.toLowerCase(),
        property.location?.street?.toLowerCase(),
        property.description?.toLowerCase(),
        property.type?.toLowerCase()
      ].filter(Boolean);
      
      return searchFields.some(field => field.includes(searchTerm));
    }).slice(0, 5); // Limit to 5 properties in suggestions
    
    return {
      textSuggestions: Array.from(textSuggestions).slice(0, 8),
      propertySuggestions: matchingProperties
    };
  }, [suggestionDatabase]);

  // Update suggestions when location changes
  useEffect(() => {
    if (location && location.length >= 2) {
      const newSuggestions = generateSuggestions(location);
      setSuggestions(newSuggestions);
    } else {
      setSuggestions({ textSuggestions: [], propertySuggestions: [] });
    }
  }, [location, generateSuggestions]);

  // Fetch properties for search results
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError("");
        
        const params = new URLSearchParams();
        if (location) params.append("location", location);
        if (propertyType && propertyType !== "All") params.append("propertyType", propertyType);

        const res = await fetch(`/api/search?${params.toString()}`, {
          cache: "no-store",
        });
        
        if (res.ok) {
          const data = await res.json();
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

  const handleSuggestionClick = useCallback((suggestedTerm) => {
    const params = new URLSearchParams();
    if (suggestedTerm) params.set("location", suggestedTerm);
    if (propertyType && propertyType !== "All") params.set("propertyType", propertyType);
    router.push(`/properties/search-results?${params.toString()}`);
    setShowSuggestions(false);
  }, [propertyType, router]);

  const handleInputFocus = () => {
    if (location && location.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 200);
  };

  // Extract unique locations from found properties
  const availableLocations = useMemo(() => {
    const locations = new Set();
    properties.forEach(property => {
      if (property.location?.city) locations.add(property.location.city);
      if (property.location?.state) locations.add(property.location.state);
    });
    return Array.from(locations);
  }, [properties]);

  return (
    <>
      <section className="bg-blue-700 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-start sm:px-6 lg:px-8">
          <div className="w-full relative">
            <PropertySearchForm 
              initialLocation={location}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            
            {/* Real-time Suggestions Dropdown */}
            {showSuggestions && suggestions.textSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="p-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Search size={16} />
                    <span>Suggestions for "{location}"</span>
                  </div>
                </div>
                
                {/* Text-based suggestions */}
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-gray-500 mb-2 px-2">LOCATIONS</h3>
                  {suggestions.textSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-md flex items-center gap-3 transition-colors group cursor-pointer"
                      onClick={() => handleSuggestionClick(suggestion)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSuggestionClick(suggestion);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Search for ${suggestion}`}
                    >
                      <MapPin size={18} className="text-gray-400 group-hover:text-blue-500" />
                      <div>
                        <div className="font-medium text-gray-800 group-hover:text-blue-600">
                          {suggestion}
                        </div>
                        <div className="text-xs text-gray-500">
                          {suggestion.toLowerCase().includes('city') ? 'City' : 
                           suggestion.toLowerCase().includes('town') ? 'Town' : 'Location'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Property suggestions */}
                {suggestions.propertySuggestions.length > 0 && (
                  <div className="p-2 border-t border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-500 mb-2 px-2">MATCHING PROPERTIES</h3>
                    {suggestions.propertySuggestions.map((property) => (
                      <div
                        key={property._id}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-md flex items-center gap-3 transition-colors group cursor-pointer"
                        onClick={() => handleSuggestionClick(property.location?.city || property.name)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSuggestionClick(property.location?.city || property.name);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Search for ${property.name}`}
                      >
                        <Building2 size={18} className="text-gray-400 group-hover:text-blue-500" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 group-hover:text-blue-600">
                            {property.name}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin size={12} />
                            {property.location?.city}, {property.location?.state}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-blue-600">
                          ${property.rates?.nightly || property.rates?.monthly || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {loading ? (
        <Spinner loading={loading} />
      ) : (
        <section className="px-4 py-6">
          <div className="container-xl lg:container m-auto px-4 py-6">
            {/* Search Summary */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <h2 className="text-lg font-semibold mb-2 text-blue-800">Search Results</h2>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-blue-600" />
                  <span><strong>Location:</strong> {location || "Anywhere"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Home size={18} className="text-blue-600" />
                  <span><strong>Type:</strong> {propertyType}</span>
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-600">
                    <span className="font-medium">Error:</span> {error}
                  </div>
                )}
              </div>
            </div>
            
            {/* Results Section */}
            {properties.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                  <Search size={48} className="text-gray-400" />
                </div>
                <h1 className="text-2xl font-bold mb-3">No Properties Found</h1>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  We couldn't find any properties matching <span className="font-semibold text-blue-600">"{location || 'your search'}"</span>
                </p>
                
                {/* Suggestions Panel */}
                {(suggestions.textSuggestions.length > 0 || availableLocations.length > 0) && (
                  <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 max-w-2xl mx-auto shadow-sm">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
                      <Search size={20} />
                      Try these instead:
                    </h3>
                    
                    {/* Text Suggestions */}
                    {suggestions.textSuggestions.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-600 mb-3">Similar Locations</h4>
                        <div className="flex flex-wrap gap-3">
                          {suggestions.textSuggestions.slice(0, 6).map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Available Locations from Database */}
                    {availableLocations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-3">Available in Our Database</h4>
                        <div className="flex flex-wrap gap-2">
                          {availableLocations.slice(0, 8).map((loc, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleSuggestionClick(loc)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors"
                            >
                              {loc}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Search Tips */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-600 mb-3">Search Tips</h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Try shorter or more general terms
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Check your spelling
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          Use just the city name without "city" or "town"
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {/* Alternative Actions */}
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => handleSuggestionClick("")}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    Show All Properties
                  </button>
                  <p className="text-sm text-gray-500">
                    Or <Link href="/properties" className="text-blue-600 hover:underline font-medium">browse all properties</Link>
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Results Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {properties.length} Property{properties.length !== 1 ? 'ies' : ''} Found
                    </h1>
                    <p className="text-gray-600 mt-1">
                      in <span className="font-semibold text-blue-600">{location || "all locations"}</span>
                    </p>
                  </div>
                  
                  {/* Quick Filters/Suggestions */}
                  {suggestions.textSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-gray-600 self-center">Related:</span>
                      {suggestions.textSuggestions.slice(0, 3).map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Properties Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <PropertyCard key={property._id} property={property} />
                  ))}
                </div>
                
                {/* More Suggestions Footer */}
                {suggestions.textSuggestions.length > 0 && (
                  <div className="mt-10 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <h3 className="text-lg font-semibold mb-4 text-blue-800">Looking for something else?</h3>
                    <div className="flex flex-wrap gap-3">
                      {suggestions.textSuggestions.slice(0, 5).map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-4 py-2.5 bg-white hover:bg-blue-50 text-blue-700 rounded-lg border border-blue-200 transition-all duration-200 hover:border-blue-300 hover:shadow"
                        >
                          Try "{suggestion}"
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
};

export default SearchResultspage;