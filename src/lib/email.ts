import { Resend } from "resend";
import {
  createEmailSender,
  EmailDeliveryError,
  type EmailTransport,
} from "@/lib/email-delivery";
import {
  renderWelcomeEmailHtml,
  renderEmailVerificationHtml,
  renderOrderConfirmationHtml,
  renderOrderStatusHtml,
  renderPasswordResetHtml,
} from "@/lib/email-templates";

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

async function sendEmail(to: string, subject: string, html: string) {
  await deliverEmail({ to, subject, html });
}

export function sendWelcomeEmail(to: string, name: string) {
  return sendEmail(
    to,
    "Chào mừng bạn đến Maison de FLOF",
    renderWelcomeEmailHtml(name),
  );
}

export function sendEmailVerificationEmail(
  to: string,
  name: string,
  verifyUrl: string,
) {
  return sendEmail(
    to,
    "Xác minh email Maison de FLOF",
    renderEmailVerificationHtml(name, verifyUrl),
  );
}

export function sendOrderConfirmationEmail(to: string, name: string, orderNumber: string, total: number) {
  return sendEmail(
    to,
    `Xác nhận đơn hàng ${orderNumber}`,
    renderOrderConfirmationHtml(name, orderNumber, total),
  );
}

export function sendOrderStatusEmail(to: string, orderNumber: string, status: string) {
  return sendEmail(
    to,
    `Cập nhật đơn hàng ${orderNumber}`,
    renderOrderStatusHtml(orderNumber, status),
  );
}

export function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  return sendEmail(
    to,
    "Đặt lại mật khẩu Maison de FLOF",
    renderPasswordResetHtml(name, resetUrl),
  );
}
