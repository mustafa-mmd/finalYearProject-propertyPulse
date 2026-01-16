

// 'use client'
// import { useState } from "react"
// import { useRouter } from "next/navigation"

// const PropertySearchForm = () => {
//   const [location, setLocation] = useState("")
//   const [propertyType, setPropertyType] = useState("All")
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const router = useRouter()

//   const handleSubmit = (e) => {
//     e.preventDefault()
//     setIsSubmitting(true)

//     // Trim and clean inputs
//     const cleanedLocation = location.trim()
//     const cleanedPropertyType = propertyType.trim()

//     if (cleanedLocation === "" && cleanedPropertyType === "All") {
//       router.push("/properties")
//       setIsSubmitting(false)
//       return
//     }

//     // Build query string
//     const params = new URLSearchParams()
//     if (cleanedLocation !== "") {
//       params.set("location", cleanedLocation)
//     }
//     if (cleanedPropertyType !== "All") {
//       params.set("propertyType", cleanedPropertyType)
//     }

//     router.push(`/properties/search-results?${params.toString()}`)
    
//     // Reset submitting state after navigation
//     setTimeout(() => setIsSubmitting(false), 1000)
//   }

//   return (
//     <div className="w-full">
//       <form
//         onSubmit={handleSubmit}
//         className="mt-3 mx-auto max-w-2xl w-full flex flex-col md:flex-row items-center"
//       >
//         <div className="w-full md:w-3/5 md:pr-2 mb-4 md:mb-0">
//           <label htmlFor="location" className="sr-only">Location</label>
//           <input
//             type="text"
//             id="location"
//             placeholder="Enter city, area, or property title"
//             className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
//             value={location}
//             onChange={(e) => setLocation(e.target.value)}
//           />
//         </div>
//         <div className="w-full md:w-2/5 md:pl-2">
//           <label htmlFor="property-type" className="sr-only">Property Type</label>
//           <select
//             id="property-type"
//             className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
//             value={propertyType}
//             onChange={(e) => setPropertyType(e.target.value)}
//           >
//             <option value="All">All Property Types</option>
//             <option value="Apartment">Apartment</option>
//             <option value="Studio">Studio</option>
//             <option value="Condo">Condo</option>
//             <option value="House">House</option>
//             <option value="Cabin Or Cottage">Cabin or Cottage</option>
//             <option value="Loft">Loft</option>
//             <option value="Room">Room</option>
//             <option value="Other">Other</option>
//           </select>
//         </div>
//         <button
//           type="submit"
//           disabled={isSubmitting}
//           className="md:ml-4 mt-4 md:mt-0 w-full md:w-auto px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//         >
//           {isSubmitting ? (
//             <span className="flex items-center">
//               <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//               </svg>
//               Searching...
//             </span>
//           ) : (
//             "Search"
//           )}
//         </button>
//       </form>

//       {/* Quick search tips */}
//       <div className="mt-3 text-center">
//         <p className="text-sm text-white opacity-80">
//           💡 Tip: Try searching for cities or with property titles
//         </p>
//       </div>
//     </div>
//   )
// }

// export default PropertySearchForm


//after deploying
'use client'
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"

