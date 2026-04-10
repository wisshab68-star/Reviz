import { AppTopbar } from "@/components/app-topbar";
import { SheetPreviewClient } from "@/components/sheet-preview-client";

export default function SheetPreviewPage() {
  return (
    <main className="app-layout">
      <AppTopbar />
      <SheetPreviewClient />
    </main>
  );
}
