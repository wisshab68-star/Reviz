import { redirect } from "next/navigation";

import { AppTopbar } from "@/components/app-topbar";
import { LibraryClient } from "@/components/library-client";
import { MobileNav } from "@/components/mobile-nav";
import { getCurrentUserAccess } from "@/lib/user-access";

export default async function LibraryPage() {
  const access = await getCurrentUserAccess();

  if (!access) {
    redirect("/sign-in");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0F0F13", overflowX: "hidden" }}>
      <AppTopbar />
      <main
        className="app-main-content"
        style={{ flex: 1, minWidth: 0, width: "100%", background: "#0F0F13", overflowX: "hidden" }}
      >
        <div
          className="content-shell library-content-shell"
          style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 1.5rem 40px", background: "#0F0F13", width: "100%" }}
        >
          <section className="section-block library-section-block" style={{ background: "transparent" }}>
            <LibraryClient />
          </section>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
