"use client";

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { CspImage as Image } from "@/components/ui/csp-image";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { safeMotion } from "@/components/ui/motion-safe";
import { AsyncState } from "@/components/ui/AsyncState";
import type { PublicBlog } from "@/services/blog.service";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: -15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};


export default function BlogListingPage() {
  const { language } = useLanguageStore();
  const t = useTrans(language);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [blogs, setBlogs] = useState<PublicBlog[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  const loadBlogs = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/blog");
      if (!response.ok) throw new Error("BLOG_FETCH_FAILED");
      const data = (await response.json()) as PublicBlog[];
      if (!Array.isArray(data)) throw new Error("BLOG_RESPONSE_INVALID");
      setBlogs(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    void loadBlogs();
  }, [loadBlogs]);

  if (!mounted) return null;
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-jotun-ivory px-4 pt-32">
        <AsyncState
          status="loading"
          title={language === "vi" ? "Đang tải bài viết" : "Loading articles"}
        />
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="min-h-screen bg-jotun-ivory px-4 pt-32">
        <AsyncState
          status="error"
          title={
            language === "vi"
              ? "Không thể tải bài viết"
              : "Unable to load articles"
          }
          description={
            language === "vi"
              ? "Kết nối tạm thời gián đoạn. Vui lòng thử lại."
              : "The connection was interrupted. Please retry."
          }
          retryLabel={language === "vi" ? "Thử lại" : "Retry"}
          onRetry={() => void loadBlogs()}
        />
      </div>
    );
  }
  if (blogs.length === 0) {
    return (
      <div className="min-h-screen bg-jotun-ivory px-4 pt-32">
        <AsyncState
          status="empty"
          title={language === "vi" ? "Chưa có bài viết" : "No articles yet"}
        />
      </div>
    );
  }

  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.summaryEn.toLowerCase().includes(searchQuery.toLowerCase());
    const blogCat = language === "vi" ? blog.category : blog.categoryEn;
    const matchesCategory = selectedCategory === "all" || blogCat === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(blogs.map((blog) => language === "vi" ? blog.category : blog.categoryEn))).filter(Boolean);

  const CATEGORY_COLORS: Record<string, string> = {
    "Xu hướng màu sắc": "bg-rose-50 text-rose-600 border-rose-100",
    "Color Trends": "bg-rose-50 text-rose-600 border-rose-100",
    "Hướng dẫn thi công": "bg-blue-50 text-blue-600 border-blue-100",
    "Application Guide": "bg-blue-50 text-blue-600 border-blue-100",
    "Đánh giá sản phẩm": "bg-amber-50 text-amber-600 border-amber-100",
    "Product Review": "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <div className="min-h-screen bg-jotun-ivory text-warm-900 transition-colors duration-300">
      {/* Page Header */}
      <div className="py-16 md:py-20 relative bg-jotun-ivory overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e1d8_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        <safeMotion.div
          initial="hidden"
          animate="visible"
          variants={headerVariants}
          className="w-full max-w-[1440px] mx-auto px-6 md:px-12 text-center relative z-10"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-warm-900 mb-4 tracking-tight">
            {language === "vi" ? "Xu Hướng Sơn" : "Paint Trends"}
          </h1>
          <p className="text-warm-500 text-sm max-w-2xl mx-auto leading-relaxed font-medium">
            {language === "vi"
              ? "Cập nhật xu hướng phối màu sắc thời thượng và cẩm nang thi công sơn nước chuyên nghiệp."
              : "Update beautiful color palettes, trending designs, and professional paint application guides."}
          </p>
        </safeMotion.div>
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-10">
        {/* Filter panel */}
        <safeMotion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-white border border-warm-200/80 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center mb-8"
        >
          <div className="relative w-full md:flex-1">
            <input
              type="text"
              placeholder={language === "vi" ? "Tìm kiếm bài viết..." : "Search articles..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-900 transition-shadow"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <safeMotion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-300 ${
                selectedCategory === "all"
                  ? "bg-warm-900 text-white border-warm-900 shadow-sm"
                  : "border-warm-200 text-warm-600 hover:bg-warm-50/50 hover:text-warm-950"
              }`}
            >
              {language === "vi" ? "Tất cả" : "All"}
            </safeMotion.button>
            {categories.map((cat) => (
              <safeMotion.button
                key={cat}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-300 ${
                  selectedCategory === cat
                    ? "bg-warm-900 text-white border-warm-900 shadow-sm"
                    : "border-warm-200 text-warm-600 hover:bg-warm-50/50 hover:text-warm-950"
                }`}
              >
                {cat}
              </safeMotion.button>
            ))}
          </div>
        </safeMotion.div>

        {/* Blog Grid */}
        {filteredBlogs.length > 0 ? (
          <safeMotion.div
            key={searchQuery + selectedCategory}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredBlogs.map((blog) => {
              const catLabel = language === "vi" ? blog.category : blog.categoryEn;
              const catColor = CATEGORY_COLORS[catLabel] || "bg-warm-50 text-warm-700 border-warm-150";
              return (
                <safeMotion.div
                  key={blog.id}
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className="flex w-full"
                >
                  <Link
                    href={`/blog/${blog.slug}`}
                    className="bg-white border border-warm-200/80 rounded-2xl overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 flex flex-col w-full"
                  >
                    <div className="relative h-56 w-full bg-warm-50 overflow-hidden">
                      <Image
                        src={blog.image}
                        alt={blog.title}
                        fill
                        className="object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                      <span className={`absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${catColor}`}>
                        {catLabel}
                      </span>
                    </div>

                    <div className="p-6 flex flex-col flex-grow gap-3 text-left">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-warm-450">
                        <div>
                          <span>{blog.author}</span>
                        </div>
                        <span className="text-warm-300">•</span>
                        <div>
                          <span>{blog.createdAt}</span>
                        </div>
                        <span className="text-warm-300">•</span>
                        <div>
                          <span>{blog.readTime}</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-serif font-bold text-xl leading-snug group-hover:text-jotun-teal transition-colors mb-2 text-warm-900">
                          {language === "vi" ? blog.title : blog.titleEn}
                        </h3>
                        <p className="text-warm-650 text-sm line-clamp-3 leading-relaxed">
                          {language === "vi" ? blog.summary : blog.summaryEn}
                        </p>
                      </div>

                      <div className="mt-auto pt-4 border-t border-warm-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-warm-850 group-hover:text-jotun-teal transition-colors">
                          {t.readMore}
                        </span>
                        <span className="text-xs font-bold text-warm-400 group-hover:translate-x-1 group-hover:text-jotun-teal transition-all">→</span>
                      </div>
                    </div>
                  </Link>
                </safeMotion.div>
              );
            })}
          </safeMotion.div>
        ) : (
          <div className="bg-warm-50/50 border border-dashed border-warm-200/80 rounded-2xl h-80 flex flex-col items-center justify-center text-center p-6 gap-2">
            <p className="font-serif font-bold text-lg text-warm-450 uppercase tracking-wider">
              {language === "vi" ? "Bài Viết" : "Articles"}
            </p>
            <p className="text-warm-600 font-medium text-sm">
              {language === "vi" ? "Không tìm thấy bài viết nào phù hợp." : "No articles match your search."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


