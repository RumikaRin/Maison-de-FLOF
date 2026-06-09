"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { formatPrice } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  MOCK_PAINTS,
  MOCK_COLORS,
  MOCK_CATEGORIES,
  MOCK_SUPPLIERS,
  Paint,
  PaintColor
} from "@/lib/mock-data";
import { toast } from "sonner";
import { CustomSelect } from "@/components/ui/custom-select";


export default function AdminPaintsPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  // Core states
  const [paints, setPaints] = useState<Paint[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paintToDelete, setPaintToDelete] = useState<string | null>(null);

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingPaintId, setEditingPaintId] = useState<string | null>(null);

  // Form states
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [price, setPrice] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [volume, setVolume] = useState(5);
  const [volumeUnit, setVolumeUnit] = useState("L");
  const [stock, setStock] = useState(10);
  const [categoryId, setCategoryId] = useState("cat-1");
  const [supplierId, setSupplierId] = useState("sup-1");
  const [finish, setFinish] = useState("MATTE");
  const [paintType, setPaintType] = useState("INTERIOR");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [linkedColors, setLinkedColors] = useState<string[]>([]); // Color codes linked to this paint

  // Promotions Modal Control
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(10);
  const [promoMethod, setPromoMethod] = useState<"category" | "single">("category");
  const [promoSelectedCategoryId, setPromoSelectedCategoryId] = useState("cat-1");
  const [promoSelectedPaintId, setPromoSelectedPaintId] = useState("");

  useEffect(() => {
    setMounted(true);
    const storedPaints = localStorage.getItem("sonvn-paints");
    if (storedPaints) {
      try {
        setPaints(JSON.parse(storedPaints));
      } catch (e) {
        setPaints(MOCK_PAINTS);
      }
    } else {
      localStorage.setItem("sonvn-paints", JSON.stringify(MOCK_PAINTS));
      setPaints(MOCK_PAINTS);
    }
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
    setEditingPaintId(null);
    setSku("");
    setName("");
    setNameEn("");
    setPrice(500000);
    setDiscountPercent(0);
    setVolume(5);
    setVolumeUnit("L");
    setStock(20);
    setCategoryId(MOCK_CATEGORIES[0]?.id || "cat-1");
    setSupplierId(MOCK_SUPPLIERS[0]?.id || "sup-1");
    setFinish("MATTE");
    setPaintType("INTERIOR");
    setDescription("");
    setDescriptionEn("");
    setLinkedColors([]);
    setIsModalOpen(true);
  };

  const openEditModal = (paint: Paint) => {
    setModalMode("edit");
    setEditingPaintId(paint.id);
    setSku(paint.sku);
    setName(paint.name);
    setNameEn(paint.nameEn);
    setPrice(paint.price);
    setDiscountPercent(paint.discountPercent || 0);
    setVolume(paint.volume);
    setVolumeUnit(paint.volumeUnit);
    setStock(paint.stock);
    setCategoryId(paint.categoryId);
    setSupplierId(paint.supplierId);
    setFinish(paint.finish);
    setPaintType(paint.paintType);
    setDescription(paint.description || "");
    setDescriptionEn(paint.descriptionEn || "");
    setLinkedColors(paint.colors || []);
    setIsModalOpen(true);
  };

  const toggleLinkedColor = (code: string) => {
    if (linkedColors.includes(code)) {
      setLinkedColors(linkedColors.filter((c) => c !== code));
    } else {
      setLinkedColors([...linkedColors, code]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sku || !name || !nameEn || !price) {
      toast.error(
        language === "vi" ? "Vui lòng nhập đầy đủ các thông tin." : "Please fill in all inputs."
      );
      return;
    }

    if (modalMode === "add") {
      // Check duplicate SKU
      if (paints.some((p) => p.sku === sku)) {
        toast.error(
          language === "vi" ? "Mã SKU này đã tồn tại." : "This SKU code already exists."
        );
        return;
      }

      const newPaint: Paint = {
        id: `paint-${Date.now()}`,
        sku,
        name,
        nameEn,
        slug: name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""),
        categoryId,
        supplierId,
        description,
        descriptionEn,
        features: "",
        featuresEn: "",
        application: "",
        specifications: "",
        coverage: 12,
        coatsRequired: 2,
        dryingTime: "2 hours",
        paintType,
        finish,
        surfaces: ["WALL"],
        volume,
        volumeUnit,
        price,
        costPrice: price * 0.6,
        stock,
        images: ["https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800"],
        colors: linkedColors,
        discountPercent
      };

      const updatedPaints = [newPaint, ...paints];
      setPaints(updatedPaints);
      localStorage.setItem("sonvn-paints", JSON.stringify(updatedPaints));
      toast.success(
        language === "vi" ? "Đã thêm sản phẩm mới thành công!" : "Product added successfully!"
      );
    } else {
      // Edit
      const updatedPaints = paints.map((p) =>
        p.id === editingPaintId
          ? {
            ...p,
            sku,
            name,
            nameEn,
            price,
            volume,
            volumeUnit,
            stock,
            categoryId,
            supplierId,
            finish,
            paintType,
            description,
            descriptionEn,
            colors: linkedColors,
            discountPercent
          }
          : p
      );
      setPaints(updatedPaints);
      localStorage.setItem("sonvn-paints", JSON.stringify(updatedPaints));
      toast.success(
        language === "vi" ? "Đã cập nhật thông tin sản phẩm!" : "Product updated successfully!"
      );
    }

    setIsModalOpen(false);
  };

  const triggerDelete = (id: string) => {
    setPaintToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!paintToDelete) return;
    const target = paints.find((p) => p.id === paintToDelete);
    const updated = paints.filter((p) => p.id !== paintToDelete);
    setPaints(updated);
    localStorage.setItem("sonvn-paints", JSON.stringify(updated));
    toast.success(
      language === "vi"
        ? `Đã xóa sản phẩm "${target?.name || ""}" thành công.`
        : "Product deleted successfully."
    );
    setPaintToDelete(null);
  };

  const handleApplyPromotion = (e: React.FormEvent) => {
    e.preventDefault();

    if (promoDiscount < 0 || promoDiscount > 100) {
      toast.error(language === "vi" ? "Mức giảm giá phải từ 0% đến 100%." : "Discount must be between 0% and 100%.");
      return;
    }

    if (promoMethod === "category") {
      const updated = paints.map((p) =>
        p.categoryId === promoSelectedCategoryId
          ? { ...p, discountPercent: promoDiscount }
          : p
      );
      setPaints(updated);
      localStorage.setItem("sonvn-paints", JSON.stringify(updated));
      const categoryName = MOCK_CATEGORIES.find((c) => c.id === promoSelectedCategoryId)?.name || "";
      toast.success(
        language === "vi"
          ? `Đã áp dụng mức giảm giá ${promoDiscount}% cho tất cả sản phẩm thuộc danh mục "${categoryName}"!`
          : `Applied ${promoDiscount}% discount to all products under "${categoryName}" category!`
      );
    } else {
      if (!promoSelectedPaintId) {
        toast.error(language === "vi" ? "Vui lòng chọn một sản phẩm." : "Please select a product.");
        return;
      }
      const updated = paints.map((p) =>
        p.id === promoSelectedPaintId
          ? { ...p, discountPercent: promoDiscount }
          : p
      );
      setPaints(updated);
      localStorage.setItem("sonvn-paints", JSON.stringify(updated));
      const paintName = paints.find((p) => p.id === promoSelectedPaintId)?.name || "";
      toast.success(
        language === "vi"
          ? `Đã áp dụng mức giảm giá ${promoDiscount}% cho sản phẩm "${paintName}"!`
          : `Applied ${promoDiscount}% discount to product "${paintName}"!`
      );
    }

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
    <div className="flex flex-col gap-8 text-left">
      {/* Header and Add CTA */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold font-serif">
            {language === "vi" ? "Quản Lý Sản Phẩm Sơn" : "Paints & Products"}
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            {language === "vi"
              ? "Chỉnh sửa giá bán lẻ, khối lượng tồn kho và cấu hình bảng màu tương ứng cho sản phẩm."
              : "Edit retail prices, stock quantities, and link available color swatches to paint items."}
          </p>
        </div>
        <div className="flex gap-3 self-start">
          <button
            onClick={() => {
              setPromoDiscount(10);
              setPromoMethod("category");
              setPromoSelectedCategoryId(MOCK_CATEGORIES[0]?.id || "cat-1");
              setPromoSelectedPaintId(paints[0]?.id || "");
              setIsPromoModalOpen(true);
            }}
            className="bg-warm-900 hover:bg-warm-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            {language === "vi" ? "Thiết Lập Khuyến Mãi" : "Set Promotions"}
          </button>
          <button
            onClick={openAddModal}
            className="bg-warm-900 text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-warm-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div
          variants={statsItemVariants}
          whileHover={{ y: -4, borderColor: "rgba(107, 95, 82, 0.3)", boxShadow: "0 10px 25px -5px rgba(107, 95, 82, 0.08)" }}
          className="bg-white border border-warm-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-colors duration-200"
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
          whileHover={{ y: -4, borderColor: "rgba(107, 95, 82, 0.3)", boxShadow: "0 10px 25px -5px rgba(107, 95, 82, 0.08)" }}
          className="bg-white border border-warm-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-colors duration-200"
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
          whileHover={{ y: -4, borderColor: "rgba(107, 95, 82, 0.3)", boxShadow: "0 10px 25px -5px rgba(107, 95, 82, 0.08)" }}
          className="bg-white border border-warm-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-colors duration-200"
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
          whileHover={{ y: -4, borderColor: "rgba(107, 95, 82, 0.3)", boxShadow: "0 10px 25px -5px rgba(107, 95, 82, 0.08)" }}
          className="bg-white border border-warm-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-colors duration-200"
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
                    ? MOCK_CATEGORIES.find((c) => c.id === selectedCategory)?.name
                    : MOCK_CATEGORIES.find((c) => c.id === selectedCategory)?.nameEn)}
              </span>
              <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <DropdownMenuRadioGroup value={selectedCategory} onValueChange={setSelectedCategory}>
              <DropdownMenuRadioItem value="all" className="text-xs font-semibold text-warm-900 cursor-pointer">
                {language === "vi" ? "Tất cả danh mục" : "All Categories"}
              </DropdownMenuRadioItem>
              {MOCK_CATEGORIES.map((c) => (
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
                  : MOCK_SUPPLIERS.find((s) => s.id === selectedBrand)?.name}
              </span>
              <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <DropdownMenuRadioGroup value={selectedBrand} onValueChange={setSelectedBrand}>
              <DropdownMenuRadioItem value="all" className="text-xs font-semibold text-warm-900 cursor-pointer">
                {language === "vi" ? "Tất cả hãng sản xuất" : "All Brands"}
              </DropdownMenuRadioItem>
              {MOCK_SUPPLIERS.map((s) => (
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
                const category = MOCK_CATEGORIES.find((c) => c.id === p.categoryId);
                const supplier = MOCK_SUPPLIERS.find((s) => s.id === p.supplierId);
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

      {/* Edit/Add Paint Modal - Premium Framer Motion Transition */}
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
                    ? (language === "vi" ? "Thêm sản phẩm sơn mới" : "Add New Paint")
                    : (language === "vi" ? "Chỉnh sửa sản phẩm" : "Edit Paint")}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-warm-450 hover:text-warm-900 text-xs font-bold px-2 py-1 transition-colors"
                >
                  {language === "vi" ? "[Đóng]" : "[Close]"}
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 pb-36 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={modalMode === "edit"}
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="E.g. JOT-MAJ-01"
                      className="px-3 py-2 rounded border border-border bg-background text-sm font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Giá bán lẻ (VND)" : "Price (VND)"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="px-3 py-2 rounded border border-border bg-background text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Tên tiếng Việt" : "Name (Vietnamese)"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="px-3 py-2 rounded border border-border bg-background text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Tên tiếng Anh" : "Name (English)"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      className="px-3 py-2 rounded border border-border bg-background text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Dung tích" : "Volume"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="px-3 py-2 rounded border border-border bg-background text-sm font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Đơn vị" : "Unit"}
                    </label>
                    <CustomSelect
                      value={volumeUnit}
                      onValueChange={setVolumeUnit}
                      options={[
                        { value: "L", label: "Lít (L)" },
                        { value: "ml", label: "Mililit (ml)" },
                        { value: "kg", label: "Kilogam (kg)" },
                      ]}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Khuyến mãi (%)" : "Discount (%)"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="px-3 py-2 rounded border border-border bg-background text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Loại sơn" : "Paint Type"}
                    </label>
                    <CustomSelect
                      value={paintType}
                      onValueChange={setPaintType}
                      options={[
                        { value: "INTERIOR", label: language === "vi" ? "Trong nhà (Interior)" : "Interior" },
                        { value: "EXTERIOR", label: language === "vi" ? "Ngoài trời (Exterior)" : "Exterior" },
                        { value: "PRIMER", label: language === "vi" ? "Sơn lót (Primer)" : "Primer" },
                        { value: "WATERPROOF", label: language === "vi" ? "Chống thấm (Waterproof)" : "Waterproof" },
                      ]}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Tồn kho" : "Stock"}
                    </label>
                    <input
                      type="number"
                      required
                      value={stock}
                      onChange={(e) => setStock(Number(e.target.value))}
                      className="px-3 py-2 rounded border border-border bg-background text-sm font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Bề mặt" : "Finish"}
                    </label>
                    <CustomSelect
                      value={finish}
                      onValueChange={setFinish}
                      options={[
                        { value: "MATTE", label: "Mờ / Matte" },
                        { value: "GLOSS", label: "Bóng / Gloss" },
                        { value: "SEMI_GLOSS", label: "Bán bóng / Semi-Gloss" },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Hãng sản xuất" : "Supplier"}
                    </label>
                    <CustomSelect
                      value={supplierId}
                      onValueChange={setSupplierId}
                      options={MOCK_SUPPLIERS.map((s) => ({
                        value: s.id,
                        label: s.name,
                      }))}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Danh mục sản phẩm" : "Category"}
                    </label>
                    <CustomSelect
                      value={categoryId}
                      onValueChange={setCategoryId}
                      options={MOCK_CATEGORIES.map((c) => ({
                        value: c.id,
                        label: language === "vi" ? c.name : c.nameEn,
                      }))}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    {language === "vi" ? "Mô tả sản phẩm" : "Product Description"}
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="px-3 py-2 rounded border border-border bg-background text-sm resize-none text-warm-900"
                  />
                </div>

                {/* Linking Color swatches directly */}
                <div className="flex flex-col gap-2.5 border-t border-warm-100 pt-4 mt-2">
                  <h4 className="text-xs font-bold text-warm-900">
                    {language === "vi" ? "Liên kết mã màu sắc áp dụng cho sản phẩm này:" : "Link Paint Color swatches for this product:"}
                  </h4>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto border border-border p-3.5 rounded bg-zinc-50 dark:bg-zinc-900/40">
                    {MOCK_COLORS.map((col) => {
                      const isLinked = linkedColors.includes(col.code);
                      return (
                        <button
                          type="button"
                          key={col.code}
                          onClick={() => toggleLinkedColor(col.code)}
                          className={`h-9 px-3.5 rounded text-xs font-bold border flex items-center gap-2 transition-all duration-150 ${isLinked
                            ? "bg-jotun-teal text-white border-jotun-teal ring-1 ring-jotun-teal"
                            : "bg-white dark:bg-zinc-950 border-border text-foreground hover:border-jotun-teal"
                            }`}
                        >
                          <div
                            className="h-4 w-4 rounded border border-black/10 shrink-0"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{language === "vi" ? col.name : col.nameEn} ({col.code})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit panel */}
                <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold bg-warm-100 hover:bg-warm-200 rounded-xl text-warm-900 transition-colors"
                  >
                    {language === "vi" ? "Hủy" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="bg-warm-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-warm-800 transition-colors"
                  >
                    {language === "vi" ? "Xác nhận" : "Confirm"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promotion Batch Setup Modal - Premium Framer Motion Transition */}
      <AnimatePresence>
        {isPromoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPromoModalOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto text-left"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-warm-200 w-full max-w-md rounded-2xl shadow-2xl flex flex-col my-8 overflow-visible"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-warm-100 flex items-center justify-between bg-warm-50/50 rounded-t-2xl">
                <h3 className="font-serif font-bold text-base text-warm-900">
                  {language === "vi" ? "Thiết lập chương trình Khuyến mãi" : "Set up Promotion"}
                </h3>
                <button
                  onClick={() => setIsPromoModalOpen(false)}
                  className="text-warm-450 hover:text-warm-900 text-xs font-bold px-2 py-1 transition-colors"
                >
                  {language === "vi" ? "[Đóng]" : "[Close]"}
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleApplyPromotion} className="p-6 pb-16 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    {language === "vi" ? "Mức giảm giá (%)" : "Discount Percentage (%)"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={promoDiscount}
                    onChange={(e) => setPromoDiscount(Number(e.target.value))}
                    placeholder="E.g. 15"
                    className="px-3 py-2 rounded border border-border bg-background text-sm font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    {language === "vi" ? "Áp dụng theo" : "Apply by"}
                  </label>
                  <CustomSelect
                    value={promoMethod}
                    onValueChange={(val) => setPromoMethod(val as any)}
                    options={[
                      { value: "category", label: language === "vi" ? "Danh mục sản phẩm" : "Product Category" },
                      { value: "single", label: language === "vi" ? "Đơn lẻ từng sản phẩm" : "Single Product" },
                    ]}
                  />
                </div>

                <AnimatePresence mode="wait">
                  {promoMethod === "category" ? (
                    <motion.div
                      key="promo-cat"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col gap-1"
                    >
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">
                        {language === "vi" ? "Chọn danh mục sơn" : "Select Category"}
                      </label>
                      <CustomSelect
                        value={promoSelectedCategoryId}
                        onValueChange={setPromoSelectedCategoryId}
                        options={MOCK_CATEGORIES.map((c) => ({
                          value: c.id,
                          label: language === "vi" ? c.name : c.nameEn,
                        }))}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="promo-single"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col gap-1"
                    >
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">
                        {language === "vi" ? "Chọn sản phẩm sơn" : "Select Paint Product"}
                      </label>
                      <CustomSelect
                        value={promoSelectedPaintId}
                        onValueChange={setPromoSelectedPaintId}
                        placeholder={language === "vi" ? "-- Chọn sản phẩm --" : "-- Select Paint --"}
                        options={paints.map((p) => ({
                          value: p.id,
                          label: `${p.sku} - ${language === "vi" ? p.name : p.nameEn}`,
                        }))}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit panel */}
                <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setIsPromoModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold bg-warm-100 hover:bg-warm-200 rounded-xl text-warm-900 transition-colors"
                  >
                    {language === "vi" ? "Hủy" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="bg-warm-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-warm-800 transition-colors"
                  >
                    {language === "vi" ? "Áp dụng" : "Apply"}
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

