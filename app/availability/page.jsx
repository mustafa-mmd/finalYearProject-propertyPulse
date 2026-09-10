import { redirect } from "next/navigation";
import AvailabilityManager from "@/components/AvailabilityManager";
import Property from "@/models/Property";
import { getActor } from "@/utils/authorization";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const actor = await getActor();
  if (!actor) redirect("/api/auth/signin?callbackUrl=/availability");
  const properties = await Property.find({ owner: actor.id, listingPurpose: "SHORT_TERM_RENT", deletedAt: { $exists: false } })
    .select("name listingReference")
    .sort({ createdAt: -1 })
    .lean();
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-sm font-semibold text-blue-700">Short-term rentals</p>
      <h1 className="mt-1 text-3xl font-bold">Availability calendar</h1>
      <p className="mt-2 text-slate-600">Block owner stays, maintenance periods and reservations received from external channels.</p>
      <div className="mt-6 rounded-2xl border bg-white p-6">
        <AvailabilityManager properties={properties.map((property) => ({ id: property._id.toString(), name: `${property.name} (${property.listingReference})` }))} />
      </div>
    </section>
  );
}
