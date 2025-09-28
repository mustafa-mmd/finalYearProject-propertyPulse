// 'use client';
// import { useState, useEffect } from "react";
// import PropertyCard from "@/components/PropertyCard";
// import Spinner from "./Spinner";
// import Pagination from "./Pagination";
// const Properties = () => {

//   const [properties,setProperties]=useState([]);
//   const [loading,setLoading]=useState(true);
//   const [page,setPage]=useState(1);
//   const [pageSize,setPageSize]=useState(6);
//   const [totalItems,setTotalItem]=useState(0);
// useEffect(()=>{
// const fetchProperties=async()=>{

//   try{

// const res=await fetch(`/api/prop?page=${page}&pageSize={pageSize}`);
// if(!res.ok){
//   throw new Error('Failed to fetch data');
// }
// const data=await res.json();
// setProperties(data.properties);
// setTotalItem(data.total);
//   }catch(err){
// console.log(err);
//   }finally{
//     setLoading(false);
//   }

// }

// fetchProperties();
// },[page,pageSize]);

// const handlePageChange = (newPage)=>{
// setPage(newPage);
// }

//   return loading ? (<Spinner />) : (
//     <section className="px-4 py-6">
//       <div className="container-xl lg:container m-auto px-4 py-6">
//        {properties.length===0?(
// <h1>No properties found</h1>
//        ):(
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {properties.map((property)=>(
//             <PropertyCard key={property._id} property={property}/>
//           ))}
//           </div>
//        )}
//         <Pagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={handlePageChange}/>
//            </div>
// </section>
//   )
// }

// export default Properties




'use client';
import { useState, useEffect } from "react";
import PropertyCard from "@/components/PropertyCard";
import Spinner from "./Spinner";
import Pagination from "./Pagination";

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [totalItems, setTotalItem] = useState(0);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        console.log(`🔄 Fetching page ${page} with pageSize ${pageSize}`);
        
        const res = await fetch(`/api/prop?page=${page}&pageSize=${pageSize}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const data = await res.json();
        console.log("📊 API Response Data:", data);
        console.log("🔢 Properties count:", data.properties?.length);
        console.log("📈 Total items:", data.total);
        
        setProperties(data.properties || []);
        setTotalItem(data.total || 0);
        
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [page, pageSize]);

  const handlePageChange = (newPage) => {
    console.log("🎯 Changing page to:", newPage);
    setPage(newPage);
  };

  return loading ? (
  <Spinner />
) : (
  <section className="px-4 py-6">
    <div className="container-xl lg:container m-auto px-4 py-6">
      {properties.length === 0 ? (
        <h1>No properties found</h1>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property._id} property={property} />
          ))}
        </div>
      )}
      
      {/* Pagination will now always show, even with one page */}
      <Pagination 
        page={page} 
        pageSize={pageSize} 
        totalItem={totalItems} 
        onPageChange={handlePageChange} 
      />
    </div>
  </section>
);
};

export default Properties;