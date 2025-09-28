
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

//   // Common location suggestions
//   const locationSuggestions = [
//     "Peshawar",
//     "Islamabad", 
//     "Karachi",
//     "Lahore",
//     "KPK",
//     "Punjab"
//   ]

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
//             placeholder="Enter city, area, or landmark (e.g., Peshawar, KPK)"
//             className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
//             value={location}
//             onChange={(e) => setLocation(e.target.value)}
//             list="location-suggestions"
//           />
//           <datalist id="location-suggestions">
//             {locationSuggestions.map((suggestion, index) => (
//               <option key={index} value={suggestion} />
//             ))}
//           </datalist>
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
//            Tip: Try searching for cities like <strong>Peshawar</strong>,or with propterty titles
//         </p>
//       </div>
//     </div>
//   )
// }

// export default PropertySearchForm





'use client'
import { useState } from "react"
import { useRouter } from "next/navigation"

const PropertySearchForm = () => {
  const [location, setLocation] = useState("")
  const [propertyType, setPropertyType] = useState("All")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Trim and clean inputs
    const cleanedLocation = location.trim()
    const cleanedPropertyType = propertyType.trim()

    if (cleanedLocation === "" && cleanedPropertyType === "All") {
      router.push("/properties")
      setIsSubmitting(false)
      return
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
    
    // Reset submitting state after navigation
    setTimeout(() => setIsSubmitting(false), 1000)
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="mt-3 mx-auto max-w-2xl w-full flex flex-col md:flex-row items-center"
      >
        <div className="w-full md:w-3/5 md:pr-2 mb-4 md:mb-0">
          <label htmlFor="location" className="sr-only">Location</label>
          <input
            type="text"
            id="location"
            placeholder="Enter city, area, or property title"
            className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="w-full md:w-2/5 md:pl-2">
          <label htmlFor="property-type" className="sr-only">Property Type</label>
          <select
            id="property-type"
            className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300"
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
        <button
          type="submit"
          disabled={isSubmitting}
          className="md:ml-4 mt-4 md:mt-0 w-full md:w-auto px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </span>
          ) : (
            "Search"
          )}
        </button>
      </form>

      {/* Quick search tips */}
      <div className="mt-3 text-center">
        <p className="text-sm text-white opacity-80">
          💡 Tip: Try searching for cities or with property titles
        </p>
      </div>
    </div>
  )
}

export default PropertySearchForm