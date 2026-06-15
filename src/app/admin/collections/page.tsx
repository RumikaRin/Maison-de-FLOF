"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type Collection = {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  description: string | null;
  image: string | null;
  year: number;
  isActive: boolean;
  _count: { colors: number };
};

const emptyCollection = {
  id: "",
  name: "",
  nameEn: "",
  slug: "",
  description: "",
  image: "",
  year: new Date().getFullYear(),
  isActive: true,
};

async function apiRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Không thể xử lý yêu cầu");
  return data;
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [form, setForm] = useState(emptyCollection);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setCollections(await apiRequest("/api/admin/collections"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải bộ sưu tập");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await apiRequest("/api/admin/collections", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setForm(emptyCollection);
      await loadData();
      toast.success("Đã lưu bộ sưu tập màu");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu bộ sưu tập");
    }
  };

  const deactivate = async (id: string) => {
    try {
      await apiRequest(`/api/admin/collections?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await loadData();
      toast.success("Đã ngừng sử dụng bộ sưu tập");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể cập nhật bộ sưu tập");
    }
  };

  if (loading) return <div className="p-8 text-sm text-warm-500">Đang tải bộ sưu tập màu...</div>;

  const inputClass = "h-10 rounded-xl border border-warm-200 bg-white px-3 text-xs outline-none focus:border-jotun-teal";
  const buttonClass = "h-10 rounded-xl bg-warm-900 px-5 text-xs font-bold text-white hover:bg-warm-700";

  return (
    <div className="space-y-8 p-5 md:p-8">
      <header>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Bộ sưu tập màu</h1>
        <p className="mt-1 text-xs text-warm-500">Quản lý nhóm màu theo chủ đề, năm phát hành và trạng thái hiển thị.</p>
      </header>

      <section className="rounded-3xl border border-warm-200 bg-white p-5 shadow-sm">
        <form onSubmit={save} className="mb-6 grid gap-3 md:grid-cols-4">
          <input className={inputClass} required placeholder="Tên bộ sưu tập" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={inputClass} placeholder="Tên tiếng Anh" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
          <input className={inputClass} placeholder="Slug (tự tạo nếu trống)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <input className={inputClass} type="number" min={1900} max={2200} required value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
          <input className={`${inputClass} md:col-span-2`} placeholder="URL ảnh đại diện" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
          <input className={`${inputClass} md:col-span-2`} placeholder="Mô tả ngắn" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="flex h-10 items-center gap-2 rounded-xl border border-warm-200 px-3 text-xs">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Đang hoạt động
          </label>
          <button className={buttonClass}>{form.id ? "Cập nhật" : "Thêm bộ sưu tập"}</button>
          {form.id && <button type="button" className="h-10 rounded-xl border border-warm-200 px-5 text-xs font-bold" onClick={() => setForm(emptyCollection)}>Hủy sửa</button>}
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-warm-200 text-warm-500">
              <tr><th className="py-3">Tên</th><th>Slug</th><th>Năm</th><th>Số màu</th><th>Trạng thái</th><th /></tr>
            </thead>
            <tbody>
              {collections.map((item) => (
                <tr key={item.id} className="border-b border-warm-100">
                  <td className="py-3 font-bold">{item.name}</td>
                  <td>{item.slug}</td>
                  <td>{item.year}</td>
                  <td>{item._count.colors}</td>
                  <td>{item.isActive ? "Hoạt động" : "Đã tắt"}</td>
                  <td className="space-x-3 text-right">
                    <button className="font-bold text-jotun-teal" onClick={() => setForm({ id: item.id, name: item.name, nameEn: item.nameEn || "", slug: item.slug, description: item.description || "", image: item.image || "", year: item.year, isActive: item.isActive })}>Sửa</button>
                    {item.isActive && <button className="font-bold text-red-500" onClick={() => deactivate(item.id)}>Tắt</button>}
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
