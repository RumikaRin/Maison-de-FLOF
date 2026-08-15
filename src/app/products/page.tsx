import { Suspense } from "react";
import { Metadata } from "next";
import { ProductsClient } from "@/components/features/product/ProductsClient";
import { ProductsPageSkeleton } from "@/components/features/product/ProductsPageSkeleton";
import { getCachedProductsPageData } from "@/lib/catalog-page-data";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Sản phẩm sơn nước - Maison de FLOF",
  description: "Khám phá danh mục các sản phẩm sơn nước chất lượng cao tại Maison de FLOF.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsPageContent />
    </Suspense>
  );
}

async function ProductsPageContent() {
  const {
    mappedProducts,
    categories,
    suppliers,
    commerceAvailable,
  } = await getCachedProductsPageData();

  return (
    <ProductsClient
      initialPaints={mappedProducts}
      initialCategories={categories}
      initialSuppliers={suppliers}
      commerceAvailable={commerceAvailable}
    />
  );
}

