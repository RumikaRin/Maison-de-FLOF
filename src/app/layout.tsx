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
              <Toaster position="top-right" richColors />
            </ThemeProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

