import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quên Mật Khẩu - Maison de FLOF",
  description: "Yêu cầu liên kết đặt lại mật khẩu cho tài khoản Maison de FLOF.",
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
