import type { Metadata } from "next";

import { LegalDocument, FLOF_CONTACT } from "@/components/features/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Chính sách Cookie | Maison de FLOF",
  description:
    "Cách Maison de FLOF sử dụng cookie và công nghệ tương tự trên website.",
};

export default function CookiePolicyPage() {
  return (
    <LegalDocument
      eyebrow="Pháp lý"
      title="Chính sách Cookie"
      updatedLabel="Cập nhật lần cuối: 26/07/2026"
      intro="Website Maison de FLOF sử dụng cookie và bộ nhớ cục bộ (local storage) để hoạt động ổn định và ghi nhớ tuỳ chọn của bạn. Trang này giải thích chúng tôi dùng những gì và vì sao."
      sections={[
        {
          heading: "Cookie là gì",
          body: [
            "Cookie là các tệp nhỏ được lưu trên thiết bị khi bạn truy cập website. Chúng tôi cũng dùng local storage của trình duyệt — một cơ chế tương tự — để lưu giỏ hàng và ngôn ngữ.",
          ],
        },
        {
          heading: "Loại cookie chúng tôi dùng",
          body: [
            {
              list: [
                "Cần thiết: duy trì phiên đăng nhập, bảo mật và chống gian lận. Không thể tắt vì website sẽ không hoạt động đúng.",
                "Tuỳ chọn: ghi nhớ ngôn ngữ (flof-locale) và nội dung giỏ hàng của bạn.",
                "Đo lường: thống kê ẩn danh về hiệu năng và lượt truy cập để cải thiện trải nghiệm.",
              ],
            },
          ],
        },
        {
          heading: "Chúng tôi không dùng",
          body: [
            "Chúng tôi không dùng cookie quảng cáo theo dõi hành vi xuyên website của bên thứ ba, và không bán dữ liệu duyệt web của bạn.",
          ],
        },
        {
          heading: "Quản lý cookie",
          body: [
            "Bạn có thể xoá hoặc chặn cookie trong cài đặt trình duyệt. Lưu ý rằng việc chặn cookie cần thiết có thể khiến đăng nhập và giỏ hàng không hoạt động. Xoá local storage sẽ làm mất giỏ hàng đang lưu trên thiết bị.",
          ],
        },
      ]}
      contact={FLOF_CONTACT}
    />
  );
}
