import "server-only";

import { getServerClient } from "@/lib/supabase/server";
import { hasActivePremium } from "@/lib/subscriptions/expiry";
import type {
  AmenityRow,
  BillingCycle,
  CategoryRow,
  DestinationRow,
  EnquiryRow,
  PaymentRow,
  PlanRow,
  ProfileRow,
  PropertyImageRow,
  PropertyRow,
  ReviewReportRow,
  ReviewRow,
  SubscriptionRow,
  SubscriptionSource,
} from "@/types/database.types";

type Client = NonNullable<Awaited<ReturnType<typeof getServerClient>>>;

async function getClient(): Promise<Client | null> {
  return getServerClient();
}

export type AdminUserSummary = ProfileRow & {
  property_count: number;
  plan_name: string | null;
  plan_code: string | null;
  subscription_status: string | null;
  subscription_id: string | null;
  subscription_source: SubscriptionSource | null;
  billing_cycle: BillingCycle | null;
  expires_at: string | null;
};

export type AdminUserFilters = {
  q?: string;
  role?: string;
  status?: string;
};

export async function getAdminStats() {
  const supabase = await getClient();
  if (!supabase) return null;

  const [
    users,
    owners,
    properties,
    pending,
    approved,
    rejected,
    draft,
    enquiries,
    subscriptions,
    payments,
    recentUsers,
    recentProperties,
    ownerProfiles,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "owner"),
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("enquiries").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("id,status,expires_at,plan:plans(code)").eq("status", "active"),
    supabase.from("payments").select("amount").eq("status", "success"),
    supabase
      .from("profiles")
      .select("id,full_name,email,role,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("properties")
      .select("id,name,status,owner_id,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("profiles").select("id,full_name,email"),
  ]);

  const activeSubscriptions = (subscriptions.data ?? []) as unknown as {
    id: string;
    status: string;
    expires_at: string | null;
    plan: { code: string } | null;
  }[];

  const activePremium = activeSubscriptions.filter((item) =>
    hasActivePremium({
      status: item.status as "active" | "expired" | "cancelled",
      expiresAt: item.expires_at,
      planCode: item.plan?.code === "premium" ? "premium" : "free",
    }),
  );

  const ownerMap = new Map(
    ((ownerProfiles.data ?? []) as Pick<ProfileRow, "id" | "full_name" | "email">[]).map((item) => [
      item.id,
      item,
    ]),
  );

  return {
    users: users.count ?? 0,
    owners: owners.count ?? 0,
    properties: properties.count ?? 0,
    pending: pending.count ?? 0,
    approved: approved.count ?? 0,
    rejected: rejected.count ?? 0,
    draft: draft.count ?? 0,
    enquiries: enquiries.count ?? 0,
    premiumSubscribers: activePremium.length,
    activeSubscriptions: activeSubscriptions.length,
    revenue:
      ((payments.data ?? []) as Pick<PaymentRow, "amount">[]).reduce(
        (total, payment) => total + Number(payment.amount),
        0,
      ) / 100,
    recentUsers: (recentUsers.data ?? []) as Pick<
      ProfileRow,
      "id" | "full_name" | "email" | "role" | "created_at"
    >[],
    recentProperties: ((recentProperties.data ?? []) as Pick<
      PropertyRow,
      "id" | "name" | "status" | "owner_id" | "created_at"
    >[]).map((property) => ({
      ...property,
      owner_name: ownerMap.get(property.owner_id)?.full_name ?? "—",
    })),
  };
}

