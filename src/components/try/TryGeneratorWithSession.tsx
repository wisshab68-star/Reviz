"use client";

import { SessionProvider } from "next-auth/react";
import { TryGenerator } from "./TryGenerator";

export function TryGeneratorWithSession() {
  return (
    <SessionProvider>
      <TryGenerator />
    </SessionProvider>
  );
}
