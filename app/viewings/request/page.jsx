import mongoose from "mongoose";
import { notFound } from "next/navigation";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import { listingPublicFilter } from "@/config/listings";
import ViewingRequestForm from "@/components/ViewingRequestForm";

export const dynamic = "force-dynamic";

export default async function RequestViewingPage({ searchParams }) {
  const params = await searchParams;
  const propertyId = params?.propertyId;
  if (!mongoose.isValidObjectId(propertyId)) notFound();
  await connectDB();
  const property = await Property.findOne({ _id: propertyId, ...listingPublicFilter() }).select("name").lean();
  if (!property) notFound();
  return <main className="mx-auto max-w-xl px-4 py-12"><ViewingRequestForm propertyId={propertyId} propertyName={property.name} /></main>;
}
