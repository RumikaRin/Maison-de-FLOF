import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yêu Cầu Báo Giá Công Trình & Dự Án - Maison de FLOF",
  description: "Gửi thông tin công trình để nhận bảng định mức khối lượng và báo giá chiết khấu ưu đãi từ chuyên gia FLOF.",
};

export default function QuoteRequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
