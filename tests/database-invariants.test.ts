import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../prisma/migrations/20260724150000_add_data_invariant_checks/migration.sql",
  import.meta.url,
);

const expectedConstraints = [
  "Paint_stock_nonnegative",
  "Paint_price_nonnegative",
  "Paint_costPrice_nonnegative",
  "Paint_discountPercent_range",
  "Paint_minStock_nonnegative",
  "Paint_soldCount_nonnegative",
  "Paint_volume_positive",
  "Paint_coatsRequired_positive",
  "Order_amounts_nonnegative",
  "OrderItem_values_valid",
  "Payment_amount_nonnegative",
  "Coupon_value_nonnegative",
  "Coupon_spend_range",
  "Coupon_usage_range",
  "Coupon_date_range",
  "Review_rating_range",
  "InventoryTransaction_quantity_nonzero",
] as const;

test("data invariant migration adds and validates every agreed constraint", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  for (const constraint of expectedConstraints) {
    assert.match(
      sql,
      new RegExp(
        String.raw`ADD CONSTRAINT "${constraint}"[\s\S]*?NOT VALID;`,
        "m",
      ),
      `missing NOT VALID add for ${constraint}`,
    );
    assert.match(
      sql,
      new RegExp(`VALIDATE CONSTRAINT "${constraint}";`),
      `missing validation for ${constraint}`,
    );
  }

  assert.doesNotMatch(sql, /\b(DROP|DELETE|TRUNCATE|UPDATE)\b/i);
});
