import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đặt Lại Mật Khẩu - Maison de FLOF",
  description: "Thiết lập mật khẩu mới an toàn cho tài khoản Maison de FLOF.",
};

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
