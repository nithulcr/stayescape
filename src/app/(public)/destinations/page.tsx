import type { Metadata } from "next";
import { DestinationGrid } from "@/components/home/destination-grid";
import { getDestinations } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Explore Kerala’s most memorable staycation destinations, from Wayanad to the backwaters.",
};

export default async function DestinationsPage() {
  const destinations = await getDestinations();

  return (
    <div className="site-container py-12 md:py-16">
      <div className="mb-9 max-w-3xl">
        <p className="eyebrow"> Kerala destinations</p>
        <h1 className="display-title mt-3 text-[clamp(2.2rem,5vw,3.5rem)]">Where will you unwind?</h1>
        <p className="mt-4 text-sm text-muted md:text-base">
          Misty hills, backwaters, heritage streets and quiet beaches. Choose the mood, then find the stay.
        </p>
      </div>
      <DestinationGrid destinations={destinations} />
    </div>
  );
}
