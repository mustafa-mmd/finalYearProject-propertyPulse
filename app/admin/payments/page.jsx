import connectDB from "@/config/database";
import Payment from "@/models/Payment";
import Refund from "@/models/Refund";
import Payout from "@/models/Payout";
import PaymentDispute from "@/models/PaymentDispute";
import FinanceOperations from "@/components/FinanceOperations";
import AdminPaymentsTableClient from "@/components/admin/AdminPaymentsTableClient";
import { requirePagePermission } from "@/utils/pageAuthorization";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage({ searchParams }) {
  await requirePagePermission("payments.read", "/admin/payments");
  const params = await searchParams;
  const status = params?.status || "";
  await connectDB();

  const [payments, refunds, payouts, disputes] = await Promise.all([
    Payment.find(status ? { paymentStatus: status } : {})
      .select("transactionId propertyName amount currency paymentType paymentStatus userEmail provider paidAt createdAt")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean(),
    Refund.find({}).populate("paymentId", "transactionId propertyName").sort({ createdAt: -1 }).limit(100).lean(),
    Payout.find({}).populate("recipientId", "name email").sort({ createdAt: -1 }).limit(100).lean(),
    PaymentDispute.find({ status: { $ne: "CLOSED" } }).populate("paymentId", "transactionId propertyName").sort({ createdAt: -1 }).limit(100).lean(),
  ]);

  const serializedPayments = JSON.parse(JSON.stringify(payments));

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-blue-700">Finance operations</p>
          <h2 className="mt-1 text-3xl font-bold text-slate-950 font-sans">Payment Management</h2>
          <p className="mt-2 text-slate-600">Administrative financial overrides, status updates, and transaction auditing.</p>
        </div>
        <form className="flex gap-2">
          <select name="status" defaultValue={status} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">Filter</button>
        </form>
      </div>

      {/* Admin Payments Table with Full Override Controls */}
      <AdminPaymentsTableClient initialPayments={serializedPayments} />

      <FinanceOperations
        initialRefunds={JSON.parse(JSON.stringify(refunds))}
        initialPayouts={JSON.parse(JSON.stringify(payouts))}
        initialDisputes={JSON.parse(JSON.stringify(disputes))}
      />
    </section>
  );
}
