import { AdminColorsClient } from "@/components/features/admin/colors/AdminColorsClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - Quản lý Màu sắc | FLOF Atelier",
  description: "Quản lý bộ sưu tập và bảng màu sơn atelier",
};

export default function AdminColorsPage() {
  return <AdminColorsClient />;
}
