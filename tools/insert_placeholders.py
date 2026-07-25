path = r"c:\Users\sansm\Downloads\BaoCao_FLOF_Full.md"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace targets in Chapter 3.6
content = content.replace(
    "### 3.6.1. Trang chủ\nThành phần: Header (Navigation + Cart Icon + User Avatar), Hero Section (Banner lớn), Category Section, Featured Products, Promotion Section, Blog Section, Footer.",
    "### 3.6.1. Trang chủ\nThành phần: Header (Navigation + Cart Icon + User Avatar), Hero Section (Banner lớn), Category Section, Featured Products, Promotion Section, Blog Section, Footer.\n\n> **[CHÚ THÍCH THÊM ẢNH: Chèn ảnh chụp giao diện Trang chủ của Website vào đây để minh họa trực quan]**"
)

content = content.replace(
    "### 3.6.2. Trang danh sách sản phẩm\nChức năng: Tìm kiếm sơn theo tên, Lọc theo danh mục / loại sơn / thương hiệu / bề mặt, Sắp xếp (Giá tăng/giảm, Bán chạy, Mới nhất).\nThành phần: Search Box, Filter Sidebar, Product Grid, Pagination.",
    "### 3.6.2. Trang danh sách sản phẩm\nChức năng: Tìm kiếm sơn theo tên, Lọc theo danh mục / loại sơn / thương hiệu / bề mặt, Sắp xếp (Giá tăng/giảm, Bán chạy, Mới nhất).\nThành phần: Search Box, Filter Sidebar, Product Grid, Pagination.\n\n> **[CHÚ THÍCH THÊM ẢNH: Chèn ảnh chụp giao diện Trang danh sách sản phẩm (Product Catalog) kèm bộ lọc vào đây]**"
)

content = content.replace(
    "### 3.6.3. Trang chi tiết sản phẩm\nThông tin: Hình ảnh sản phẩm (Gallery), Giá bán (hiển thị giảm giá nếu có), Thông số kỹ thuật (Độ phủ, Thời gian khô, Số lớp, Loại bề mặt), Bảng chọn mã màu (Color Picker), Nút thêm giỏ hàng, Đánh giá khách hàng.",
    "### 3.6.3. Trang chi tiết sản phẩm\nThông tin: Hình ảnh sản phẩm (Gallery), Giá bán (hiển thị giảm giá nếu có), Thông số kỹ thuật (Độ phủ, Thời gian khô, Số lớp, Loại bề mặt), Bảng chọn mã màu (Color Picker), Nút thêm giỏ hàng, Đánh giá khách hàng.\n\n> **[CHÚ THÍCH THÊM ẢNH: Chèn ảnh chụp giao diện Trang chi tiết sản phẩm sơn (kèm bảng chọn màu sắc và thông số độ phủ) vào đây]**"
)

content = content.replace(
    "### 3.6.4. Trang giỏ hàng\nChức năng: Cập nhật số lượng, Xóa sản phẩm, Hiển thị mã màu đã chọn, Tính tổng tiền.",
    "### 3.6.4. Trang giỏ hàng\nChức năng: Cập nhật số lượng, Xóa sản phẩm, Hiển thị mã màu đã chọn, Tính tổng tiền.\n\n> **[CHÚ THÍCH THÊM ẢNH: Chèn ảnh chụp giao diện Trang giỏ hàng (hiển thị sản phẩm và mã màu sơn đã chọn) vào đây]**"
)

content = content.replace(
    "### 3.6.5. Trang thanh toán\nThông tin nhập: Họ tên, Số điện thoại, Email, Địa chỉ, Quận/Huyện, Tỉnh/TP, Ghi chú, Mã giảm giá. Lựa chọn: COD hoặc VNPay.",
    "### 3.6.5. Trang thanh toán\nThông tin nhập: Họ tên, Số điện thoại, Email, Địa chỉ, Quận/Huyện, Tỉnh/TP, Ghi chú, Mã giảm giá. Lựa chọn: COD hoặc VNPay.\n\n> **[CHÚ THÍCH THÊM ẢNH: Chèn ảnh chụp giao diện Trang điền thông tin thanh toán và chọn phương thức COD/VNPay vào đây]**"
)

content = content.replace(
    "### 3.6.6. Dashboard quản trị\nThông tin: Tổng doanh thu, Tổng đơn hàng, Tổng khách hàng, Tổng sản phẩm. Biểu đồ doanh thu theo ngày/tháng. Danh sách đơn hàng gần đây. Sản phẩm bán chạy.",
    "### 3.6.6. Dashboard quản trị\nThông tin: Tổng doanh thu, Tổng đơn hàng, Tổng khách hàng, Tổng sản phẩm. Biểu đồ doanh thu theo ngày/tháng. Danh sách đơn hàng gần đây. Sản phẩm bán chạy.\n\n> **[CHÚ THÍCH THÊM ẢNH: Chèn ảnh chụp giao diện Dashboard Admin quản trị (biểu đồ doanh thu Recharts và thống kê) vào đây]**"
)

