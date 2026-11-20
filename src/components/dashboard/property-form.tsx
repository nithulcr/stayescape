"use client";

import { startTransition, useActionState, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { savePropertyAction } from "@/app/dashboard/properties/actions";
import type { ActionResult } from "@/types";
import type {
  AmenityRow,
  CategoryRow,
  DestinationRow,
  PropertyRow,
  PropertyStatus,
} from "@/types/database.types";

type PropertyFormValues = {
  name: string;
  short_description: string;
  destination_id: string;
  category_id: string;
  description: string;
  address: string;
  map_url: string;
  price_per_night: string;
  contact_phone: string;
  whatsapp_number: string;
  contact_email: string;
  website_url: string;
  instagram_url: string;
  facebook_url: string;
  check_in_time: string;
  check_out_time: string;
  highlights: string;
  amenities: string[];
};

function initialValues(
  property?: PropertyRow,
  selectedAmenityIds: string[] = [],
): PropertyFormValues {
  return {
    name: property?.name ?? "",
    short_description: property?.short_description ?? "",
    destination_id: property?.destination_id ?? "",
    category_id: property?.category_id ?? "",
    description: property?.description ?? "",
    address: property?.address ?? "",
    map_url: property?.map_url ?? "",
    price_per_night:
      property?.price_per_night === null || property?.price_per_night === undefined
        ? ""
        : String(property.price_per_night),
    contact_phone: property?.contact_phone ?? "",
    whatsapp_number: property?.whatsapp_number ?? "",
    contact_email: property?.contact_email ?? "",
    website_url: property?.website_url ?? "",
    instagram_url: property?.instagram_url ?? "",
    facebook_url: property?.facebook_url ?? "",
    check_in_time: property?.check_in_time ?? "",
    check_out_time: property?.check_out_time ?? "",
    highlights: (property?.highlights ?? []).join("\n"),
    amenities: selectedAmenityIds,
  };
}

function ErrorText({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <span className="field-error">{messages[0]}</span>;
}

const submittedFields: Record<Exclude<keyof PropertyFormValues, "amenities">, string> = {
  name: "property_name",
  short_description: "property_short_description",
  destination_id: "property_destination_id",
  category_id: "property_category_id",
  description: "property_description",
  address: "property_address",
  map_url: "property_map_url",
  price_per_night: "property_price_per_night",
  contact_phone: "property_contact_phone",
  whatsapp_number: "property_whatsapp_number",
  contact_email: "property_contact_email",
  website_url: "property_website_url",
  instagram_url: "property_instagram_url",
  facebook_url: "property_facebook_url",
  check_in_time: "property_check_in_time",
  check_out_time: "property_check_out_time",
  highlights: "property_highlights",
};

export function PropertyForm({
  property,
  destinations,
  categories,
  amenities,
  isPremium,
  selectedAmenityIds = [],
  saveAction = savePropertyAction,
  adminMode = false,
  owners = [],
  selectedOwnerId = "",
  redirectBase,
}: {
  property?: PropertyRow;
  destinations: DestinationRow[];
  categories: CategoryRow[];
  amenities: AmenityRow[];
  isPremium: boolean;
  selectedAmenityIds?: string[];
  saveAction?: (previous: ActionResult, formData: FormData) => Promise<ActionResult>;
  adminMode?: boolean;
  owners?: { id: string; label: string }[];
  selectedOwnerId?: string;
  redirectBase?: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(saveAction, {
    ok: false,
    message: "",
  });
  const [values, setValues] = useState<PropertyFormValues>(() =>
    initialValues(property, selectedAmenityIds),
  );
  const [ownerId, setOwnerId] = useState(selectedOwnerId);
  const [status, setStatus] = useState<PropertyStatus>(property?.status ?? "pending");
  const [featured, setFeatured] = useState(property?.is_featured ?? false);

  useLayoutEffect(() => {
    const form = formRef.current;
    if (!form) return;
    for (const element of form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>("[data-field]")) {
      const key = element.dataset.field as keyof PropertyFormValues;
      if (key === "amenities") continue;
      const value = values[key] as string;
      if (element.value !== value) element.value = value;
    }
  }, [values]);

  useEffect(() => {
    if (state.ok && state.propertyId && !property) {
      router.push(`${redirectBase ?? "/dashboard/properties"}/${state.propertyId}`);
    } else if (state.ok) {
      router.refresh();
    }
  }, [state.ok, state.propertyId, property, router, redirectBase]);

  function setValue<K extends keyof PropertyFormValues>(
    key: K,
    value: PropertyFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleAmenity(id: string, checked: boolean) {
    setValues((current) => ({
      ...current,
      amenities: checked
        ? current.amenities.includes(id)
          ? current.amenities
          : [...current.amenities, id]
        : current.amenities.filter((item) => item !== id),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData();
    for (const [key, name] of Object.entries(submittedFields)) {
      data.set(name, values[key as keyof typeof submittedFields]);
    }
    for (const id of values.amenities) data.append("property_amenities", id);
    if (property) data.set("propertyId", property.id);
    if (adminMode) {
      data.set("ownerId", ownerId);
      data.set("status", status);
      if (featured) data.set("is_featured", "on");
    }
    startTransition(() => formAction(data));
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      autoComplete="off"
      noValidate
      className="grid gap-6"
    >
      <section className="surface-card p-6">
        <h2 className="font-serif text-xl text-forest-deep">Essential details</h2>
        <p className="mt-1 text-xs text-muted">These fields are available on every plan.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="field-label">Property name</span>
            <input
              data-field="name"
              required
              minLength={3}
              autoComplete="off"
              value={values.name}
              onChange={(event) => setValue("name", event.target.value)}
              className="input-field"
            />
            <ErrorText messages={state.fieldErrors?.name} />
          </label>
          <label className="md:col-span-2">
            <span className="field-label">Short description</span>
            <textarea
              data-field="short_description"
              required
              minLength={20}
              maxLength={300}
              rows={3}
              autoComplete="off"
              value={values.short_description}
              onChange={(event) => setValue("short_description", event.target.value)}
              className="input-field"
            />
            <ErrorText messages={state.fieldErrors?.short_description} />
          </label>
          <label>
            <span className="field-label">Destination</span>
            <select
              data-field="destination_id"
              required
              autoComplete="off"
              value={values.destination_id}
              onChange={(event) => setValue("destination_id", event.target.value)}
              className="input-field"
            >
              <option value="">Choose a destination</option>
              {destinations.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <ErrorText messages={state.fieldErrors?.destination_id} />
          </label>
          <label>
            <span className="field-label">Property type</span>
            <select
              data-field="category_id"
              required
              autoComplete="off"
              value={values.category_id}
              onChange={(event) => setValue("category_id", event.target.value)}
              className="input-field"
            >
              <option value="">Choose a type</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <ErrorText messages={state.fieldErrors?.category_id} />
          </label>
        </div>
      </section>

      {adminMode && (
        <section className="surface-card p-6">
          <h2 className="font-serif text-xl text-forest-deep">Admin controls</h2>
          <p className="mt-1 text-xs text-muted">Choose the owning account and how this listing should be published.</p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label>
              <span className="field-label">Property owner</span>
              <select
                value={ownerId}
                onChange={(event) => setOwnerId(event.target.value)}
                className="input-field"
              >
                <option value="">Choose an owner</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>{owner.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="field-label">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as PropertyStatus)}
                className="input-field"
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending review</option>
                <option value="approved">Approved</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-charcoal/75 md:col-span-2">
              <input
                type="checkbox"
                checked={featured}
                onChange={(event) => setFeatured(event.target.checked)}
                className="h-4 w-4 accent-[#123D32]"
              />
              Feature this property
            </label>
          </div>
        </section>
      )}

      <section className="surface-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl text-forest-deep">Enhanced details</h2>
            <p className="mt-1 text-xs text-muted">
              {isPremium
                ? adminMode
                  ? "All enhanced fields are available in the admin console."
                  : "Available with your Premium plan."
                  : adminMode
                    ? "This owner's current plan does not include these fields."
                    : "Upgrade to Premium to unlock these fields."}
            </p>
          </div>
          {!isPremium && !adminMode && <a href="/pricing" className="btn-secondary !py-2">Upgrade</a>}
        </div>

        {isPremium ? (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2">
              <span className="field-label">Full description</span>
              <textarea
                data-field="description"
                rows={7}
                maxLength={8000}
                autoComplete="off"
                value={values.description}
                onChange={(event) => setValue("description", event.target.value)}
                className="input-field"
              />
            </label>
            <label className="md:col-span-2">
              <span className="field-label">Address</span>
              <input
                data-field="address"
                autoComplete="off"
                value={values.address}
                onChange={(event) => setValue("address", event.target.value)}
                className="input-field"
              />
            </label>
            <label>
              <span className="field-label">Price per night (₹)</span>
              <input
                data-field="price_per_night"
                type="number"
                min={0}
                autoComplete="off"
                value={values.price_per_night}
                onChange={(event) => setValue("price_per_night", event.target.value)}
                className="input-field"
              />
            </label>
            <label>
              <span className="field-label">Map link</span>
              <input
                data-field="map_url"
                type="url"
                autoComplete="off"
                value={values.map_url}
                onChange={(event) => setValue("map_url", event.target.value)}
                className="input-field"
              />
            </label>
            <label>
              <span className="field-label">Contact phone</span>
              <input
                data-field="contact_phone"
                autoComplete="off"
                value={values.contact_phone}
                onChange={(event) => setValue("contact_phone", event.target.value)}
                className="input-field"
              />
            </label>
            <label>
              <span className="field-label">WhatsApp number</span>
              <input
                data-field="whatsapp_number"
                autoComplete="off"
                value={values.whatsapp_number}
                onChange={(event) => setValue("whatsapp_number", event.target.value)}
                className="input-field"
              />
            </label>
            <label>
              <span className="field-label">Contact email</span>
              <input
                data-field="contact_email"
                type="email"
                autoComplete="off"
                value={values.contact_email}
                onChange={(event) => setValue("contact_email", event.target.value)}
                className="input-field"
              />
            </label>
            <label>
              <span className="field-label">Website</span>
              <input
                data-field="website_url"
                type="url"
                autoComplete="off"
                value={values.website_url}
                onChange={(event) => setValue("website_url", event.target.value)}
                className="input-field"
              />
            </label>
            <label>
              <span className="field-label">Instagram</span>
              <input
                data-field="instagram_url"
                type="url"
                autoComplete="off"
                value={values.instagram_url}
                onChange={(event) => setValue("instagram_url", event.target.value)}
                className="input-field"
              />
            </label>
            <label>
              <span className="field-label">Facebook</span>
              <input
                data-field="facebook_url"
                type="url"
                autoComplete="off"
                value={values.facebook_url}
                onChange={(event) => setValue("facebook_url", event.target.value)}
                className="input-field"
              />
            </label>
            <label>
              <span className="field-label">Check-in time</span>
              <input
                data-field="check_in_time"
                placeholder="e.g. 2:00 PM"
                autoComplete="off"
                value={values.check_in_time}
                onChange={(event) => setValue("check_in_time", event.target.value)}
                className="input-field"
              />
            </label>
            <label>
              <span className="field-label">Check-out time</span>
              <input
                data-field="check_out_time"
                placeholder="e.g. 11:00 AM"
                autoComplete="off"
                value={values.check_out_time}
                onChange={(event) => setValue("check_out_time", event.target.value)}
                className="input-field"
              />
            </label>
            <label className="md:col-span-2">
              <span className="field-label">Highlights (one per line)</span>
              <textarea
                data-field="highlights"
                rows={5}
                autoComplete="off"
                value={values.highlights}
                onChange={(event) => setValue("highlights", event.target.value)}
                className="input-field"
              />
            </label>
            <fieldset className="md:col-span-2">
              <legend className="field-label">Amenities</legend>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {amenities.map((amenity) => (
                  <label key={amenity.id} className="flex items-center gap-2 text-sm text-charcoal/75">
                    <input
                      type="checkbox"
                      data-field="amenities"
                      checked={values.amenities.includes(amenity.id)}
                      onChange={(event) => toggleAmenity(amenity.id, event.target.checked)}
                      autoComplete="off"
                      className="h-4 w-4 accent-[#123D32]"
                    />
                    {amenity.name}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        ) : (
          <p className="mt-4 rounded-lg bg-sand/60 px-4 py-3 text-sm text-muted">
            Free listings include the name, short description, destination and property type. Add photos after saving.
          </p>
        )}
      </section>

      {state.message && (
        <p className={`rounded-lg px-4 py-3 text-sm ${state.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"}`}>
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-fit disabled:opacity-60">
        <Save size={15} /> {pending ? "Saving..." : property ? "Save changes" : "Create property"}
      </button>
    </form>
  );
}
