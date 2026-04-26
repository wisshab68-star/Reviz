import type { Metadata } from "next";
import Script from "next/script";
import "katex/dist/katex.min.css";
import "./globals.css";
import "@/styles/print.css";

export const metadata: Metadata = {
  title: "Reviz — Fiches de révision bac 2026 en 30s | 3,99€/an",
  description: "Reviz génère tes fiches de révision bac 2026 en 30 secondes à partir de tes cours. 3,99€/an en abonnement annuel. Essaie maintenant sur revizai.app",
  keywords: "reviz, fiches révision bac 2026, révision bac, lycée 2026, app révision bac, fiches de révision",
  openGraph: {
    title: "Reviz — Fiches de révision bac 2026 en 30s",
    description: "Génère tes fiches de révision bac 2026 en 30 secondes. 3,99€/an.",
    url: "https://www.revizai.app",
    type: "website",
    locale: "fr_FR",
    siteName: "Reviz",
  },
  metadataBase: new URL("https://www.revizai.app"),
  verification: {
    google: "VlU7_UMUyaXY_Uv3zS_APlvDkqt6kq9nnZbg6TFCIEc",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        <link rel="canonical" href="https://www.revizai.app" />
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
        <Script id="schema-org" type="application/ld+json" strategy="beforeInteractive">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Reviz",
            "description": "Application de fiches de révision bac 2026 générées en 30 secondes par IA",
            "url": "https://revizai.app",
            "applicationCategory": "EducationalApplication",
            "offers": {
              "@type": "Offer",
              "price": "3.99",
              "priceCurrency": "EUR",
              "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "billingDuration": "P1Y"
              }
            },
            "audience": {
              "@type": "EducationalAudience",
              "educationalRole": "student"
            }
          })}
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
