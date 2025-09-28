"use client";
import { useState, useEffect } from "react";
import PropertyCard from "@/components/PropertyCard";
import Spinner from "@/components/Spinner";
import { toast } from "react-toastify";

const SavedPropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedProperties = async () => {
      try {
        setLoading(true);
        console.log(" Starting to fetch saved properties...");
        
        const res = await fetch("/api/bookmarks");
        
        console.log(" API Response Status:", res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log(" Data received from API:", data);
          
          // Ensure data is an array
          const propertiesArray = Array.isArray(data) ? data : [];
          console.log(" Processed properties array length:", propertiesArray.length);
          
          setProperties(propertiesArray);
        } else {
          console.error(" API returned error status:", res.status);
          toast.error('Failed to fetch saved properties');
          setProperties([]);
        }
      } catch (error) {
        console.error(" Error fetching saved properties:", error);
        toast.error('Failed to fetch saved properties');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedProperties();
  }, []);

  console.log(" Current properties state:", properties);
  console.log(" Properties array length:", properties.length);
  console.log(" Loading state:", loading);

  if (loading) {
    return <Spinner loading={loading} />;
  }

  return (
    <section className="px-4 py-6">
      <div className="container-xl lg:container m-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-8">Saved Properties</h1>
        
        {properties.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-gray-600 mb-4">No saved properties found.</p>
            <p className="text-gray-500">Bookmark some properties to see them here!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SavedPropertiesPage;