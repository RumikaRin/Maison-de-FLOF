"use client";

import { useState, useEffect } from "react";
import { useLanguageStore } from "@/store/language-store";
import { toast } from "@/components/ui/csp-toast";
import { CustomSelect } from "@/components/ui/custom-select";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { safeMotion, AnimatePresence } from "@/components/ui/motion-safe";
import { DeleteConfirmModal } from "@/components/ui/delete-confirm-modal";
import { ColorSwatch } from "@/components/ui/color-swatch";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";


type ColorCollection = {
  id: string;
  name: string;
  nameEn: string | null;
  isActive: boolean;
};

type AdminColor = {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  hex: string;
  toneFamily: string;
  colorFamily: string;
  collectionId: string | null;
  collection?: Pick<ColorCollection, "id" | "name" | "nameEn"> | null;
};

export default function AdminColorsPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  // Core state
  const [colors, setColors] = useState<AdminColor[]>([]);
  const [collections, setCollections] = useState<ColorCollection[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedColorFamily, setSelectedColorFamily] = useState("all");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [colorToDelete, setColorToDelete] = useState<string | null>(null);

  // Modal control
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingColorId, setEditingColorId] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [hex, setHex] = useState("#FFFFFF");
  const [toneFamily, setToneFamily] = useState("neutral");
  const [colorFamily, setColorFamily] = useState("white");
  const [collectionId, setCollectionId] = useState("none");

  useEffect(() => {
    Promise.all([fetch("/api/admin/colors"), fetch("/api/admin/collections")])
      .then(async ([colorResponse, collectionResponse]) => {
        const [colorData, collectionData] = await Promise.all([
          colorResponse.json(),
          collectionResponse.json(),
        ]);
        if (!colorResponse.ok) throw new Error(colorData.error || "Không thể tải mã màu");
        if (!collectionResponse.ok) {
          throw new Error(collectionData.error || "Không thể tải bộ sưu tập màu");
        }
        setColors(colorData);
        setCollections(collectionData);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setMounted(true));
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

  // Search & Filter
  const filteredColors = colors.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFamily = selectedColorFamily === "all" || c.colorFamily === selectedColorFamily;

    return matchesSearch && matchesFamily;
  });

  const openAddModal = () => {
    setModalMode("add");
    setEditingColorId(null);
    setCode("");
    setName("");
    setNameEn("");
    setHex("#007B8A");
    setToneFamily("neutral");
    setColorFamily("white");
    setCollectionId("none");
    setIsModalOpen(true);
  };

  const openEditModal = (color: AdminColor) => {
    setModalMode("edit");
    setEditingColorId(color.id);
    setCode(color.code);
    setName(color.name);
    setNameEn(color.nameEn);
    setHex(color.hex);
    setToneFamily(color.toneFamily || "neutral");
    setColorFamily(color.colorFamily || "white");
    setCollectionId(color.collectionId || "none");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || !name || !nameEn || !hex) {
      toast.error(
        language === "vi" ? "Vui lòng điền đầy đủ các thông tin." : "Please fill in all inputs."
      );
      return;
    }

    const response = await fetch("/api/admin/colors", {
      method: modalMode === "add" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingColorId || undefined,
        code,
        name,
        nameEn,
        hex,
        toneFamily,
        colorFamily,
        collectionId: collectionId === "none" ? null : collectionId,
      }),
    });
    const saved = await response.json();
    if (!response.ok) {
      toast.error(saved.error || "Không thể lưu mã màu");
      return;
    }

    setColors((current) =>
      modalMode === "add"
        ? [saved, ...current]
        : current.map((color) => (color.id === saved.id ? saved : color)),
    );
    toast.success(
      modalMode === "add"
        ? language === "vi" ? "Đã thêm mã màu thành công!" : "Color added successfully!"
        : language === "vi" ? "Đã cập nhật thông tin mã màu!" : "Color updated successfully!",
    );
    setIsModalOpen(false);
  };

  const triggerDelete = (id: string) => {
    setColorToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!colorToDelete) return;
    const target = colors.find((c) => c.id === colorToDelete);
    const response = await fetch(`/api/admin/colors?id=${encodeURIComponent(colorToDelete)}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Không thể xóa mã màu");
      return;
    }
    setColors((current) => current.filter((c) => c.id !== colorToDelete));
    toast.success(
      language === "vi"
        ? `Đã xóa mã màu ${target?.code || ""} thành công.`
        : `Color ${target?.code || ""} deleted successfully.`
    );
    setColorToDelete(null);
  };

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Header and Add CTA with spring reveal */}
      <safeMotion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold font-serif">
            {language === "vi" ? "Quản Lý Mã Màu Sơn" : "Colors Management"}
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            {language === "vi"
              ? "Cập nhật, thêm mới hoặc chỉnh sửa mã màu sơn phối trong hệ thống."
              : "Update, add new, or edit coordinated paint colors in the database."}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-warm-900 text-white font-bold text-xs px-5 py-3 rounded-xl hover:bg-warm-800 transition-colors flex items-center justify-center gap-1.5 self-start shadow-sm cursor-pointer"
        >
          {language === "vi" ? "Thêm Mã Màu Mới" : "Add New Color"}
        </button>
      </safeMotion.div>

      {/* Filter and Search Bar */}
      <safeMotion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="md:col-span-2 relative">
          <input
            type="text"
            placeholder={
              language === "vi" ? "Tìm theo tên màu, mã số..." : "Search by color name, code..."
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
                {(() => {
                  const items = [
                    { value: "all", label: language === "vi" ? "Tất cả nhóm màu" : "All Color Families" },
                    { value: "white", label: language === "vi" ? "Trắng (White)" : "White" },
                    { value: "beige", label: language === "vi" ? "Be / Kem (Beige)" : "Beige" },
                    { value: "grey", label: language === "vi" ? "Xám (Grey)" : "Grey" },
                    { value: "yellow", label: language === "vi" ? "Vàng (Yellow)" : "Yellow" },
                    { value: "orange", label: language === "vi" ? "Cam (Orange)" : "Orange" },
                    { value: "red", label: language === "vi" ? "Đỏ (Red)" : "Red" },
                    { value: "blue", label: language === "vi" ? "Xanh dương (Blue)" : "Blue" },
                    { value: "green", label: language === "vi" ? "Xanh lá (Green)" : "Green" },
                    { value: "brown", label: language === "vi" ? "Nâu (Brown)" : "Brown" },
                  ];
                  return items.find((i) => i.value === selectedColorFamily)?.label || "";
                })()}
              </span>
              <ChevronDown className="h-4 w-4 text-warm-450 opacity-60 shrink-0 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto bg-white border border-warm-200 rounded-xl shadow-lg p-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <DropdownMenuRadioGroup value={selectedColorFamily} onValueChange={setSelectedColorFamily}>
              {[
                { value: "all", label: language === "vi" ? "Tất cả nhóm màu" : "All Color Families" },
                { value: "white", label: language === "vi" ? "Trắng (White)" : "White" },
                { value: "beige", label: language === "vi" ? "Be / Kem (Beige)" : "Beige" },
                { value: "grey", label: language === "vi" ? "Xám (Grey)" : "Grey" },
                { value: "yellow", label: language === "vi" ? "Vàng (Yellow)" : "Yellow" },
                { value: "orange", label: language === "vi" ? "Cam (Orange)" : "Orange" },
                { value: "red", label: language === "vi" ? "Đỏ (Red)" : "Red" },
                { value: "blue", label: language === "vi" ? "Xanh dương (Blue)" : "Blue" },
                { value: "green", label: language === "vi" ? "Xanh lá (Green)" : "Green" },
                { value: "brown", label: language === "vi" ? "Nâu (Brown)" : "Brown" },
              ].map((fam) => (
                <DropdownMenuRadioItem
                  key={fam.value}
                  value={fam.value}
                  className="text-xs font-semibold text-warm-900 cursor-pointer"
                >
                  {fam.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </safeMotion.div>

      {/* Table grid of colors with exit/entry animations */}
      <safeMotion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="bg-white border border-warm-200/80 rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-warm-150 text-warm-450 font-bold uppercase tracking-wider text-[10px] bg-warm-50/50">
                <th className="py-3 px-6 w-[12%]">{language === "vi" ? "Xem trước" : "Preview"}</th>
                <th className="py-3 px-4 w-[12%]">{language === "vi" ? "Mã số" : "Code"}</th>
                <th className="py-3 px-4 w-[23%]">{language === "vi" ? "Tên Tiếng Việt" : "Vietnamese Name"}</th>
                <th className="py-3 px-4 w-[23%]">{language === "vi" ? "Tên Tiếng Anh" : "English Name"}</th>
                <th className="py-3 px-4 w-[18%]">{language === "vi" ? "Nhóm màu / Tông" : "Family / Tone"}</th>
                <th className="py-3 pr-6 text-right w-[12%]">{language === "vi" ? "Thao tác" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 font-semibold text-warm-800">
              {filteredColors.map((color) => (
                <tr
                  key={color.id}
                  className="hover:bg-warm-50/30 transition-colors"
                >
                  <td className="py-3.5 px-6">
                    <ColorSwatch
                      color={color.hex}
                      className="h-7 w-12 cursor-pointer rounded-lg border border-black/10 shadow-sm"
                    />
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-warm-900">{color.code}</td>
                  <td className="py-3.5 px-4 text-warm-850">{color.name}</td>
                  <td className="py-3.5 px-4 text-warm-500">{color.nameEn}</td>
                  <td className="py-3.5 px-4 text-xs font-bold uppercase">
                    {color.colorFamily && (
                      <span className="px-2 py-0.5 bg-warm-100 text-warm-600 rounded-lg mr-1">
                        {color.colorFamily}
                      </span>
                    )}
                    {color.toneFamily && (
                      <span className="px-2 py-0.5 bg-jotun-teal/10 text-jotun-teal rounded-lg">
                        {color.toneFamily}
                      </span>
                    )}
                    {color.collection && (
                      <span className="mt-1 block text-[10px] normal-case text-warm-450">
                        {color.collection.name}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-6 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(color)}
                        className="text-[11px] font-bold text-white bg-warm-900 hover:bg-warm-800 px-3.5 py-1.5 rounded-xl transition-all shadow-xs border border-warm-900 cursor-pointer"
                        title={language === "vi" ? "Chỉnh sửa" : "Edit"}
                      >
                        {language === "vi" ? "Sửa" : "Edit"}
                      </button>
                      <button
                        onClick={() => triggerDelete(color.id)}
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
      </safeMotion.div>

      {/* CRUD Add/Edit Modal overlay with premium spring reveal */}
      <AnimatePresence>
        {isModalOpen && (
          <safeMotion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-left"
          >
            <safeMotion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-warm-200 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-visible"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-warm-100 flex items-center justify-between bg-warm-50/50 rounded-t-2xl">
                <h3 className="font-serif font-bold text-base text-warm-900">
                  {modalMode === "add"
                    ? language === "vi"
                      ? "Thêm mã màu sơn mới"
                      : "Add New Paint Color"
                    : language === "vi"
                      ? "Chỉnh sửa thông tin mã màu"
                      : "Edit Paint Color"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-warm-450 hover:text-warm-900 text-xs font-bold px-2 py-1 transition-colors"
                >
                  {language === "vi" ? "[Đóng]" : "[Close]"}
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 pb-12 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Mã số màu" : "Color Code"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={code}
                      disabled={modalMode === "edit"}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="E.g. 1001"
                      className="px-3 py-2 rounded border border-border bg-background text-sm font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Mã Hex màu" : "Hex Value"} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={hex}
                        onChange={(e) => setHex(e.target.value)}
                        className="h-9 w-9 border border-border rounded p-0 cursor-pointer shrink-0"
                      />
                      <input
                        type="text"
                        required
                        value={hex}
                        onChange={(e) => setHex(e.target.value)}
                        placeholder="#FFFFFF"
                        className="w-full px-3 py-2 rounded border border-border bg-background text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    {language === "vi" ? "Tên Tiếng Việt" : "Vietnamese Name"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === "vi" ? "Trắng Ngà..." : "Ivory White..."}
                    className="px-3 py-2 rounded border border-border bg-background text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    {language === "vi" ? "Tên Tiếng Anh" : "English Name"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="Ivory White..."
                    className="px-3 py-2 rounded border border-border bg-background text-sm"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">
                    {language === "vi" ? "Bộ sưu tập màu" : "Color Collection"}
                  </label>
                  <CustomSelect
                    value={collectionId}
                    onValueChange={setCollectionId}
                    options={[
                      {
                        value: "none",
                        label: language === "vi" ? "Không thuộc bộ sưu tập" : "No collection",
                      },
                      ...collections
                        .filter((collection) => collection.isActive || collection.id === collectionId)
                        .map((collection) => ({
                          value: collection.id,
                          label:
                            language === "vi"
                              ? collection.name
                              : collection.nameEn || collection.name,
                        })),
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Nhóm màu" : "Color Family"}
                    </label>
                    <CustomSelect
                      value={colorFamily}
                      onValueChange={setColorFamily}
                      options={[
                        { value: "white", label: "White" },
                        { value: "beige", label: "Beige" },
                        { value: "grey", label: "Grey" },
                        { value: "yellow", label: "Yellow" },
                        { value: "orange", label: "Orange" },
                        { value: "red", label: "Red" },
                        { value: "blue", label: "Blue" },
                        { value: "green", label: "Green" },
                        { value: "brown", label: "Brown" },
                      ]}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      {language === "vi" ? "Tông màu" : "Tone Family"}
                    </label>
                    <CustomSelect
                      value={toneFamily}
                      onValueChange={setToneFamily}
                      options={[
                        { value: "neutral", label: "Neutral" },
                        { value: "warm", label: "Warm" },
                        { value: "cool", label: "Cool" },
                        { value: "bold", label: "Bold / Accent" },
                        { value: "earth", label: "Earth Tone" },
                        { value: "pastel", label: "Pastel" },
                      ]}
                    />
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
            </safeMotion.div>
          </safeMotion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setColorToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={language === "vi" ? "Xóa mã màu?" : "Delete Color?"}
        message={
          language === "vi"
            ? `Bạn có chắc muốn xóa mã màu ${colors.find((c) => c.id === colorToDelete)?.code || ""} không?`
            : `Are you sure you want to delete color code ${colors.find((c) => c.id === colorToDelete)?.code || ""}?`
        }
      />
    </div>
  );
}

