import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tìm Đại Lý Sơn Chính Hãng Toàn Quốc - Maison de FLOF",
  description: "Tra cứu hệ thống showroom và đại lý ủy quyền sơn Jotun, Dulux chính hãng của Maison de FLOF trên toàn quốc.",
};

export default function FindDealerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
