import { Metadata } from "next";
import { db } from "@/lib/db";
import { ColorsClient } from "@/components/features/colors/ColorsClient";
import { getColorsPageData } from "@/lib/catalog-page-data";

export const metadata: Metadata = {
  title: "Bảng màu sơn nước - Maison de FLOF",
  description: "Khám phá hàng ngàn màu sắc sơn nước tuyệt đẹp tại Maison de FLOF.",
};

export default async function ColorsPage() {
  const mappedColors = await getColorsPageData(db);

  return <ColorsClient initialColors={mappedColors} />;
}
