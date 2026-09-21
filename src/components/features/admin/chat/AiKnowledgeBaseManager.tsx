"use client";

import { useEffect, useState, useRef } from "react";
import {
  FileSpreadsheet,
  FileText,
  FileCode,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Eye,
  RefreshCw,
  Layers,
  Database,
  Info,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "@/components/ui/csp-toast";
import { useLanguageStore } from "@/store/language-store";

export type KnowledgeDoc = {
  id: string;
  filename: string;
  fileType: "excel" | "word" | "text";
  sizeBytes: number;
  charCount: number;
  tokenEstimate: number;
  isActive: boolean;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type CatalogStats = {
  productCount: number;
  colorCount: number;
  isFallback: boolean;
};

export function AiKnowledgeBaseManager() {
  const { language } = useLanguageStore();

  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [catalogStats, setCatalogStats] = useState<CatalogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshingCatalog, setRefreshingCatalog] = useState(false);

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<KnowledgeDoc | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchKnowledgeData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/chat/ai-knowledge");
      if (!res.ok) throw new Error("Không thể tải cơ sở tri thức");
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents || []);
        setCatalogStats(data.catalogStats || null);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi tải cơ sở tri thức");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchKnowledgeData();
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Tệp quá lớn. Vui lòng chọn tệp nhỏ hơn 10MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch("/api/admin/chat/ai-knowledge", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Tải lên thất bại");
      }

      toast.success(data.message || `Đã nạp tài liệu "${file.name}"`);
      await fetchKnowledgeData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi khi xử lý tệp");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleToggleActive = async (doc: KnowledgeDoc) => {
    const nextState = !doc.isActive;
    try {
      const res = await fetch(`/api/admin/chat/ai-knowledge/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextState }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể cập nhật trạng thái");
      }

      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, isActive: nextState } : d)),
      );
      toast.success(
        nextState
          ? `Đã kích hoạt tài liệu "${doc.filename}"`
          : `Đã tạm ẩn tài liệu "${doc.filename}"`,
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi cập nhật");
    }
  };

  const handleDelete = async (doc: KnowledgeDoc) => {
    if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn tài liệu "${doc.filename}" khỏi AI?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/chat/ai-knowledge/${doc.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể xóa tài liệu");
      }

      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success(`Đã xóa tài liệu "${doc.filename}"`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Lỗi xóa");
    }
  };

  const handleRefreshCatalog = async () => {
    setRefreshingCatalog(true);
    await fetchKnowledgeData();
    setRefreshingCatalog(false);
    toast.success("Đã đồng bộ lại danh mục sản phẩm website");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const renderFileIcon = (type: "excel" | "word" | "text") => {
    switch (type) {
      case "excel":
        return <FileSpreadsheet className="h-5 w-5 text-emerald-600" />;
      case "word":
        return <FileText className="h-5 w-5 text-blue-600" />;
      default:
        return <FileCode className="h-5 w-5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Live Website Catalog Sync */}
      <div className="rounded-2xl border border-jotun-teal/30 bg-gradient-to-br from-jotun-teal/10 via-white to-warm-50 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-jotun-teal/15 text-jotun-teal flex items-center justify-center shrink-0">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-warm-950">
                  {language === "vi"
                    ? "Đồng bộ sản phẩm website thời gian thực"
                    : "Live Website Product Sync"}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  {language === "vi" ? "Tự động kết nối" : "Auto Connected"}
                </span>
              </div>
              <p className="text-xs text-warm-600 mt-1 leading-relaxed max-w-2xl">
                {language === "vi"
                  ? "AI tự động nắm rõ thông tin sản phẩm, SKU, loại sơn nội/ngoại thất, độ phủ, quy cách và giá bán từ website để trả lời khách hàng chuẩn xác nhất."
                  : "AI automatically pulls current products, SKUs, interior/exterior categories, coverage, and prices from the website to assist customers."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 sm:border-l sm:border-warm-200/80 sm:pl-5">
            <div className="text-right">
              <div className="text-base font-bold text-warm-900">
                {catalogStats ? `${catalogStats.productCount} sản phẩm` : "..."}
              </div>
              <div className="text-[11px] text-warm-500">
                {catalogStats ? `${catalogStats.colorCount} mã màu` : "Đang tải..."}
              </div>
            </div>
            <button
              type="button"
              onClick={handleRefreshCatalog}
              disabled={refreshingCatalog}
              title={language === "vi" ? "Làm mới dữ liệu từ Database" : "Refresh database cache"}
              className="h-9 w-9 rounded-xl border border-warm-200 bg-white hover:bg-warm-50 flex items-center justify-center text-warm-600 hover:text-warm-900 transition disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshingCatalog ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Box */}
      <div className="rounded-2xl border border-dashed border-warm-300 bg-white p-6 shadow-xs text-center transition hover:border-jotun-teal">
        <input
          type="file"
          ref={fileInputRef}
          accept=".xlsx,.xls,.csv,.docx,.txt,.md"
          className="hidden"
          onChange={(e) => void handleFileUpload(e.target.files)}
        />
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-jotun-teal/10 text-jotun-teal mb-3">
          <UploadCloud className="h-7 w-7" />
        </div>
        <h4 className="text-sm font-bold text-warm-900">
          {language === "vi"
            ? "Tải lên tài liệu Excel, Word hoặc Văn bản"
            : "Upload Excel, Word or Text Documents"}
        </h4>
        <p className="text-xs text-warm-550 mt-1 max-w-md mx-auto">
          {language === "vi"
            ? "Hỗ trợ file Excel (.xlsx, .xls, .csv), Word (.docx) và Văn bản (.txt, .md) tối đa 10MB. Hệ thống sẽ tự động trích xuất bảng biểu và dữ liệu để nạp vào AI."
            : "Supports Excel (.xlsx, .csv), Word (.docx) and Text (.txt, .md) up to 10MB. Tables and texts will be automatically parsed."}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl bg-jotun-teal px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-jotun-teal/90 disabled:opacity-50 transition"
          >
            {uploading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                {language === "vi" ? "Đang phân tích tệp..." : "Parsing document..."}
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                {language === "vi" ? "Chọn tệp từ máy tính" : "Choose file from computer"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div className="rounded-2xl border border-warm-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 sm:px-6 border-b border-warm-200 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-warm-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-jotun-teal" />
              {language === "vi" ? "Tài liệu cơ sở tri thức đã nạp" : "Uploaded Knowledge Documents"}
              <span className="rounded-full bg-warm-100 px-2 py-0.5 text-[11px] font-semibold text-warm-700">
                {documents.length}
              </span>
            </h4>
            <p className="text-[11px] text-warm-500 mt-0.5">
              {language === "vi"
                ? "Các tài liệu đang BẬT sẽ được đưa vào ngữ cảnh AI để tư vấn báo giá và kỹ thuật."
                : "Active documents are injected into AI context for accurate recommendations."}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-warm-500">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-jotun-teal" />
            {language === "vi" ? "Đang tải danh sách tài liệu..." : "Loading documents..."}
          </div>
        ) : documents.length === 0 ? (
          <div className="p-10 text-center text-xs text-warm-500 space-y-1.5">
            <Info className="h-6 w-6 text-warm-400 mx-auto" />
            <p className="font-semibold text-warm-700">
              {language === "vi" ? "Chưa có tài liệu bổ sung nào" : "No documents added yet"}
            </p>
            <p className="text-[11px] text-warm-500 max-w-sm mx-auto">
              {language === "vi"
                ? "Hãy tải lên bảng giá sơn Jotun, hướng dẫn phối màu, hoặc quy trình thi công để trợ lý AI tư vấn sát thực tế nhất."
                : "Upload price sheets or painting guides to help the AI answer with full context."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-warm-100 overflow-x-auto">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  doc.isActive ? "hover:bg-warm-50/40" : "bg-warm-50/60 opacity-70"
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="mt-0.5 h-10 w-10 rounded-xl bg-warm-100 flex items-center justify-center shrink-0">
                    {renderFileIcon(doc.fileType)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-warm-900 truncate">{doc.filename}</p>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          doc.fileType === "excel"
                            ? "bg-emerald-100 text-emerald-800"
                            : doc.fileType === "word"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {doc.fileType}
                      </span>
                      {!doc.isActive && (
                        <span className="rounded-md bg-warm-200 px-1.5 py-0.5 text-[9px] font-semibold text-warm-700">
                          {language === "vi" ? "Tạm tắt" : "Disabled"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-warm-500 mt-1 flex-wrap">
                      <span>{formatFileSize(doc.sizeBytes)}</span>
                      <span>•</span>
                      <span>{doc.charCount.toLocaleString("vi-VN")} ký tự</span>
                      <span>•</span>
                      <span>~{doc.tokenEstimate.toLocaleString("vi-VN")} tokens</span>
                      <span>•</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {/* Toggle Active */}
                  <button
                    type="button"
                    onClick={() => void handleToggleActive(doc)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition border ${
                      doc.isActive
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                        : "bg-warm-100 border-warm-300 text-warm-600 hover:bg-warm-200"
                    }`}
                  >
                    {doc.isActive
                      ? language === "vi"
                        ? "Đang bật"
                        : "Active"
                      : language === "vi"
                      ? "Đã tắt"
                      : "Inactive"}
                  </button>

                  {/* Preview Content */}
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    title={language === "vi" ? "Xem trước nội dung" : "Preview extracted text"}
                    className="p-2 rounded-xl border border-warm-200 bg-white text-warm-600 hover:text-warm-900 hover:bg-warm-50 transition"
                  >
                    <Eye className="h-4 w-4" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => void handleDelete(doc)}
                    title={language === "vi" ? "Xóa tài liệu" : "Delete document"}
                    className="p-2 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div
            data-lenis-prevent
            className="w-full max-w-3xl max-h-[85vh] rounded-2xl bg-white shadow-2xl border border-warm-200 flex flex-col overflow-hidden overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:px-6 border-b border-warm-200 flex items-center justify-between bg-warm-50/50">
              <div className="flex items-center gap-2.5">
                {renderFileIcon(previewDoc.fileType)}
                <div>
                  <h3 className="text-sm font-bold text-warm-950 truncate max-w-md">
                    {previewDoc.filename}
                  </h3>
                  <p className="text-[10px] text-warm-500">
                    {previewDoc.charCount.toLocaleString("vi-VN")} ký tự • ~
                    {previewDoc.tokenEstimate.toLocaleString("vi-VN")} tokens trích xuất
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl p-1.5 text-warm-400 hover:bg-warm-100 hover:text-warm-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              data-lenis-prevent
              className="flex-1 overflow-y-auto p-4 sm:p-6 bg-warm-50/20 text-xs font-mono text-warm-900 whitespace-pre-wrap leading-relaxed overscroll-contain"
            >
              {previewDoc.content}
            </div>

            <div className="p-3 sm:px-6 border-t border-warm-200 bg-white flex justify-between items-center text-[11px] text-warm-500">
              <span>
                {previewDoc.isActive
                  ? "✓ Tài liệu đang được nạp vào AI prompt"
                  : "○ Tài liệu đang tạm tắt (không gửi đến AI)"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 rounded-xl bg-warm-950 text-white font-bold text-xs hover:bg-warm-850 transition"
              >
                {language === "vi" ? "Đóng" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
