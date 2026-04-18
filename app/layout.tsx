import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { HeaderNavOverridesProvider } from "@/components/header/nav-overrides";

const isProduction = process.env.NEXT_PUBLIC_SITE_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  title: {
    template: "Pathetic",
    default: "Pathetic",
  },
  openGraph: {
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  robots: !isProduction ? "noindex, nofollow" : "index, follow",
};

const arialNarrow = localFont({
  src: [
    { path: "../public/fonts/Arial Narrow.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/Arial Narrow Italic.woff2", weight: "400", style: "italic" },
    { path: "../public/fonts/Arial Narrow Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/Arial Narrow Bold Italic.woff2", weight: "700", style: "italic" },
  ],
  variable: "--font-sans",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var root=document.documentElement;var pending=!!window.location.hash&&!window.__APP_CAME_VIA_CLIENT_NAV__;if(pending){root.setAttribute('data-initial-hash-pending','true');root.removeAttribute('data-initial-hash-ready');}else{root.setAttribute('data-initial-hash-ready','true');root.removeAttribute('data-initial-hash-pending');}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased overscroll-none",
          arialNarrow.variable
        )}
      >
        <ThemeProvider>
          <HeaderNavOverridesProvider>{children}</HeaderNavOverridesProvider>
        </ThemeProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
