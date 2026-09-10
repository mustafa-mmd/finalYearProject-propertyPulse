import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import { queryProperty } from "@/utils/propertyQueries";
import { getActor } from "@/utils/authorization";
import PropertyHeaderImage from "@/components/PropertyHeaderImage";
import PropertyDetails from "@/components/PropertyDetails";
import BookmarkButton from "@/components/BookmarkButton";
import ShareButton from "@/components/ShareButton";
import PropertyContactForm from "@/components/PropertyContactForm";
import CompareButton from "@/components/CompareButton";
import RecentlyViewedRecorder from "@/components/RecentlyViewedRecorder";

export const dynamic = "force-dynamic";

export default async function PropertyPage({ params }) {
  const { id } = await params;
  const actor = await getActor();
  const property = await queryProperty(id, {
    actorId: actor?.id,
    canReview: actor?.permissions?.includes("properties.review") || false,
  });
  if (!property) notFound();

  return (
    <>
      <RecentlyViewedRecorder propertyId={property._id.toString()} />

      {/* Full Airbnb-style gallery hero — passes all images + property metadata */}
      <PropertyHeaderImage
        images={property.images || []}
        property={property}
      />

      <section>
        <div className="container m-auto px-6 py-6">
          <Link href="/properties" className="flex items-center text-blue-600 hover:text-blue-700">
            <FaArrowLeft className="mr-2" /> Back to properties
          </Link>
        </div>
      </section>

      <section className="bg-blue-50">
        <div className="container m-auto px-6 py-10">
          <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-70/30">
            <PropertyDetails property={property} />
            <aside className="space-y-4">
              <BookmarkButton property={property} />
              <CompareButton propertyId={property._id.toString()} />
              <ShareButton property={property} />
              <PropertyContactForm property={property} />
            </aside>
          </div>
        </div>
      </section>
      {/* PropertyImages removed — gallery is now in the hero above */}
    </>
  );
}
