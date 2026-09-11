import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giỏ Hàng Sơn & Phụ Kiện - Maison de FLOF",
  description: "Xem và quản lý các sản phẩm sơn nước, sơn lót, phụ kiện đã chọn trong giỏ hàng Maison de FLOF.",
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
