import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { getAllAdminPayments } from "@/lib/data/admin";
import { formatDate, formatINR } from "@/lib/utils";

export default async function AdminPaymentsPage() {
  const payments = await getAllAdminPayments();

  return (
    <>
      <p className="eyebrow">Billing</p>
      <h1 className="display-title mt-3 text-4xl">Payments.</h1>

      {payments.length ? (
        <div className="surface-card mt-8 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-forest/10 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Cycle</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest/8">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-5 py-4 font-medium text-forest-deep">{formatINR(payment.amount / 100)}</td>
                  <td className="px-5 py-4 text-xs text-muted">{payment.razorpay_order_id}</td>
                  <td className="px-5 py-4 capitalize">{payment.billing_cycle}</td>
                  <td className="px-5 py-4"><StatusPill status={payment.status} /></td>
                  <td className="px-5 py-4 text-xs text-muted">{formatDate(payment.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8"><EmptyState title="No payments yet" description="Razorpay transactions will appear here." /></div>
      )}
    </>
  );
}