const PropertySearchForm = () => {
  const [location, setLocation] = useState("")
  const [propertyType, setPropertyType] = useState("All")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const router = useRouter()
  const inputRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (err) {
        console.error("Error parsing recent searches:", err)
        setRecentSearches([])
      }
    }
  }, [])

  // Save search to recent searches
  const saveToRecentSearches = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return
    
    const updated = [
      searchTerm.trim(),
      ...recentSearches.filter(s => s.toLowerCase() !== searchTerm.trim().toLowerCase())
    ].slice(0, 5) // Keep only 5 most recent
    
    setRecentSearches(updated)
    try {
      localStorage.setItem('recentSearches', JSON.stringify(updated))
    } catch (err) {
      console.error("Error saving to localStorage:", err)
    }
  }, [recentSearches])

  // Fetch suggestions from API with debouncing
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (location.length < 2) {
        setSuggestions([])
        return
      }

      setIsLoadingSuggestions(true)
      try {
        const res = await fetch(`/api/locations?q=${encodeURIComponent(location)}`)
        if (res.ok) {
          const data = await res.json()
          // Filter and rank suggestions
          const filtered = data
            .filter(loc => 
              loc.toLowerCase().includes(location.toLowerCase()) ||
              location.toLowerCase().includes(loc.toLowerCase())
            )
            .slice(0, 8) // Limit to 8 suggestions
          setSuggestions(filtered)
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err)
        setSuggestions([])
      } finally {
        setIsLoadingSuggestions(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [location])

  // Handle clicks outside suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current && 
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setShowSuggestions(false)

    // Trim and clean inputs
    const cleanedLocation = location.trim()
    const cleanedPropertyType = propertyType.trim()

    // Save to recent searches
    if (cleanedLocation) {
      saveToRecentSearches(cleanedLocation)
    }

    // Build query string
    const params = new URLSearchParams()
    if (cleanedLocation !== "") {
      params.set("location", cleanedLocation)
    }
    if (cleanedPropertyType !== "All") {
      params.set("propertyType", cleanedPropertyType)
    }

    router.push(`/properties/search-results?${params.toString()}`)
    
    // Reset submitting state
    setTimeout(() => setIsSubmitting(false), 1000)
  }

  const handleSuggestionClick = useCallback((suggestion) => {
    setLocation(suggestion)
    setShowSuggestions(false)
    
    // Save to recent searches
    saveToRecentSearches(suggestion)
    
    // Submit with suggestion
    const params = new URLSearchParams()
    params.set("location", suggestion)
    if (propertyType !== "All") params.set("propertyType", propertyType)
    
    router.push(`/properties/search-results?${params.toString()}`)
  }, [propertyType, router, saveToRecentSearches])

  const handleClearInput = () => {
    setLocation("")
    setSuggestions([])
    inputRef.current?.focus()
  }

  const handleQuickSearch = useCallback((searchTerm) => {
    setLocation(searchTerm)
    saveToRecentSearches(searchTerm)
    
    const params = new URLSearchParams()
    params.set("location", searchTerm)
    if (propertyType !== "All") params.set("propertyType", propertyType)
    
    router.push(`/properties/search-results?${params.toString()}`)
  }, [propertyType, router, saveToRecentSearches])

  const removeRecentSearch = useCallback((searchToRemove, e) => {
    e.stopPropagation()
    e.preventDefault()
    const updated = recentSearches.filter(s => s !== searchToRemove)
    setRecentSearches(updated)
    try {
      localStorage.setItem('recentSearches', JSON.stringify(updated))
    } catch (err) {
      console.error("Error updating localStorage:", err)
    }
  }, [recentSearches])

  return (
    <div className="w-full relative">
      <form
        onSubmit={handleSubmit}
        className="mt-3 mx-auto max-w-2xl w-full flex flex-col md:flex-row items-center"
      >
        {/* Location Input with Autocomplete */}
        <div className="w-full md:w-3/5 md:pr-2 mb-4 md:mb-0 relative">
          <label htmlFor="location" className="sr-only">Location</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">📍</span>
            </div>
            <input
              ref={inputRef}
              type="text"
              id="location"
              placeholder="Enter city, area, or property title"
              className="w-full pl-10 pr-10 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                if (e.target.value.length >= 2) {
                  setShowSuggestions(true)
                }
              }}
              onFocus={() => {
                if (location.length >= 2 || recentSearches.length > 0) {
                  setShowSuggestions(true)
                }
              }}
              autoComplete="off"
            />
            
            {/* Clear button */}
            {location && (
              <button
                type="button"
                onClick={handleClearInput}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label="Clear search"
              >
                <span className="text-gray-400 hover:text-gray-600 text-xl">&times;</span>
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto"
            >
              {/* Loading State */}
              {isLoadingSuggestions && (
                <div className="p-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-1">Finding suggestions...</p>
                </div>
              )}

              {/* Recent Searches */}
              {!isLoadingSuggestions && recentSearches.length > 0 && (
                <div className="p-2 border-b border-gray-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                    Recent Searches
                  </h3>
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className="w-full text-left px-4 py-2 hover:bg-blue-50 rounded flex items-center justify-between group cursor-pointer"
                      onClick={() => handleSuggestionClick(search)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSuggestionClick(search)
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Search for ${search}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1 bg-gray-100 rounded">
                          <span className="text-gray-500">🔍</span>
                        </div>
                        <span className="text-gray-700 group-hover:text-blue-600">{search}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => removeRecentSearch(search, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                        aria-label={`Remove ${search} from recent searches`}
                      >
                        <span className="text-gray-400 text-lg">&times;</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Location Suggestions */}
              {!isLoadingSuggestions && suggestions.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                    Matching Locations
                  </h3>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded flex items-center gap-3 group cursor-pointer"
                      onClick={() => handleSuggestionClick(suggestion)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleSuggestionClick(suggestion)
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Search for ${suggestion}`}
                    >
                      <span className="text-gray-400 group-hover:text-blue-500">📍</span>
                      <div>
                        <div className="font-medium text-gray-800 group-hover:text-blue-600">
                          {suggestion}
                        </div>
                        <div className="text-xs text-gray-500">
                          {suggestion.includes(' ') ? 'Multi-word location' : 'City'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Suggestions */}
              {!isLoadingSuggestions && suggestions.length === 0 && location.length >= 2 && (
                <div className="p-4 text-center">
                  <span className="text-3xl text-gray-300 mx-auto mb-2">🔍</span>
                  <p className="text-gray-600">No locations found for "{location}"</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Try different spelling or broader terms
                  </p>
                </div>
              )}

              {/* Search Button for Current Input */}
              {location.length >= 2 && (
                <div className="p-2 border-t border-gray-100 bg-gray-50">
                  <div
                    className="w-full text-left px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center justify-between group cursor-pointer"
                    onClick={() => handleSuggestionClick(location)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSuggestionClick(location)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Search for ${location}`}
                  >
                    <div className="flex items-center gap-3">
                      <span>🔍</span>
                      <div>
                        <div className="font-medium">Search for "{location}"</div>
                        <div className="text-xs opacity-90">
                          {propertyType === 'All' ? 'All property types' : propertyType}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm opacity-90">Press Enter ↵</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Property Type Select */}
        <div className="w-full md:w-2/5 md:pl-2">
          <label htmlFor="property-type" className="sr-only">Property Type</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🏠</span>
            </div>
            <select
              id="property-type"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 appearance-none"
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
            >
              <option value="All">All Property Types</option>
              <option value="Apartment">Apartment</option>
              <option value="Studio">Studio</option>
              <option value="Condo">Condo</option>
              <option value="House">House</option>
              <option value="Cabin Or Cottage">Cabin or Cottage</option>
              <option value="Loft">Loft</option>
              <option value="Room">Room</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="md:ml-4 mt-4 md:mt-0 w-full md:w-auto px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[120px]"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Searching...
            </span>
          ) : (
            <span className="flex items-center">
              <span className="mr-2">🔍</span>
              Search
            </span>
          )}
        </button>
      </form>

      {/* Quick search tips */}
      <div className="mt-4 text-center">
        <div className="flex flex-wrap justify-center gap-3">
          <span className="text-sm text-white opacity-80 font-medium">Popular searches:</span>
          <button
            type="button"
            onClick={() => handleQuickSearch("New York")}
            className="text-sm text-white opacity-90 hover:opacity-100 hover:underline transition-opacity"
          >
            New York
          </button>
          <button
            type="button"
            onClick={() => handleQuickSearch("Los Angeles")}
            className="text-sm text-white opacity-90 hover:opacity-100 hover:underline transition-opacity"
          >
            Los Angeles
          </button>
          <button
            type="button"
            onClick={() => handleQuickSearch("Karachi")}
            className="text-sm text-white opacity-90 hover:opacity-100 hover:underline transition-opacity"
          >
            Karachi
          </button>
          <button
            type="button"
            onClick={() => handleQuickSearch("Islamabad")}
            className="text-sm text-white opacity-90 hover:opacity-100 hover:underline transition-opacity"
          >
            Islamabad
          </button>
        </div>
        <p className="text-xs text-white opacity-70 mt-2">
          💡 Tip: Type 2+ letters for instant suggestions
        </p>
      </div>
    </div>
  )
}

export default PropertySearchForm