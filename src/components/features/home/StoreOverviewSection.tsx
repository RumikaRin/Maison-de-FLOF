"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPin, PaintBucket, ShieldCheck, Truck } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";

/**
 * Editorial "article" block: store overview for a paint retailer
 * (not a blog post from DB - fixed brand story on homepage).
 */
export function StoreOverviewSection() {
  const { language } = useLanguageStore();
  const reduceMotion = useReducedMotion();

  const pillars = [
    {
      icon: PaintBucket,
      titleVi: "Catalog sơn đầy đủ",
      titleEn: "Full paint catalog",
      bodyVi: "Nội thất, ngoại thất, lót, chống thấm - kèm finish và thông số coverage.",
      bodyEn: "Interior, exterior, primers, waterproofing - with finish and coverage specs.",
    },
    {
      icon: ShieldCheck,
      titleVi: "Màu & chất lượng",
      titleEn: "Color & quality",
      bodyVi: "Hơn 1000 mã màu, visualizer phòng mẫu, sản phẩm chính hãng có theo dõi tồn.",
      bodyEn: "1000+ color codes, room visualizer, authentic stock with inventory tracking.",
    },
    {
      icon: Truck,
      titleVi: "Mua online linh hoạt",
      titleEn: "Flexible online buying",
      bodyVi: "Giỏ hàng, mã giảm giá, COD / chuyển khoản / VNPay demo, theo dõi đơn trong hồ sơ.",
      bodyEn: "Cart, coupons, COD / transfer / VNPay demo, track orders in your profile.",
    },
    {
      icon: MapPin,
      titleVi: "Đại lý gần bạn",
      titleEn: "Dealers near you",
      bodyVi: "Bản đồ đại lý ủy quyền theo tỉnh/thành - mua online hoặc ghé cửa hàng.",
      bodyEn: "Authorized dealer map by province - buy online or visit in person.",
    },
  ];

  return (
    <section id="store-overview" className="py-20 md:py-28 bg-jotun-ivory relative overflow-hidden">
      <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">
        {/* Article header */}
        <motion.header
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-10 md:mb-14"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-8 bg-jotun-teal" />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-jotun-teal">
              {language === "vi" ? "Bài viết" : "Article"}
            </p>
          </div>
          <p className="text-[11px] font-semibold text-warm-450 uppercase tracking-wide mb-2">
            {language === "vi" ? "Tổng quan cửa hàng · 5 phút đọc" : "Store overview · 5 min read"}
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-warm-950 leading-tight">
            {language === "vi"
              ? "Maison de FLOF: cửa hàng sơn nước hiện đại cho ngôi nhà Việt"
              : "Maison de FLOF: a modern paint store for Vietnamese homes"}
          </h2>
          <p className="mt-4 text-sm md:text-base text-warm-550 leading-relaxed">
            {language === "vi"
              ? "FLOF kết hợp showroom số và thương mại điện tử: chọn màu, phối trên phòng mẫu, đặt hàng online hoặc tìm đại lý ủy quyền gần nhà. Dưới đây là bức tranh tổng quan về những gì cửa hàng mang lại."
              : "FLOF blends a digital showroom with e-commerce: pick colors, preview on sample rooms, order online, or find an authorized dealer nearby. Here is what the store offers at a glance."}
          </p>
        </motion.header>

        {/* Lead image + pull quote */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-12 md:mb-16">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-8 relative aspect-[16/10] rounded-[1.5rem] overflow-hidden border border-warm-200 shadow-[0_20px_50px_rgba(47,40,34,0.08)]"
          >
            <Image
              src="/generated/hero-cinematic.jpg"
              alt={language === "vi" ? "Không gian sống với sơn FLOF" : "Living space with FLOF paint"}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
          </motion.div>
          <motion.aside
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: reduceMotion ? 0 : 0.06 }}
            className="lg:col-span-4 flex flex-col justify-between rounded-[1.5rem] bg-warm-900 text-white p-6 md:p-8 min-h-[240px]"
          >
            <p className="font-serif text-xl md:text-2xl leading-snug text-white/95">
              {language === "vi"
                ? "“Chọn màu không còn là đoán mò - bạn thấy trước, rồi mới mua.”"
                : "“Choosing color is no longer guesswork - you preview, then buy.”"}
            </p>
            <div className="mt-8">
              <p className="text-xs font-bold text-jotun-teal">Maison de FLOF</p>
              <p className="text-[11px] text-white/50 mt-0.5">
                {language === "vi" ? "Nền tảng sơn & tư vấn màu" : "Paint & color platform"}
              </p>
            </div>
          </motion.aside>
        </div>

        {/* Article body columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-12">
          <div className="lg:col-span-7 space-y-5 text-sm text-warm-600 leading-relaxed">
            <h3 className="font-serif text-xl font-bold text-warm-950">
              {language === "vi" ? "Cửa hàng phục vụ ai?" : "Who is the store for?"}
            </h3>
            <p>
              {language === "vi"
                ? "Gia chủ muốn tự chọn màu và đặt sơn online; nhà thầu / kiến trúc sư cần catalog, báo giá công trình; và khách ghé đại lý để xem màu thật, lấy hàng nhanh."
                : "Homeowners who want to pick colors and order paint online; contractors and designers who need catalog and project quotes; and customers who prefer visiting a dealer for real chips and fast pickup."}
            </p>
            <h3 className="font-serif text-xl font-bold text-warm-950 pt-2">
              {language === "vi" ? "Hành trình mua sơn điển hình" : "A typical paint journey"}
            </h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>
                {language === "vi"
                  ? "Khám phá bảng màu hoặc bộ sưu tập xu hướng."
                  : "Explore the palette or seasonal collections."}
              </li>
              <li>
                {language === "vi"
                  ? "Thử màu trên visualizer phòng mẫu."
                  : "Preview shades on the room visualizer."}
              </li>
              <li>
                {language === "vi"
                  ? "Chọn dòng sơn, thêm giỏ, áp mã giảm giá nếu có."
                  : "Pick a product line, add to cart, apply a coupon if available."}
              </li>
              <li>
                {language === "vi"
                  ? "Thanh toán COD / chuyển khoản / VNPay (demo), hoặc tìm đại lý gần nhà."
                  : "Pay with COD / transfer / VNPay (demo), or find a nearby dealer."}
              </li>
            </ol>
            <p>
              {language === "vi"
                ? "Admin theo dõi đơn, kho, coupon và phản hồi chat - giúp vận hành cửa hàng thống nhất trên một hệ thống."
                : "Staff manage orders, stock, coupons and chat replies - one system for day-to-day store operations."}
            </p>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
            {pillars.map((p, index) => (
              <motion.div
                key={p.titleEn}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.45,
                  ease: [0.16, 1, 0.3, 1],
                  delay: reduceMotion ? 0 : index * 0.04,
                }}
                className="rounded-2xl border border-warm-200 bg-white p-4 sm:p-5 flex gap-3"
              >
                <span className="w-10 h-10 rounded-xl bg-jotun-teal/10 text-jotun-teal flex items-center justify-center shrink-0">
                  <p.icon className="w-4.5 h-4.5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-warm-900">
                    {language === "vi" ? p.titleVi : p.titleEn}
                  </p>
                  <p className="mt-1 text-xs text-warm-500 leading-relaxed">
                    {language === "vi" ? p.bodyVi : p.bodyEn}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Closing CTAs */}
        <div className="flex flex-wrap gap-3 pt-2 border-t border-warm-200">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-full bg-warm-900 text-white text-xs font-bold px-6 py-3.5 hover:bg-warm-800 transition-colors"
          >
            {language === "vi" ? "Vào cửa hàng" : "Enter the store"}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/find-dealer"
            className="inline-flex items-center gap-2 rounded-full border border-warm-300 bg-white text-warm-800 text-xs font-bold px-6 py-3.5 hover:border-jotun-teal/40 hover:text-jotun-teal transition-colors"
          >
            {language === "vi" ? "Tìm đại lý" : "Find a dealer"}
          </Link>
          <Link
            href="/quote-request"
            className="inline-flex items-center gap-2 rounded-full border border-warm-300 bg-white text-warm-800 text-xs font-bold px-6 py-3.5 hover:border-jotun-teal/40 hover:text-jotun-teal transition-colors"
          >
            {language === "vi" ? "Báo giá công trình" : "Project quote"}
          </Link>
        </div>
      </div>
    </section>
  );
}
