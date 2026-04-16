import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppTopbar } from "@/components/app-topbar";
import { MobileNav } from "@/components/mobile-nav";

export const metadata: Metadata = {
  themeColor: "#ffffff",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#0F0F13",
        overflowX: "hidden",
      }}
    >
      <AppTopbar />
      <div
        className="app-main-content"
        style={{
          flex: 1,
          minWidth: 0,
          width: "100%",
          background: "#0F0F13",
          overflowX: "hidden",
        }}
      >
        {children}
      </div>
      <MobileNav />
    </div>
  );
}
