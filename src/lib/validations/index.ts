import { z } from "zod";
import { isKeralaDistrict, keralaStateName } from "@/lib/config";
import { BILLING_CYCLES } from "@/lib/plans/billing-cycle";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const optionalUrl = z.string().trim().url().optional().or(z.literal(""));
const optionalEmail = z.string().trim().email().optional().or(z.literal(""));
const optionalDate = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date").optional(),
);
const optionalGuests = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
  z.number().int().min(1, "At least one guest").max(50).optional(),
);

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your name").max(100),
    email: z.string().trim().email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters").max(128),
    confirmPassword: z.string(),
    role: z.enum(["user", "owner"]),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters").max(128),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const enquirySchema = z
  .object({
    property_id: z.string().uuid(),
    name: z.string().trim().min(2, "Enter your name").max(100),
    email: z.string().trim().email("Enter a valid email address"),
    phone: optionalText(30),
    check_in: optionalDate,
    check_out: optionalDate,
    guests: optionalGuests,
    message: z.string().trim().min(10, "Tell us a little more").max(2000),
  })
  .refine(
    (values) => !values.check_in || !values.check_out || values.check_out > values.check_in,
    { message: "Check-out must be after check-in", path: ["check_out"] },
  );

const enquiryStatus = z.enum(["new", "read", "replied", "contacted", "pending", "completed"]);

export const enquiryResponseSchema = z.object({
  enquiry_id: z.string().uuid(),
  status: enquiryStatus,
  response_message: z.string().trim().max(2000).optional().or(z.literal("")),
  quoted_amount: z.union([z.coerce.number().min(0).max(10000000), z.literal("")]).optional(),
  quote_currency: z.string().trim().min(3).max(3).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  property_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5, "Choose a rating"),
  guest_token: z.string().uuid().optional().or(z.literal("")),
  title: optionalText(120),
  comment: z.string().trim().min(10, "Write at least 10 characters").max(1500, "Keep your review under 1500 characters"),
});

export const reviewUpdateSchema = reviewSchema.extend({
  review_id: z.string().uuid(),
});

const basePropertySchema = z.object({
  name: z.string().trim().min(3, "Property name is too short").max(120),
  short_description: z.string().trim().min(20, "Add a short description of at least 20 characters").max(300),
  state: z.string().trim().min(2, "Enter a state").max(100),
  district: z.string().trim().optional().or(z.literal("")),
  destination_id: z.string().uuid("Choose a destination"),
  category_id: z.string().uuid("Choose a property type"),
});

const premiumPropertySchema = basePropertySchema.extend({
  description: z.string().trim().max(8000).optional().or(z.literal("")),
  address: optionalText(300),
  map_url: optionalUrl,
  price_per_night: z.union([z.coerce.number().min(0).max(10000000), z.literal("")]).optional(),
  amenities: z.array(z.string().uuid()).max(50).optional(),
  contact_phone: optionalText(30),
  whatsapp_number: optionalText(30),
  contact_email: optionalEmail,
  website_url: optionalUrl,
  instagram_url: optionalUrl,
  facebook_url: optionalUrl,
  check_in_time: optionalText(20),
  check_out_time: optionalText(20),
  highlights: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const propertySchema = premiumPropertySchema
  .refine(
    (values) =>
      values.state.trim().toLowerCase() !== keralaStateName.toLowerCase() ||
      isKeralaDistrict(values.district),
    { message: "Choose a district", path: ["district"] },
  )
  .refine(
    (values) => !values.district || isKeralaDistrict(values.district),
    { message: "Choose a valid district", path: ["district"] },
  );

export const destinationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens"),
  state: z.string().trim().min(2).max(100),
  short_description: optionalText(300),
  description: optionalText(8000),
  image_url: optionalUrl,
  seo_title: optionalText(160),
  seo_description: optionalText(320),
  is_active: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(9999),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens"),
  description: optionalText(400),
  icon: optionalText(60),
  is_active: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(9999),
});

export const billingCycleSchema = z.enum(BILLING_CYCLES);

export const planSchema = z.object({
  price_monthly: z.coerce.number().min(0).max(1000000),
  price_six_month: z.coerce.number().min(0).max(10000000),
  price_yearly: z.coerce.number().min(0).max(10000000),
  max_properties: z.coerce.number().int().min(1).max(100),
  max_images_per_property: z.coerce.number().int().min(1).max(50),
  expired_listing_visibility: z.enum(["keep_visible", "hide"]),
  features: z.string().trim().max(2000).optional().transform((value) =>
    value
      ? value
          .split("\n")
          .map((feature) => feature.trim())
          .filter(Boolean)
          .slice(0, 20)
      : [],
  ),
});

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email address"),
  subject: optionalText(120),
  message: z.string().trim().min(10, "Write at least 10 characters").max(4000, "Keep your message under 4000 characters"),
});

export const reviewReportSchema = z.object({
  review_id: z.string().uuid(),
  guest_token: z.string().uuid().optional().or(z.literal("")),
  reason: z.enum(["spam", "abuse", "fake", "irrelevant", "private-information", "other"]),
  details: optionalText(2000),
});

export const adminReviewReportActionSchema = z.object({
  reportId: z.string().uuid(),
  decision: z.enum(["dismissed", "actioned"]),
});

export const accountDeletionSchema = z.object({
  confirmation: z.literal("DELETE"),
  email: z.string().trim().email("Enter your account email"),
  reason: optionalText(500),
});

export function schemaFieldErrors(error: z.ZodError) {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] ? String(issue.path[0]) : "form";
    errors[key] = [...(errors[key] ?? []), issue.message];
  }
  return errors;
}

export function parseOptional(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}
