"use client";

import { useEffect, useState } from "react";
import { CspImage as Image } from "@/components/ui/csp-image";
import { toast } from "@/components/ui/csp-toast";
import { useLanguageStore } from "@/store/language-store";

interface Media {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  createdAt: string;
}

export default function AdminImagesPage() {
  const { language } = useLanguageStore();
  const [media, setMedia] = useState<Media[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () =>
    fetch("/api/admin/media")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải ảnh");
        setMedia(data);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const upload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 8 * 1024 * 1024) {
      toast.error(language === "vi" ? "Chỉ hỗ trợ ảnh tối đa 8 MB." : "Only images up to 8 MB are supported.");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl, fileName: file.name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không thể tải ảnh lên");
      setMedia((current) => [data, ...current]);
      toast.success(language === "vi" ? "Đã tải ảnh lên Cloudinary." : "Image uploaded to Cloudinary.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải ảnh lên");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (item: Media) => {
    const response = await fetch(`/api/admin/media?publicId=${encodeURIComponent(item.publicId)}`, {
      method: "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Không thể xóa ảnh");
      return;
    }
    setMedia((current) => current.filter((image) => image.publicId !== item.publicId));
    toast.success(language === "vi" ? "Đã xóa ảnh." : "Image deleted.");
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-serif text-3xl font-bold text-warm-900">
            {language === "vi" ? "Thư Viện Hình Ảnh" : "Media Library"}
          </h1>
          <p className="mt-1 text-xs text-warm-550">Cloudinary · flof/</p>
        </div>
        <label className="cursor-pointer rounded-xl bg-warm-900 px-5 py-3 text-xs font-bold text-white">
          {uploading ? "Uploading..." : language === "vi" ? "Tải ảnh lên" : "Upload image"}
          <input disabled={uploading} type="file" accept="image/*" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
        </label>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-warm-200 bg-white p-10 text-center text-sm text-warm-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {media.map((item) => (
            <article key={item.publicId} className="overflow-hidden rounded-2xl border border-warm-200 bg-white shadow-sm">
              <div className="relative aspect-square w-full">
                <Image src={item.url} alt={item.publicId} fill sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw" className="object-cover" />
              </div>
              <div className="space-y-2 p-3">
                <p className="truncate text-[10px] font-bold text-warm-700" title={item.publicId}>{item.publicId}</p>
                <p className="text-[10px] text-warm-500">{item.width} × {item.height} · {item.format}</p>
                <div className="flex gap-2">
                  <button onClick={() => navigator.clipboard.writeText(item.url)} className="flex-1 rounded-lg bg-warm-100 px-2 py-1.5 text-[10px] font-bold">Copy URL</button>
                  <button onClick={() => remove(item)} className="rounded-lg bg-red-50 px-2 py-1.5 text-[10px] font-bold text-red-600">Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

