import { AppTopbar } from "@/components/app-topbar";
import { MobileNav } from "@/components/mobile-nav";
import { SheetPreviewClient } from "@/components/sheet-preview-client";

export default function SheetPreviewPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0F0F13", overflowX: "hidden" }}>
      <AppTopbar />
      <main className="app-main-content" style={{ flex: 1, minWidth: 0, width: "100%", background: "#0F0F13", overflowX: "hidden" }}>
        <SheetPreviewClient />
      </main>
      <MobileNav />
    </div>
  );
}
