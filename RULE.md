# Project Guidelines (Superpowers Augmented)
Đây là các quy tắc nội bộ cho dự án. Agent phải tuân thủ nghiêm ngặt các quy tắc này song song với quy trình làm việc mặc định của Superpowers.
## 1. Ngôn ngữ giao tiếp
- LUÔN LUÔN chat, giải thích, lập plan, và báo cáo tiến độ với user bằng **Tiếng Việt**.
- Code, tên biến, lệnh terminal, logs thì giữ nguyên tiếng Anh.
## 2. Tiêu chuẩn UI/UX và Thiết kế
- Khi được giao các task frontend, không được tự ý redesign hay dùng style chung chung. 
- Nếu project có skill về thiết kế (như `taste` hay `high-end-visual-design`), BẮT BUỘC phải tham khảo hoặc kích hoạt chúng trước khi chốt UI.
- Nếu được cung cấp link Figma, ưu tiên sử dụng MCP Figma để trích xuất màu sắc, khoảng cách, font chữ chính xác.
## 3. Bash & Môi trường
- Không bao giờ dùng lệnh `cd /path && command`. Hãy ưu tiên đường dẫn tuyệt đối hoặc tương đối.
- Tuyệt đối không chạy các lệnh phá hoại (`rm -rf`, `git reset --hard`) nếu user chưa phê duyệt.
## 4. Tối giản (Simplicity First)
- Chỉ sửa đúng file cần thiết.
- Không tự động refactor các code xung quanh không liên quan.
- Không viết logic phòng hờ cho các trường hợp không có trong yêu cầu (YAGNI).