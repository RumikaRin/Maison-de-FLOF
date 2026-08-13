import type { Metadata } from "next";

import { LegalDocument, FLOF_CONTACT } from "@/components/features/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Điều khoản dịch vụ | Maison de FLOF",
  description:
    "Điều khoản và điều kiện sử dụng website và dịch vụ mua sơn trực tuyến của Maison de FLOF.",
};

export default function TermsOfServicePage() {
  return (
    <LegalDocument
      eyebrow="Pháp lý"
      title="Điều khoản dịch vụ"
      updatedLabel="Cập nhật lần cuối: 26/07/2026"
      intro="Bằng việc truy cập và sử dụng website Maison de FLOF, bạn đồng ý với các điều khoản dưới đây. Vui lòng đọc kỹ trước khi đặt hàng."
      sections={[
        {
          heading: "Tài khoản",
          body: [
            "Bạn chịu trách nhiệm về tính chính xác của thông tin tài khoản và bảo mật mật khẩu của mình. Mọi hoạt động phát sinh từ tài khoản của bạn được xem là do bạn thực hiện. Vui lòng thông báo ngay nếu phát hiện truy cập trái phép.",
          ],
        },
        {
          heading: "Đặt hàng và xác nhận",
          body: [
            "Đơn hàng được tạo khi bạn hoàn tất thanh toán hoặc chọn thanh toán khi nhận hàng (COD). Chúng tôi có quyền từ chối hoặc huỷ đơn trong trường hợp hết hàng, thông tin không hợp lệ, hoặc nghi ngờ gian lận. Với đơn thanh toán online chưa hoàn tất, đơn sẽ tự động huỷ sau 30 phút và hoàn kho.",
          ],
        },
        {
          heading: "Giá và thanh toán",
          body: [
            "Giá sản phẩm được niêm yết bằng VND, đã bao gồm thuế nếu áp dụng. Chúng tôi hỗ trợ thanh toán khi nhận hàng (COD), chuyển khoản ngân hàng và cổng VNPay. Giá và khuyến mãi có thể thay đổi; giá áp dụng là giá tại thời điểm đơn hàng được xác nhận.",
          ],
        },
        {
          heading: "Giao hàng",
          body: [
            "Phí vận chuyển được tính theo giá trị đơn hàng và hiển thị trước khi bạn xác nhận. Đơn hàng từ 500.000đ được miễn phí vận chuyển. Thời gian giao phụ thuộc khu vực và đơn vị vận chuyển.",
          ],
        },
        {
          heading: "Đổi trả và hoàn tiền",
          body: [
            "Sản phẩm lỗi do nhà sản xuất hoặc giao sai được đổi trả trong vòng 7 ngày kể từ khi nhận hàng, với điều kiện còn nguyên tem, nhãn và chưa qua sử dụng. Sơn đã pha màu theo yêu cầu không áp dụng đổi trả. Hoàn tiền được xử lý qua phương thức thanh toán ban đầu.",
          ],
        },
        {
          heading: "Sở hữu trí tuệ",
          body: [
            "Toàn bộ nội dung, hình ảnh, thương hiệu và mã màu trên website thuộc về Maison de FLOF hoặc các đối tác cấp phép. Bạn không được sao chép, phân phối vì mục đích thương mại khi chưa có sự đồng ý bằng văn bản.",
          ],
        },
        {
          heading: "Giới hạn trách nhiệm",
          body: [
            "Màu sắc hiển thị trên màn hình có thể khác biệt so với thực tế do thiết bị. Công cụ phối màu chỉ mang tính tham khảo. Chúng tôi khuyến nghị dùng bảng màu thật hoặc sơn mẫu trước khi thi công diện rộng.",
          ],
        },
      ]}
      contact={FLOF_CONTACT}
    />
  );
}
