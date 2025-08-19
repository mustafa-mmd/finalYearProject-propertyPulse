'use client';
import { useEffect, useState } from "react"; 
import { useParams } from "next/navigation"; 
import { getProperty } from "@/utils/requests";
import PropertyHeaderImage from "@/components/PropertyHeaderImage";
import Link from "next/link";
import PropertyDetails from "@/components/PropertyDetails";
import PropertyImages from "@/components/PropertyImages";
import {FaArrowLeft} from "react-icons/fa";
import Spinner from "@/components/Spinner";
import BookmarkButton from "@/components/BookmarkButton";
import ShareButton from "@/components/ShareButton";
import PropertyContactForm from "@/components/PropertyContactForm";
const PropertyIdPage = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperty = async () => {
      const propertyData = await getProperty(id);
      if (propertyData) {
        setProperty(propertyData);
      } else {
        console.error('Property not found');
      }
      setLoading(false);
    };
    fetchProperty();
  }, [id]);

  if (!property && loading) {
    return <h1 className="text-center text-2xl font-bold mt-10">Property Not Found</h1>; 
  }

  return (
    <>
    {loading && <Spinner loading={loading}/>}
      {!loading && property && (
        <>
          <PropertyHeaderImage image={property.images[0]} />

          <section>
            <div className="container m-auto py-6 px-6">
              <Link
                href="/properties"
                className="text-blue-500 hover:text-blue-600 flex items-center"
              >
                <FaArrowLeft className="f mr-2"></FaArrowLeft> Back to Properties
              </Link>
            </div>
          </section>

          <section className="bg-blue-50">
            <div className="container m-auto py-10 px-6">
              <div className="grid grid-cols-1 md:grid-cols-70/30 w-full gap-6">
                
<PropertyDetails property={property}/>
                
                <aside className="space-y-4">       
                 
                 <BookmarkButton property={property}  />

                 <ShareButton property={property}/>

                  <PropertyContactForm property={property}/>
                  
                </aside>
              </div>
            </div>
          </section>
          <PropertyImages images={property.images}/>
        </>
      )}
    </>
  );
};

export default PropertyIdPage;
