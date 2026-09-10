import { redirect } from "next/navigation";
import connectDB from "@/config/database";
import Commission from "@/models/Commission";
import Reservation from "@/models/Reservation";
import SaleTransaction from "@/models/SaleTransaction";
import SaleOperations from "@/components/SaleOperations";
import { getActor } from "@/utils/authorization";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sales transactions", description: "Manage property sale milestones, reservations, commissions and documents." };

export default async function SalesPage() {
  const actor = await getActor();
  if (!actor) redirect("/api/auth/signin?callbackUrl=/sales");
  await connectDB();
  const canReview = actor.permissions.includes("properties.review");
  const canVerifyFinance = actor.permissions.includes("payments.read");
  const filter = canReview || canVerifyFinance ? {} : { $or: [{ buyerId: actor.id }, { sellerId: actor.id }] };
  const sales = await SaleTransaction.find(filter).populate("propertyId", "name listingReference").sort({ createdAt: -1 }).limit(250).lean();
  const saleIds = sales.map((sale) => sale._id);
  const [reservations, commissions] = await Promise.all([
    Reservation.find({ saleTransactionId: { $in: saleIds } }).lean(),
    Commission.find({ saleTransactionId: { $in: saleIds } }).populate("agentId", "name email").sort({ createdAt: -1 }).lean(),
  ]);
  const reservationBySale = new Map(reservations.map((item) => [item.saleTransactionId.toString(), item]));
  const commissionsBySale = new Map();
  for (const item of commissions) { const key = item.saleTransactionId.toString(); commissionsBySale.set(key, [...(commissionsBySale.get(key) || []), item]); }
  return <main className="min-h-screen bg-slate-50 py-10"><section className="mx-auto max-w-7xl px-4"><div className="rounded-3xl bg-slate-950 p-7 text-white"><p className="text-sm font-semibold text-blue-300">Property sales</p><h1 className="mt-2 text-3xl font-bold">Sales transactions</h1><p className="mt-2 max-w-3xl text-slate-300">Coordinate reservation evidence, due diligence, financing, conveyancing, commissions and private documents. Property transfer and regulated funds remain with licensed external professionals.</p></div><div className="mt-6 space-y-5">{sales.map((sale) => { const id = sale._id.toString(); const reservation = reservationBySale.get(id); const saleData = { id, status: sale.status, currency: sale.currency, purchasePrice: Number(sale.purchasePrice), milestones: sale.milestones.map((item) => ({ id: item._id.toString(), label: item.label, status: item.status })) }; const reservationData = reservation ? { status: reservation.status, currency: reservation.currency, depositAmount: Number(reservation.depositAmount) } : null; const commissionData = (commissionsBySale.get(id) || []).map((item) => ({ id: item._id.toString(), agent: item.agentId?.name || item.agentId?.email || "Agent", currency: item.currency, amount: Number(item.amount), basis: item.basis, status: item.status })); const isSeller = sale.sellerId.toString() === actor.id; const isBuyer = sale.buyerId.toString() === actor.id; return <article key={id} className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-bold">{sale.propertyId?.name || "Property sale"}</h2><p className="mt-1 text-lg font-bold text-blue-700">{sale.currency} {Number(sale.purchasePrice).toLocaleString()}</p><p className="mt-1 font-mono text-xs text-slate-400">{sale.propertyId?.listingReference}</p></div><span className="h-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{sale.status.replaceAll("_", " ")}</span></div><SaleOperations sale={saleData} reservation={reservationData} commissions={commissionData} isSeller={isSeller} canVerifyFinance={canVerifyFinance} canReview={canReview} canCollaborate={canReview || isSeller || isBuyer} /></article>; })}{!sales.length && <p className="rounded-2xl border border-dashed bg-white p-8 text-slate-500">No active sale transactions.</p>}</div></section></main>;
}
