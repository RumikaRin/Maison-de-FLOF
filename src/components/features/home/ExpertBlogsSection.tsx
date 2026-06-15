"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";

interface ExpertBlogsSectionProps {
  blogs: any[];
}

export function ExpertBlogsSection({ blogs }: ExpertBlogsSectionProps) {
  const { language } = useLanguageStore();

  return (
    <section id="blogs-section" className="py-16 md:py-28 bg-jotun-ivory-100 border-b border-black/5">
      <div className="w-full max-w-[1400px] mx-auto px-6 md:px-12 xl:px-16 2xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="text-center mb-16"
        >
          <span className="text-[#88734C] font-semibold text-xs tracking-widest mb-3 flex items-center justify-center gap-2 uppercase">
            <Sparkles className="w-4 h-4 text-[#88734C]" />
            {language === "vi" ? "CẨM NANG & CẢM HỨNG" : "GUIDES & INSPIRATION"}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-warm-900 mb-4 leading-tight">
            {language === "vi" ? "Xu Hướng Từ Chuyên Gia" : "Expert Design Trends"}
          </h2>
          <div className="w-16 h-1 bg-[#88734C] mx-auto mt-2 mb-6" />
          <p className="text-warm-550 text-xs md:text-sm max-w-2xl mx-auto leading-relaxed">
            {language === "vi"
              ? "Cập nhật các xu hướng màu sắc mới nhất và những hướng dẫn thi công thực tế từ đội ngũ chuyên gia của chúng tôi."
              : "Stay updated with the latest color trends and practical application guides from our expert team."}
          </p>
        </motion.div>

        <div className="flex flex-col gap-10 max-w-[1200px] mx-auto">
          {blogs.map((blog, idx) => {
            const title = language === "vi" ? blog.title : (blog.titleEn || blog.title);
            const summary = language === "vi" ? blog.summary : (blog.summaryEn || blog.summary);
            const category = language === "vi" ? blog.category : (blog.categoryEn || blog.category);

            return (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.08 }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1], delay: idx * 0.15 }}
                className="group bg-white rounded-3xl overflow-hidden border border-black/5 hover:border-[#88734C]/30 shadow-sm hover:shadow-xl transition-all duration-500 grid grid-cols-1 md:grid-cols-12 items-stretch"
              >
                {/* Blog Image */}
                <div className="md:col-span-5 relative min-h-[260px] md:min-h-full overflow-hidden">
                  <Image
                    src={blog.image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-500" />

                  {/* Category Tag overlay on image */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-[#88734C] border border-[#88734C]/10 text-[9px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full shadow-xs">
                    {category}
                  </div>
                </div>

                {/* Blog Content */}
                <div className="md:col-span-7 p-6 md:p-10 flex flex-col justify-between items-start text-left bg-gradient-to-br from-white to-warm-50/10">
                  <div className="flex flex-col gap-4 w-full">
                    {/* Meta info */}
                    <div className="flex items-center gap-4 text-[10px] text-warm-450 font-bold uppercase tracking-wider">
                      <span>{blog.author.split(" - ")[0]}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-warm-300" />
                      <span>{blog.readTime}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-warm-300 hidden sm:inline" />
                      <span className="hidden sm:inline">{blog.createdAt}</span>
                    </div>

                    <h3 className="font-serif font-bold text-xl md:text-2xl text-warm-900 group-hover:text-jotun-teal transition-colors duration-300 leading-tight">
                      {title}
                    </h3>

                    <p className="text-xs md:text-sm text-warm-550 leading-relaxed font-light line-clamp-3">
                      {summary}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-black/5 w-full flex items-center justify-between">
                    <Link
                      href={`/blog/${blog.slug}`}
                      className="inline-flex items-center gap-2 text-xs font-bold text-warm-900 group-hover:text-jotun-teal transition-all duration-300"
                    >
                      {language === "vi" ? "Đọc tiếp" : "Read more"}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
