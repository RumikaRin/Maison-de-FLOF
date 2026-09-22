"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("[AdminError]", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
      <div className="mx-auto max-w-lg rounded-control border border-atelier-rule-strong bg-atelier-paper-2 p-8 shadow-sm">
        <span className="text-fl-xs font-semibold uppercase tracking-wider text-atelier-danger">
          Admin Portal Error
        </span>
        <h2 className="mt-fl-2xs text-fl-xl font-medium text-atelier-ink">
          Không thể tải dữ liệu quản trị
        </h2>
        <p className="mt-fl-xs text-fl-sm text-atelier-ink-2">
          Đã xảy ra lỗi trong quá trình truy xuất dữ liệu từ máy chủ quản trị.
        </p>

        {error.digest && (
          <p className="mt-fl-2xs text-fl-2xs text-atelier-ink-3">
            Error digest: <code className="font-mono">{error.digest}</code>
          </p>
        )}

        <div className="mt-fl-md flex items-center justify-center gap-3">
          <Button onClick={() => reset()} variant="default" size="sm">
            Tải lại
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">Về Tổng Quan</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
