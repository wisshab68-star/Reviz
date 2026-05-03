"use client";

import { useEffect } from "react";
import { trackSignupCompleted } from "@/lib/analytics";

const TRACKED_KEY_PREFIX = "reviz-signup-tracked:";

export function AuthTracker({ userId }: { userId: string }) {
  useEffect(() => {
    const key = `${TRACKED_KEY_PREFIX}${userId}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    trackSignupCompleted(userId);
  }, [userId]);

  return null;
}
