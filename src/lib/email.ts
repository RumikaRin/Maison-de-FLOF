import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM;

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });

async function sendEmail(to: string, subject: string, html: string) {
  if (!resend || !from) return;
  try {
    await resend.emails.send({ from, to, subject, html });
  } catch (error) {
    console.error("Email delivery failed:", error);
  }
}

export function sendWelcomeEmail(to: string, name: string) {
  return sendEmail(
    to,
    "Chào mừng bạn đến Maison de FLOF",
    `<p>Xin chào <strong>${escapeHtml(name)}</strong>,</p><p>Tài khoản Maison de FLOF của bạn đã được tạo thành công.</p>`,
  );
}

export function sendOrderConfirmationEmail(to: string, name: string, orderNumber: string, total: number) {
  return sendEmail(
    to,
    `Xác nhận đơn hàng ${orderNumber}`,
    `<p>Xin chào <strong>${escapeHtml(name)}</strong>,</p><p>Đơn hàng <strong>${escapeHtml(orderNumber)}</strong> đã được ghi nhận.</p><p>Tổng thanh toán: <strong>${total.toLocaleString("vi-VN")} đ</strong>.</p>`,
  );
}

export function sendOrderStatusEmail(to: string, orderNumber: string, status: string) {
  return sendEmail(
    to,
    `Cập nhật đơn hàng ${orderNumber}`,
    `<p>Đơn hàng <strong>${escapeHtml(orderNumber)}</strong> đã chuyển sang trạng thái <strong>${escapeHtml(status)}</strong>.</p>`,
  );
}
