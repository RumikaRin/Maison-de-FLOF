import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng Ký Thành Viên - Maison de FLOF",
  description: "Tạo tài khoản thành viên để nhận bảng màu miễn phí, tích điểm và theo dõi đơn hàng.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
