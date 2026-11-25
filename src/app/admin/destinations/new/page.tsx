import { DestinationForm } from "@/components/admin/destination-form";

export default function NewDestinationPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow">Content</p>
      <h1 className="display-title mt-3 text-3xl md:text-4xl">Add a destination.</h1>
      <div className="surface-card mt-8 p-6">
        <DestinationForm />
      </div>
    </div>
  );
}
