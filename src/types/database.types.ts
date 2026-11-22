export type UserRole = "user" | "owner" | "admin" | "super_admin";
export type AccountStatus = "active" | "suspended";
export type PropertyStatus = "draft" | "pending" | "approved" | "rejected";
export type PlanCode = "free" | "premium";
export type BillingCycle = "monthly" | "six_month" | "yearly";
export type SubscriptionStatus = "active" | "expired" | "cancelled";
export type SubscriptionSource = "razorpay" | "admin_grant";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";
export type EnquiryStatus = "new" | "read" | "replied" | "contacted" | "pending" | "completed";

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type ProfileRow = Timestamps & {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  whatsapp_number: string | null;
  avatar_url: string | null;
  account_status: AccountStatus;
};

export type DestinationRow = Timestamps & {
  id: string;
  name: string;
  slug: string;
  state: string;
  short_description: string | null;
  description: string | null;
  image_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_active: boolean;
  sort_order: number;
};

export type CategoryRow = Timestamps & {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
};

export type AmenityRow = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  created_at: string;
};

export type PlanRow = Timestamps & {
  id: string;
  code: PlanCode;
  name: string;
  description: string | null;
  price_monthly: number;
  price_six_month: number;
  price_yearly: number;
  max_properties: number;
  max_images_per_property: number;
  expired_listing_visibility: "keep_visible" | "hide";
  is_active: boolean;
  sort_order: number;
  features: string[];
};

export type PropertyRow = Timestamps & {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  state: string;
  district: string | null;
  category_id: string | null;
  destination_id: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  map_url: string | null;
  price_per_night: number | null;
  status: PropertyStatus;
  is_featured: boolean;
  is_published: boolean;
  publish_after_renewal: boolean;
  plan_type: PlanCode;
  contact_phone: string | null;
  whatsapp_number: string | null;
  contact_email: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  highlights: string[];
  rejection_reason: string | null;
  submitted_at: string | null;
  approved_at: string | null;
};

export type PropertyImageRow = {
  id: string;
  property_id: string;
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  position: number;
  is_cover: boolean;
  created_at: string;
};

export type PropertyAmenityRow = {
  property_id: string;
  amenity_id: string;
};

export type SubscriptionRow = Timestamps & {
  id: string;
  owner_id: string;
  user_name: string;
  plan_id: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  starts_at: string;
  expires_at: string | null;
  razorpay_subscription_id: string | null;
  auto_renew: boolean;
  source: SubscriptionSource;
  granted_by: string | null;
  grant_reason: string | null;
  grant_notes: string | null;
  grant_duration_months: number | null;
};

export type PaymentRow = {
  id: string;
  user_id: string;
  subscription_id: string | null;
  plan_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  amount: number;
  currency: string;
  billing_cycle: BillingCycle;
  status: PaymentStatus;
  created_at: string;
};

export type PaymentEventRow = {
  event_id: string;
  payment_id: string;
  event_type: string;
  created_at: string;
};

export type EnquiryRow = {
  id: string;
  property_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: EnquiryStatus;
  check_in: string | null;
  check_out: string | null;
  guests: number | null;
  response_message: string | null;
  quoted_amount: number | null;
  quote_currency: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewRow = Timestamps & {
  id: string;
  property_id: string;
  user_id: string | null;
  guest_token: string | null;
  reviewer_name: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  status: "pending" | "approved" | "rejected";
};

export type ContactMessageRow = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: "new" | "read" | "replied" | "closed";
  created_at: string;
};

export type ReviewReportRow = {
  id: string;
  review_id: string;
  reporter_user_id: string | null;
  reporter_guest_token: string | null;
  reason: "spam" | "abuse" | "fake" | "irrelevant" | "private-information" | "other";
  details: string | null;
  status: "open" | "reviewed" | "dismissed" | "actioned";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type AdminAuditLogRow = {
  id: string;
  occurred_at: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
};

export type AccountDeletionRequestRow = {
  id: string;
  user_id: string | null;
  email_snapshot: string;
  reason: string | null;
  status: "pending" | "anonymised" | "completed" | "rejected";
  requested_at: string;
  completed_at: string | null;
};

export type PublicOwnerRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  whatsapp_number: string | null;
};

