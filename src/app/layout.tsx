import type { Metadata } from "next";
import { headers } from "next/headers";
import { Noto_Sans, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/providers/theme-provider";
import { SmoothScrollProvider } from "@/providers/smooth-scroll-provider";
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
import { AppRouterAnnouncer } from "@/components/csp-app-router-announcer";
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
        {/* Satisfy third-party extension (e.g. Urban VPN) config probes so they don't crash on M_ID */}
        <script
          data-config='{"config":{"properties":{"M_ID":"","M_TYPE":""}}}'
          suppressHydrationWarning
          nonce={nonce}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${noto.variable} ${playfair.variable} ${bromise.variable} antialiased min-h-screen flex flex-col bg-atelier-paper text-atelier-ink`}
      >
        {/* Sync JavaScript enhancement class on <html> synchronously, before
            any rendering or hydration, matching the nonce generated for
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
            mid-hydration.
            Also intercept and suppress runtime errors from third-party browser
            extensions (such as Urban VPN M_ID crash) so they cannot break the UI
            or trigger Next.js development overlay alerts. */}
        <script
          suppressHydrationWarning
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var a = "bis_skin_checked";
  document.querySelectorAll("[" + a + "]").forEach(function(e) { e.removeAttribute(a); });
  new MutationObserver(function(ms) {
    for (var i = 0; i < ms.length; i++) {
      ms[i].target.removeAttribute(a);
    }
  }).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: [a] });

  function isExtensionError(eventOrReason) {
    if (!eventOrReason) return false;
    var stack = (eventOrReason.error && eventOrReason.error.stack) || eventOrReason.stack || "";
    var filename = eventOrReason.filename || "";
    var message = (eventOrReason.message || "") + " " + (eventOrReason.reason && eventOrReason.reason.message ? eventOrReason.reason.message : "");
    return (
      filename.indexOf("chrome-extension://") !== -1 ||
      filename.indexOf("moz-extension://") !== -1 ||
      filename.indexOf("safari-web-extension://") !== -1 ||
      stack.indexOf("chrome-extension://") !== -1 ||
      stack.indexOf("moz-extension://") !== -1 ||
      stack.indexOf("safari-web-extension://") !== -1 ||
      message.indexOf("M_ID") !== -1 ||
      message.indexOf("eppiocemhmnlbhjplcgkofciiegomcon") !== -1
    );
  }

  window.addEventListener("error", function(e) {
    if (isExtensionError(e)) {
      e.stopImmediatePropagation();
      e.preventDefault();
      return true;
    }
  }, true);

  window.addEventListener("unhandledrejection", function(e) {
    if (isExtensionError(e.reason || e)) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);
})();`,
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
              <SmoothScrollProvider>
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
              </SmoothScrollProvider>
            </ThemeProvider>
          </QueryProvider>
        </SessionProvider>
        <AppRouterAnnouncer />
      </body>
    </html>
  );
}
