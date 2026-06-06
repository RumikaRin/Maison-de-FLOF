"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLanguageStore } from "@/store/language-store";
import { useTrans } from "@/lib/dictionary";
import { MOCK_BLOGS } from "@/lib/mock-data";
import { motion } from "framer-motion";

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
  const [blogs, setBlogs] = useState<any[]>(MOCK_BLOGS);

  useEffect(() => { 
    setMounted(true); 
    fetch("/api/blog")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBlogs(data);
        }
      })
      .catch((err) => console.error("Error loading blogs from DB API:", err));
  }, []);

  if (!mounted) return null;

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
        <motion.div
          initial="hidden"
          animate="visible"
          variants={headerVariants}
          className="w-full max-w-[1440px] mx-auto px-6 md:px-12 text-center relative z-10"
        >
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-warm-900 mb-4 tracking-tight">
            {language === "vi" ? "Tư Vấn & Xu Hướng Sơn" : "Paint Consultation & Trends"}
          </h1>
          <p className="text-warm-500 text-sm max-w-2xl mx-auto leading-relaxed font-medium">
            {language === "vi"
              ? "Cập nhật xu hướng phối màu sắc thời thượng và cẩm nang thi công sơn nước chuyên nghiệp."
              : "Update beautiful color palettes, trending designs, and professional paint application guides."}
          </p>
        </motion.div>
      </div>

      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 py-10">
        {/* Filter panel */}
        <motion.div
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
            <motion.button
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
            </motion.button>
            {categories.map((cat) => (
              <motion.button
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
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Blog Grid */}
        {filteredBlogs.length > 0 ? (
          <motion.div
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
                <motion.div
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
                </motion.div>
              );
            })}
          </motion.div>
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
