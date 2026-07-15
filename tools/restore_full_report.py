import sys

path = r"c:\Users\sansm\Downloads\BaoCao_FLOF_Full.md"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Restore the corrupt test cases using string replacement
start_marker = "| Kết quả mong đợi | Đăng nhập thành công,# KẾT LUẬN ĐỀ TÀI"
end_marker = "PostgreSQL.tion rollback |\n| Trạng thái | PASS |\n"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    restored_test_cases = """| Kết quả mong đợi | Đăng nhập thành công, điều hướng tới Dashboard |
| Kết quả thực tế | Thành công |
| Trạng thái | PASS |

**Test Case TC-AUTH-02**

| **Thuộc tính** | **Giá trị** |
| --- | --- |
| Mục tiêu | Kiểm tra mật khẩu sai |
| Dữ liệu vào | admin@flof.vn / wrongpassword |
| Kết quả mong đợi | Hiển thị thông báo lỗi |
| Kết quả thực tế | Hiển thị thông báo lỗi chính xác |
| Trạng thái | PASS |

**Test Case TC-AUTH-03**

| **Thuộc tính** | **Giá trị** |
| --- | --- |
| Mục tiêu | Kiểm tra đăng nhập Google OAuth |
| Dữ liệu vào | Tài khoản Google hợp lệ |
| Kết quả mong đợi | Popup Google hiện ra, đăng nhập xong tự tạo tài khoản CUSTOMER |
| Kết quả thực tế | Thành công, avatar hiển thị góc phải |
| Trạng thái | PASS |

### 5.3.2. Kiểm thử chức năng tìm kiếm sản phẩm

**Test Case TC-PROD-01**

| **Thuộc tính** | **Giá trị** |
| --- | --- |
| Mục tiêu | Tìm kiếm sơn theo tên |
| Dữ liệu vào | Jotun Majestic |
| Kết quả mong đợi | Hiển thị danh sách sản phẩm phù hợp |
| Kết quả thực tế | Hiển thị chính xác |
| Trạng thái | PASS |

**Test Case TC-PROD-02**

| **Thuộc tính** | **Giá trị** |
| --- | --- |
| Mục tiêu | Tìm kiếm sản phẩm không tồn tại |
| Dữ liệu vào | abcxyz123 |
| Kết quả mong đợi | Hiển thị "Không tìm thấy sản phẩm" |
| Kết quả thực tế | Đúng yêu cầu |
| Trạng thái | PASS |

### 5.3.3. Kiểm thử giỏ hàng

**Test Case TC-CART-01**

| **Thuộc tính** | **Giá trị** |
| --- | --- |
| Mục tiêu | Thêm sản phẩm vào giỏ (kèm mã màu) |
| Dữ liệu vào | Sản phẩm còn hàng + Chọn màu Jotun 0394 |
| Kết quả mong đợi | Sản phẩm xuất hiện trong giỏ kèm mã màu |
| Kết quả thực tế | Thành công |
| Trạng thái | PASS |

**Test Case TC-CART-02**

| **Thuộc tính** | **Giá trị** |
| --- | --- |
| Mục tiêu | Xóa sản phẩm khỏi giỏ |
| Dữ liệu vào | Chọn nút xóa |
| Kết quả mong đợi | Sản phẩm bị xóa, tổng tiền cập nhật |
| Kết quả thực tế | Thành công |
| Trạng thái | PASS |

### 5.3.4. Kiểm thử chức năng đặt hàng

**Test Case TC-ORDER-01**

| **Thuộc tính** | **Giá trị** |
| --- | --- |
| Mục tiêu | Đặt hàng COD thành công |
| Dữ liệu vào | Giỏ hàng hợp lệ + Thông tin giao hàng đầy đủ |
| Kết quả mong đợi | Tạo đơn hàng, trừ tồn kho, Admin nhận thông báo |
| Kết quả thực tế | Thành công |
| Trạng thái | PASS |

**Test Case TC-ORDER-02**

| **Thuộc tính** | **Giá trị** |
| --- | --- |
| Mục tiêu | Đặt hàng vượt tồn kho |
| Dữ liệu vào | Số lượng > Stock |
| Kết quả mong đợi | Báo lỗi "Sản phẩm không đủ số lượng" |
| Kết quả thực tế | Báo lỗi, Transaction rollback |
| Trạng thái | PASS |\n"""
    # Replace from start_idx to end_idx + len(end_marker)
    content = content[:start_idx] + restored_test_cases + content[end_idx + len(end_marker):]
    print("Test cases section restored successfully.")
else:
    # Try finding without \\n in end_marker in case of \\r\\n discrepancy
    end_marker_alt = "PostgreSQL.tion rollback |\n| Trạng thái | PASS |"
    end_idx = content.find(end_marker_alt)
    if start_idx != -1 and end_idx != -1:
         content = content[:start_idx] + restored_test_cases + content[end_idx + len(end_marker_alt):]
         print("Test cases section restored successfully (alt end marker).")
    else:
         print(f"Warning: Corrupted test cases block not found. start_idx={start_idx}, end_idx={end_idx}")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done restoring and updating the report file.")
