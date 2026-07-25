import { AuditLogTable } from "@/components/admin/AuditLogTable";

export default function AuditPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-warm-500">
          Security & governance
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-warm-950">
          Nhật ký kiểm toán / Audit history
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-warm-600">
          Lịch sử thay đổi chỉ đọc dành cho quản trị viên, kèm bộ lọc và dữ
          liệu trước/sau đã loại bỏ trường nhạy cảm.
        </p>
      </div>
      <AuditLogTable />
    </section>
  );
}
