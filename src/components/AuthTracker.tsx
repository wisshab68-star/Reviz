"use client";

import { useEffect } from "react";
import { trackSignupCompleted } from "@/lib/analytics";

const TRACKED_KEY = "reviz-auth-tracked";

export function AuthTracker({ userId }: { userId: string }) {
  useEffect(() => {
    if (sessionStorage.getItem(TRACKED_KEY)) return;
    sessionStorage.setItem(TRACKED_KEY, "1");
    trackSignupCompleted(userId);
  }, [userId]);

  return null;
}
