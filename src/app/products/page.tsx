import { Metadata } from "next";
import { db } from "@/lib/db";
import { ProductsClient } from "@/components/features/product/ProductsClient";
import { getProductsPageData } from "@/lib/catalog-page-data";

export const metadata: Metadata = {
  title: "Sản phẩm sơn nước - Maison de FLOF",
  description: "Khám phá danh mục các sản phẩm sơn nước chất lượng cao tại Maison de FLOF.",
};

export default async function ProductsPage() {
  const { mappedProducts, categories, suppliers } = await getProductsPageData(db);

  return (
    <ProductsClient
      initialPaints={mappedProducts}
      initialCategories={categories}
      initialSuppliers={suppliers}
    />
  );
}
