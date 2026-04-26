"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Reads ?ref=CODE from the URL and saves it in a 30-day cookie.
 * Drop this component in the landing page and /pricing.
 */
export function AffiliateTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && /^[A-Z0-9]{4,20}$/.test(ref.toUpperCase())) {
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      document.cookie = `reviz_ref=${ref.toUpperCase()}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    }
  }, [searchParams]);

  return null;
}
