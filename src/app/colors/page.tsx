import { Metadata } from "next";
import { ColorsClient } from "@/components/features/colors/ColorsClient";
import { getCachedColorsPageData } from "@/lib/catalog-page-data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Bảng màu sơn nước - Maison de FLOF",
  description: "Khám phá hàng ngàn màu sắc sơn nước tuyệt đẹp tại Maison de FLOF.",
};

export default async function ColorsPage() {
  const mappedColors = await getCachedColorsPageData();

  return <ColorsClient initialColors={mappedColors} />;
}
