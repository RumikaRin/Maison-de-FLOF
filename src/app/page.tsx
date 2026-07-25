import { HomeClient } from "@/components/features/home/HomeClient";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { getHomePageData } from "@/lib/home-page-data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Maison de FLOF - Sắc màu nghệ thuật",
  description: "Kiến tạo không gian sống đậm chất nghệ thuật với hàng ngàn màu sơn từ Maison de FLOF.",
};

export default async function HomePage() {
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
