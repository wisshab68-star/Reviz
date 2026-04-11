import type { ReactNode } from "react";

import { AppTopbar } from "@/components/app-topbar";

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
    </div>
  );
}
