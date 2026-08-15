import { Suspense } from "react";
import { Metadata } from "next";
import { ColorsClient } from "@/components/features/colors/ColorsClient";
import { ColorsPageSkeleton } from "@/components/features/colors/ColorsPageSkeleton";
import { getCachedColorsPageData } from "@/lib/catalog-page-data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Bảng màu sơn nước - Maison de FLOF",
  description: "Khám phá hàng ngàn màu sắc sơn nước tuyệt đẹp tại Maison de FLOF.",
};

export default function ColorsPage() {
  return (
    <Suspense fallback={<ColorsPageSkeleton />}>
      <ColorsPageContent />
    </Suspense>
  );
}

async function ColorsPageContent() {
  const mappedColors = await getCachedColorsPageData();

  return <ColorsClient initialColors={mappedColors} />;
}

