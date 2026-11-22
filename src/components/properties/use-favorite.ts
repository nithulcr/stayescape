"use client";

import { useCallback, useEffect, useState } from "react";

const storageKey = "STAYESCAPE:favorites";

function readFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function useFavorite(propertyId: string) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const sync = () => setIsFavorite(readFavorites().includes(propertyId));
    sync();
    window.addEventListener(storageKey, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(storageKey, sync);
      window.removeEventListener("storage", sync);
    };
  }, [propertyId]);

  const toggle = useCallback(() => {
    const current = readFavorites();
    const next = current.includes(propertyId)
      ? current.filter((id) => id !== propertyId)
      : [...current, propertyId];
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new Event(storageKey));
  }, [propertyId]);

  return { isFavorite, toggle };
}
