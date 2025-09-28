// 'use client';
// import Image from "next/image";
// import Link from "next/link";
// import { useSession } from "next-auth/react";
// import profileDefault from '@/assets/images/profile.png'
// import { useState, useEffect } from "react";
// import Spinner from "@/components/Spinner";
// import Property from "@/models/Property";
// import { toast } from "react-toastify";
// const ProfilePage = () => {
//   const {data:session}=useSession();
//   const profileImage=session?.user?.image;
//   const profileName=session?.user?.name;
//   const profileEmail=session?.user?.email;
//   const [properties,setProperties]=useState([]);
//   const [loading,setLoading]=useState(true);
//   useEffect(()=>{
// const fetchUserProperty=async(userId)=>{
//   if(!userId){

//   }
//   try{
// const res=fetch(`/api/prop/user/${userId}`);
// if(res.status===200){
//   const data=await res.json();
//   setProperties(data);
  
// }
//   }catch(err){
// console.log(err)
//   }finally{
//     setLoading(false)
//   }
// }
// //fetch user property when session is available
// if(session?.user?.id){
//   fetchUserProperty(session.user.id);
// }
//   },[session]);

//   const handleDeleteProperty=async(propertyId)=>{
//     const confirmed=window.confirm("Are you sure you want to delete this property");
//     if(!confirmed) return;
//     try{
//       const res=await fetch(`/api/prop/${propertyId}`,{method:'DELETE'});
//       if(res.status===200){
//         //remove the property from state
//         const updatedProperty=properties.filter((property)=>property._id !==propertyId);
//         setProperties(updatedProperty);
//         toast.success("property deleted")
//       }else{
//         toast.error("failed to delete property")
//       }

//     }catch(err){
//       console.log(err)
// toast.error("failed to delete property")
//     }
//   }
//   return(
//     <section className="bg-blue-50">
//       <div className="container m-auto py-24">
//         <div className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0">
//           <h1 className="text-3xl font-bold mb-4">Your Profile</h1>
//           <div className="flex flex-col md:flex-row">
//             <div className="md:w-1/4 mx-20 mt-10">
//               <div className="mb-4">
//                 <Image
//                   className="h-32 w-32 md:h-48 md:w-48 rounded-full mx-auto md:mx-0"
//                   src={profileImage || profileDefault}
//                   width={200}
//                   height={200}
//                   alt="User"
//                 />
//               </div>
//               <h2 className="text-2xl mb-4"><span className="font-bold block">Name: </span>{profileName}</h2>
//               <h2 className="text-2xl"><span className="font-bold block">Email: </span>{profileEmail}</h2>
//             </div>

//             <div className="md:w-3/4 md:pl-4">
//               <h2 className="text-xl font-semibold mb-4">Your Listings</h2>
//               {!loading && properties.length===0 && (
//                 <p>You have no property listing.</p>
//               )}
//               {loading ? (
//                 <Spinner loading={loading}/>
//               ):(
//                 properties.map((property)=>(

//               <div key={property._id} className="mb-10">
//                 <Link href={`/prop/${property._id}`}>
//                   <Image
//                     className="h-32 w-full rounded-md object-cover"
//                     src={property.images[0]}
//                     alt=""
//                     width={500}
//                     height={100}
//                     priority={true}
//                   />
//                 </Link>
//                 <div className="mt-2">
//                   <p className="text-lg font-semibold">{property.name}</p>
//                   <p className="text-gray-600">Address: {property.location.street} {property.location.city} {property.location.state}</p>
//                 </div>
//                 <div className="mt-2">
//                   <Link href={`/prop/${property._id}/edit`}
//                     className="bg-blue-500 text-white px-3 py-3 rounded-md mr-2 hover:bg-blue-600"
//                   >
//                     Edit
//                   </Link>
//                   <button
//                   onClick={()=>{handleDeleteProperty(property._id)}}
//                     className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
//                     type="button"
//                   >
//                     Delete
//                   </button>
//                 </div>
//               </div>
//                 ))
//               )}
              
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>



//   )
// }

// export default ProfilePage





'use client';
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import profileDefault from '@/assets/images/profile.png';
import { useState, useEffect } from "react";
import Spinner from "@/components/Spinner";
import { toast } from "react-toastify";

