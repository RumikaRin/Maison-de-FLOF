import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[65vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto max-w-md">
        <span className="font-serif text-fl-xs tracking-widest uppercase text-atelier-accent">
          Maison de FLOF · 404
        </span>
        <h1 className="mt-fl-xs font-serif text-3xl font-normal text-atelier-ink sm:text-4xl">
          Không Tìm Thấy Trang
        </h1>
        <p className="mt-fl-sm text-fl-sm text-atelier-ink-2">
          Địa chỉ bạn đang tìm kiếm có thể đã thay đổi, bị xóa hoặc tạm thời không khả dụng.
        </p>

        <div className="mt-fl-lg flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="default">
            <Link href="/">Về trang chủ</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/products">Xem sản phẩm</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/colors">Bảng màu</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
