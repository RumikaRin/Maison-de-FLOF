import type { Metadata } from "next";
import { headers } from "next/headers";
import { Noto_Sans, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { SessionProvider } from "@/providers/session-provider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";
import { CartSync } from "@/components/layout/CartSync";
import { CspToaster } from "@/components/ui/csp-toast";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { GlobalNavigationLoader } from "@/components/layout/GlobalNavigationLoader";
import { LazyChatBubble } from "@/components/layout/LazyChatBubble";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { shouldEnableVercelTelemetry } from "@/lib/vercel-runtime";
import { resolveLocale } from "@/lib/locale";
import "./globals.css";

// Dynamic rendering is handled automatically by the headers() call below.
// Vercel CDN caching (s-maxage) is set in middleware for public pages.

const noto = Noto_Sans({
  subsets: ["vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto",
  display: "swap",
  adjustFontFallback: true,
});

const playfair = Playfair_Display({
  subsets: ["vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
  adjustFontFallback: true,
});

const bromise = localFont({
  src: "./fonts/bromise/bromise.ttf",
  variable: "--font-bromise",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "FLOF — Maison de FLOF Premium Paint Boutique | Sơn Cao Cấp Jotun, Dulux Chính Hãng",
  description: "Mua sơn cao cấp chính hãng Jotun, Dulux tại Maison de FLOF. Bảng màu thượng lưu, tư vấn phối màu AI trực quan và định mức sơn miễn phí.",
  keywords: ["mua sơn", "sơn nội thất", "sơn ngoại thất", "bảng màu sơn", "Jotun", "Dulux", "FLOF", "Maison de FLOF"],
  openGraph: {
    locale: "vi_VN",
    type: "website",
    siteName: "Maison de FLOF",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const locale = resolveLocale({
    pathname: "/",
    cookie: requestHeaders.get("x-locale"),
  });
  const enableVercelTelemetry = shouldEnableVercelTelemetry({
    VERCEL: process.env.VERCEL,
  });

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          as="image"
          href="/generated/hero-cinematic.jpg"
          fetchPriority="high"
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${noto.variable} ${playfair.variable} ${bromise.variable} antialiased min-h-screen flex flex-col bg-atelier-paper text-atelier-ink`}
      >
        {/* Pre-paint fl-js bootstrap (spec M2-M6): sets html.fl-js before the
            first paint so SSR-visible [data-fl-io] clusters never flash in,
            hide, then replay once fl-reveal.ts mounts. Nonced per the CSP's
            script-src 'self' 'nonce-...' 'strict-dynamic'. initFlReveal still
            sets the class too, as a no-JS-blocked fallback. */}
        <script
          suppressHydrationWarning
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: 'document.documentElement.classList.add("fl-js")',
          }}
        />
        {/* Strip third-party injected attributes (bis_skin_checked from
            system-level antivirus/security software) BEFORE React hydration
            compares the DOM. The MutationObserver catches any added
            mid-hydration. */}
        <script
          suppressHydrationWarning
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: '(function(){var a="bis_skin_checked";document.querySelectorAll("["+a+"]").forEach(function(e){e.removeAttribute(a)});new MutationObserver(function(ms){for(var i=0;i<ms.length;i++){ms[i].target.removeAttribute(a)}}).observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:[a]})})();',
          }}
        />
        <SessionProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableColorScheme={false}
              nonce={nonce}
            >
              <Header />
              <CartSync />
              <MainLayoutWrapper>
                {children}
              </MainLayoutWrapper>
              <Footer />
              <MobileBottomBar />
              <CspToaster />
              <ScrollToTop />
              <LazyChatBubble />
              <Suspense fallback={null}>
                <GlobalNavigationLoader />
              </Suspense>
              {enableVercelTelemetry ? (
                <>
                  <Analytics />
                  <SpeedInsights />
                </>
              ) : null}
            </ThemeProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
