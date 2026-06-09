import type { Metadata } from "next";
import { Noto_Sans, Playfair_Display } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";
import { SessionProvider } from "@/providers/session-provider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";
import { Toaster } from "sonner";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import "./globals.css";

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
  title: "FLOF — Maison de FLOF Premium Paint Boutique | Sơn Cao Cấp Jotun, Dulux Chính Hãng",
  description: "Mua sơn cao cấp chính hãng Jotun, Dulux tại Maison de FLOF. Bảng màu thượng lưu, tư vấn phối màu AI trực quan và định mức sơn miễn phí.",
  keywords: ["mua sơn", "sơn nội thất", "sơn ngoại thất", "bảng màu sơn", "Jotun", "Dulux", "FLOF", "Maison de FLOF"],
  openGraph: {
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
              disableTransitionOnChange
            >
              <Header />
              <MainLayoutWrapper>
                {children}
              </MainLayoutWrapper>
              <Footer />
              <Toaster
                position="top-right"
                offset={{ top: 96, right: 20 }}
                expand={false}
                gap={10}
                toastOptions={{
                  duration: 3500,
                  classNames: {
                    toast:
                      "group font-sans text-sm rounded-2xl border border-[#e8e2da] bg-white/95 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.07),0_2px_8px_rgba(0,0,0,0.04)] px-4 py-3.5 flex gap-3 items-start",
                    title: "font-semibold text-[13px] text-[#1c1917] leading-snug",
                    description: "text-[11.5px] text-[#78716c] leading-relaxed mt-0.5",
                    success:
                      "border-[#d1fae5] bg-white/95 [&>[data-icon]]:text-emerald-500",
                    error:
                      "border-[#fee2e2] bg-white/95 [&>[data-icon]]:text-red-500",
                    warning:
                      "border-[#fef3c7] bg-white/95 [&>[data-icon]]:text-amber-500",
                    info:
                      "border-[#dbeafe] bg-white/95 [&>[data-icon]]:text-sky-500",
                    closeButton:
                      "rounded-full bg-[#f5f0eb] hover:bg-[#ebe5de] text-[#78716c] hover:text-[#1c1917] border border-[#e8e2da] transition-colors",
                    actionButton:
                      "bg-[#1c1917] text-white text-[11px] font-bold rounded-xl px-3 py-1.5 hover:bg-[#292524] transition-colors",
                    cancelButton:
                      "bg-[#f5f0eb] text-[#78716c] text-[11px] font-bold rounded-xl px-3 py-1.5 hover:bg-[#ebe5de] transition-colors",
                  },
                }}
              />
              <ScrollToTop />
            </ThemeProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

