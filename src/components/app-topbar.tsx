import Link from "next/link";

import { AuthButtons } from "@/components/auth-buttons";
import { SidebarNav } from "@/components/sidebar-nav";

export function AppTopbar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Link href="/app" className="brand brand-minimal brand-chatgpt">
          <span>Reviz</span>
        </Link>
      </div>

      <SidebarNav />

      <div className="sidebar-footer">
        <AuthButtons />
      </div>
    </aside>
  );
}