export async function getAllUsers(filters: AdminUserFilters = {}): Promise<AdminUserSummary[]> {
  const supabase = await getClient();
  if (!supabase) return [];

  let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
  const term = filters.q?.replace(/[,()%]/g, " ").trim();
  if (term) query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
  if (filters.role) query = query.eq("role", filters.role as ProfileRow["role"]);
  if (filters.status) query = query.eq("account_status", filters.status as ProfileRow["account_status"]);

  const [profiles, properties, subscriptions, plans] = await Promise.all([
    query,
    supabase.from("properties").select("owner_id"),
    supabase
      .from("subscriptions")
      .select("id,owner_id,status,plan_id,billing_cycle,starts_at,expires_at,source"),
    supabase.from("plans").select("id,name,code"),
  ]);

  const propertyCounts = new Map<string, number>();
  for (const property of (properties.data ?? []) as Pick<PropertyRow, "owner_id">[]) {
    propertyCounts.set(property.owner_id, (propertyCounts.get(property.owner_id) ?? 0) + 1);
  }

  const planMap = new Map(
    ((plans.data ?? []) as Pick<PlanRow, "id" | "name" | "code">[]).map((plan) => [
      plan.id,
      { name: plan.name, code: plan.code },
    ]),
  );

  type AdminUserSubscription = Pick<
    SubscriptionRow,
    "id" | "owner_id" | "status" | "plan_id" | "billing_cycle" | "starts_at" | "expires_at" | "source"
  >;
  const isCurrent = (subscription: AdminUserSubscription) =>
    subscription.status === "active" &&
    (!subscription.expires_at || Date.parse(subscription.expires_at) > Date.now());
  const subscriptionMap = new Map<string, AdminUserSubscription>();
  for (const subscription of (subscriptions.data ?? []) as AdminUserSubscription[]) {
    const current = subscriptionMap.get(subscription.owner_id);
    if (!current || (isCurrent(subscription) && !isCurrent(current))) {
      subscriptionMap.set(subscription.owner_id, subscription);
    }
  }

  return ((profiles.data ?? []) as ProfileRow[]).map((profile) => {
    const subscription = subscriptionMap.get(profile.id);
    const plan = subscription ? planMap.get(subscription.plan_id) : null;
    return {
      ...profile,
      property_count: propertyCounts.get(profile.id) ?? 0,
      plan_name: plan?.name ?? null,
      plan_code: plan?.code ?? null,
      subscription_status: subscription?.status ?? null,
      subscription_id: subscription?.id ?? null,
      subscription_source: subscription?.source ?? null,
      billing_cycle: subscription?.billing_cycle ?? null,
      expires_at: subscription?.expires_at ?? null,
    };
  });
}

export async function getAdminUserById(id: string) {
  const supabase = await getClient();
  if (!supabase) return null;

  const [profile, properties, subscription, plans] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
    supabase.from("properties").select("*").eq("owner_id", id).order("created_at", { ascending: false }),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("owner_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("plans").select("id,name,code"),
  ]);

  const user = (profile.data as ProfileRow | null) ?? null;
  if (!user) return null;

  const planMap = new Map(
    ((plans.data ?? []) as Pick<PlanRow, "id" | "name" | "code">[]).map((plan) => [plan.id, plan]),
  );
  const activeSubscription = (subscription.data as SubscriptionRow | null) ?? null;

  return {
    profile: user,
    properties: (properties.data ?? []) as PropertyRow[],
    subscription: activeSubscription
      ? {
          ...activeSubscription,
          plan_name: planMap.get(activeSubscription.plan_id)?.name ?? "—",
        }
      : null,
  };
}

export type AdminPropertyFilters = {
  status?: string;
  q?: string;
  district?: string;
  changeRequestsOnly?: boolean;
};

export async function getAllProperties(filters: AdminPropertyFilters = {}) {
  const supabase = await getClient();
  if (!supabase) return [];

  let query = supabase.from("properties").select("*").order("created_at", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status as PropertyRow["status"]);
  if (filters.district) query = query.eq("district", filters.district);
  if (filters.changeRequestsOnly) query = query.eq("has_requested_changes", true);
  const term = filters.q?.trim();
  if (term) query = query.or(`name.ilike.*${term}*,district.ilike.*${term}*`);

  const [properties, profiles, destinations, categories, images] = await Promise.all([
    query,
    supabase.from("profiles").select("id,full_name,email"),
    supabase.from("destinations").select("id,name"),
    supabase.from("categories").select("id,name"),
    supabase.from("property_images").select("id,property_id,public_url,is_cover").order("position"),
  ]);
  const ownerMap = new Map(
    ((profiles.data ?? []) as Pick<ProfileRow, "id" | "full_name" | "email">[]).map((item) => [item.id, item]),
  );
  const destinationMap = new Map(
    ((destinations.data ?? []) as Pick<DestinationRow, "id" | "name">[]).map((item) => [item.id, item]),
  );
  const categoryMap = new Map(
    ((categories.data ?? []) as Pick<CategoryRow, "id" | "name">[]).map((item) => [item.id, item]),
  );
  const coverMap = new Map<string, string>();
  for (const image of (images.data ?? []) as Pick<PropertyImageRow, "property_id" | "public_url">[]) {
    if (!coverMap.has(image.property_id)) coverMap.set(image.property_id, image.public_url);
  }

  return ((properties.data ?? []) as PropertyRow[]).map((property) => ({
    ...property,
    owner_name: ownerMap.get(property.owner_id)?.full_name ?? "—",
    owner_email: ownerMap.get(property.owner_id)?.email ?? "—",
    destination_name: destinationMap.get(property.destination_id ?? "")?.name ?? "—",
    category_name: categoryMap.get(property.category_id ?? "")?.name ?? "—",
    cover_image: coverMap.get(property.id) ?? null,
  }));
}

