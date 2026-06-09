"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { MOCK_BLOGS, Blog } from "@/lib/mock-data";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/custom-select";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";

export default function AdminArticlesPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  // Core articles state
  const [articles, setArticles] = useState<Blog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null);

  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);

  // Form States
  const [title, setTitle] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryEn, setSummaryEn] = useState("");
  const [category, setCategory] = useState("Xu hướng màu sắc");
  const [categoryEn, setCategoryEn] = useState("Color Trends");
  const [author, setAuthor] = useState("FLOF Editor");
  const [readTime, setReadTime] = useState("5 phút");
  const [image, setImage] = useState("");

  useEffect(() => {
    setMounted(true);
    setArticles(MOCK_BLOGS);
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  if (!mounted) return null;

  const openAddModal = () => {
    setModalMode("add");
    setEditingArticleId(null);
    setTitle("");
    setTitleEn("");
    setSummary("");
    setSummaryEn("");
    setCategory("Xu hướng màu sắc");
    setCategoryEn("Color Trends");
    setAuthor("FLOF Editor");
    setReadTime("5 phút");
    setImage("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800");
    setIsModalOpen(true);
  };

  const openEditModal = (article: Blog) => {
    setModalMode("edit");
    setEditingArticleId(article.id);
    setTitle(article.title);
    setTitleEn(article.titleEn);
    setSummary(article.summary);
    setSummaryEn(article.summaryEn);
    setCategory(article.category);
    setCategoryEn(article.categoryEn);
    setAuthor(article.author);
    setReadTime(article.readTime);
    setImage(article.image);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !titleEn || !summary || !summaryEn || !image) {
      toast.error(
        language === "vi" ? "Vui lòng nhập đầy đủ các trường thông tin." : "Please fill in all input fields."
      );
      return;
    }

    if (modalMode === "add") {
      const newArticle: Blog = {
        id: `blog-${Date.now()}`,
        slug: title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""),
        title,
        titleEn,
        summary,
        summaryEn,
        category,
        categoryEn,
        author,
        readTime,
        image,
        content: "",
        contentEn: "",
        createdAt: new Date().toISOString().split("T")[0]
      };

      setArticles([newArticle, ...articles]);
      toast.success(
        language === "vi" ? "Đã xuất bản bài viết mới thành công!" : "Article published successfully!"
      );
    } else {
      setArticles(
        articles.map((art) =>
          art.id === editingArticleId
            ? { ...art, title, titleEn, summary, summaryEn, category, categoryEn, author, readTime, image }
            : art
        )
      );
      toast.success(
        language === "vi" ? "Cập nhật bài viết thành công!" : "Article updated successfully!"
      );
    }

    setIsModalOpen(false);
  };

  const triggerDelete = (id: string) => {
    setArticleToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!articleToDelete) return;
    const target = articles.find((art) => art.id === articleToDelete);
    setArticles(articles.filter((art) => art.id !== articleToDelete));
    toast.success(
      language === "vi" ? `Đã xóa bài viết "${target?.title || ""}" thành công.` : "Article deleted successfully."
    );
    setArticleToDelete(null);
  };

  const filteredArticles = articles.filter((art) => {
    return (
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.titleEn.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Header and Add CTA with spring reveal */}
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold font-serif text-warm-900">
            {language === "vi" ? "Quản Lý Bài Viết" : "Blog Articles Publisher"}
          </h1>
          <p className="text-warm-550 text-xs mt-1">
            {language === "vi"
              ? "Tạo mới, xuất bản hoặc chỉnh sửa các bài blog tư vấn xu hướng phối màu và cẩm nang thi công sơn nước."
              : "Create, publish, and edit advice articles, color trends, and paint application manuals."}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-warm-900 text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-warm-800 transition-colors flex items-center justify-center gap-1.5 self-start shadow-sm cursor-pointer"
        >
          {language === "vi" ? "Viết Bài Mới" : "Publish New Article"}
        </button>
      </motion.div>

      {/* Filter and Search Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="grid grid-cols-1 gap-4"
      >
        <input
          type="text"
          placeholder={
            language === "vi" ? "Tìm theo tiêu đề bài viết..." : "Search by article title..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-900 transition-shadow"
        />
      </motion.div>

      {/* Article Listing Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="bg-white border border-warm-200/80 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-warm-150 text-warm-450 font-bold uppercase tracking-wider text-[10px] bg-warm-50/50">
                <th className="py-3 px-6">{language === "vi" ? "Bài viết" : "Article"}</th>
                <th className="py-3 px-4">{language === "vi" ? "Tác giả" : "Author"}</th>
                <th className="py-3 px-4">{language === "vi" ? "Chuyên mục" : "Category"}</th>
                <th className="py-3 px-4">{language === "vi" ? "Ngày viết" : "Date"}</th>
                <th className="py-3 pr-6 text-right">{language === "vi" ? "Thao tác" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 font-semibold text-warm-850">
              {filteredArticles.map((art) => (
                <tr key={art.id} className="hover:bg-warm-50/30 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-16 rounded-lg overflow-hidden border border-warm-200 shrink-0 bg-warm-50">
                        <img src={art.image} alt={art.title} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-warm-900 line-clamp-1">
                          {language === "vi" ? art.title : art.titleEn}
                        </h4>
                        <span className="text-[10px] text-warm-450 font-medium">
                          {art.readTime}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium">{art.author}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 bg-jotun-teal/10 text-jotun-teal text-[10px] font-bold rounded-lg">
                      {language === "vi" ? art.category : art.categoryEn}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-warm-500">{art.createdAt}</td>
                  <td className="py-3.5 pr-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(art)}
                        className="text-[11px] font-bold text-white bg-warm-900 hover:bg-warm-800 px-3.5 py-1.5 rounded-xl transition-all shadow-xs border border-warm-900 cursor-pointer"
                        title={language === "vi" ? "Chỉnh sửa" : "Edit"}
                      >
                        {language === "vi" ? "Sửa" : "Edit"}
                      </button>
                      <button
                        onClick={() => triggerDelete(art.id)}
                        className="text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-xl transition-all shadow-xs border border-red-600 cursor-pointer"
                        title={language === "vi" ? "Xóa" : "Delete"}
                      >
                        {language === "vi" ? "Xóa" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Write/Edit Modal overlay with premium spring scale transitions */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)} 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto text-left"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()} 
              className="bg-white border border-warm-200 w-full max-w-xl rounded-2xl shadow-2xl flex flex-col my-8 overflow-visible"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-warm-100 flex items-center justify-between bg-warm-50/50 rounded-t-2xl">
                <h3 className="font-serif font-bold text-base text-warm-900">
                  {modalMode === "add"
                    ? language === "vi"
                      ? "Tạo và viết bài viết mới"
                      : "Create & Write New Article"
                    : language === "vi"
                    ? "Chỉnh sửa nội dung bài viết"
                    : "Edit Blog Article"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-warm-450 hover:text-warm-900 text-xs font-bold px-2 py-1 transition-colors cursor-pointer"
                >
                  {language === "vi" ? "[Đóng]" : "[Close]"}
                </button>
              </div>

              {/* Modal Form Details */}
              <form onSubmit={handleSubmit} className="p-6 pb-36 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-warm-450">Tiêu đề (Tiếng Việt)</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Cách phối màu sơn phòng khách..."
                    className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-850"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-warm-450">Tiêu đề (Tiếng Anh)</label>
                  <input
                    type="text"
                    required
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="VD: How to coordinate paint colors..."
                    className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-850"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-warm-450">Hình ảnh đại diện (Image URL)</label>
                  <input
                    type="url"
                    required
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-850 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-warm-450">Chuyên mục (Vi)</label>
                    <CustomSelect
                      value={category}
                      onValueChange={setCategory}
                      options={[
                        { value: "Xu hướng màu sắc", label: "Xu hướng màu sắc" },
                        { value: "Hướng dẫn thi công", label: "Hướng dẫn thi công" },
                        { value: "Đánh giá sản phẩm", label: "Đánh giá sản phẩm" },
                      ]}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-warm-450">Chuyên mục (En)</label>
                    <CustomSelect
                      value={categoryEn}
                      onValueChange={setCategoryEn}
                      options={[
                        { value: "Color Trends", label: "Color Trends" },
                        { value: "Application Guide", label: "Application Guide" },
                        { value: "Product Review", label: "Product Review" },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-warm-450">Tác giả</label>
                    <input
                      type="text"
                      required
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-850"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-warm-450">Thời gian đọc</label>
                    <input
                      type="text"
                      required
                      value={readTime}
                      onChange={(e) => setReadTime(e.target.value)}
                      placeholder="VD: 5 phút / 5 min read"
                      className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-850"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-warm-450">Tóm tắt (Tiếng Việt)</label>
                  <textarea
                    rows={2}
                    required
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs text-warm-850 focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-warm-450">Tóm tắt (Tiếng Anh)</label>
                  <textarea
                    rows={2}
                    required
                    value={summaryEn}
                    onChange={(e) => setSummaryEn(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-xs text-warm-850 focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 resize-none"
                  />
                </div>


                <div className="mt-4 flex justify-end gap-3 border-t border-warm-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold bg-warm-100 hover:bg-warm-200 rounded-xl text-warm-900 transition-colors cursor-pointer"
                  >
                    {language === "vi" ? "Hủy" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="bg-warm-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-warm-800 transition-colors cursor-pointer"
                  >
                    {modalMode === "add"
                      ? language === "vi"
                        ? "Xuất bản"
                        : "Publish"
                      : language === "vi"
                      ? "Lưu thay đổi"
                      : "Save"}
                  </button>
                </div>

              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setArticleToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={language === "vi" ? "Xóa bài viết?" : "Delete Article?"}
        message={
          language === "vi"
            ? `Bạn có chắc muốn xóa bài viết "${articles.find((art) => art.id === articleToDelete)?.title || ""}" không?`
            : `Are you sure you want to delete article "${articles.find((art) => art.id === articleToDelete)?.titleEn || ""}"?`
        }
      />
    </div>
  );
}
