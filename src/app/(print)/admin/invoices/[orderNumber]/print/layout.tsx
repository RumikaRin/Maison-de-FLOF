// This route group escapes the admin sidebar chrome (src/app/admin/layout.tsx)
// and the public header/footer/chat so the invoice renders as a clean,
// standalone paper document ready for Ctrl/Cmd + P → "Save as PDF".
//
// Access is enforced server-side in page.tsx AND at the edge by middleware
// (any /admin/* path requires an authenticated ADMIN/STAFF session — see
// src/auth.config.ts `authorized`).
export default function InvoicePrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
