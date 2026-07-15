"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLanguageStore } from "@/store/language-store";

interface ExpertBlogsSectionProps {
  blogs: any[];
}

export function ExpertBlogsSection({ blogs }: ExpertBlogsSectionProps) {
  const { language } = useLanguageStore();
  const reduceMotion = useReducedMotion();
  const list = blogs.slice(0, 3);
  const featured = list[0];
  const rest = list.slice(1);

  if (!list.length) return null;

  return (
    <section id="blogs-section" className="py-20 md:py-28 bg-jotun-ivory border-t border-warm-200/80">
      <div className="w-full max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div className="max-w-xl">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-warm-950">
              {language === "vi" ? "Xu hướng từ chuyên gia" : "Trends from experts"}
            </h2>
            <p className="mt-2 text-sm text-warm-550">
              {language === "vi"
                ? "Màu sắc mới và hướng dẫn thực tế từ đội ngũ FLOF."
                : "Fresh color ideas and practical guides from the FLOF team."}
            </p>
          </div>
          <Link
            href="/blog"
            className="text-xs font-bold text-jotun-teal hover:text-jotun-teal-dark transition-colors inline-flex items-center gap-1.5 shrink-0"
          >
            {language === "vi" ? "Tất cả bài viết" : "All articles"}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {featured && (
            <motion.article
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 group"
            >
              <Link
                href={`/blog/${featured.slug}`}
                className="block relative overflow-hidden rounded-[1.5rem] border border-warm-200 bg-warm-50 min-h-[300px] md:min-h-[400px]"
              >
                <Image
                  src={featured.image}
                  alt={language === "vi" ? featured.title : featured.titleEn || featured.title}
                  fill
                  sizes="(min-width: 1024px) 55vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-warm-950/85 via-warm-950/25 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">
                    {language === "vi"
                      ? featured.category
                      : featured.categoryEn || featured.category}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl md:text-3xl font-bold leading-snug max-w-lg">
                    {language === "vi" ? featured.title : featured.titleEn || featured.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/75 line-clamp-2 max-w-md">
                    {language === "vi"
                      ? featured.summary
                      : featured.summaryEn || featured.summary}
                  </p>
                </div>
              </Link>
            </motion.article>
          )}

          <div className="lg:col-span-5 flex flex-col gap-5">
            {rest.map((blog, index) => {
              const title = language === "vi" ? blog.title : blog.titleEn || blog.title;
              const summary =
                language === "vi" ? blog.summary : blog.summaryEn || blog.summary;

              return (
                <motion.article
                  key={blog.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                    delay: reduceMotion ? 0 : index * 0.05,
                  }}
                >
                  <Link
                    href={`/blog/${blog.slug}`}
                    className="group grid grid-cols-5 gap-4 rounded-[1.35rem] border border-warm-200 bg-white p-3 hover:border-jotun-teal/30 transition-colors h-full"
                  >
                    <div className="col-span-2 relative aspect-[4/3] rounded-2xl overflow-hidden bg-warm-100">
                      <Image
                        src={blog.image}
                        alt={title}
                        fill
                        sizes="160px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="col-span-3 flex flex-col justify-center pr-1">
                      <h3 className="font-serif font-bold text-warm-900 text-base leading-snug group-hover:text-jotun-teal transition-colors line-clamp-2">
                        {title}
                      </h3>
                      <p className="mt-1.5 text-xs text-warm-550 line-clamp-2">{summary}</p>
                    </div>
                  </Link>
                </motion.article>
              );
            })}

            {rest.length === 0 && featured && (
              <div className="rounded-[1.35rem] border border-dashed border-warm-300 bg-white/60 p-6 text-sm text-warm-500">
                {language === "vi"
                  ? "Thêm bài viết trong admin để hiển thị tại đây."
                  : "Add more articles in admin to show here."}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
