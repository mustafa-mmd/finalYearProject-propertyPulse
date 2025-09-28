
// 'use client';
// import { useState, useEffect } from "react";
// import { useSession } from "next-auth/react";
// import { FaBookmark } from "react-icons/fa";
// import { toast } from "react-toastify";

// const BookmarkButton = ({ property }) => {
//   const { data: session, status } = useSession();
//   const [isBookmarked, setIsBookmarked] = useState(false);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const checkBookmarkStatus = async () => {
//       if (!property?._id) {
//         setLoading(false);
//         return;
//       }

//       // Don't check bookmarks if user is not authenticated
//       if (status !== "authenticated") {
//         setIsBookmarked(false);
//         setLoading(false);
//         return;
//       }

//       try {
//         console.log("🔍 Checking bookmark for property:", property._id);
        
//         const response = await fetch(`/api/bookmarks?propertyId=${property._id}`);
        
//         if (!response.ok) {
//           console.error("❌ API response not OK:", response.status);
//           setIsBookmarked(false);
//           return;
//         }
        
//         const data = await response.json();
//         console.log("✅ Bookmark check response:", data);
//         setIsBookmarked(data.isBookmarked ?? false);
//       } catch (error) {
//         console.error("❌ Bookmark check error:", error);
//         setIsBookmarked(false);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (property?._id) {
//       checkBookmarkStatus();
//     }
//   }, [property?._id, status]);

//   const handleClick = async () => {
//     if (status !== "authenticated") {
//       toast.error("You need to sign in to bookmark a property");
//       return;
//     }

//     if (!property?._id) {
//       toast.error("Property information is missing");
//       return;
//     }

//     setLoading(true);
//     try {
//       console.log("📝 Toggling bookmark for property:", property._id);
      
//       const response = await fetch('/api/bookmarks', {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           propertyId: property._id,
//         }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || `HTTP ${response.status}`);
//       }

//       const data = await response.json();
//       toast.success(data.message);
//       setIsBookmarked(data.isBookmarked);
//     } catch (error) {
//       console.error("❌ Bookmark error:", error);
//       toast.error(error.message || "Failed to update bookmark");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) {
//     return (
//       <button
//         disabled
//         className="w-full py-2 px-4 rounded-full bg-gray-300 text-gray-500 font-bold flex items-center justify-center"
//       >
//         <FaBookmark className="mr-2" />
//         Loading...
//       </button>
//     );
//   }

//   return (
//     <button
//       onClick={handleClick}
//       className={`w-full py-2 px-4 rounded-full flex items-center justify-center font-bold transition-colors ${
//         isBookmarked
//           ? "bg-red-500 hover:bg-red-600 text-white"
//           : "bg-blue-500 hover:bg-blue-600 text-white"
//       }`}
//       disabled={loading}
//     >
//       <FaBookmark className="mr-2" />
//       {isBookmarked ? "Remove Bookmark" : "Bookmark Property"}
//     </button>
//   );
// };

// export default BookmarkButton;




'use client';
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FaBookmark } from "react-icons/fa";
import { toast } from "react-toastify";

const BookmarkButton = ({ property }) => {
  const { data: session, status } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!property?._id) {
        setLoading(false);
        return;
      }

      if (status !== "authenticated") {
        setIsBookmarked(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/bookmarks?propertyId=${property._id}`);
        
        if (response.ok) {
          const data = await response.json();
          setIsBookmarked(data.isBookmarked);
        }
      } catch (error) {
        console.error("Error checking bookmark status:", error);
        setIsBookmarked(false);
      } finally {
        setLoading(false);
      }
    };

    checkBookmarkStatus();
  }, [property?._id, status]);

  const handleClick = async () => {
    if (status !== "authenticated") {
      toast.error("You need to sign in to bookmark a property");
      return;
    }

    if (!property?._id) return;

    setLoading(true);
    try {
      const response = await fetch('/api/bookmarks', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: property._id }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        setIsBookmarked(data.isBookmarked);
      } else {
        throw new Error('Failed to update bookmark');
      }
    } catch (error) {
      console.error("Bookmark error:", error);
      toast.error("Failed to update bookmark");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className="w-full py-3 px-4 rounded-full bg-gray-300 text-gray-500 font-bold flex items-center justify-center"
      >
        <FaBookmark className="mr-2" />
        Loading...
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full py-3 px-4 rounded-full flex items-center justify-center font-bold transition-colors ${
        isBookmarked
          ? "bg-red-500 hover:bg-red-600 text-white"
          : "bg-blue-500 hover:bg-blue-600 text-white"
      }`}
      disabled={loading}
    >
      <FaBookmark className="mr-2" />
      {isBookmarked ? "Remove Bookmark" : "Bookmark Property"}
    </button>
  );
};

export default BookmarkButton;