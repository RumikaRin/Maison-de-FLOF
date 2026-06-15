ALTER TABLE "Order"
ADD COLUMN "shippingName" TEXT,
ADD COLUMN "shippingPhone" TEXT,
ADD COLUMN "shippingEmail" TEXT,
ADD COLUMN "shippingAddress" TEXT,
ADD COLUMN "shippingDistrict" TEXT,
ADD COLUMN "shippingProvince" TEXT;

ALTER TABLE "OrderItem"
ADD COLUMN "productName" TEXT,
ADD COLUMN "productSku" TEXT,
ADD COLUMN "colorName" TEXT,
ADD COLUMN "colorCode" TEXT;

CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "previousStatus" "OrderStatus",
    "newStatus" "OrderStatus" NOT NULL,
    "changedByEmail" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");
CREATE INDEX "OrderStatusHistory_createdAt_idx" ON "OrderStatusHistory"("createdAt");
ALTER TABLE "OrderStatusHistory"
ADD CONSTRAINT "OrderStatusHistory_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
