import type { Metadata } from "next";
import { ManualSubscriptionRequestsSection } from "@/components/dashboard/manual-subscription-requests";
import { requireOwner } from "@/lib/auth/guards";
import { getOwnerManualRequests } from "@/lib/data/manual-requests";

export const metadata: Metadata = {
  title: "Manual payment requests",
  robots: { index: false, follow: false },
};

export default async function OwnerManualRequestsPage() {
  const { user } = await requireOwner("/dashboard/manual-requests");
  const requests = await getOwnerManualRequests(user.id);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow">Subscription</p>
      <h1 className="display-title mt-3 text-3xl md:text-4xl">Payment requests.</h1>
      <p className="mt-3 max-w-3xl text-sm text-muted">
        Open a request from the subscription page, pay by bank transfer or UPI, then submit the transaction reference and screenshot here. Premium is activated only after a Super Admin verifies and approves the payment.
      </p>
      <ManualSubscriptionRequestsSection requests={requests} />
    </div>
  );
}
