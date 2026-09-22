import assert from "node:assert/strict";
import test from "node:test";
import {
  renderWelcomeEmailHtml,
  renderEmailVerificationHtml,
  renderOrderConfirmationHtml,
  renderOrderStatusHtml,
  renderPasswordResetHtml,
} from "../src/lib/email-templates.ts";

test("renderWelcomeEmailHtml escapes malicious characters and includes greeting", () => {
  const html = renderWelcomeEmailHtml("<script>alert('xss')</script> John");
  assert.ok(html.includes("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt; John"));
  assert.ok(html.includes("Maison de FLOF"));
  assert.ok(html.includes("Khám Phá Bảng Màu Sơn"));
});

test("renderEmailVerificationHtml renders action button with verify link", () => {
  const verifyUrl = "https://flof.vn/api/auth/verify-email?token=abc123xyz";
  const html = renderEmailVerificationHtml("Jane Doe", verifyUrl);
  assert.ok(html.includes("Jane Doe"));
  assert.ok(html.includes(verifyUrl));
  assert.ok(html.includes("Xác Minh Email Ngay"));
});

test("renderOrderConfirmationHtml renders formatted price and order number", () => {
  const html = renderOrderConfirmationHtml("Alice", "FLOF-20260821-1234", 1_500_000);
  assert.ok(html.includes("FLOF-20260821-1234"));
  assert.ok(html.includes("Alice"));
  assert.ok(html.includes("1.500.000"));
});

test("renderOrderStatusHtml renders order status badge", () => {
  const html = renderOrderStatusHtml("FLOF-20260821-1234", "ĐANG GIAO HÀNG");
  assert.ok(html.includes("FLOF-20260821-1234"));
  assert.ok(html.includes("ĐANG GIAO HÀNG"));
});

test("renderPasswordResetHtml renders reset password action button", () => {
  const resetUrl = "https://flof.vn/reset-password?token=secret123";
  const html = renderPasswordResetHtml("Bob", resetUrl);
  assert.ok(html.includes("Bob"));
  assert.ok(html.includes(resetUrl));
  assert.ok(html.includes("Đặt Lại Mật Khẩu"));
});
