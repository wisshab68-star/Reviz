import { SidebarNav } from "@/components/sidebar-nav";
import { getCurrentUserAccess } from "@/lib/user-access";

export async function AppTopbar() {
  const access = await getCurrentUserAccess();

  return (
    <aside
      className="sidebar"
      style={{
        width: "280px",
        minWidth: "280px",
        minHeight: "100vh",
        padding: "24px 18px",
        background: "#1A1A24",
        borderRight: "1px solid #2A2A38",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <SidebarNav
        initials={access?.initials ?? "R"}
        displayName={access?.displayName ?? "Invite"}
        email={access?.email ?? null}
        image={access?.image ?? null}
        subscriptionStatus={access?.subscriptionStatus ?? null}
      />
    </aside>
  );
}
