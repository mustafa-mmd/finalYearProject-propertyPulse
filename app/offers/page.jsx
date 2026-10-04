import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import connectDB from "@/config/database";
import Offer from "@/models/Offer";
import Property from "@/models/Property";
import OfferActions from "@/components/OfferActions";
import PayOfferButton from "@/components/PayOfferButton";
import { getActor } from "@/utils/authorization";

export const dynamic = "force-dynamic";
export const metadata = { title: "Offers", description: "Manage secure property purchase offers and counteroffers." };
const statusStyles = { SUBMITTED: "bg-amber-100 text-amber-800", ACCEPTED: "bg-emerald-100 text-emerald-800", REJECTED: "bg-red-100 text-red-800", COUNTERED: "bg-violet-100 text-violet-800", WITHDRAWN: "bg-slate-100 text-slate-500", EXPIRED: "bg-slate-100 text-slate-500" };

export default async function OffersPage() {
  const actor = await getActor();
  if (!actor) redirect("/api/auth/signin?callbackUrl=/offers");
  await connectDB();
  const items = await Offer.find({ $or: [{ buyerId: actor.id }, { sellerId: actor.id }], deletedAt: { $exists: false } }).populate("propertyId", "name listingReference images").sort({ createdAt: -1 }).lean();

  function card(offer) {
    const property = offer.propertyId;
    const submittedByActor = offer.submittedBy.toString() === actor.id;
    const isBuyer = offer.buyerId.toString() === actor.id || submittedByActor;
    const awaiting = offer.status === "SUBMITTED";
    const accepted = offer.status === "ACCEPTED";
    const data = { id: offer._id.toString(), amount: Number(offer.amount), depositAmount: Number(offer.depositAmount || 0), status: offer.status };

    return (
      <article key={offer._id.toString()} className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div className="flex gap-4">
            {property?.images?.[0] && (
              <Image src={property.images[0]} alt="" width={96} height={64} className="h-16 w-24 rounded-xl object-cover" />
            )}
            <div>
              <h2 className="font-bold">{property?.name || "Property"}</h2>
              <p className="mt-1 text-2xl font-extrabold text-blue-700">{offer.currency} {Number(offer.amount).toLocaleString()}</p>
              <p className="text-xs text-slate-500">Deposit: {offer.currency} {Number(offer.depositAmount || 0).toLocaleString()} · {offer.financingType.replaceAll("_", " ")}</p>
              {property?.listingReference && <p className="mt-1 font-mono text-xs text-slate-400">{property.listingReference}</p>}
            </div>
          </div>
          <div className="text-right">
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[offer.status] || "bg-slate-100"}`}>{offer.status.replaceAll("_", " ")}</span>
            <p className="mt-2 text-xs text-slate-400">Version {offer.version}</p>
          </div>
        </div>
        {offer.message && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">{offer.message}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {isBuyer && (awaiting || accepted) && (
            <PayOfferButton
              offerId={offer._id.toString()}
              amount={offer.depositAmount > 0 ? offer.depositAmount : offer.amount}
              currency={offer.currency}
              label={accepted ? "Pay Earnest Deposit" : "Pay Earnest Deposit Now"}
            />
          )}
          <OfferActions offer={data} canRespond={awaiting && !submittedByActor} canWithdraw={(awaiting || accepted || offer.status === "COUNTERED") && isBuyer} propertyId={property?._id.toString()} />
        </div>
      </article>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-blue-700">Property sales</p>
            <h1 className="mt-2 text-3xl font-bold">Purchase offers</h1>
            <p className="mt-2 text-slate-600">Review immutable offer versions, respond with validated counteroffers and collaborate on private evidence.</p>
          </div>
          <Link href="/properties?purpose=SALE" className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white">Browse sale listings</Link>
        </div>
        <div className="mt-8 space-y-4">
          {items.map(card)}
          {!items.length && <p className="rounded-2xl border border-dashed bg-white p-8 text-slate-500">No purchase offers yet.</p>}
        </div>
      </div>
    </main>
  );
}
