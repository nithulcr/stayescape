import Image from "next/image";
import Link from "next/link";
import { deleteDestinationAction } from "@/app/admin/actions";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { getAdminDestinations } from "@/lib/data/admin";
import { media } from "@/lib/media";

export default async function AdminDestinationsPage() {
  const destinations = await getAdminDestinations();

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Content</p>
          <h1 className="display-title mt-3 text-4xl">Destinations.</h1>
        </div>
        <Link href="/admin/destinations/new" className="btn-primary">Add destination</Link>
      </div>

      <div className="mt-8">
        <div className="grid gap-3">
          {destinations.length ? (
            destinations.map((destination) => {
              const image = destination.image_url || (media[destination.slug as keyof typeof media] as string | undefined) || media.resort;
              return (
                <article key={destination.id} className="surface-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="relative h-20 w-full shrink-0 overflow-hidden rounded-lg bg-sand sm:w-28">
                    <Image src={image} alt="" fill sizes="112px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif text-lg text-forest-deep">{destination.name}</h2>
                      <StatusPill status={destination.is_active ? "active" : "expired"}>
                        {destination.is_active ? "Active" : "Hidden"}
                      </StatusPill>
                    </div>
                    <p className="mt-1 text-xs text-muted">/{destination.slug} · order {destination.sort_order}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/destinations/${destination.id}`} className="text-sm font-semibold text-forest">Edit</Link>
                    <form className="flex" action={deleteDestinationAction}>
                      <input type="hidden" className="text-sm" name="destinationId" value={destination.id} />
                      <button type="submit" className="text-sm text-rose-600">Delete</button>
                    </form>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState title="No destinations yet" description="Seed the database or add your first destination." />
          )}
        </div>
      </div>
    </>
  );
}
