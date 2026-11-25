import type { Metadata } from "next";
import { ManualRequestManager } from "@/components/admin/manual-request-manager";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { getAdminManualRequests } from "@/lib/data/manual-requests";

export const metadata: Metadata = {
  title: "Manual payment requests",
  robots: { index: false, follow: false },
};

export default async function AdminManualRequestsPage() {
  await requireSuperAdmin();
  const requests = await getAdminManualRequests();

  return (
    <>
      <p className="eyebrow">Super admin · Billing</p>
      <h1 className="display-title mt-3 text-3xl md:text-4xl">Manual payment requests.</h1>
      <p className="mt-3 max-w-3xl text-sm text-muted">
        Verify each bank or UPI credit against the business account before approval. Only Super Admin approval activates Premium; rejecting a request never changes an owner&apos;s plan.
      </p>
      <div className="surface-card mt-8 overflow-hidden">
        <ManualRequestManager requests={requests} />
      </div>
    </>
  );
}
