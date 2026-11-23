"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { districtOptions } from "@/lib/config";
import type { CategoryRow, DestinationRow } from "@/types/database.types";

export function HeroSearch({
  destinations,
  categories,
}: {
  destinations: DestinationRow[];
  categories: CategoryRow[];
}) {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [district, setDistrict] = useState("");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (destination) params.set("destination", destination);
    if (district) params.set("district", district);
    if (category) params.set("category", category);
    router.push(`/properties${params.size ? `?${params.toString()}` : ""}`);
  };

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 rounded-lg bg-white/70 p-3 md:p-5 shadow-[0_24px_70px_-30px_rgba(8,32,25,0.6)] backdrop-blur md:grid-cols-[1.2fr_1fr_1fr_1fr_auto] md:items-center"
    >
      <label className="block px-2 md:px-3 py-1">
        <span className="field-label !mb-1 !text-[0.65rem] !uppercase !tracking-wider">
          Where to?
        </span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search stays by name"
          className="w-full border-0 bg-transparent px-0 py-2 text-sm text-black outline-none placeholder:text-black/70 focus:ring-0"
        />
      </label>

      <label className="block border-t border-forest/30 px-2 md:px-3 py-1 md:border-l  md:border-t-0">
        <span className="field-label !mb-1 !text-[0.65rem] !uppercase !tracking-wider">
          Destination
        </span>
        <select
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          className="w-full cursor-pointer border-0 bg-transparent px-0 py-2 text-sm text-black  outline-none focus:ring-0"
        >
          <option value="">All destinations</option>
          {destinations.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block border-t border-forest/30 px-2 md:px-3 py-1 md:border-l md:border-t-0">
        <span className="field-label !mb-1 !text-[0.65rem] !uppercase !tracking-wider">
          District
        </span>
        <select
          value={district}
          onChange={(event) => setDistrict(event.target.value)}
          className="w-full cursor-pointer border-0 bg-transparent px-0 py-2 text-sm text-black outline-none focus:ring-0"
        >
          <option value="">All districts</option>
          {districtOptions.map((item) => (
            <option key={item.slug} value={item.slug}>{item.name}</option>
          ))}
        </select>
      </label>

      <label className="block border-t border-forest/30 px-2 md:px-3 py-1 md:border-l md:border-t-0">
        <span className="field-label !mb-1 !text-[0.65rem] !uppercase !tracking-wider">
          Stay type
        </span>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full cursor-pointer border-0 bg-transparent px-0 py-2 text-sm text-black  outline-none focus:ring-0"
        >
          <option value="">All stay types</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <div className=" md:border-l border-forest/30 pl-3">
        <button
          type="submit"
          className="btn-secondary h-12 w-full md:w-auto md:px-6"
        >
          <Search size={16} /> Search Property
        </button>
      </div>
    </form>
  );
}