type Table<T, I, U> = {
  Row: T;
  Insert: I;
  Update: U;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        ProfileRow,
        Partial<ProfileRow> & { id: string; email: string },
        Partial<ProfileRow>
      >;
      destinations: Table<
        DestinationRow,
        Partial<DestinationRow> & { name: string; slug: string },
        Partial<DestinationRow>
      >;
      categories: Table<
        CategoryRow,
        Partial<CategoryRow> & { name: string; slug: string },
        Partial<CategoryRow>
      >;
      amenities: Table<
        AmenityRow,
        Partial<AmenityRow> & { name: string; slug: string },
        Partial<AmenityRow>
      >;
      plans: Table<
        PlanRow,
        Partial<PlanRow> & { code: PlanCode; name: string },
        Partial<PlanRow>
      >;
      properties: Table<
        PropertyRow,
        Partial<PropertyRow> & { owner_id: string; name: string; slug: string },
        Partial<PropertyRow>
      >;
      property_images: Table<
        PropertyImageRow,
        Partial<PropertyImageRow> & { property_id: string; storage_path: string; public_url: string },
        Partial<PropertyImageRow>
      >;
      property_amenities: Table<
        PropertyAmenityRow,
        PropertyAmenityRow,
        Partial<PropertyAmenityRow>
      >;
      subscriptions: Table<
        SubscriptionRow,
        Partial<SubscriptionRow> & { owner_id: string; plan_id: string; billing_cycle: BillingCycle },
        Partial<SubscriptionRow>
      >;
      payments: Table<
        PaymentRow,
        Partial<PaymentRow> & {
          user_id: string;
          plan_id: string;
          razorpay_order_id: string;
          amount: number;
          currency: string;
        },
        Partial<PaymentRow>
      >;
      payment_events: Table<
        PaymentEventRow,
        Partial<PaymentEventRow> & { event_id: string; payment_id: string; event_type: string },
        Partial<PaymentEventRow>
      >;
      enquiries: Table<
        EnquiryRow,
        Partial<EnquiryRow> & { property_id: string; name: string; email: string; message: string },
        Partial<EnquiryRow>
      >;
      reviews: Table<
        ReviewRow,
        Partial<ReviewRow> & { property_id: string; rating: number },
        Partial<ReviewRow>
      >;
      contact_messages: Table<
        ContactMessageRow,
        Partial<ContactMessageRow> & { name: string; email: string; message: string },
        Partial<ContactMessageRow>
      >;
      review_reports: Table<
        ReviewReportRow,
        Partial<ReviewReportRow> & { review_id: string; reason: ReviewReportRow["reason"] },
        Partial<ReviewReportRow>
      >;
      admin_audit_logs: Table<
        AdminAuditLogRow,
        Partial<AdminAuditLogRow> & { action: string },
        Partial<AdminAuditLogRow>
      >;
      account_deletion_requests: Table<
        AccountDeletionRequestRow,
        Partial<AccountDeletionRequestRow> & { email_snapshot: string },
        Partial<AccountDeletionRequestRow>
      >;
    };
    Views: {
      public_property_owners: {
        Row: PublicOwnerRow;
        Relationships: [];
      };
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
      is_super_admin: { Args: never; Returns: boolean };
      consume_rate_limit: {
        Args: {
          p_action: string;
          p_subject: string;
          p_limit: number;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
      activate_paid_subscription: {
        Args: {
          p_payment_id: string;
          p_razorpay_payment_id: string;
          p_duration_months: number;
          p_signature?: string | null;
          p_event_id?: string | null;
        };
        Returns: Record<string, unknown>;
      };
      record_payment_status: {
        Args: {
          p_order_id: string;
          p_status: PaymentStatus;
          p_event_id?: string | null;
          p_razorpay_payment_id?: string | null;
        };
        Returns: Record<string, unknown>;
      };
      reserve_payment_event: {
        Args: { p_event_id: string; p_payment_id: string; p_event_type: string };
        Returns: boolean;
      };
      get_owner_entitlement: {
        Args: { p_owner_id: string };
        Returns: Record<string, unknown> | null;
      };
      plan_limit_for: {
        Args: { p_owner_id: string; p_limit_key: string };
        Returns: number | null;
      };
      is_active_property_owner: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
      storage_property_path_is_owned: {
        Args: { p_path: string };
        Returns: boolean;
      };
      apply_expired_property_policy: {
        Args: { p_owner_id?: string | null };
        Returns: Record<string, unknown>;
      };
      select_expiry_property: {
        Args: { p_owner_id: string; p_property_id: string };
        Returns: Record<string, unknown>;
      };
      set_property_published: {
        Args: { p_property_id: string; p_published: boolean };
        Returns: Record<string, unknown>;
      };
      admin_grant_premium: {
        Args: {
          p_owner_id: string;
          p_plan_id: string;
          p_billing_cycle: BillingCycle;
          p_duration_months: number;
          p_start_at: string;
          p_reason: string;
          p_actor_id: string;
          p_actor_email: string;
          p_notes?: string | null;
        };
        Returns: Record<string, unknown>;
      };
      admin_extend_premium: {
        Args: {
          p_owner_id: string;
          p_plan_id: string;
          p_billing_cycle: BillingCycle;
          p_duration_months: number;
          p_reason: string;
          p_actor_id: string;
          p_actor_email: string;
          p_notes?: string | null;
        };
        Returns: Record<string, unknown>;
      };
      admin_revoke_premium: {
        Args: {
          p_owner_id: string;
          p_reason: string;
          p_actor_id: string;
          p_actor_email: string;
          p_notes?: string | null;
        };
        Returns: Record<string, unknown>;
      };
    };
    Enums: {
      user_role: UserRole;
      property_status: PropertyStatus;
      plan_code: PlanCode;
      billing_cycle: BillingCycle;
      subscription_status: SubscriptionStatus;
      subscription_source: SubscriptionSource;
      payment_status: PaymentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
