"use client";

import { useEffect } from "react";

export function DemoSeenTracker() {
  useEffect(() => {
    void fetch("/api/user/mark-demo-seen", {
      method: "POST",
    }).catch((error) => {
      console.error("Unable to mark demo as seen.", error);
    });
  }, []);

  return null;
}
