"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useLanguageStore } from "@/store/language-store";
import { getApiErrorMessage } from "@/lib/api-error-contract";

const initialForm = {
  fullName: "",
  phone: "",
  email: "",
  companyName: "",
  projectName: "",
  projectType: "Residential",
  area: "",
  paintType: "",
  message: "",
};

export default function QuoteRequestPage() {
  const { language } = useLanguageStore();
  const { data: session } = useSession();
  const [form, setForm] = useState({
    ...initialForm,
    fullName: session?.user?.name || "",
    email: session?.user?.email || "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, area: form.area ? Number(form.area) : undefined }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(getApiErrorMessage(data, "Không thể gửi yêu cầu"));
      }
      setSubmitted(true);
      toast.success(language === "vi" ? "Đã gửi yêu cầu báo giá." : "Quote request submitted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi yêu cầu");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="container mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-serif text-3xl font-bold text-warm-900">
          {language === "vi" ? "Yêu cầu đã được tiếp nhận" : "Request received"}
        </h1>
        <p className="mt-3 text-sm text-warm-600">
          {language === "vi"
            ? "Đội ngũ FLOF sẽ liên hệ với bạn trong thời gian sớm nhất."
            : "The FLOF team will contact you shortly."}
        </p>
      </main>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-warm-200 bg-white px-4 py-3 text-sm outline-none focus:border-jotun-teal";

  return (
    <main className="container mx-auto max-w-4xl px-6 py-16">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-warm-900">
          {language === "vi" ? "Yêu cầu báo giá công trình" : "Project Quote Request"}
        </h1>
        <p className="mt-2 text-sm text-warm-600">
          {language === "vi"
            ? "Cung cấp thông tin dự án để nhận định mức và báo giá phù hợp."
            : "Share project details to receive a tailored estimate and quotation."}
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-5 rounded-2xl border border-warm-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label htmlFor="quote-full-name" className="sr-only">Họ và tên</label>
        <input id="quote-full-name" required className={inputClass} placeholder="Họ và tên *" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
        <label htmlFor="quote-phone" className="sr-only">Số điện thoại</label>
        <input id="quote-phone" required className={inputClass} placeholder="Số điện thoại *" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        <label htmlFor="quote-email" className="sr-only">Email</label>
        <input id="quote-email" required type="email" className={inputClass} placeholder="Email *" value={form.email} onChange={(e) => update("email", e.target.value)} />
        <label htmlFor="quote-company" className="sr-only">Công ty hoặc tổ chức</label>
        <input id="quote-company" className={inputClass} placeholder="Công ty / tổ chức" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
        <label htmlFor="quote-project-name" className="sr-only">Tên dự án</label>
        <input id="quote-project-name" className={inputClass} placeholder="Tên dự án" value={form.projectName} onChange={(e) => update("projectName", e.target.value)} />
        <label htmlFor="quote-project-type" className="sr-only">Loại dự án</label>
        <select id="quote-project-type" className={inputClass} value={form.projectType} onChange={(e) => update("projectType", e.target.value)}>
          <option value="Residential">Nhà ở / Residential</option>
          <option value="Commercial">Thương mại / Commercial</option>
          <option value="Industrial">Công nghiệp / Industrial</option>
        </select>
        <label htmlFor="quote-area" className="sr-only">Diện tích dự kiến</label>
        <input id="quote-area" type="number" min="0" className={inputClass} placeholder="Diện tích dự kiến (m²)" value={form.area} onChange={(e) => update("area", e.target.value)} />
        <label htmlFor="quote-paint-type" className="sr-only">Loại sơn quan tâm</label>
        <input id="quote-paint-type" className={inputClass} placeholder="Loại sơn quan tâm" value={form.paintType} onChange={(e) => update("paintType", e.target.value)} />
        <label htmlFor="quote-message" className="sr-only">Mô tả nhu cầu</label>
        <textarea id="quote-message" required rows={5} className={`${inputClass} md:col-span-2`} placeholder="Mô tả nhu cầu *" value={form.message} onChange={(e) => update("message", e.target.value)} />
        <button disabled={submitting} className="rounded-xl bg-warm-900 px-6 py-3 font-bold text-white disabled:opacity-50 md:col-span-2">
          {submitting
            ? language === "vi" ? "Đang gửi..." : "Submitting..."
            : language === "vi" ? "Gửi yêu cầu báo giá" : "Submit quote request"}
        </button>
      </form>
    </main>
  );
}
