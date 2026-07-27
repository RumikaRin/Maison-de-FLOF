/* Hallmark · genre: editorial · macrostructure: 08 Photographic (Workbench-adjacent form) · design-system: design.md · designed-as-app */
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "@/components/ui/csp-toast";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { getApiErrorMessage } from "@/lib/api-error-contract";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EditorialHeading } from "@/components/ui/editorial";

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
  const t = useTrans(language);
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

  // Native select restyled to match the retuned Input — square-edged well on a
  // hairline border. Behaviour is untouched.
  const selectClass =
    "flex min-h-11 w-full rounded-control border border-atelier-rule-strong bg-atelier-paper-2 px-3 py-2 text-fl-sm text-atelier-ink transition-colors duration-fl-fast ease-fl-out hover:border-atelier-ink-3 focus-visible:border-atelier-accent md:min-h-10";

  if (submitted) {
    return (
      <main className="min-h-[60vh] bg-atelier-paper text-atelier-ink">
        {/* Intentional editorial success state: a rule, a line of Playfair, silence. */}
        <div className="lg:border-x lg:border-atelier-rule mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] py-fl-3xl">
          <div className="max-w-xl border-t border-atelier-rule-strong pt-fl-md">
            <p className="fl-label">{t.quotePageLabel}</p>
            <h1 className="fl-display mt-fl-xs text-fl-3xl">
              {language === "vi" ? "Yêu cầu đã được tiếp nhận" : "Request received"}
            </h1>
            <p className="mt-fl-sm text-fl-sm text-atelier-ink-2">
              {language === "vi"
                ? "Đội ngũ FLOF sẽ liên hệ với bạn trong thời gian sớm nhất."
                : "The FLOF team will contact you shortly."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-atelier-paper text-atelier-ink">
      <div className="lg:border-x lg:border-atelier-rule mx-auto w-full max-w-[100rem] px-[clamp(1rem,4vw,1.5rem)] py-fl-2xl md:py-fl-3xl">
        <div className="max-w-2xl">
          <EditorialHeading as="h1" scale="3xl" label={t.quotePageLabel}>
            {language === "vi" ? "Yêu cầu báo giá công trình" : "Project quote request"}
          </EditorialHeading>
          <p className="fl-measure-tight mt-fl-sm text-fl-sm text-atelier-ink-2">
            {language === "vi"
              ? "Cung cấp thông tin dự án để nhận định mức và báo giá phù hợp."
              : "Share project details to receive a tailored estimate and quotation."}
          </p>
        </div>

        {/* The form sits directly on the page — structure on hairlines, no card chrome */}
        <form
          onSubmit={submit}
          className="mt-fl-lg grid max-w-3xl grid-cols-1 gap-x-fl-lg gap-y-fl-md border-t border-atelier-rule pt-fl-lg md:grid-cols-2"
        >
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="quote-full-name">{t.fullName} *</Label>
            <Input id="quote-full-name" required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          </div>
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="quote-phone">{t.phone} *</Label>
            <Input id="quote-phone" required value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="quote-email">{t.email} *</Label>
            <Input id="quote-email" required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="quote-company">{t.companyName}</Label>
            <Input id="quote-company" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
          </div>
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="quote-project-name">{t.projectName}</Label>
            <Input id="quote-project-name" value={form.projectName} onChange={(e) => update("projectName", e.target.value)} />
          </div>
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="quote-project-type">{t.projectType}</Label>
            <select
              id="quote-project-type"
              className={selectClass}
              value={form.projectType}
              onChange={(e) => update("projectType", e.target.value)}
            >
              <option value="Residential">{t.projectTypeRes}</option>
              <option value="Commercial">{t.projectTypeComm}</option>
              <option value="Industrial">{t.projectTypeInd}</option>
            </select>
          </div>
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="quote-area">{t.paintArea}</Label>
            <Input id="quote-area" type="number" min="0" value={form.area} onChange={(e) => update("area", e.target.value)} />
          </div>
          <div className="flex flex-col gap-fl-2xs">
            <Label htmlFor="quote-paint-type">{t.paintTypeReq}</Label>
            <Input id="quote-paint-type" value={form.paintType} onChange={(e) => update("paintType", e.target.value)} />
          </div>
          <div className="flex flex-col gap-fl-2xs md:col-span-2">
            <Label htmlFor="quote-message">{t.messageNote} *</Label>
            <Textarea id="quote-message" required rows={5} value={form.message} onChange={(e) => update("message", e.target.value)} />
          </div>
          <div className="border-t border-atelier-rule pt-fl-md md:col-span-2">
            <Button
              type="submit"
              disabled={submitting}
              data-state={submitting ? "loading" : undefined}
            >
              {submitting
                ? language === "vi" ? "Đang gửi..." : "Submitting..."
                : t.submitQuote}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
