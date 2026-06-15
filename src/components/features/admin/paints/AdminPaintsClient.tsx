"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { formatPrice } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Paint, PaintColor, Category, Supplier } from "@/types";
import { toast } from "sonner";
import { PaintsFormModal } from "./PaintsFormModal";
import { PaintsPromoModal } from "./PaintsPromoModal";

export function AdminPaintsClient() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  // Core states
  const [paints, setPaints] = useState<Paint[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [colorCatalog, setColorCatalog] = useState<PaintColor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paintToDelete, setPaintToDelete] = useState<string | null>(null);

  // Form Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [initialData, setInitialData] = useState<Paint | null>(null);

  // Promotions Modal Control
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/products")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải sản phẩm");
        setPaints(data.products);
        setCategories(data.categories);
        setSuppliers(data.suppliers);
        setColorCatalog(data.colors);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (isModalOpen || isPromoModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen, isPromoModalOpen]);

  if (!mounted) return null;

  // Filters
  const filteredPaints = paints.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory;
    const matchesBrand = selectedBrand === "all" || p.supplierId === selectedBrand;

    return matchesSearch && matchesCategory && matchesBrand;
  });

  const openAddModal = () => {
    setModalMode("add");
    setInitialData(null);
    setIsModalOpen(true);
  };

  const openEditModal = (paint: Paint) => {
    setModalMode("edit");
    setInitialData(paint);
    setIsModalOpen(true);
  };

  const handleFormSuccess = (savedPaint: Paint, mode: "add" | "edit") => {
    setPaints((current) =>
      mode === "add"
        ? [savedPaint, ...current]
        : current.map((paint) => (paint.id === savedPaint.id ? savedPaint : paint)),
    );
    setIsModalOpen(false);
  };

  const triggerDelete = (id: string) => {
    setPaintToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!paintToDelete) return;
    const target = paints.find((p) => p.id === paintToDelete);
    const response = await fetch(`/api/admin/products?id=${encodeURIComponent(paintToDelete)}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Không thể xóa sản phẩm");
      return;
    }
    setPaints((current) => current.filter((paint) => paint.id !== paintToDelete));
    toast.success(
      language === "vi"
        ? `Đã xóa sản phẩm "${target?.name || ""}" thành công.`
        : "Product deleted successfully."
    );
    setPaintToDelete(null);
  };

  const handlePromoSuccess = (discountPercent: number, method: "category" | "single", targetId: string) => {
    setPaints((current) =>
      current.map((paint) =>
        (method === "category" && paint.categoryId === targetId) ||
        (method === "single" && paint.id === targetId)
          ? { ...paint, discountPercent }
          : paint,
      ),
    );
    setIsPromoModalOpen(false);
  };

  // Variants for staggered statistics grid
  const statsContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      }
    }
  };

  const statsItemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 24 }
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Header and Add CTA */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">
            {language === "vi" ? "Quản Lý Sản Phẩm Sơn" : "Paints & Products"}
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            {language === "vi"
              ? "Chỉnh sửa giá bán lẻ, khối lượng tồn kho và cấu hình bảng màu tương ứng cho sản phẩm."
              : "Edit retail prices and link available color swatches. Stock changes are managed through inventory."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 self-start sm:w-auto sm:flex-row">
          <button
            onClick={() => setIsPromoModalOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {language === "vi" ? "Thiết Lập Khuyến Mãi" : "Set Promotions"}
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-jotun-teal px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-jotun-teal-dark"
          >
            {language === "vi" ? "Thêm Sản Phẩm Mới" : "Add New Product"}
          </button>
        </div>
      </motion.div>

      {/* Quick Statistics Banner with stagger animation */}
      <motion.div
        variants={statsContainerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <motion.div
          variants={statsItemVariants}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase font-bold text-warm-450 tracking-wider">
              {language === "vi" ? "Tổng số sản phẩm" : "Total Products"}
            </span>
            <span className="text-2xl font-bold font-mono text-warm-900">
              {paints.length}
            </span>
            <span className="text-[10px] text-warm-450 font-medium">
              {language === "vi" ? "Đang được hiển thị" : "Currently active"}
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={statsItemVariants}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase font-bold text-warm-450 tracking-wider">
              {language === "vi" ? "Tổng lượng tồn kho" : "Total Stock Level"}
            </span>
            <span className="text-2xl font-bold font-mono text-jotun-teal">
              {paints.reduce((sum, p) => sum + p.stock, 0)} {language === "vi" ? "hộp" : "cans"}
            </span>
            <span className="text-[10px] text-warm-450 font-medium">
              {language === "vi" ? "Tổng số lượng trong kho" : "Total cans in inventory"}
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={statsItemVariants}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase font-bold text-warm-450 tracking-wider">
              {language === "vi" ? "Sản phẩm sắp hết hàng" : "Low Stock Items"}
            </span>
            <span className="text-2xl font-bold font-mono text-red-500">
              {paints.filter((p) => p.stock <= 5).length}
            </span>
            <span className="text-[10px] text-warm-450 font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              {language === "vi" ? "Số lượng tồn dưới 5 hộp" : "Stock level under 5"}
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={statsItemVariants}
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase font-bold text-warm-450 tracking-wider">
              {language === "vi" ? "Giá trị tồn kho dự kiến" : "Total Stock Value"}
            </span>
            <span className="text-lg font-bold font-mono text-warm-900">
              {formatPrice(paints.reduce((sum, p) => sum + p.stock * p.price, 0))}
            </span>
            <span className="text-[10px] text-warm-450 font-medium">
              {language === "vi" ? "Theo giá bán lẻ hiện tại" : "Based on retail price"}
            </span>
          </div>
        </motion.div>
      </motion.div>

      {/* Filter and Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="relative">
          <input
            type="text"
            placeholder={
              language === "vi" ? "Tìm theo tên sản phẩm, SKU..." : "Search by product name, SKU..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-warm-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-jotun-teal/20 text-warm-900 transition-shadow"
          />
        </div>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between font-bold text-xs bg-white border-warm-200 text-warm-900 rounded-xl px-4 py-2.5 h-10 shadow-sm focus:ring-2 focus:ring-jotun-teal/20 focus:border-jotun-teal text-left"
            >
              <span className="truncate">
                {selectedCategory === "all"
                  ? (language === "vi" ? "Tất cả danh mục" : "All Categories")
                  : (language === "vi"
                    ? categories.find((c) => c.id === selectedCategory)?.name
                    : categories.find((c) => c.id === selectedCategory)?.nameEn)}
              </span>
              <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <DropdownMenuRadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
              <DropdownMenuRadioItem value="all" className="text-xs font-semibold text-warm-900 cursor-pointer">
                {language === "vi" ? "Tất cả danh mục" : "All Categories"}
              </DropdownMenuRadioItem>
              {categories.map((c) => (
                <DropdownMenuRadioItem
                  key={c.id}
                  value={c.id}
                  className="text-xs font-semibold text-warm-900 cursor-pointer"
                >
                  {language === "vi" ? c.name : c.nameEn}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between font-bold text-xs bg-white border-warm-200 text-warm-900 rounded-xl px-4 py-2.5 h-10 shadow-sm focus:ring-2 focus:ring-jotun-teal/20 focus:border-jotun-teal text-left"
            >
              <span className="truncate">
                {selectedBrand === "all"
                  ? (language === "vi" ? "Tất cả hãng sản xuất" : "All Brands")
                  : suppliers.find((s) => s.id === selectedBrand)?.name}
              </span>
              <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <DropdownMenuRadioGroup value={selectedBrand} onValueChange={setSelectedBrand}>
              <DropdownMenuRadioItem value="all" className="text-xs font-semibold text-warm-900 cursor-pointer">
                {language === "vi" ? "Tất cả hãng sản xuất" : "All Brands"}
              </DropdownMenuRadioItem>
              {suppliers.map((s) => (
                <DropdownMenuRadioItem
                  key={s.id}
                  value={s.id}
                  className="text-xs font-semibold text-warm-900 cursor-pointer"
                >
                  {s.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>

      {/* Paints list table with entry animation */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="bg-white border border-warm-200/80 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-warm-150 text-warm-450 font-bold uppercase tracking-wider text-[10px] bg-warm-50/50">
                <th className="py-3 px-6">{language === "vi" ? "Sản phẩm sơn" : "Paint Product"}</th>
                <th className="py-3 px-4">{language === "vi" ? "Phân loại" : "Category"}</th>
                <th className="py-3 px-4">{language === "vi" ? "Hãng sản xuất" : "Supplier"}</th>
                <th className="py-3 px-4">{language === "vi" ? "Thể tích" : "Volume"}</th>
                <th className="py-3 px-4">{language === "vi" ? "Giá bán" : "Price"}</th>
                <th className="py-3 px-4">{language === "vi" ? "Tồn kho" : "Stock"}</th>
                <th className="py-3 pr-6 text-right">{language === "vi" ? "Hành động" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 font-semibold text-warm-800">
              {filteredPaints.map((p) => {
                const category = categories.find((c) => c.id === p.categoryId);
                const supplier = suppliers.find((s) => s.id === p.supplierId);
                const hasDiscount = !!(p.discountPercent && p.discountPercent > 0);
                const discountedPrice = hasDiscount ? p.price * (1 - p.discountPercent! / 100) : p.price;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-warm-50/30 transition-colors"
                  >
                    <td className="py-3.5 px-6">
                      <div>
                        <span className="font-bold text-warm-900 block">{language === "vi" ? p.name : p.nameEn}</span>
                        <span className="text-[10px] text-warm-450 font-mono">{p.sku}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-warm-700">
                      {category ? (language === "vi" ? category.name : category.nameEn) : "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-warm-700">
                      {supplier ? supplier.name : "N/A"}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-warm-600">
                      {p.volume} {p.volumeUnit}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {hasDiscount ? (
                        <div className="flex flex-col">
                          <span className="text-red-500 font-bold">{formatPrice(discountedPrice)}</span>
                          <span className="text-[10px] text-warm-400 line-through">{formatPrice(p.price)}</span>
                        </div>
                      ) : (
                        <span className="text-warm-900 font-bold">{formatPrice(p.price)}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.stock > 5 ? 'bg-jotun-teal/10 text-jotun-teal' : 'bg-rose-500/10 text-rose-600'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3.5 pr-6 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="text-[11px] font-bold text-white bg-warm-900 hover:bg-warm-800 px-3.5 py-1.5 rounded-xl transition-all shadow-xs border border-warm-900 cursor-pointer"
                        >
                          {language === "vi" ? "Sửa" : "Edit"}
                        </button>
                        <button
                          onClick={() => triggerDelete(p.id)}
                          className="text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 px-3.5 py-1.5 rounded-xl transition-all shadow-xs border border-red-600 cursor-pointer"
                        >
                          {language === "vi" ? "Xóa" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modals */}
      <PaintsFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        mode={modalMode}
        initialData={initialData}
        categories={categories}
        suppliers={suppliers}
        colorCatalog={colorCatalog}
        language={language}
        onSuccess={handleFormSuccess}
      />

      <PaintsPromoModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        categories={categories}
        paints={paints}
        language={language}
        onSuccess={handlePromoSuccess}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPaintToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={language === "vi" ? "Xóa sản phẩm?" : "Delete Product?"}
        message={
          language === "vi"
            ? `Bạn có chắc chắn muốn xóa sản phẩm "${paints.find((p) => p.id === paintToDelete)?.name || ""}" không?`
            : `Are you sure you want to delete product "${paints.find((p) => p.id === paintToDelete)?.nameEn || ""}"?`
        }
      />
    </div>
  );
}
