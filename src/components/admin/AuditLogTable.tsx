"use client";

import { useCallback, useEffect, useState } from "react";
import { AsyncState } from "@/components/ui/AsyncState";

type AuditRecord = {
  id: string;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  beforeData: unknown;
  afterData: unknown;
  createdAt: string;
};

type AuditResponse = {
  data: AuditRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function formattedJson(value: unknown) {
  return value == null ? "—" : JSON.stringify(value, null, 2);
}

export function AuditLogTable() {
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [pagination, setPagination] = useState<AuditResponse["pagination"]>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  const load = useCallback(async () => {
    setStatus("loading");
    const query = new URLSearchParams({
      page: String(page),
      limit: "25",
    });
    if (action.trim()) query.set("action", action.trim());
    if (entityType.trim()) query.set("entityType", entityType.trim());

    try {
      const response = await fetch(`/api/admin/audit-logs?${query}`);
      if (!response.ok) throw new Error("AUDIT_FETCH_FAILED");
      const body = (await response.json()) as AuditResponse;
      setRecords(body.data);
      setPagination(body.pagination);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [action, entityType, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="overflow-hidden rounded-3xl border border-warm-200 bg-white shadow-sm">
      <form
        className="grid gap-3 border-b border-warm-200 p-4 md:grid-cols-[1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          void load();
        }}
      >
        <label className="space-y-1 text-xs font-semibold text-warm-700">
          Action
          <input
            className="block h-10 w-full rounded-xl border border-warm-200 px-3 text-sm"
            value={action}
            onChange={(event) => setAction(event.target.value)}
            placeholder="ORDER_UPDATED"
          />
        </label>
        <label className="space-y-1 text-xs font-semibold text-warm-700">
          Entity
          <input
            className="block h-10 w-full rounded-xl border border-warm-200 px-3 text-sm"
            value={entityType}
            onChange={(event) => setEntityType(event.target.value)}
            placeholder="Order"
          />
        </label>
        <button
          type="submit"
          className="self-end rounded-xl bg-warm-900 px-5 py-3 text-xs font-bold text-white hover:bg-warm-800"
        >
          Lọc dữ liệu
        </button>
      </form>

      {status === "loading" ? (
        <AsyncState
          status="loading"
          title="Đang tải nhật ký…"
          className="min-h-56 max-w-none rounded-none border-0 shadow-none"
        />
      ) : status === "error" ? (
        <AsyncState
          status="error"
          title="Không thể tải nhật ký kiểm toán"
          description="Vui lòng kiểm tra kết nối và thử lại."
          retryLabel="Thử lại"
          onRetry={() => void load()}
          className="min-h-56 max-w-none rounded-none border-0 shadow-none"
        />
      ) : records.length === 0 ? (
        <AsyncState
          status="empty"
          title="Không có dữ liệu phù hợp"
          description="Thay đổi bộ lọc để xem thêm sự kiện quản trị."
          className="min-h-56 max-w-none rounded-none border-0 shadow-none"
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-warm-50 text-xs uppercase tracking-wide text-warm-800">
              <tr>
                <th className="px-4 py-3">Thời gian / Actor</th>
                <th className="px-4 py-3">Action / Entity</th>
                <th className="px-4 py-3">Before</th>
                <th className="px-4 py-3">After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {records.map((record) => (
                <tr key={record.id} className="align-top">
                  <td className="px-4 py-4">
                    <time dateTime={record.createdAt}>
                      {new Date(record.createdAt).toLocaleString("vi-VN")}
                    </time>
                    <p className="mt-1 text-xs text-warm-500">
                      {record.actorEmail}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-warm-950">{record.action}</p>
                    <p className="mt-1 text-xs text-warm-500">
                      {record.entityType}
                      {record.entityId ? ` · ${record.entityId}` : ""}
                    </p>
                  </td>
                  <td className="max-w-sm px-4 py-4">
                    <pre className="whitespace-pre-wrap break-all rounded-xl bg-warm-50 p-3 text-xs">
                      {formattedJson(record.beforeData)}
                    </pre>
                  </td>
                  <td className="max-w-sm px-4 py-4">
                    <pre className="whitespace-pre-wrap break-all rounded-xl bg-warm-50 p-3 text-xs">
                      {formattedJson(record.afterData)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-warm-200 px-4 py-3 text-xs text-warm-600">
        <span>{pagination.total} bản ghi</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="rounded-lg border border-warm-200 px-3 py-2 font-bold disabled:opacity-40"
          >
            Trước
          </button>
          <span>
            {pagination.page}/{Math.max(1, pagination.totalPages)}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-lg border border-warm-200 px-3 py-2 font-bold disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