export async function getAllAdminEnquiries() {
  const supabase = await getClient();
  if (!supabase) return [];
  const [enquiries, properties] = await Promise.all([
    supabase.from("enquiries").select("*").order("created_at", { ascending: false }),
    supabase.from("properties").select("id,name"),
  ]);
  const names = new Map(
    ((properties.data ?? []) as Pick<PropertyRow, "id" | "name">[]).map((item) => [item.id, item.name]),
  );
  return ((enquiries.data ?? []) as EnquiryRow[]).map((enquiry) => ({
    ...enquiry,
    property_name: names.get(enquiry.property_id) ?? "Property",
  }));
}

export type AdminReview = ReviewRow & {
  property_name: string;
  property_slug: string;
  reviewer_name: string;
  reviewer_email: string;
};

export async function getAdminReviews(): Promise<AdminReview[]> {
  const supabase = await getClient();
  if (!supabase) return [];
  const [reviews, properties, profiles] = await Promise.all([
    supabase.from("reviews").select("*").order("created_at", { ascending: false }),
    supabase.from("properties").select("id,name,slug"),
    supabase.from("profiles").select("id,full_name,email"),
  ]);

  const propertyMap = new Map(
    ((properties.data ?? []) as Pick<PropertyRow, "id" | "name" | "slug">[]).map((property) => [
      property.id,
      property,
    ]),
  );
  const reviewerMap = new Map(
    ((profiles.data ?? []) as Pick<ProfileRow, "id" | "full_name" | "email">[]).map((profile) => [
      profile.id,
      profile,
    ]),
  );

  return ((reviews.data ?? []) as ReviewRow[]).map((review) => {
    const reviewer = review.user_id ? reviewerMap.get(review.user_id) : null;
    return {
      ...review,
      property_name: propertyMap.get(review.property_id)?.name ?? "Property",
      property_slug: propertyMap.get(review.property_id)?.slug ?? "",
      reviewer_name: reviewer?.full_name ?? review.reviewer_name ?? "Guest traveller",
      reviewer_email: reviewer?.email ?? "—",
    };
  });
}

export async function getAllSubscriptions() {
  const supabase = await getClient();
  if (!supabase) return [];
  const [subscriptions, plans, profiles] = await Promise.all([
    supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
    supabase.from("plans").select("id,name,code"),
    supabase.from("profiles").select("id,full_name,email"),
  ]);
  const planMap = new Map(
    ((plans.data ?? []) as Pick<PlanRow, "id" | "name" | "code">[]).map((item) => [item.id, item]),
  );
  const userMap = new Map(
    ((profiles.data ?? []) as Pick<ProfileRow, "id" | "full_name" | "email">[]).map((item) => [item.id, item]),
  );
  return ((subscriptions.data ?? []) as SubscriptionRow[]).map((subscription) => ({
    ...subscription,
    plan_name: planMap.get(subscription.plan_id)?.name ?? "—",
    plan_code: planMap.get(subscription.plan_id)?.code ?? null,
    owner_name: userMap.get(subscription.owner_id)?.full_name ?? "—",
    owner_email: userMap.get(subscription.owner_id)?.email ?? "—",
  }));
}

export async function getAllAdminPayments(): Promise<PaymentRow[]> {
  const supabase = await getClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as PaymentRow[];
}

