import type { Metadata } from "next";
import Script from "next/script";
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
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-CQ10FGZVZC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CQ10FGZVZC');
          `}
        </Script>
      </head>
      <body>
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
