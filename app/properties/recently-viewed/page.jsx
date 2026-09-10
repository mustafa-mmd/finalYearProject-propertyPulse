import { redirect } from "next/navigation";
import connectDB from "@/config/database";
import RecentlyViewedProperty from "@/models/RecentlyViewedProperty";
import Property from "@/models/Property";
import PropertyCard from "@/components/PropertyCard";
import { listingPublicFilter } from "@/config/listings";
import { getActor } from "@/utils/authorization";

export const dynamic = "force-dynamic";
export default async function RecentlyViewedPage() {
  const actor = await getActor();
  if (!actor) redirect("/api/auth/signin?callbackUrl=/properties/recently-viewed");
  await connectDB();
  const rows = await RecentlyViewedProperty.find({ userId: actor.id }).sort({ viewedAt: -1 }).limit(24).lean();
  const found = await Property.find({ _id: { $in: rows.map((row) => row.propertyId) }, ...listingPublicFilter() }).lean();
  const byId = new Map(found.map((property) => [property._id.toString(), property]));
  const properties = rows.map((row) => byId.get(row.propertyId.toString())).filter(Boolean);
  return <main className="min-h-screen bg-slate-50 px-4 py-12"><div className="mx-auto max-w-7xl"><h1 className="text-3xl font-bold">Recently viewed</h1><p className="mt-2 text-slate-600">Your property history is retained for 90 days.</p>{properties.length ? <div className="mt-8 grid gap-7 md:grid-cols-2 xl:grid-cols-3">{properties.map((property) => <PropertyCard key={property._id.toString()} property={property} />)}</div> : <div className="mt-8 rounded-2xl border border-dashed bg-white p-12 text-center text-slate-600">Properties you view will appear here.</div>}</div></main>;
}
