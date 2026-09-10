import Link from "next/link";
import mongoose from "mongoose";
import { redirect } from "next/navigation";
import connectDB from "@/config/database";
import Property from "@/models/Property";
import Lease from "@/models/Lease";
import Invoice from "@/models/Invoice";
import MaintenanceRequest from "@/models/MaintenanceRequest";
import { getActor } from "@/utils/authorization";

export const dynamic = "force-dynamic";

export default async function OwnerPortal() {
  const actor = await getActor();
  if (!actor) redirect("/api/auth/signin?callbackUrl=/owner");
  await connectDB();
  const actorId = new mongoose.Types.ObjectId(actor.id);
  const [properties, leases, receivables, maintenance] = await Promise.all([
    Property.countDocuments({ owner: actorId, deletedAt: { $exists: false } }),
    Lease.countDocuments({ landlordId: actorId, status: "ACTIVE" }),
    Invoice.aggregate([{ $match: { payeeId: actorId, status: { $in: ["ISSUED", "OVERDUE", "PARTIALLY_PAID"] } } }, { $group: { _id: null, total: { $sum: { $subtract: ["$total", "$amountPaid"] } } } }]),
    MaintenanceRequest.countDocuments({ ownerId: actorId, status: { $nin: ["CLOSED", "CANCELLED"] } }),
  ]);
  const cards = [["Properties", properties, "/profile"], ["Active leases", leases, "/leases"], ["Open maintenance", maintenance, "/maintenance"], ["Outstanding", `ZAR ${(receivables[0]?.total || 0).toLocaleString()}`, "/invoices"]];
  return <section className="mx-auto max-w-6xl px-4 py-10"><p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Owner portal</p><h1 className="mt-2 text-3xl font-bold">Portfolio overview</h1><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label, value, href]) => <Link key={label} href={href} className="rounded-2xl border bg-white p-6"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></Link>)}</div></section>;
}
