import { redirect } from "next/navigation";
import connectDB from "@/config/database";
import Payment from "@/models/Payment";
import Refund from "@/models/Refund";
import PaymentDispute from "@/models/PaymentDispute";
import CustomerPaymentOperations from "@/components/CustomerPaymentOperations";
import { getActor } from "@/utils/authorization";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const actor = await getActor();
  if (!actor) redirect("/auth/signin?callbackUrl=/payments");

  await connectDB();
  const payments = await Payment.find({
    $or: [{ userId: actor.id }, { userEmail: actor.email }],
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const ids = payments.map((item) => item._id);
  const [refunds, disputes] = await Promise.all([
    Refund.find({ paymentId: { $in: ids }, requestedBy: actor.id }).lean(),
    PaymentDispute.find({ paymentId: { $in: ids }, openedBy: actor.id }).lean(),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payments &amp; Receipts</h1>
          <p className="mt-1.5 text-sm text-slate-600">Your confirmed transaction history and finance support portal.</p>
        </div>

        <CustomerPaymentOperations
          initialPayments={JSON.parse(JSON.stringify(payments))}
          initialRefunds={JSON.parse(JSON.stringify(refunds))}
          initialDisputes={JSON.parse(JSON.stringify(disputes))}
          isAdmin={false}
        />
      </div>
    </main>
  );
}
