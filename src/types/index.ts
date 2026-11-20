export type PropertyCardImage = {
  id: string;
  public_url: string;
  alt_text: string | null;
  is_cover: boolean;
};

export type PropertyAmenity = {
  id: string;
  name: string;
  icon: string | null;
};

export type PropertyReview = {
  id: string;
  property_id: string;
  user_id: string | null;
  guest_token: string | null;
  reviewer_name: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  author_label: string;
};

export type ReviewSummary = {
  average: number | null;
  count: number;
};

export type PropertyListItem = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  status: string;
  is_featured: boolean;
  plan_type: string;
  price_per_night: number | null;
  city: string | null;
  state: string | null;
  category_name: string | null;
  category_slug: string | null;
  cover_image: string | null;
  image_count: number;
  images: PropertyCardImage[];
  amenities: PropertyAmenity[];
  rating_average: number | null;
  review_count: number;
  created_at: string;
};

export type PropertyDetail = PropertyListItem & {
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  map_url: string | null;
  contact_phone: string | null;
  whatsapp_number: string | null;
  contact_email: string | null;
  website_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  highlights: string[];
  owner_id: string;
  owner_name: string | null;
  owner_avatar: string | null;
  reviews: PropertyReview[];
};

export type PlanLimits = {
  planCode: "free" | "premium";
  planName: string;
  maxProperties: number;
  maxImagesPerProperty: number;
  priceMonthly: number;
  priceYearly: number;
  expiredListingVisibility: "keep_visible" | "hide";
  features: string[];
  isActive: boolean;
};

export type EntitlementSource = "free" | "paid" | "admin_bypass";

export type PlanContext = {
  limits: PlanLimits;
  isPremium: boolean;
  isExpired: boolean;
  expiresAt: string | null;
  billingCycle: "monthly" | "yearly" | null;
  subscriptionId: string | null;
  entitlement: EntitlementSource;
  isUnlimited: boolean;
};

export type PropertyFilters = {
  q?: string;
  destination?: string;
  category?: string;
  amenity?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "featured" | "price_low" | "price_high";
  page?: number;
};

export type ActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
  propertyId?: string;
};

export type AuthResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};
