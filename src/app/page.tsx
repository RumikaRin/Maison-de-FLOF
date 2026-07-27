import { HomeClient } from "@/components/features/home/HomeClient";
import { HeroSection } from "@/components/features/home/HeroSection";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { getHomePageData } from "@/lib/home-page-data";
import { Suspense } from "react";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Maison de FLOF - Sắc màu nghệ thuật",
  description: "Kiến tạo không gian sống đậm chất nghệ thuật với hàng ngàn màu sơn từ Maison de FLOF.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Suspense fallback={<div className="min-h-[24rem] bg-atelier-paper" />}>
        <HomePageSections />
      </Suspense>
    </>
  );
}

async function HomePageSections() {
  const {
    mappedProducts,
    colors,
    mappedBlogs,
    source,
    commerceAvailable,
  } = await getHomePageData(db);

  return (
    <HomeClient
      initialPaints={mappedProducts}
      initialColors={colors}
      initialBlogs={mappedBlogs}
      catalogAvailability={{ source, commerceAvailable }}
    />
  );
}
