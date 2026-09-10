import PropertySearchForm from "@/components/PropertySearchForm";
import Properties from "@/components/Properties";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Explore Properties | PropertyPulse",
  description: "Browse properties for rent, sale, and short stay holidays with real-time filters.",
};

const Propertypage = async ({ searchParams }) => {
  const params = await searchParams;
  const purpose = params?.purpose || "";

  return (
    <>
      <section className="bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-800 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Explore properties
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white">
              {purpose === "LONG_TERM_RENT"
                ? "Properties Available For Rent"
                : purpose === "SALE"
                ? "Properties Available For Sale"
                : purpose === "SHORT_TERM_RENT"
                ? "Short Stay & Holiday Listings"
                : "Search Every Available Property"}
            </h1>
          </div>
          <PropertySearchForm initialFilters={{ purpose }} />
        </div>
      </section>

      <Properties initialPurpose={purpose} />
    </>
  );
};

export default Propertypage;