const ProfilePage = () => {
  const { data: session } = useSession();
  const profileImage = session?.user?.image;
  const profileName = session?.user?.name;
  const profileEmail = session?.user?.email;
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProperties = async (userId) => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        const res = await fetch(`/api/prop/user/${userId}`);
        console.log("API Response status:", res.status);
        
        if (res.status === 200) {
          const data = await res.json();
          setProperties(data);
        } else {
          console.error("Failed to fetch properties:", res.status);
          toast.error("Failed to load your properties");
        }
      } catch (err) {
        console.error("Error fetching properties:", err);
        toast.error("Error loading properties");
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchUserProperties(session.user.id);
    } else {
      setLoading(false);
    }
  }, [session]);

  const handleDeleteProperty = async (propertyId) => {
    const confirmed = window.confirm("Are you sure you want to delete this property?");
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/prop/${propertyId}`, { 
        method: 'DELETE' 
      });
      
      if (res.status === 200) {
        const updatedProperties = properties.filter((property) => property._id !== propertyId);
        setProperties(updatedProperties);
        toast.success("Property deleted successfully");
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to delete property");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete property");
    }
  };

  return (
    <section className="bg-blue-50 min-h-screen">
      <div className="container m-auto py-24">
        <div className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0">
          <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
          <div className="flex flex-col md:flex-row">
            {/* Profile Info Section */}
            <div className="md:w-1/4 mx-auto md:mx-20 mt-10 text-center md:text-left">
              <div className="mb-6">
                <Image
                  className="h-32 w-32 md:h-48 md:w-48 rounded-full mx-auto md:mx-0 border-4 border-blue-200"
                  src={profileImage || profileDefault}
                  width={200}
                  height={200}
                  alt="User Profile"
                  priority
                />
              </div>
              <h2 className="text-2xl mb-4">
                <span className="font-bold block text-gray-600">Name: </span>
                <span className="text-blue-800">{profileName || "Not available"}</span>
              </h2>
              <h2 className="text-2xl">
                <span className="font-bold block text-gray-600">Email: </span>
                <span className="text-blue-800">{profileEmail || "Not available"}</span>
              </h2>
            </div>

            {/* Properties Section */}
            <div className="md:w-3/4 md:pl-8 mt-8 md:mt-0">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Your Listings</h2>
              
              {loading ? (
                <div className="flex justify-center">
                  <Spinner loading={loading} />
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-lg mb-4">You have no property listings yet.</p>
                  <Link 
                    href="/properties/add" 
                    className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add Your First Property
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {properties.map((property) => (
                    <div key={property._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* ✅ FIXED: Removed outer Link wrapper */}
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Property Image with Link */}
                        <div className="md:w-1/3">
                          <Link href={`/prop/${property._id}`}>
                            <Image
                              className="h-48 w-full rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
                              src={property.images?.[0] || "/images/default-property.jpg"}
                              alt={property.name || "Property"}
                              width={400}
                              height={200}
                              priority={true}
                            />
                          </Link>
                        </div>
                        
                        {/* Property Details */}
                        <div className="md:w-2/3">
                          {/* Property Name as Link */}
                          <Link href={`/prop/${property._id}`}>
                            <p className="text-xl font-semibold text-blue-900 mb-2 hover:text-blue-700 cursor-pointer">
                              {property.name || "Unnamed Property"}
                            </p>
                          </Link>
                          
                          <p className="text-gray-600 mb-2">
                            <span className="font-medium">Address:</span> {property.location?.street} {property.location?.city} {property.location?.state}
                          </p>
                          <p className="text-gray-600 mb-4">
                            <span className="font-medium">Type:</span> {property.type} | 
                            <span className="font-medium"> Beds:</span> {property.beds} | 
                            <span className="font-medium"> Baths:</span> {property.baths}
                          </p>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-3">
                            <Link 
                              href={`/properties/${property._id}/edit`}
                              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                            >
                              Edit Property
                            </Link>
                            <button
                              onClick={() => handleDeleteProperty(property._id)}
                              className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
                              type="button"
                            >
                              Delete Property
                            </button>
                            <Link 
                              href={`/properties/${property._id}`}
                              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;