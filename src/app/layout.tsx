import type { Metadata } from "next";
import { headers } from "next/headers";
import { Noto_Sans, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { SessionProvider } from "@/providers/session-provider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";
import { CspToaster } from "@/components/ui/csp-toast";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { GlobalNavigationLoader } from "@/components/layout/GlobalNavigationLoader";
import { LazyChatBubble } from "@/components/layout/LazyChatBubble";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { shouldEnableVercelTelemetry } from "@/lib/vercel-runtime";
import "./globals.css";

// A strict per-request CSP nonce requires dynamic rendering so Next.js can
// attach the nonce to every framework and application script.
export const dynamic = "force-dynamic";

const noto = Noto_Sans({
  subsets: ["vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto",
});

const playfair = Playfair_Display({
  subsets: ["vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
});

const bromise = localFont({
  src: "./fonts/bromise/bromise.ttf",
  variable: "--font-bromise",
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
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const enableVercelTelemetry = shouldEnableVercelTelemetry({
    VERCEL: process.env.VERCEL,
  });

  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${noto.variable} ${playfair.variable} ${bromise.variable} antialiased min-h-screen flex flex-col bg-jotun-ivory grain-overlay`}
      >
        <SessionProvider>
          <QueryProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableColorScheme={false}
              nonce={nonce}
            >
              <Header />
              <MainLayoutWrapper>
                {children}
              </MainLayoutWrapper>
              <Footer />
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
