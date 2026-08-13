/* Hallmark · genre: editorial · macrostructure: 05 Workbench · design-system: design.md · designed-as-app */
import VerifyEmailClient from "./verify-email-client";

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string; token?: string }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { email = "", token = "" } = await searchParams;
  return <VerifyEmailClient initialEmail={email} token={token} />;
}
