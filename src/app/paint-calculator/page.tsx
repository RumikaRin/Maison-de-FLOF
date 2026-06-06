"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { calculatePaint, PaintCalculatorResult } from "@/lib/paint-calculator";
import { formatPrice } from "@/lib/utils";
import { ChevronDown, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { MOCK_BLOGS } from "@/lib/mock-data";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";


const MOCK_CALC_PAINTS = [
  { id: "1", name: "Jotun Majestic Đẹp Hoàn Hảo", nameEn: "Jotun Majestic Perfect Beauty", coverage: 12, pricePerLiter: 190000 },
  { id: "2", name: "Jotun Essence Dễ Lau Chùi", nameEn: "Jotun Essence Easy Clean", coverage: 12, pricePerLiter: 84000 },
  { id: "3", name: "Jotun Jotashield Bền Màu Tối Ưu", nameEn: "Jotun Jotashield Extreme", coverage: 10, pricePerLiter: 270000 },
  { id: "4", name: "Dulux Weathershield Ngoại Thất", nameEn: "Dulux Weathershield Exterior", coverage: 11, pricePerLiter: 256000 },
  { id: "5", name: "Nippon Paint Weathergard", nameEn: "Nippon Paint Weathergard", coverage: 8, pricePerLiter: 95000 },
];

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 focus:border-warm-350 transition-colors text-warm-900";
const labelClass = "block text-[10px] font-bold text-warm-450 uppercase tracking-wider mb-1.5";

export default function PaintCalculatorPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const currentLang = mounted ? language : "vi";
  const t = useTrans(currentLang);

  const [length, setLength] = useState<string | number>("5");
  const [width, setWidth] = useState<string | number>("4");
  const [height, setHeight] = useState<string | number>("2.8");
  const [doors, setDoors] = useState<string | number>("1");
  const [windows, setWindows] = useState<string | number>("1");
  const [coats, setCoats] = useState<number>(2);
  const [selectedPaintId, setSelectedPaintId] = useState<string>("1");
  const [results, setResults] = useState<PaintCalculatorResult | null>(null);
  const [estCost, setEstCost] = useState<number>(0);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const activePaint = MOCK_CALC_PAINTS.find((p) => p.id === selectedPaintId) || MOCK_CALC_PAINTS[0];
    const calcResult = calculatePaint({
      length: Number(length) || 0,
      width: Number(width) || 0,
      height: Number(height) || 0,
      doors: Number(doors) || 0,
      windows: Number(windows) || 0,
      coats,
      coverage: activePaint.coverage,
    });
    setResults(calcResult);
    setEstCost(calcResult.litersNeeded * activePaint.pricePerLiter);
  };

  const handleReset = () => {
    setLength("5"); setWidth("4"); setHeight("2.8");
    setDoors("1"); setWindows("1"); setCoats(2);
    setSelectedPaintId("1"); setResults(null);
  };

  return (
    <div className="min-h-screen bg-jotun-ivory text-warm-900 transition-colors duration-300">
      {/* Page Header */}
      <div className="py-16 md:py-20 relative bg-jotun-ivory">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-warm-900 mb-4 tracking-tight">
            {t.calculatorTitle}
          </h1>
          <p className="text-warm-500 text-sm max-w-2xl mx-auto leading-relaxed font-medium">
            {t.calculatorSub}
          </p>
        </div>
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Input Form */}
          <form onSubmit={handleCalculate} className="lg:col-span-6 bg-white border border-warm-200/80 rounded-2xl p-6 md:p-8 flex flex-col gap-5 shadow-sm">
            <h2 className="font-serif font-bold text-xl text-warm-900 border-b border-warm-100 pb-4">
              {language === "vi" ? "Thông số phòng" : "Room dimensions"}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t.calcLength} (m)</label>
                <input type="number" step="0.1" min="0.1" value={length} onChange={(e) => setLength(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>{t.calcWidth} (m)</label>
                <input type="number" step="0.1" min="0.1" value={width} onChange={(e) => setWidth(e.target.value)} className={inputClass} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t.calcHeight} (m)</label>
                <input type="number" step="0.1" min="0.5" value={height} onChange={(e) => setHeight(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>{t.calcCoats}</label>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between font-semibold text-sm bg-white border-warm-200 text-warm-900 rounded-xl px-4 py-2.5 h-10 shadow-sm focus:ring-2 focus:ring-jotun-teal/20 focus:border-jotun-teal text-left"
                    >
                      <span className="truncate">
                        {coats === 1
                          ? `1 ${language === "vi" ? "lớp sơn lót" : "coat (primer)"}`
                          : coats === 2
                          ? `2 ${language === "vi" ? "lớp phủ màu" : "coats (topcoat)"}`
                          : `3 ${language === "vi" ? "lớp (1 lót + 2 phủ)" : "coats (1+2)"}`}
                      </span>
                      <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50">
                    <DropdownMenuRadioGroup value={String(coats)} onValueChange={(val) => setCoats(Number(val))}>
                      <DropdownMenuRadioItem value="1" className="text-xs font-semibold text-warm-900 cursor-pointer">
                        1 {language === "vi" ? "lớp sơn lót" : "coat (primer)"}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="2" className="text-xs font-semibold text-warm-900 cursor-pointer">
                        2 {language === "vi" ? "lớp phủ màu" : "coats (topcoat)"}
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="3" className="text-xs font-semibold text-warm-900 cursor-pointer">
                        3 {language === "vi" ? "lớp (1 lót + 2 phủ)" : "coats (1+2)"}
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t.calcDoors} {language === "vi" ? "(cửa)" : "(doors)"}</label>
                <input type="number" min="0" value={doors} onChange={(e) => setDoors(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t.calcWindows} {language === "vi" ? "(cửa sổ)" : "(windows)"}</label>
                <input type="number" min="0" value={windows} onChange={(e) => setWindows(e.target.value)} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>{t.calcPaintSelect}</label>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between font-semibold text-sm bg-white border-warm-200 text-warm-900 rounded-xl px-4 py-2.5 h-10 shadow-sm focus:ring-2 focus:ring-jotun-teal/20 focus:border-jotun-teal text-left"
                  >
                    <span className="truncate">
                      {(() => {
                        const p = MOCK_CALC_PAINTS.find((x) => x.id === selectedPaintId);
                        return p ? `${currentLang === "vi" ? p.name : p.nameEn} — ${p.coverage} m²/L` : "";
                      })()}
                    </span>
                    <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72 bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50">
                  <DropdownMenuRadioGroup value={selectedPaintId} onValueChange={setSelectedPaintId}>
                    {MOCK_CALC_PAINTS.map((p) => (
                      <DropdownMenuRadioItem
                        key={p.id}
                        value={p.id}
                        className="text-xs font-semibold text-warm-900 cursor-pointer"
                      >
                        {currentLang === "vi" ? p.name : p.nameEn} — {p.coverage} m²/L
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-warm-900 hover:bg-warm-850 text-white font-bold py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {t.calcButton}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-3 bg-warm-100 hover:bg-warm-200 text-warm-700 rounded-xl transition-colors font-bold text-sm flex items-center justify-center shadow-inner"
                title="Reset"
              >
                {language === "vi" ? "Đặt lại" : "Reset"}
              </button>
            </div>
          </form>

          {/* Results */}
          <div className="lg:col-span-6">
            {results ? (
              <div className="bg-white border border-warm-200/80 rounded-2xl p-6 md:p-8 flex flex-col gap-6 shadow-sm animate-fade-in">
                <h2 className="font-serif font-bold text-xl text-warm-900 border-b border-warm-100 pb-4">
                  {language === "vi" ? "Kết Quả Tính Toán" : "Calculation Results"}
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-warm-50/50 border border-warm-200 rounded-xl p-4">
                    <span className="block text-[10px] text-warm-450 uppercase font-bold tracking-wider mb-1">{t.calcResultArea}</span>
                    <span className="text-2xl font-bold text-warm-900">{results.totalArea} m²</span>
                  </div>
                  <div className="bg-jotun-teal/[0.03] border border-jotun-teal/20 rounded-xl p-4">
                    <span className="block text-[10px] text-jotun-teal uppercase font-bold tracking-wider mb-1">{t.calcResultLiters}</span>
                    <span className="text-2xl font-bold text-jotun-teal">{results.litersNeeded} L</span>
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-warm-450 uppercase tracking-wider mb-3">{t.calcResultThung}</span>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {[
                      { qty: results.cans["18L"], label: language === "vi" ? "Thùng 18L" : "Can 18L", color: "bg-warm-50/50 border-warm-200 text-warm-900" },
                      { qty: results.cans["5L"], label: language === "vi" ? "Lon 5L" : "Can 5L", color: "bg-emerald-500/[0.03] border-emerald-500/20 text-emerald-850" },
                      { qty: results.cans["1L"], label: language === "vi" ? "Lon 1L" : "Can 1L", color: "bg-amber-500/[0.03] border-amber-500/20 text-amber-850" },
                    ].map((can, i) => (
                      <div key={i} className={`${can.color} border rounded-xl p-3`}>
                        <span className="block text-xl font-bold">×{can.qty}</span>
                        <span className="text-[10px] text-warm-450 font-semibold">{can.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-warm-200 pt-5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-warm-700">{t.calcEstPrice}</span>
                  <span className="text-3xl font-extrabold text-jotun-teal font-mono">
                    {formatPrice(estCost)}
                  </span>
                </div>

                <div className="flex flex-col gap-1 text-xs bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl text-amber-900">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-amber-800">{language === "vi" ? "Lưu ý:" : "Note:"}</span>
                  <p>{t.calcNote}</p>
                </div>
              </div>
            ) : (
              <div className="bg-warm-50/50 border border-dashed border-warm-200/80 rounded-2xl h-full min-h-80 flex flex-col items-center justify-center text-center p-8 gap-2">
                <p className="font-serif font-bold text-lg text-warm-400">
                  {language === "vi" ? "Định Mức" : "Estimation"}
                </p>
                <div>
                  <p className="font-semibold text-warm-600 text-sm">
                    {language === "vi" ? "Nhập thông số và nhấn Tính toán" : "Enter dimensions and click Calculate"}
                  </p>
                  <p className="text-xs text-warm-500 mt-1">
                    {language === "vi" ? "Kết quả sẽ hiển thị ở đây." : "Results will appear here."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Related Articles Section */}
      <div className="border-t border-warm-200/60 py-20 bg-warm-50/20">
        <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 text-center">
          <div className="flex flex-col items-center mb-12 text-center">
            <span className="text-[10px] font-bold text-[#88734C] uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              {language === "vi" ? "TƯ VẤN & XU HƯỚNG" : "ADVICE & TRENDS"}
            </span>
            <h2 className="text-3xl font-serif font-bold text-warm-900 mb-2 tracking-tight">
              {language === "vi" ? "Bài Viết & Xu Hướng Nổi Bật" : "Featured Articles & Trends"}
            </h2>
            <div className="w-12 h-0.5 bg-[#88734C] mt-2 mb-4" />
            <p className="text-xs text-warm-500 max-w-md mx-auto">
              {language === "vi"
                ? "Khám phá các bí quyết chọn màu sơn và kỹ thuật thi công từ các chuyên gia thiết kế hàng đầu."
                : "Discover paint color secrets and execution techniques from leading design experts."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[...MOCK_BLOGS].reverse().map((blog) => (
              <div
                key={blog.id}
                className="bg-white border border-warm-200/80 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-500 flex flex-col sm:flex-row items-stretch group text-left"
              >
                {/* Image Left */}
                <div className="sm:w-2/5 relative min-h-[160px] sm:min-h-full bg-warm-100 overflow-hidden">
                  <Link href={`/blog/${blog.slug}`} className="absolute inset-0 block cursor-pointer">
                    <Image
                      src={blog.image}
                      alt={language === "vi" ? blog.title : blog.titleEn}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </Link>
                  <span className="bg-[#88734C] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-md absolute top-3 left-3 shadow-xs z-10">
                    {language === "vi" ? blog.category : blog.categoryEn}
                  </span>
                </div>

                {/* Text Right */}
                <div className="sm:w-3/5 p-5 flex flex-col justify-between">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono font-bold text-warm-400">
                      {blog.readTime}
                    </span>
                    <Link href={`/blog/${blog.slug}`} className="cursor-pointer">
                      <h4 className="font-serif font-bold text-sm md:text-base text-warm-900 group-hover:text-[#88734C] transition-colors leading-snug line-clamp-2">
                        {language === "vi" ? blog.title : blog.titleEn}
                      </h4>
                    </Link>
                    <p className="text-xs text-warm-500 line-clamp-3 leading-relaxed">
                      {language === "vi" ? blog.summary : blog.summaryEn}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/[0.03] flex items-center justify-between">
                    <span className="text-[9px] text-warm-400 font-semibold truncate max-w-[120px]">
                      {language === "vi" ? blog.author.split(" - ")[0] : "By Expert"}
                    </span>
                    <Link
                      href={`/blog/${blog.slug}`}
                      className="text-xs font-bold text-[#88734C] group-hover:text-[#78633F] transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>{language === "vi" ? "Đọc tiếp" : "Read more"}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
