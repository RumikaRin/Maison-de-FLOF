import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng Nhập Tài Khoản - Maison de FLOF",
  description: "Đăng nhập tài khoản khách hàng hoặc quản trị viên Maison de FLOF.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
