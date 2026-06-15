"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minSpend: number;
  maxSpend: number | null;
  startDate: string;
  endDate: string;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
};

type CouponForm = {
  id: string;
  code: string;
  type: Coupon["type"];
  value: number;
  minSpend: number;
  maxSpend: string;
  startDate: string;
  endDate: string;
  usageLimit: string;
  isActive: boolean;
};

const today = new Date().toISOString().slice(0, 10);
const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
const emptyForm: CouponForm = {
  id: "",
  code: "",
  type: "PERCENTAGE",
  value: 10,
  minSpend: 0,
  maxSpend: "",
  startDate: today,
  endDate: nextMonth,
  usageLimit: "",
  isActive: true,
};

async function request(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Không thể xử lý yêu cầu");
  return data;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const loadCoupons = useCallback(async () => {
    try {
      setCoupons(await request("/api/admin/coupons"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải mã giảm giá");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await request("/api/admin/coupons", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          value: Number(form.value),
          minSpend: Number(form.minSpend),
          maxSpend: form.maxSpend === "" ? null : Number(form.maxSpend),
          usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
        }),
      });
      setForm(emptyForm);
      await loadCoupons();
      toast.success("Đã lưu mã giảm giá");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu mã giảm giá");
    }
  };

  const edit = (coupon: Coupon) => {
    setForm({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minSpend: coupon.minSpend,
      maxSpend: coupon.maxSpend === null ? "" : String(coupon.maxSpend),
      startDate: coupon.startDate.slice(0, 10),
      endDate: coupon.endDate.slice(0, 10),
      usageLimit: coupon.usageLimit === null ? "" : String(coupon.usageLimit),
      isActive: coupon.isActive,
    });
  };

  const deactivate = async (id: string) => {
    try {
      await request(`/api/admin/coupons?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await loadCoupons();
      toast.success("Đã ngừng mã giảm giá");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể ngừng mã giảm giá");
    }
  };

  const inputClass = "h-10 rounded-xl border border-warm-200 bg-white px-3 text-xs outline-none focus:border-jotun-teal";
  const labelClass = "mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-400";
  if (loading) return <div className="p-8 text-sm text-warm-500">Đang tải mã giảm giá...</div>;

  return (
    <div className="space-y-7 p-5 md:p-8">
      <header>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Mã giảm giá</h1>
        <p className="mt-1 text-xs text-warm-500">Coupon được backend xác thực lại khi checkout.</p>
      </header>

      <form onSubmit={save} className="grid gap-3 rounded-3xl border border-warm-200 bg-white p-5 shadow-sm md:grid-cols-4">
        <label>
          <span className={labelClass}>Mã coupon</span>
          <input required className={`${inputClass} w-full`} placeholder="Ví dụ: FLOF10" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
        </label>
        <label>
          <span className={labelClass}>Hình thức giảm giá</span>
          <select className={`${inputClass} w-full`} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Coupon["type"] })}>
            <option value="PERCENTAGE">Giảm phần trăm</option>
            <option value="FIXED">Giảm số tiền</option>
          </select>
        </label>
        <label>
          <span className={labelClass}>{form.type === "PERCENTAGE" ? "Phần trăm giảm (%)" : "Số tiền giảm (VNĐ)"}</span>
          <input required type="number" min="0.01" step="0.01" className={`${inputClass} w-full`} placeholder={form.type === "PERCENTAGE" ? "Ví dụ: 10" : "Ví dụ: 100000"} value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
        </label>
        <label>
          <span className={labelClass}>Giá trị đơn tối thiểu (VNĐ)</span>
          <input type="number" min="0" className={`${inputClass} w-full`} placeholder="0 = không yêu cầu tối thiểu" value={form.minSpend} onChange={(e) => setForm({ ...form, minSpend: Number(e.target.value) })} />
        </label>
        <label>
          <span className={labelClass}>Mức giảm tối đa (VNĐ)</span>
          <input type="number" min="0" className={`${inputClass} w-full`} placeholder="Để trống nếu không giới hạn" value={form.maxSpend} onChange={(e) => setForm({ ...form, maxSpend: e.target.value })} />
        </label>
        <label>
          <span className={labelClass}>Ngày bắt đầu</span>
          <input required type="date" className={`${inputClass} w-full`} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </label>
        <label>
          <span className={labelClass}>Ngày kết thúc</span>
          <input required type="date" className={`${inputClass} w-full`} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </label>
        <label>
          <span className={labelClass}>Giới hạn lượt sử dụng</span>
          <input type="number" min="1" className={`${inputClass} w-full`} placeholder="Để trống nếu không giới hạn" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} />
        </label>
        <label>
          <span className={labelClass}>Trạng thái coupon</span>
          <span className="flex h-10 items-center gap-2 rounded-xl border border-warm-200 px-3 text-xs">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            Đang hoạt động
          </span>
        </label>
        <div className="self-end">
          <button className="h-10 w-full rounded-xl bg-warm-900 px-5 text-xs font-bold text-white">{form.id ? "Cập nhật coupon" : "Tạo coupon"}</button>
        </div>
        {form.id && <div className="self-end"><button type="button" className="h-10 w-full rounded-xl border border-warm-200 px-5 text-xs font-bold" onClick={() => setForm(emptyForm)}>Hủy sửa</button></div>}
      </form>

      <div className="overflow-x-auto rounded-3xl border border-warm-200 bg-white p-5 shadow-sm">
        <table className="w-full min-w-[850px] text-left text-xs">
          <thead className="border-b border-warm-200 text-warm-500"><tr><th className="py-3">Mã</th><th>Giá trị</th><th>Điều kiện</th><th>Thời hạn</th><th>Đã dùng</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b border-warm-100">
                <td className="py-4 font-mono font-bold">{coupon.code}</td>
                <td>{coupon.type === "PERCENTAGE" ? `${coupon.value}%` : formatPrice(coupon.value)}</td>
                <td>Từ {formatPrice(coupon.minSpend)}{coupon.maxSpend ? `, tối đa ${formatPrice(coupon.maxSpend)}` : ""}</td>
                <td>{coupon.startDate.slice(0, 10)} đến {coupon.endDate.slice(0, 10)}</td>
                <td>{coupon.usageCount}/{coupon.usageLimit ?? "∞"}</td>
                <td>{coupon.isActive ? "Hoạt động" : "Đã tắt"}</td>
                <td className="space-x-3 text-right">
                  <button className="font-bold text-jotun-teal" onClick={() => edit(coupon)}>Sửa</button>
                  {coupon.isActive && <button className="font-bold text-red-500" onClick={() => deactivate(coupon.id)}>Tắt</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
