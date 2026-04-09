import type { Metadata } from "next";
import "katex/dist/katex.min.css";
import "./globals.css";
import "@/styles/print.css";

export const metadata: Metadata = {
  title: "Prompt SaaS",
  description: "Genere des fiches de revision intelligentes a partir de n'importe quel cours.",
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
