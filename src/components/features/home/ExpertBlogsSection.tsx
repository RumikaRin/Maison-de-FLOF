"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";

interface ExpertBlogsSectionProps {
  blogs: any[];
}

/**
 * Editorial "latest articles" block (coffee blog row + Aura editorial):
 * one cinematic featured story + compact side list with dates.
 */
export function ExpertBlogsSection({ blogs }: ExpertBlogsSectionProps) {
  const { language } = useLanguageStore();
  const reduceMotion = useReducedMotion();
  const list = blogs.slice(0, 3);
  const featured = list[0];
  const rest = list.slice(1);

  if (!list.length) return null;

  return (
    <section id="blogs-section" className="py-20 md:py-28 bg-warm-950 text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(0,123,138,0.18),_transparent_55%)]" />

      <div className="relative w-full max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8 bg-jotun-teal" />
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-jotun-teal">
                {language === "vi" ? "Blog" : "Journal"}
              </p>
            </div>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-[2.6rem] font-bold text-white leading-tight">
              {language === "vi" ? "Xu hướng từ chuyên gia" : "Trends from experts"}
            </h2>
            <p className="mt-3 text-sm text-white/55 leading-relaxed max-w-md">
              {language === "vi"
                ? "Màu sắc mới và hướng dẫn thực tế từ đội ngũ FLOF."
                : "Fresh color ideas and practical guides from the FLOF team."}
            </p>
          </div>
          <Link
            href="/blog"
            className="text-xs font-bold text-white/80 hover:text-white transition-colors inline-flex items-center gap-1.5 shrink-0 border-b border-white/25 pb-0.5"
          >
            {language === "vi" ? "Tất cả bài viết" : "All articles"}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          {featured && (
            <motion.article
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 group"
            >
              <Link
                href={`/blog/${featured.slug}`}
                className="block relative overflow-hidden rounded-[1.5rem] min-h-[340px] md:min-h-[460px] border border-white/10"
              >
                <Image
                  src={featured.image}
                  alt={language === "vi" ? featured.title : featured.titleEn || featured.title}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-warm-950 via-warm-950/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-9">
                  <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-white/60 mb-3">
                    <span className="text-jotun-teal">
                      {language === "vi"
                        ? featured.category
                        : featured.categoryEn || featured.category}
                    </span>
                    {featured.createdAt && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-white/30" />
                        <span>{featured.createdAt}</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-serif text-2xl md:text-3xl font-bold leading-snug max-w-lg text-white">
                    {language === "vi" ? featured.title : featured.titleEn || featured.title}
                  </h3>
                  <p className="mt-3 text-sm text-white/65 line-clamp-2 max-w-md leading-relaxed">
                    {language === "vi"
                      ? featured.summary
                      : featured.summaryEn || featured.summary}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:gap-2.5 transition-all">
                    {language === "vi" ? "Đọc tiếp" : "Read more"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            </motion.article>
          )}

          <div className="lg:col-span-5 flex flex-col gap-4">
            {rest.map((blog, index) => {
              const title = language === "vi" ? blog.title : blog.titleEn || blog.title;
              const summary =
                language === "vi" ? blog.summary : blog.summaryEn || blog.summary;

              return (
                <motion.article
                  key={blog.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                    delay: reduceMotion ? 0 : index * 0.06,
                  }}
                  className="flex-1"
                >
                  <Link
                    href={`/blog/${blog.slug}`}
                    className="group grid grid-cols-5 gap-4 h-full rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-3 hover:bg-white/[0.07] hover:border-jotun-teal/40 transition-colors"
                  >
                    <div className="col-span-2 relative aspect-[4/3] rounded-2xl overflow-hidden bg-warm-800">
                      <Image
                        src={blog.image}
                        alt={title}
                        fill
                        sizes="160px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="col-span-3 flex flex-col justify-center pr-1 py-1">
                      {blog.createdAt && (
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">
                          {blog.createdAt}
                        </p>
                      )}
                      <h3 className="font-serif font-bold text-white text-[15px] md:text-base leading-snug group-hover:text-jotun-teal transition-colors line-clamp-2">
                        {title}
                      </h3>
                      <p className="mt-1.5 text-xs text-white/45 line-clamp-2 leading-relaxed">
                        {summary}
                      </p>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
