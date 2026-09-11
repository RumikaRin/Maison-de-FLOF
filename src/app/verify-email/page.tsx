/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
import type { Metadata } from "next";
import VerifyEmailClient from "./verify-email-client";

export const metadata: Metadata = {
  title: "Xác Minh Email - Maison de FLOF",
  description: "Xác minh địa chỉ email để kích hoạt đầy đủ tính năng tài khoản Maison de FLOF.",
};

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string; token?: string }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { email = "", token = "" } = await searchParams;
  return <VerifyEmailClient initialEmail={email} token={token} />;
}
