"use client";

import { useEffect, useState } from "react";
import { toast } from "@/components/ui/csp-toast";

type Category = {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  _count: { paints: number };
};

type Supplier = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  _count: { paints: number; dealers: number };
};

const emptyCategory = { id: "", name: "", nameEn: "", slug: "", sortOrder: 0, isActive: true };
const emptySupplier = { id: "", name: "", slug: "", website: "", phone: "", email: "", isActive: true };

async function apiRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Không thể xử lý yêu cầu");
  return data;
}

export default function AdminCatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [supplierForm, setSupplierForm] = useState(emptySupplier);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [categoryData, supplierData] = await Promise.all([
        apiRequest("/api/admin/categories"),
        apiRequest("/api/admin/suppliers"),
      ]);
      setCategories(categoryData);
      setSuppliers(supplierData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiRequest("/api/admin/categories", {
        method: categoryForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryForm),
      });
      setCategoryForm(emptyCategory);
      await loadData();
      toast.success("Đã lưu danh mục");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu danh mục");
    }
  };

  const saveSupplier = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiRequest("/api/admin/suppliers", {
        method: supplierForm.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierForm),
      });
      setSupplierForm(emptySupplier);
      await loadData();
      toast.success("Đã lưu nhà cung cấp");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu nhà cung cấp");
    }
  };

  const deactivate = async (entity: "categories" | "suppliers", id: string) => {
    try {
      await apiRequest(`/api/admin/${entity}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await loadData();
      toast.success("Đã ngừng sử dụng");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật");
    }
  };

  if (loading) return <div className="p-8 text-sm text-warm-500">Đang tải danh mục...</div>;

  const inputClass = "h-10 rounded-xl border border-warm-200 bg-white px-3 text-xs outline-none focus:border-jotun-teal";
  const buttonClass = "h-10 rounded-xl bg-warm-900 px-5 text-xs font-bold text-white hover:bg-warm-700";

  return (
    <div className="space-y-8 p-5 md:p-8">
      <header>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Danh mục & Nhà cung cấp</h1>
        <p className="mt-1 text-xs text-warm-500">Dữ liệu này được dùng trực tiếp trong sản phẩm, bộ lọc và đại lý.</p>
      </header>

      <section className="rounded-3xl border border-warm-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-serif text-lg font-bold">Danh mục sản phẩm</h2>
        <form onSubmit={saveCategory} className="mb-5 grid gap-3 md:grid-cols-6">
          <input className={inputClass} required placeholder="Tên danh mục" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
          <input className={inputClass} placeholder="Tên tiếng Anh" value={categoryForm.nameEn} onChange={(e) => setCategoryForm({ ...categoryForm, nameEn: e.target.value })} />
          <input className={inputClass} placeholder="Slug (tự tạo nếu trống)" value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} />
          <input className={inputClass} type="number" min={0} placeholder="Thứ tự" value={categoryForm.sortOrder} onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: Number(e.target.value) })} />
          <label className="flex h-10 items-center gap-2 rounded-xl border border-warm-200 px-3 text-xs">
            <input type="checkbox" checked={categoryForm.isActive} onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })} />
            Đang hoạt động
          </label>
          <button className={buttonClass}>{categoryForm.id ? "Cập nhật" : "Thêm danh mục"}</button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-warm-200 text-warm-500"><tr><th className="py-3">Tên</th><th>Slug</th><th>Sản phẩm</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>
              {categories.map((item) => (
                <tr key={item.id} className="border-b border-warm-100">
                  <td className="py-3 font-bold">{item.name}</td><td>{item.slug}</td><td>{item._count.paints}</td><td>{item.isActive ? "Hoạt động" : "Đã tắt"}</td>
                  <td className="space-x-3 text-right">
                    <button className="font-bold text-jotun-teal" onClick={() => setCategoryForm({ id: item.id, name: item.name, nameEn: item.nameEn || "", slug: item.slug, sortOrder: item.sortOrder, isActive: item.isActive })}>Sửa</button>
                    {item.isActive && <button className="font-bold text-red-500" onClick={() => deactivate("categories", item.id)}>Tắt</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-warm-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-serif text-lg font-bold">Nhà cung cấp</h2>
        <form onSubmit={saveSupplier} className="mb-5 grid gap-3 md:grid-cols-4">
          <input className={inputClass} required placeholder="Tên nhà cung cấp" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} />
          <input className={inputClass} placeholder="Slug (tự tạo nếu trống)" value={supplierForm.slug} onChange={(e) => setSupplierForm({ ...supplierForm, slug: e.target.value })} />
          <input className={inputClass} type="url" placeholder="Website" value={supplierForm.website} onChange={(e) => setSupplierForm({ ...supplierForm, website: e.target.value })} />
          <input className={inputClass} placeholder="Điện thoại" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
          <input className={inputClass} type="email" placeholder="Email" value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} />
          <label className="flex h-10 items-center gap-2 rounded-xl border border-warm-200 px-3 text-xs">
            <input type="checkbox" checked={supplierForm.isActive} onChange={(e) => setSupplierForm({ ...supplierForm, isActive: e.target.checked })} />
            Đang hoạt động
          </label>
          <button className={buttonClass}>{supplierForm.id ? "Cập nhật" : "Thêm nhà cung cấp"}</button>
          {supplierForm.id && <button type="button" className="h-10 rounded-xl border border-warm-200 px-5 text-xs font-bold" onClick={() => setSupplierForm(emptySupplier)}>Hủy sửa</button>}
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-warm-200 text-warm-500"><tr><th className="py-3">Tên</th><th>Liên hệ</th><th>Sản phẩm</th><th>Đại lý</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>
              {suppliers.map((item) => (
                <tr key={item.id} className="border-b border-warm-100">
                  <td className="py-3 font-bold">{item.name}</td><td>{item.email || item.phone || "-"}</td><td>{item._count.paints}</td><td>{item._count.dealers}</td><td>{item.isActive ? "Hoạt động" : "Đã tắt"}</td>
                  <td className="space-x-3 text-right">
                    <button className="font-bold text-jotun-teal" onClick={() => setSupplierForm({ id: item.id, name: item.name, slug: item.slug, website: item.website || "", phone: item.phone || "", email: item.email || "", isActive: item.isActive })}>Sửa</button>
                    {item.isActive && <button className="font-bold text-red-500" onClick={() => deactivate("suppliers", item.id)}>Tắt</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
