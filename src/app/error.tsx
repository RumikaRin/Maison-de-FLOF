"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log safe error telemetry
    if (process.env.NODE_ENV === "development") {
      console.error("[RootError]", error);
    }
  }, [error]);

  return (
    <main className="flex min-h-[65vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mx-auto max-w-md">
        <span className="font-serif text-fl-xs tracking-widest uppercase text-atelier-accent">
          Maison de FLOF · Hệ Thống
        </span>
        <h1 className="mt-fl-xs font-serif text-3xl font-normal text-atelier-ink sm:text-4xl">
          Đã Xảy Ra Sự Cố
        </h1>
        <p className="mt-fl-sm text-fl-sm text-atelier-ink-2">
          Hệ thống gặp sự cố không mong muốn trong khi tải trang. Xin vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề tiếp tục diễn ra.
        </p>

        {error.digest && (
          <p className="mt-fl-2xs text-fl-2xs text-atelier-ink-3">
            Mã định danh sự cố: <code className="font-mono">{error.digest}</code>
          </p>
        )}

        <div className="mt-fl-lg flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => reset()} variant="default">
            Thử lại
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Về trang chủ</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
