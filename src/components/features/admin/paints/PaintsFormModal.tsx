"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Paint, Category, Supplier, PaintColor } from "@/types";
import { CustomSelect } from "@/components/ui/custom-select";

interface PaintsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  initialData?: Paint | null;
  categories: Category[];
  suppliers: Supplier[];
  colorCatalog: PaintColor[];
  language: string;
  onSuccess: (savedPaint: Paint, mode: "add" | "edit") => void;
}

export function PaintsFormModal({
  isOpen,
  onClose,
  mode,
  initialData,
  categories,
  suppliers,
  colorCatalog,
  language,
  onSuccess,
}: PaintsFormModalProps) {
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
  const [linkedColors, setLinkedColors] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialData) {
        setSku(initialData.sku);
        setName(initialData.name);
        setNameEn(initialData.nameEn);
        setPrice(initialData.price);
        setDiscountPercent(initialData.discountPercent || 0);
        setVolume(initialData.volume);
        setVolumeUnit(initialData.volumeUnit);
        setStock(initialData.stock);
        setCategoryId(initialData.categoryId);
        setSupplierId(initialData.supplierId);
        setFinish(initialData.finish);
        setPaintType(initialData.paintType);
        setDescription(initialData.description || "");
        setDescriptionEn(initialData.descriptionEn || "");
        setLinkedColors(initialData.colors || []);
      } else {
        setSku("");
        setName("");
        setNameEn("");
        setPrice(500000);
        setDiscountPercent(0);
        setVolume(5);
        setVolumeUnit("L");
        setStock(20);
        setCategoryId(categories[0]?.id || "cat-1");
        setSupplierId(suppliers[0]?.id || "sup-1");
        setFinish("MATTE");
        setPaintType("INTERIOR");
        setDescription("");
        setDescriptionEn("");
        setLinkedColors([]);
      }
    }
  }, [isOpen, mode, initialData, categories, suppliers]);

  const toggleLinkedColor = (code: string) => {
    if (linkedColors.includes(code)) {
      setLinkedColors(linkedColors.filter((c) => c !== code));
    } else {
      setLinkedColors([...linkedColors, code]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sku || !name || !nameEn || !price) {
      toast.error(
        language === "vi" ? "Vui lòng nhập đầy đủ các thông tin." : "Please fill in all inputs."
      );
      return;
    }

    const response = await fetch("/api/admin/products", {
      method: mode === "add" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: initialData?.id || undefined,
        sku,
        name,
        nameEn,
        categoryId,
        supplierId,
        description,
        descriptionEn,
        paintType,
        finish,
        volume,
        volumeUnit,
        price,
        costPrice: price * 0.6,
        stock,
        colors: linkedColors,
        discountPercent,
      }),
    });
    const saved = await response.json();
    if (!response.ok) {
      toast.error(saved.error || "Không thể lưu sản phẩm");
      return;
    }

    toast.success(
      mode === "add"
        ? language === "vi" ? "Đã thêm sản phẩm mới thành công!" : "Product added successfully!"
        : language === "vi" ? "Đã cập nhật thông tin sản phẩm!" : "Product updated successfully!",
    );
    onSuccess(saved, mode);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
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
                {mode === "add"
                  ? (language === "vi" ? "Thêm sản phẩm sơn mới" : "Add New Paint")
                  : (language === "vi" ? "Chỉnh sửa sản phẩm" : "Edit Paint")}
              </h3>
              <button
                onClick={onClose}
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
                    disabled={mode === "edit"}
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
                    disabled={mode === "edit"}
                    className="px-3 py-2 rounded border border-border bg-background text-sm font-mono disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  {mode === "edit" && (
                    <span className="text-[9px] text-muted-foreground">
                      {language === "vi" ? "Điều chỉnh tồn kho tại mục Nhập hàng." : "Adjust stock from Inventory."}
                    </span>
                  )}
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
                    options={suppliers.map((s) => ({
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
                    options={categories.map((c) => ({
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
                  {colorCatalog.map((col) => {
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
                  onClick={onClose}
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
  );
}
