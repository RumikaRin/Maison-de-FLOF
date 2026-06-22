import { Metadata } from "next";
import { db } from "@/lib/db";
import { ColorsClient } from "@/components/features/colors/ColorsClient";

export const metadata: Metadata = {
  title: "Bảng màu sơn nước - Maison de FLOF",
  description: "Khám phá hàng ngàn màu sắc sơn nước tuyệt đẹp tại Maison de FLOF.",
};

export default async function ColorsPage() {
  const colors = await db.paintColor.findMany({
    include: {
      collection: true,
    },
    orderBy: { code: "asc" }
  });

  const mappedColors = colors.map((color) => ({
    id: color.id,
    code: color.code,
    name: color.name,
    nameEn: color.nameEn || color.name,
    hex: color.hex,
    rgb: color.rgb || "",
    hsl: color.hsl || "",
    toneFamily: color.toneFamily,
    colorFamily: color.colorFamily,
    isPopular: color.isPopular,
    isTrending: color.isTrending,
    previewImage: color.previewImage || "",
    collection: color.collection ? {
      id: color.collection.id,
      name: color.collection.name,
      nameEn: color.collection.nameEn || color.collection.name,
      slug: color.collection.slug,
      year: color.collection.year,
    } : null,
  }));

  return <ColorsClient initialColors={mappedColors} />;
}
