"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguageStore } from "@/store/language-store";
import {
  ArrowLeft,
  Calendar,
  User,
  Clock,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface BlogClientProps {
  initialBlog: any;
  initialRelatedBlogs: any[];
}

export function BlogClient({ initialBlog, initialRelatedBlogs }: BlogClientProps) {
  const { language } = useLanguageStore();

  const [mounted, setMounted] = useState(false);
  const [blog] = useState(initialBlog);
  const [relatedBlogs] = useState(initialRelatedBlogs);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!blog) {
    return (
      <div className="container mx-auto px-6 py-24 text-center">
        <h2 className="text-2xl font-bold font-serif mb-4">
          {language === "vi" ? "Bài viết không tồn tại" : "Article Not Found"}
        </h2>
        <Link href="/blog" className="text-jotun-teal hover:underline inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {language === "vi" ? "Quay lại danh sách bài viết" : "Back to blogs"}
        </Link>
      </div>
    );
  }

  // Split contents by paragraph breaks
  const paragraphs = (language === "vi" ? blog.content : blog.contentEn)?.split("\n\n") || [];

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      {/* Back to blogs list button */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-jotun-teal mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        {language === "vi" ? "Quay lại danh sách bài viết" : "Back to blogs"}
      </Link>

      <article className="flex flex-col gap-6 mb-16">
        {/* Category tag */}
        <span className="text-xs font-bold text-jotun-teal uppercase tracking-wider">
          {language === "vi" ? blog.category : blog.categoryEn}
        </span>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-bold font-serif leading-tight">
          {language === "vi" ? blog.title : blog.titleEn}
        </h1>

        {/* Metadata info */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-y border-border py-4">
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-jotun-teal" />
            <span className="font-bold">{blog.author}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{blog.createdAt}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{blog.readTime}</span>
          </div>
        </div>

        {/* Cover Image */}
        <div className="relative h-[450px] w-full rounded-xl overflow-hidden shadow-sm my-4 border border-border">
          <Image src={blog.image} alt={blog.title} fill className="object-cover" priority />
        </div>

        {/* Body content */}
        <div className="prose prose-zinc dark:prose-invert max-w-none text-base leading-relaxed text-foreground/90 flex flex-col gap-6">
          {paragraphs.map((p: string, idx: number) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        {/* Interactive contextual CALL-TO-ACTIONS */}
        {blog.id === "blog-1" && (
          <div className="bg-gradient-to-r from-jotun-teal/5 to-emerald-500/5 dark:from-zinc-900/40 border border-border p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 my-8 shadow-sm">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-jotun-teal/15 text-jotun-teal rounded-full shrink-0">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-base mb-1">
                  {language === "vi" ? "Bạn muốn thử nghiệm phối các màu sắc này?" : "Want to try these colors?"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {language === "vi"
                    ? "Duyệt qua hàng ngàn mã màu chuẩn của chúng tôi và chọn ra tông màu hoàn hảo."
                    : "Browse through our full catalog and find matching coordinated schemes easily."}
                </p>
              </div>
            </div>
            <Link
              href="/colors"
              className="bg-jotun-teal text-white font-bold text-xs px-6 py-3 rounded hover:bg-jotun-darkTeal transition-colors shrink-0 flex items-center gap-2"
            >
              {language === "vi" ? "Khám phá bảng màu" : "Explore Color Catalog"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {blog.id === "blog-2" && (
          <div className="bg-gradient-to-r from-jotun-teal/5 to-indigo-500/5 dark:from-zinc-900/40 border border-border p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 my-8 shadow-sm">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-jotun-teal/15 text-jotun-teal rounded-full shrink-0">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-base mb-1">
                  {language === "vi" ? "Thử nghiệm phối màu 3D trực quan" : "Try Our 3D Color Visualizer"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {language === "vi"
                    ? "Trực quan hóa màu sơn mong ước trên các không gian phòng mẫu 3D thực tế trước khi quyết định mua hàng."
                    : "Visualize your dream paint colors on interactive 3D model rooms before making a purchase."}
                </p>
              </div>
            </div>
            <Link
              href="/color-visualizer"
              className="bg-jotun-teal text-white font-bold text-xs px-6 py-3 rounded hover:bg-jotun-darkTeal transition-colors shrink-0 flex items-center gap-2"
            >
              {language === "vi" ? "Trải nghiệm ngay" : "Try It Now"}
              <ArrowRight className="h-3.5 w-3.5 text-white" />
            </Link>
          </div>
        )}
      </article>

      {/* Related articles */}
      {relatedBlogs.length > 0 && (
        <section className="border-t border-border pt-12">
          <h3 className="font-serif font-bold text-2xl mb-8">
            {language === "vi" ? "Bài viết liên quan" : "Related Articles"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {relatedBlogs.map((item) => (
              <Link
                key={item.id}
                href={`/blog/${item.slug}`}
                className="bg-white dark:bg-zinc-950 border border-border rounded-xl overflow-hidden group shadow-sm hover:shadow-md transition-all flex flex-col"
              >
                <div className="relative h-48 w-full bg-zinc-100 overflow-hidden">
                  <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-5 flex flex-col flex-grow gap-2">
                  <span className="text-[10px] font-bold text-jotun-teal uppercase">
                    {language === "vi" ? item.category : item.categoryEn}
                  </span>
                  <h4 className="font-serif font-bold text-base leading-snug group-hover:text-jotun-teal transition-colors">
                    {language === "vi" ? item.title : item.titleEn}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
