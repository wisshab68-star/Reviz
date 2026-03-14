"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="sidebar-nav">
      <Link
        href="/app"
        className={`nav-link${pathname === "/app" ? " active" : ""}`}
      >
        Accueil
      </Link>
      <Link
        href="/library"
        className={`nav-link${pathname === "/library" ? " active" : ""}`}
      >
        Bibliotheque
      </Link>
    </nav>
  );
}
