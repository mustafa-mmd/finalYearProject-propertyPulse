import { redirect } from "next/navigation";
import connectDB from "@/config/database";
import SavedSearch from "@/models/SavedSearch";
import { getActor } from "@/utils/authorization";
import SavedSearchManager from "@/components/SavedSearchManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Saved searches | PropertyPulse" };

export default async function SavedSearchesPage() {
  const actor = await getActor();
  if (!actor) redirect("/api/auth/signin?callbackUrl=/searches");
  await connectDB();
  const items = await SavedSearch.find({ userId: actor.id, deletedAt: { $exists: false } }).sort({ createdAt: -1 }).lean();
  const serializable = items.map((item) => ({ ...item, _id: item._id.toString(), userId: item.userId.toString(), createdAt: item.createdAt?.toISOString(), updatedAt: item.updatedAt?.toISOString(), lastRunAt: item.lastRunAt?.toISOString() }));
  return <main className="min-h-screen bg-slate-50 px-4 py-12"><div className="mx-auto max-w-5xl"><p className="text-sm font-bold uppercase tracking-wider text-blue-600">Discovery tools</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Saved searches and alerts</h1><p className="mb-8 mt-2 text-slate-600">Return to complex searches instantly and control matching-property alerts.</p><SavedSearchManager initialItems={serializable} /></div></main>;
}
