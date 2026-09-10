import { redirect } from "next/navigation";
import connectDB from "@/config/database";
import PropertyCollection from "@/models/PropertyCollection";
import Property from "@/models/Property";
import { listingPublicFilter } from "@/config/listings";
import { getActor } from "@/utils/authorization";
import ComparePropertiesClient from "@/components/ComparePropertiesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Compare Properties — Luxury Decision Workspace | PropertyPulse" };

export default async function ComparePropertiesPage() {
  const actor = await getActor();
  if (!actor) redirect("/auth/signin?callbackUrl=/properties/compare");

  await connectDB();
  const collection = await PropertyCollection.findOne({
    userId: actor.id,
    kind: "COMPARE",
    deletedAt: { $exists: false },
  }).lean();

  const [rawProperties, sampleProperties] = await Promise.all([
    collection
      ? Property.find({
          _id: { $in: collection.propertyIds },
          deletedAt: { $exists: false },
        }).lean()
      : [],
    Property.find({
      deletedAt: { $exists: false },
    })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(30)
      .lean(),
  ]);

  const properties = JSON.parse(JSON.stringify(rawProperties));
  const suggestions = JSON.parse(JSON.stringify(sampleProperties));

  return (
    <main className="min-h-screen bg-slate-900/5 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Hero Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl ring-1 ring-white/10">
          <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-400/20 px-3.5 py-1 text-xs font-bold text-blue-300">
                <span>⚡ Decision Workspace</span>
                <span className="h-1 w-1 rounded-full bg-blue-400" />
                <span>Side-by-Side Comparison</span>
              </div>
              <h1 className="mt-3 text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Property Comparison Matrix
              </h1>
              <p className="mt-2 text-sm text-slate-300 max-w-2xl">
                Compare pricing tiers, floor plans, rates, amenities, and location metrics side-by-side with full technical accuracy.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 text-center border border-white/10 min-w-[110px]">
                <p className="text-2xl font-black text-white">{properties.length}</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Compared</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Comparison Client Component */}
        <ComparePropertiesClient initialProperties={properties} availableSuggestions={suggestions} />
      </div>
    </main>
  );
}
