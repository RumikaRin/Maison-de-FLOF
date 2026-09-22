/**
 * Maison de FLOF Luxury Transactional Email Templates.
 * Crafted with table-based email client compatibility, inline CSS styles,
 * and Atelier branding (Jotun Teal, Ivory, Charcoal).
 */

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

function emailWrapper(title: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f5f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7f5f0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e5e0d8; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          
          <!-- Header Band -->
          <tr>
            <td align="center" style="background-color: #1a1a1a; padding: 28px 24px; border-bottom: 2px solid #008080;">
              <span style="font-family: Georgia, serif; font-size: 20px; letter-spacing: 2px; color: #f7f5f0; text-transform: uppercase; font-weight: 500;">
                Maison de FLOF
              </span>
              <p style="margin: 4px 0 0 0; font-size: 11px; letter-spacing: 1px; color: #a39e93; text-transform: uppercase;">
                Sắc Màu Nghệ Thuật · Kiến Tạo Không Gian
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px; font-size: 15px; line-height: 1.6; color: #2d2a26;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Footer Note -->
          <tr>
            <td style="background-color: #fcfbf9; padding: 20px 32px; border-top: 1px solid #e5e0d8; font-size: 12px; line-height: 1.5; color: #736d64; text-align: center;">
              <p style="margin: 0 0 6px 0;">
                Maison de FLOF — Hệ thống phân phối sơn cao cấp Jotun &amp; Dulux chính hãng.
              </p>
              <p style="margin: 0; color: #9c9689;">
                Nếu bạn có bất kỳ thắc mắc nào, vui lòng phản hồi email này hoặc liên hệ hotline để được hỗ trợ.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderWelcomeEmailHtml(name: string): string {
  const content = `
    <h2 style="font-family: Georgia, serif; font-size: 22px; color: #1a1a1a; margin: 0 0 16px 0; font-weight: normal;">
      Chào mừng bạn gia nhập Maison de FLOF
    </h2>
    <p style="margin: 0 0 16px 0;">
      Xin chào <strong>${escapeHtml(name)}</strong>,
    </p>
    <p style="margin: 0 0 24px 0;">
      Tài khoản thành viên Maison de FLOF của bạn đã được khởi tạo thành công. Bạn đã có thể truy cập bảng màu nghệ thuật, lưu bộ sưu tập yêu thích và nhận các ưu đãi chiết khấu sơn chính hãng.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
      <tr>
        <td align="center" style="border-radius: 3px; background-color: #008080;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://flof.vn"}/colors" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 14px; color: #ffffff; text-decoration: none; font-weight: 500;">
            Khám Phá Bảng Màu Sơn
          </a>
        </td>
      </tr>
    </table>
  `;
  return emailWrapper("Chào mừng bạn đến Maison de FLOF", content);
}

export function renderEmailVerificationHtml(name: string, verifyUrl: string): string {
  const content = `
    <h2 style="font-family: Georgia, serif; font-size: 22px; color: #1a1a1a; margin: 0 0 16px 0; font-weight: normal;">
      Xác minh địa chỉ email
    </h2>
    <p style="margin: 0 0 16px 0;">
      Xin chào <strong>${escapeHtml(name)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0;">
      Vui lòng nhấn vào nút bên dưới để hoàn tất xác minh tài khoản và kích hoạt đầy đủ tính năng thành viên:
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        <td align="center" style="border-radius: 3px; background-color: #008080;">
          <a href="${escapeHtml(verifyUrl)}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; color: #ffffff; text-decoration: none; font-weight: 500;">
            Xác Minh Email Ngay
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0 0; font-size: 13px; color: #736d64;">
      Liên kết này có hiệu lực trong 24 giờ. Nếu bạn không tạo tài khoản này, xin vui lòng bỏ qua email.
    </p>
  `;
  return emailWrapper("Xác minh email Maison de FLOF", content);
}

export function renderOrderConfirmationHtml(
  name: string,
  orderNumber: string,
  total: number,
): string {
  const content = `
    <h2 style="font-family: Georgia, serif; font-size: 22px; color: #1a1a1a; margin: 0 0 16px 0; font-weight: normal;">
      Đơn hàng đã được xác nhận
    </h2>
    <p style="margin: 0 0 16px 0;">
      Kính gửi <strong>${escapeHtml(name)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0;">
      Cảm ơn bạn đã tin tưởng đặt hàng tại <strong>Maison de FLOF</strong>. Đơn hàng của bạn đã được tiếp nhận và đang được chuyển sang bộ phận xử lý đóng gói.
    </p>

    <!-- Order Info Box -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fcfbf9; border: 1px solid #e5e0d8; border-radius: 4px; padding: 16px; margin: 20px 0;">
      <tr>
        <td style="padding: 6px 12px; font-size: 14px; color: #555047;">Mã đơn hàng:</td>
        <td align="right" style="padding: 6px 12px; font-size: 14px; font-weight: 600; color: #1a1a1a; font-family: monospace;">${escapeHtml(orderNumber)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 12px; font-size: 14px; color: #555047; border-top: 1px solid #ece7e0;">Tổng thanh toán:</td>
        <td align="right" style="padding: 6px 12px; font-size: 16px; font-weight: 700; color: #008080; border-top: 1px solid #ece7e0;">${total.toLocaleString("vi-VN")} ₫</td>
      </tr>
    </table>

    <p style="margin: 20px 0 0 0; font-size: 14px; color: #555047;">
      Chúng tôi sẽ gửi thông báo tiếp theo khi đơn hàng được bàn giao cho đơn vị vận chuyển.
    </p>
  `;
  return emailWrapper(`Xác nhận đơn hàng ${orderNumber}`, content);
}

export function renderOrderStatusHtml(orderNumber: string, status: string): string {
  const content = `
    <h2 style="font-family: Georgia, serif; font-size: 22px; color: #1a1a1a; margin: 0 0 16px 0; font-weight: normal;">
      Cập nhật trạng thái đơn hàng
    </h2>
    <p style="margin: 0 0 16px 0;">
      Đơn hàng <strong>${escapeHtml(orderNumber)}</strong> vừa được cập nhật trạng thái:
    </p>
    <div style="display: inline-block; padding: 8px 16px; background-color: #e6f2f2; color: #008080; font-weight: 600; border-radius: 3px; font-size: 15px; margin: 12px 0 20px 0;">
      ${escapeHtml(status)}
    </div>
    <p style="margin: 16px 0 0 0; font-size: 14px; color: #555047;">
      Bạn có thể đăng nhập vào tài khoản để theo dõi lịch sử vận chuyển chi tiết.
    </p>
  `;
  return emailWrapper(`Cập nhật đơn hàng ${orderNumber}`, content);
}

export function renderPasswordResetHtml(name: string, resetUrl: string): string {
  const content = `
    <h2 style="font-family: Georgia, serif; font-size: 22px; color: #1a1a1a; margin: 0 0 16px 0; font-weight: normal;">
      Yêu cầu đặt lại mật khẩu
    </h2>
    <p style="margin: 0 0 16px 0;">
      Xin chào <strong>${escapeHtml(name)}</strong>,
    </p>
    <p style="margin: 0 0 20px 0;">
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản Maison de FLOF của bạn. Nhấn vào nút bên dưới để thiết lập mật khẩu mới:
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
      <tr>
        <td align="center" style="border-radius: 3px; background-color: #008080;">
          <a href="${escapeHtml(resetUrl)}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; color: #ffffff; text-decoration: none; font-weight: 500;">
            Đặt Lại Mật Khẩu
          </a>
        </td>
      </tr>
    </table>
    <p style="margin: 24px 0 0 0; font-size: 13px; color: #736d64;">
      Liên kết này có hiệu lực trong 1 giờ. Nếu bạn không thực hiện yêu cầu này, xin vui lòng bỏ qua email và mật khẩu của bạn sẽ không thay đổi.
    </p>
  `;
  return emailWrapper("Đặt lại mật khẩu Maison de FLOF", content);
}
