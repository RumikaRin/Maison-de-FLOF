import { HomeClient } from "@/components/features/home/HomeClient";
import { HeroSection } from "@/components/features/home/HeroSection";
import { Metadata } from "next";
import { getCachedHomePageData } from "@/lib/home-page-data";
import { Suspense } from "react";

import { HomePageSkeleton } from "@/components/features/home/HomePageSkeleton";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Maison de FLOF - Sắc màu nghệ thuật",
  description: "Kiến tạo không gian sống đậm chất nghệ thuật với hàng ngàn màu sơn từ Maison de FLOF.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Suspense fallback={<HomePageSkeleton />}>
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
  } = await getCachedHomePageData();

  return (
    <HomeClient
      initialPaints={mappedProducts}
      initialColors={colors}
      initialBlogs={mappedBlogs}
      catalogAvailability={{ source, commerceAvailable }}
    />
  );
}
