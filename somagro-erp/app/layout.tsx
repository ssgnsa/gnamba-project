import "./globals.css";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import localFont from "next/font/local";
import { resolveSupabaseConfig } from "@/lib/supabase/config";

const displayFont = localFont({
  src: "../public/fonts/Fraunces-Variable.ttf",
  variable: "--font-display",
  display: "swap",
});

const bodyFont = localFont({
  src: "../public/fonts/Manrope-Variable.ttf",
  variable: "--font-body",
  display: "swap",
});

// eslint-disable-next-line react-refresh/only-export-components
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#064e3b",
};

// eslint-disable-next-line react-refresh/only-export-components
export const metadata = {
  title: "SomAgro ERP",
  description: "Unified ERP for multi-service agricultural operations",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "SomAgro ERP",
    "format-detection": "telephone=no",
  },
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  const host = headers().get("host") ?? "";
  const supabaseConfig = resolveSupabaseConfig(host);

  return (
    <html lang="fr" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-[var(--font-body)]">
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__SOMAGRO_SUPABASE__ = ${JSON.stringify({
              url: supabaseConfig.url,
              anonKey: supabaseConfig.anonKey,
              mode: supabaseConfig.mode,
            })};`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
