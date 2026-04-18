"use client";

import { useEffect } from "react";

import { trackPricingPageViewed } from "@/lib/analytics";

export function PricingPageTracker() {
  useEffect(() => {
    trackPricingPageViewed();
  }, []);

  return null;
}
