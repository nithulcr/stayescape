import { notFound } from "next/navigation";
import { getAdminDestinations } from "@/lib/data/admin";
import { DestinationForm } from "@/components/admin/destination-form";

export default async function EditDestinationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const destinations = await getAdminDestinations();
  const destination = destinations.find((item) => item.id === id);
  if (!destination) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">Content</p>
      <h1 className="display-title mt-3 text-3xl md:text-4xl">Edit {destination.name}.</h1>
      <div className="surface-card mt-8 p-6">
        <DestinationForm destination={destination} />
      </div>
    </div>
  );
}
