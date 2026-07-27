import type { Metadata } from "next";

import { LegalDocument, FLOF_CONTACT } from "@/components/features/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Chính sách bảo mật | Maison de FLOF",
  description:
    "Cách Maison de FLOF thu thập, sử dụng và bảo vệ dữ liệu cá nhân của khách hàng theo pháp luật Việt Nam.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      eyebrow="Pháp lý"
      title="Chính sách bảo mật"
      updatedLabel="Cập nhật lần cuối: 26/07/2026"
      intro="Maison de FLOF tôn trọng và cam kết bảo vệ dữ liệu cá nhân của bạn. Chính sách này mô tả loại dữ liệu chúng tôi thu thập, mục đích sử dụng, cách lưu trữ và các quyền của bạn theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân."
      sections={[
        {
          heading: "Dữ liệu chúng tôi thu thập",
          body: [
            "Chúng tôi chỉ thu thập dữ liệu cần thiết để cung cấp dịch vụ:",
            {
              list: [
                "Thông tin tài khoản: họ tên, email, số điện thoại, mật khẩu (được mã hoá).",
                "Thông tin đơn hàng: địa chỉ giao hàng, sản phẩm, phương thức thanh toán.",
                "Dữ liệu kỹ thuật: địa chỉ IP, loại trình duyệt, nhật ký truy cập nhằm bảo mật hệ thống.",
                "Dữ liệu bạn chủ động cung cấp: yêu cầu báo giá, tin nhắn tư vấn, đánh giá sản phẩm.",
              ],
            },
          ],
        },
        {
          heading: "Mục đích sử dụng",
          body: [
            "Dữ liệu của bạn được dùng để: xử lý và giao đơn hàng; xác thực tài khoản và bảo mật; hỗ trợ khách hàng; gửi thông báo giao dịch; và — chỉ khi bạn đồng ý — gửi bản tin về màu sắc và sản phẩm mới.",
            "Chúng tôi không bán, cho thuê hoặc trao đổi dữ liệu cá nhân của bạn với bên thứ ba vì mục đích quảng cáo.",
          ],
        },
        {
          heading: "Chia sẻ dữ liệu với bên thứ ba",
          body: [
            "Chúng tôi chỉ chia sẻ dữ liệu ở mức tối thiểu cần thiết với các đối tác xử lý: cổng thanh toán VNPay (xử lý giao dịch), đơn vị vận chuyển (giao hàng), nhà cung cấp email giao dịch và lưu trữ hình ảnh. Mỗi đối tác chỉ nhận đúng phần dữ liệu cần cho chức năng của họ.",
          ],
        },
        {
          heading: "Lưu trữ và bảo mật",
          body: [
            "Mật khẩu được băm bằng bcrypt. Kết nối được mã hoá bằng HTTPS. Tài khoản quản trị bắt buộc xác thực hai lớp (2FA). Dữ liệu được lưu trong thời gian cần thiết cho mục đích đã nêu, hoặc theo yêu cầu pháp lý về lưu trữ hoá đơn.",
          ],
        },
        {
          heading: "Quyền của bạn",
          body: [
            "Bạn có quyền:",
            {
              list: [
                "Truy cập và tải xuống dữ liệu cá nhân của mình (Hồ sơ → Dữ liệu & quyền riêng tư).",
                "Chỉnh sửa thông tin cá nhân bất cứ lúc nào.",
                "Yêu cầu xoá tài khoản; dữ liệu sẽ được ẩn danh hoặc xoá theo quy định.",
                "Huỷ đăng ký nhận bản tin qua liên kết trong mỗi email.",
              ],
            },
          ],
        },
        {
          heading: "Thay đổi chính sách",
          body: [
            "Khi cập nhật chính sách này, chúng tôi sẽ thay đổi ngày ở đầu trang. Các thay đổi quan trọng sẽ được thông báo qua email hoặc trên website.",
          ],
        },
      ]}
      contact={FLOF_CONTACT}
    />
  );
}
