-- Additive data invariants. Each constraint is installed without scanning
-- existing rows first, then validated in a separate statement.

ALTER TABLE "Paint"
  ADD CONSTRAINT "Paint_stock_nonnegative"
  CHECK ("stock" >= 0) NOT VALID;
ALTER TABLE "Paint"
  ADD CONSTRAINT "Paint_price_nonnegative"
  CHECK ("price" >= 0) NOT VALID;
ALTER TABLE "Paint"
  ADD CONSTRAINT "Paint_costPrice_nonnegative"
  CHECK ("costPrice" >= 0) NOT VALID;
ALTER TABLE "Paint"
  ADD CONSTRAINT "Paint_discountPercent_range"
  CHECK ("discountPercent" BETWEEN 0 AND 100) NOT VALID;
ALTER TABLE "Paint"
  ADD CONSTRAINT "Paint_minStock_nonnegative"
  CHECK ("minStock" >= 0) NOT VALID;
ALTER TABLE "Paint"
  ADD CONSTRAINT "Paint_soldCount_nonnegative"
  CHECK ("soldCount" >= 0) NOT VALID;
ALTER TABLE "Paint"
  ADD CONSTRAINT "Paint_volume_positive"
  CHECK ("volume" > 0) NOT VALID;
ALTER TABLE "Paint"
  ADD CONSTRAINT "Paint_coatsRequired_positive"
  CHECK ("coatsRequired" > 0) NOT VALID;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_amounts_nonnegative"
  CHECK (
    "subtotal" >= 0
    AND "discount" >= 0
    AND "shippingFee" >= 0
    AND "total" >= 0
  ) NOT VALID;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_values_valid"
  CHECK ("quantity" > 0 AND "price" >= 0 AND "total" >= 0) NOT VALID;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amount_nonnegative"
  CHECK ("amount" >= 0) NOT VALID;

ALTER TABLE "Coupon"
  ADD CONSTRAINT "Coupon_value_nonnegative"
  CHECK ("value" >= 0) NOT VALID;
ALTER TABLE "Coupon"
  ADD CONSTRAINT "Coupon_spend_range"
  CHECK (
    "minSpend" >= 0
    AND ("maxSpend" IS NULL OR "maxSpend" >= "minSpend")
  ) NOT VALID;
ALTER TABLE "Coupon"
  ADD CONSTRAINT "Coupon_usage_range"
  CHECK (
    "usageCount" >= 0
    AND ("usageLimit" IS NULL OR (
      "usageLimit" > 0
      AND "usageCount" <= "usageLimit"
    ))
  ) NOT VALID;
ALTER TABLE "Coupon"
  ADD CONSTRAINT "Coupon_date_range"
  CHECK ("endDate" > "startDate") NOT VALID;

ALTER TABLE "Review"
  ADD CONSTRAINT "Review_rating_range"
  CHECK ("rating" BETWEEN 1 AND 5) NOT VALID;

ALTER TABLE "InventoryTransaction"
  ADD CONSTRAINT "InventoryTransaction_quantity_nonzero"
  CHECK ("quantity" <> 0) NOT VALID;

ALTER TABLE "Paint" VALIDATE CONSTRAINT "Paint_stock_nonnegative";
ALTER TABLE "Paint" VALIDATE CONSTRAINT "Paint_price_nonnegative";
ALTER TABLE "Paint" VALIDATE CONSTRAINT "Paint_costPrice_nonnegative";
ALTER TABLE "Paint" VALIDATE CONSTRAINT "Paint_discountPercent_range";
ALTER TABLE "Paint" VALIDATE CONSTRAINT "Paint_minStock_nonnegative";
ALTER TABLE "Paint" VALIDATE CONSTRAINT "Paint_soldCount_nonnegative";
ALTER TABLE "Paint" VALIDATE CONSTRAINT "Paint_volume_positive";
ALTER TABLE "Paint" VALIDATE CONSTRAINT "Paint_coatsRequired_positive";
ALTER TABLE "Order" VALIDATE CONSTRAINT "Order_amounts_nonnegative";
ALTER TABLE "OrderItem" VALIDATE CONSTRAINT "OrderItem_values_valid";
ALTER TABLE "Payment" VALIDATE CONSTRAINT "Payment_amount_nonnegative";
ALTER TABLE "Coupon" VALIDATE CONSTRAINT "Coupon_value_nonnegative";
ALTER TABLE "Coupon" VALIDATE CONSTRAINT "Coupon_spend_range";
ALTER TABLE "Coupon" VALIDATE CONSTRAINT "Coupon_usage_range";
ALTER TABLE "Coupon" VALIDATE CONSTRAINT "Coupon_date_range";
ALTER TABLE "Review" VALIDATE CONSTRAINT "Review_rating_range";
ALTER TABLE "InventoryTransaction"
  VALIDATE CONSTRAINT "InventoryTransaction_quantity_nonzero";