export async function getAdminDestinations(): Promise<DestinationRow[]> {
  const supabase = await getClient();
  if (!supabase) return [];
  const { data } = await supabase.from("destinations").select("*").order("sort_order");
  return (data ?? []) as DestinationRow[];
}

export async function getAdminDestinationById(id: string): Promise<DestinationRow | null> {
  const supabase = await getClient();
  if (!supabase) return null;
  const { data } = await supabase.from("destinations").select("*").eq("id", id).maybeSingle();
  return (data as DestinationRow | null) ?? null;
}

export async function getAdminCategories(): Promise<CategoryRow[]> {
  const supabase = await getClient();
  if (!supabase) return [];
  const { data } = await supabase.from("categories").select("*").order("sort_order");
  return (data ?? []) as CategoryRow[];
}

export async function getAdminCategoryById(id: string): Promise<CategoryRow | null> {
  const supabase = await getClient();
  if (!supabase) return null;
  const { data } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
  return (data as CategoryRow | null) ?? null;
}

export async function getAdminAmenities(): Promise<AmenityRow[]> {
  const supabase = await getClient();
  if (!supabase) return [];
  const { data } = await supabase.from("amenities").select("*").order("name");
  return (data ?? []) as AmenityRow[];
}

export async function getAdminPlans(): Promise<PlanRow[]> {
  const supabase = await getClient();
  if (!supabase) return [];
  const { data } = await supabase.from("plans").select("*").order("sort_order");
  return (data ?? []) as PlanRow[];
}

export async function getAdminPropertyById(id: string): Promise<PropertyRow | null> {
  const supabase = await getClient();
  if (!supabase) return null;
  const { data } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();
  return (data as PropertyRow | null) ?? null;
}

export async function getAdminPropertyImages(propertyId: string): Promise<PropertyImageRow[]> {
  const supabase = await getClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", propertyId)
    .order("position", { ascending: true });
  return (data ?? []) as PropertyImageRow[];
}

export async function getAdminPropertyAmenityIds(propertyId: string): Promise<string[]> {
  const supabase = await getClient();
  if (!supabase) return [];
  const { data } = await supabase.from("property_amenities").select("amenity_id").eq("property_id", propertyId);
  return ((data ?? []) as { amenity_id: string }[]).map((link) => link.amenity_id);
}

export async function getPropertyOwnerCandidates(): Promise<{ id: string; label: string }[]> {
  const supabase = await getClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("profiles")
    .select("id,full_name,email,role")
    .order("full_name", { ascending: true });
  return ((data ?? []) as Pick<ProfileRow, "id" | "full_name" | "email" | "role">[]).map((profile) => ({
    id: profile.id,
    label: `${profile.full_name || profile.email || "Account"} (${profile.email ?? profile.role})`,
  }));
}

export type AdminReviewReport = ReviewReportRow & {
  review: Pick<ReviewRow, "id" | "reviewer_name" | "rating" | "title" | "comment" | "status"> | null;
  property: Pick<PropertyRow, "id" | "name" | "slug"> | null;
};

export async function getAdminReviewReports(): Promise<AdminReviewReport[]> {
  const supabase = await getClient();
  if (!supabase) return [];

  const { data: reports } = await supabase
    .from("review_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (!reports?.length) return [];

  const reviewIds = [...new Set(reports.map((report) => report.review_id))];
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id,property_id,reviewer_name,rating,title,comment,status")
    .in("id", reviewIds);
  const propertyIds = [...new Set((reviews ?? []).map((review) => review.property_id))];
  const { data: properties } = propertyIds.length
    ? await supabase.from("properties").select("id,name,slug").in("id", propertyIds)
    : { data: [] };

  const reviewMap = new Map((reviews ?? []).map((review) => [review.id, review]));
  const propertyMap = new Map((properties ?? []).map((property) => [property.id, property]));

  return reports.map((report) => {
    const review = reviewMap.get(report.review_id) ?? null;
    return {
      ...report,
      review: review
        ? {
            id: review.id,
            reviewer_name: review.reviewer_name,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            status: review.status,
          }
        : null,
      property: review ? propertyMap.get(review.property_id) ?? null : null,
    };
  });
}
