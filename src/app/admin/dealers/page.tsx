import { AdminDealersClient } from "@/components/features/admin/dealers/AdminDealersClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - Quản lý Đại lý | FLOF Atelier",
  description: "Quản lý mạng lưới đại lý phân phối sơn FLOF",
};

export default function AdminDealersPage() {
  return <AdminDealersClient />;
}
