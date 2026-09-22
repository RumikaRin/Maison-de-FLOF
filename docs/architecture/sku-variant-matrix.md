# Kiến Trúc Quản Lý Biến Thể Sản Phẩm & Tồn Kho (SKU Variant Matrix)

**Mã tài liệu:** FLOF-ARCH-004  
**Trạng thái:** Được phê duyệt thực hiện (Approved)  
**Quyết định từ người dùng:** "tách" (Tách riêng bảng biến thể PaintVariant)  
**Phạm vi:** Database Schema (Prisma), Checkout Engine, Inventory Ledger, Storefront UI & Admin Matrix.

---

## 1. Bối cảnh & Vấn đề hiện tại

Trong mô hình ban đầu của Maison de FLOF:
- Bảng `Paint` lưu trữ trực tiếp: `volume` (ví dụ: 5L), `price` (ví dụ: 1.250.000đ), `stock` (ví dụ: 50).
- Bảng `PaintColorLink` liên kết sản phẩm với các màu trong bảng `PaintColor`.

### Hạn chế nghiêm trọng:
1. **Không thể bán nhiều dung tích độc lập**: Một dòng sơn cao cấp (như *FLOF Silk Interior*) trong thực tế luôn có 3 quy cách đóng gói:
   - **Lon 1L**: Dành cho sơn dặm, thử màu (Cước vận chuyển nhẹ ~1.3kg, Giá ~280.000đ, SKU: `FLOF-SILK-1L`).
   - **Thùng 5L**: Dành cho phòng ngủ, diện tích vừa (Cước trung bình ~6.5kg, Giá ~1.250.000đ, SKU: `FLOF-SILK-5L`).
   - **Thùng 18L**: Dành cho công trình lớn, thầu thợ (Cước nặng ~24kg, Giá ~3.900.000đ, SKU: `FLOF-SILK-18L`).
2. **Sai lệch tồn kho (Inventory Inaccuracy)**: Khi khách đặt mua 2 thùng 18L, hệ thống chỉ trừ `quantity = 2` trên tổng số lượng của bảng `Paint`, không phân biệt được kho đang hết thùng 18L hay lon 1L.
3. **Tính cước vận chuyển không chính xác**: Đơn vị vận chuyển (GHTK / GHN / Viettel Post) tính cước theo cân nặng thực tế. Nếu không có biến thể dung tích, cước phí tham khảo sẽ bị tính sai lệch.

---

## 2. Mô hình Dữ Liệu Đề Xuất (Target Schema)

### 2.1. Model `PaintVariant` trong Prisma
```prisma
model PaintVariant {
  id             String          @id @default(cuid())
  paintId        String
  paint          Paint           @relation(fields: [paintId], references: [id], onDelete: Cascade)
  
  // Màu sắc liên kết (nếu null = áp dụng cho sơn trắng gốc/base không pha màu)
  colorId        String?
  color          PaintColor?     @relation(fields: [colorId], references: [id], onDelete: SetNull)

  // Mã định danh sản phẩm bán lẻ
  sku            String          @unique // ví dụ: FLOF-INT-SILK-05L-NCS0502
  barcode        String?         @unique // Mã vạch chuẩn EAN-13 quét tại kho / showroom

  // Quy cách đóng gói & Cân nặng
  volume         Decimal         @db.Decimal(8, 2) // 1.00, 5.00, 18.00
  volumeUnit     String          @default("L")
  weightKg       Decimal         @default(1.3) @db.Decimal(6, 2) // 1.3kg, 6.5kg, 23.4kg

  // Giá bán & Giá vốn
  price          Decimal         @db.Decimal(12, 2)
  costPrice      Decimal         @default(0) @db.Decimal(12, 2)
  discountPercent Int?           @default(0)

  // Quản lý tồn kho chi tiết
  stock          Int             @default(0)
  minStock       Int             @default(5)
  soldCount      Int             @default(0)
  isActive       Boolean         @default(true)

  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  // Quan hệ
  orderItems     OrderItem[]
  cartItems      CartItem[]
  inventoryLogs  InventoryTransaction[]

  @@unique([paintId, volume, colorId])
  @@index([paintId])
  @@index([colorId])
  @@index([sku])
  @@index([isActive, stock])
}
```

### 2.2. Quan hệ với `OrderItem` và `CartItem`
- Thêm cột `variantId String?` vào cả `OrderItem` và `CartItem`.
- `OrderItem`:
  ```prisma
  model OrderItem {
    id             String        @id @default(cuid())
    orderId        String
    order          Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)
    paintId        String
    paint          Paint         @relation(fields: [paintId], references: [id])
    variantId      String?
    variant        PaintVariant? @relation(fields: [variantId], references: [id])
    ...
  }
  ```

---

## 3. Lộ trình Triển khai Zero-Downtime (4 Giai đoạn)

### Giai đoạn 1: Database Migration & Data Backfill (Không gián đoạn hệ thống)
1. Chạy Prisma migration tạo bảng `PaintVariant` và thêm khóa ngoại tùy chọn `variantId` vào `OrderItem`, `CartItem`.
2. Chạy migration script quét toàn bộ `Paint` hiện tại:
   - Với mỗi sản phẩm `Paint`, tạo sẵn 3 `PaintVariant`:
     - **1L**: Giá = `round(Paint.price * 0.3)`
     - **5L**: Giá = `Paint.price` (quy chuẩn hiện tại)
     - **18L**: Giá = `round(Paint.price * 3.2)`
   - Phân bổ số lượng tồn kho `Paint.stock` sang các biến thể.

### Giai đoạn 2: Nâng cấp Transaction Checkout & Trừ Tồn Kho
Trong [`src/services/checkout.service.ts`](file:///d:/ProjectZ/FLOF/src/services/checkout.service.ts):
```ts
// Trừ kho theo từng biến thể cụ thể, khóa bi quan hoặc lạc quan chống race condition
for (const [variantId, quantity] of Object.entries(stockByVariant)) {
  const updated = await tx.paintVariant.updateMany({
    where: { id: variantId, isActive: true, stock: { gte: quantity } },
    data: { stock: { decrement: quantity }, soldCount: { increment: quantity } },
  });
  if (updated.count !== 1) {
    throw new ApiError(409, `Biến thể sản phẩm không đủ tồn kho`);
  }
}
```

### Giai đoạn 3: Trải nghiệm Người dùng (Storefront Product Page)
1. **Bộ chọn Dung tích trực quan**: Nút bấm chọn `1L | 5L | 18L`.
2. **Giá tiền động**: Cập nhật tức thời theo dung tích đã chọn kèm nhãn dung tích / m2 phủ bề mặt tương ứng.
3. **Trạng thái kho thời gian thực**: Nếu biến thể 18L hết hàng nhưng 5L còn hàng, giao diện hiển thị "Hết hàng dung tích 18L - Vui lòng chọn 5L hoặc liên hệ tư vấn".

### Giai đoạn 4: Quản lý Kho Admin (Variant Inventory Matrix)
- Admin có thể điều chỉnh giá bán, giá vốn, điểm tái đặt hàng (`minStock`), và nhập/xuất kho riêng biệt cho từng lon/thùng sơn.