# Replace targets in Chapter 4
content = content.replace(
    "### 4.3.2. Đăng nhập hệ thống\nHỗ trợ 2 phương thức: **Credentials** (Email + Password) và **Google OAuth**.\nQuy trình: Người dùng nhập thông tin → Hệ thống xác thực → Tạo JWT Session → Điều hướng theo role.",
    "### 4.3.2. Đăng nhập hệ thống\nHỗ trợ 2 phương thức: **Credentials** (Email + Password) và **Google OAuth**.\nQuy trình: Người dùng nhập thông tin → Hệ thống xác thực → Tạo JWT Session → Điều hướng theo role.\n\n> **[CHÚ THÍCH THÊM ẢNH: Chèn ảnh giao diện Đăng nhập hệ thống (Credentials và Google OAuth) vào đây]**"
)

content = content.replace(
    "### 4.4.3. Quản trị sơn\nCung cấp các giao diện quản lý sản phẩm cho Admin. Cho phép tạo sản phẩm mới, cập nhật số lượng tồn kho, giá bán, phần trăm chiết khấu và thiết lập các mã màu tương thích.",
    "### 4.4.3. Quản trị sơn\nCung cấp các giao diện quản lý sản phẩm cho Admin. Cho phép tạo sản phẩm mới, cập nhật số lượng tồn kho, giá bán, phần trăm chiết khấu và thiết lập các mã màu tương thích.\n\n> **[CHÚ THÍCH THÊM ẢNH: Chèn ảnh giao diện Admin quản trị danh sách sản phẩm sơn (thêm/sửa/xóa sơn) vào đây]**"
)

content = content.replace(
    "## 4.8. Xây dựng hệ thống Live Chat\n\nHệ thống Live Chat hai chiều giúp khách hàng trao đổi trực tiếp với Admin. Do sử dụng Next.js nên hệ thống được thiết kế theo cơ chế Short-Polling (tần suất 5 giây) để đồng bộ tin nhắn.",
    "## 4.8. Xây dựng hệ thống Live Chat\n\nHệ thống Live Chat hai chiều giúp khách hàng trao đổi trực tiếp với Admin. Do sử dụng Next.js nên hệ thống được thiết kế theo cơ chế Short-Polling (tần suất 5 giây) để đồng bộ tin nhắn.\n\n> **[CHÚ THÍCH THÊM ẢNH: Chèn ảnh giao diện Live Chat 2 chiều giữa Khách hàng và Admin vào đây]**"
)

content = content.replace(
    "## 4.10. Xây dựng Dashboard quản trị\n\nDashboard quản trị cung cấp các số liệu trực quan cho Admin. Bao gồm 4 thẻ thống kê ở phía trên: Tổng doanh thu, Tổng đơn hàng, Số khách hàng mới, Số sản phẩm.",
    "## 4.10. Xây dựng Dashboard quản trị\n\nDashboard quản trị cung cấp các số liệu trực quan cho Admin. Bao gồm 4 thẻ thống kê ở phía trên: Tổng doanh thu, Tổng đơn hàng, Số khách hàng mới, Số sản phẩm.\n\n> **[CHÚ THÍCH THÊM ẢNH: Chèn ảnh giao diện Dashboard quản trị hệ thống của Admin thực tế vào đây]**"
)

content = content.replace(
    "## 4.13. Xây dựng công cụ phối màu trực quan (Color Visualizer)\n\nCông cụ Color Visualizer cho phép người dùng trực quan hóa màu sơn trên các phòng mẫu khác nhau.",
    "## 4.13. Xây dựng công cụ phối màu trực quan (Color Visualizer)\n\nCông cụ Color Visualizer cho phép người dùng trực quan hóa màu sơn trên các phòng mẫu khác nhau.\n\n> **[CHÚ THÍCH THÊM ẢNH: Chèn ảnh giao diện Công cụ phối màu 3D trực quan Color Visualizer trên không gian phòng mẫu vào đây]**"
)

content = content.replace(
    "## 4.14. Xây dựng mạng lưới tìm kiếm đại lý (Find Dealer)\n\nChức năng Find Dealer giúp khách hàng tìm kiếm đại lý chính hãng gần nhất trên bản đồ tương tác.",
    "## 4.14. Xây dựng mạng lưới tìm kiếm đại lý (Find Dealer)\n\nChức năng Find Dealer giúp khách hàng tìm kiếm đại lý chính hãng gần nhất trên bản đồ tương tác.\n\n> **[CHÚ THÍCH THÊM ẢNH: Chèn ảnh giao diện Bản đồ tìm kiếm đại lý gần nhất Find Dealer tích hợp Leaflet Map vào đây]**"
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully inserted screenshot annotations in markdown report.")
