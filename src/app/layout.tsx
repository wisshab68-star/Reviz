import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import "@/styles/print.css";

export const metadata: Metadata = {
  title: "Reviz AI",
  description: "Reviz AI - Transforme tes revisions avec l'intelligence artificielle",
  openGraph: {
    title: "Reviz AI",
    description: "Reviz AI - Transforme tes revisions avec l'intelligence artificielle",
    type: "website",
    locale: "fr_FR",
    siteName: "Reviz AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
