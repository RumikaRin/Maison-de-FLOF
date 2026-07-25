"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "@/components/ui/csp-toast";

type Review = {
  id: string;
  rating: number;
  comment: string;
  adminReply: string;
  createdAt: string;
  user: { name: string | null; email: string };
  paint: { name: string; sku: string };
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});

  const loadReviews = () =>
    fetch("/api/admin/reviews")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Không thể tải đánh giá");
        setReviews(data);
        setReplies(Object.fromEntries(data.map((review: Review) => [review.id, review.adminReply])));
      })
      .catch((error) => toast.error(error.message));

  useEffect(() => {
    loadReviews();
  }, []);

  const saveReply = async (id: string) => {
    const response = await fetch("/api/admin/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, adminReply: replies[id] || "" }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Không thể lưu phản hồi");
      return;
    }
    setReviews((current) => current.map((review) => review.id === id ? data : review));
    toast.success("Đã lưu phản hồi");
  };

  const removeReview = async (id: string) => {
    const response = await fetch(`/api/admin/reviews?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.error || "Không thể xóa đánh giá");
      return;
    }
    setReviews((current) => current.filter((review) => review.id !== id));
    toast.success("Đã xóa đánh giá");
  };

  return (
    <div className="space-y-7 p-5 md:p-8">
      <header>
        <h1 className="font-serif text-2xl font-bold text-warm-900">Đánh giá sản phẩm</h1>
        <p className="mt-1 text-xs text-warm-500">Phản hồi khách đã mua hàng và xử lý nội dung không phù hợp.</p>
      </header>
      <div className="space-y-4">
        {reviews.map((review) => (
          <article key={review.id} className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">{review.paint.name} <span className="font-mono text-xs text-warm-400">({review.paint.sku})</span></h2>
                <p className="mt-1 text-xs text-warm-500">{review.user.name || "Khách hàng"} · {review.user.email} · {new Date(review.createdAt).toLocaleDateString("vi-VN")}</p>
              </div>
              <div className="flex text-jotun-yellow">
                {Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-current" : "opacity-20"}`} />)}
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-warm-700">{review.comment}</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <textarea
                value={replies[review.id] || ""}
                onChange={(event) => setReplies({ ...replies, [review.id]: event.target.value })}
                placeholder="Phản hồi từ Maison de FLOF..."
                className="min-h-20 flex-1 rounded-xl border border-warm-200 p-3 text-xs outline-none focus:border-jotun-teal"
              />
              <div className="flex gap-2 sm:flex-col">
                <button onClick={() => saveReply(review.id)} className="rounded-xl bg-warm-900 px-4 py-2 text-xs font-bold text-white">Lưu phản hồi</button>
                <button onClick={() => removeReview(review.id)} className="rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-500">Xóa đánh giá</button>
              </div>
            </div>
          </article>
        ))}
        {reviews.length === 0 && <p className="rounded-2xl border border-warm-200 bg-white p-8 text-center text-xs text-warm-500">Chưa có đánh giá nào.</p>}
      </div>
    </div>
  );
}
