import { AdminPaintsClient } from "@/components/features/admin/paints/AdminPaintsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - Products Management",
  description: "Manage paints, products, pricing, and swatches linkage.",
};

export default function AdminPaintsPage() {
  return <AdminPaintsClient />;
}
