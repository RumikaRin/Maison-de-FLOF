"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguageStore } from "@/store/language-store";
import { CustomSelect } from "@/components/ui/custom-select";

interface Quote {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  companyName?: string;
  projectName?: string;
  projectType: string;
  area?: number;
  paintType?: string;
  message: string;
  status: "PENDING" | "CONTACTED" | "QUOTED" | "CLOSED";
  adminNote: string;
  createdAt: string;
}

export default function AdminQuotesPage() {
  const { language } = useLanguageStore();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/quotes")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải báo giá");
        setQuotes(data);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  const updateQuote = async (quote: Quote, patch: Partial<Quote>) => {
    const response = await fetch("/api/admin/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...quote, ...patch }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Không thể cập nhật báo giá");
      return;
    }
    setQuotes((current) => current.map((item) => (item.id === data.id ? data : item)));
    toast.success(language === "vi" ? "Đã cập nhật yêu cầu báo giá." : "Quote updated.");
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h1 className="font-serif text-3xl font-bold text-warm-900">
          {language === "vi" ? "Yêu Cầu Báo Giá" : "Quote Requests"}
        </h1>
        <p className="mt-1 text-xs text-warm-550">
          {language === "vi" ? "Theo dõi và xử lý nhu cầu tư vấn công trình." : "Track and process project consultation requests."}
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-warm-200 bg-white p-10 text-center text-sm text-warm-500">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {quotes.map((quote) => (
            <article key={quote.id} className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-warm-900">{quote.fullName}</h2>
                    <span className="rounded bg-warm-100 px-2 py-1 text-[10px] font-bold">{quote.createdAt}</span>
                  </div>
                  <p className="mt-1 text-xs text-warm-600">{quote.phone} · {quote.email}</p>
                  <p className="mt-3 text-sm font-semibold text-warm-800">{quote.projectName || quote.projectType} {quote.area ? `· ${quote.area} m²` : ""}</p>
                  <p className="mt-2 text-xs leading-relaxed text-warm-600">{quote.message}</p>
                </div>
                <div className="w-full shrink-0 space-y-3 md:w-64">
                  <CustomSelect
                    value={quote.status}
                    onValueChange={(status) => updateQuote(quote, { status: status as Quote["status"] })}
                    options={[
                      { value: "PENDING", label: "PENDING" },
                      { value: "CONTACTED", label: "CONTACTED" },
                      { value: "QUOTED", label: "QUOTED" },
                      { value: "CLOSED", label: "CLOSED" },
                    ]}
                  />
                  <textarea
                    rows={3}
                    value={quote.adminNote}
                    onChange={(event) =>
                      setQuotes((current) =>
                        current.map((item) =>
                          item.id === quote.id ? { ...item, adminNote: event.target.value } : item,
                        ),
                      )
                    }
                    className="w-full rounded-xl border border-warm-200 p-3 text-xs outline-none focus:border-jotun-teal"
                    placeholder={language === "vi" ? "Ghi chú xử lý..." : "Admin note..."}
                  />
                  <button onClick={() => updateQuote(quote, {})} className="w-full rounded-xl bg-warm-900 px-4 py-2.5 text-xs font-bold text-white">
                    {language === "vi" ? "Lưu ghi chú" : "Save note"}
                  </button>
                </div>
              </div>
            </article>
          ))}
          {quotes.length === 0 && (
            <div className="rounded-2xl border border-warm-200 bg-white p-10 text-center text-sm text-warm-500">
              {language === "vi" ? "Chưa có yêu cầu báo giá." : "No quote requests yet."}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
