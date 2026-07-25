import { Resend } from "resend";
import {
  createEmailSender,
  EmailDeliveryError,
  type EmailTransport,
} from "@/lib/email-delivery";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM;
const transport: EmailTransport | null = resend
  ? {
      async send(message) {
        const result = await resend.emails.send(message);
        if (result.error) {
          throw new EmailDeliveryError(
            "PROVIDER_ERROR",
            "Email provider rejected the delivery",
          );
        }
        return result.data;
      },
    }
  : null;
const deliverEmail = createEmailSender(transport, from);

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
  await deliverEmail({ to, subject, html });
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

export function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  return sendEmail(
    to,
    "Đặt lại mật khẩu Maison de FLOF",
    `<p>Xin chào <strong>${escapeHtml(name)}</strong>,</p>
     <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
     <p><a href="${escapeHtml(resetUrl)}">Nhấn vào đây để đặt lại mật khẩu</a></p>
     <p>Liên kết có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
  );
}
