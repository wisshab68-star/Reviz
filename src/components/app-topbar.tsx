import Link from "next/link";

import { AuthButtons } from "@/components/auth-buttons";
import { RevizMascotDoodle } from "@/components/reviz-illustrations";
import { SidebarNav } from "@/components/sidebar-nav";

export function AppTopbar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Link href="/app" className="brand brand-minimal brand-chatgpt">
          <span>REVIZ</span>
        </Link>
        <div className="sidebar-brand-art" aria-hidden="true">
          <RevizMascotDoodle className="reviz-illustration reviz-illustration-mascot" />
        </div>
      </div>

      <div className="sidebar-auth">
        <AuthButtons />
      </div>

      <SidebarNav />
    </aside>
  );
}
