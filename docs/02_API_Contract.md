# ĐỀ XUẤT: KIẾN TRÚC LUỒNG DỮ LIỆU (DATA FLOW) VÀ API CONTRACT

**Mục tiêu:** Đáp ứng được tính năng Offline (mang app vào xưởng/thư viện không có mạng vẫn tính toán được).

Hiện tại thư mục `server/` đang gánh việc tính toán (`strategies/` đai dẹt, đai thang). Nếu để đây thì khi mất mạng, app sẽ bị lỗi. Dưới đây là phân công trách nhiệm (Contract) lại giữa Frontend và Backend để giải quyết bài toán này:

## 1. Chuyển "Bộ não tính toán" về Client
Bê toàn bộ thư mục logic tính toán cơ khí (như `strategies`) từ Backend ném sang thư mục `client/src/utils/` hoặc `client/src/logic/`. 
Nhờ vậy, App Mobile sẽ tự lấy số liệu Input ($P, n, L$) do người dùng nhập để tính ra kết quả ngay trên vi xử lý của điện thoại mà **không cần gọi API** thực thi phép toán.

## 2. Thêm Local Database cho Client
Tạo thêm thư mục `client/src/database/` để nhúng sẵn file JSON/SQLite. Khối dữ liệu này sẽ chứa các **bảng tra linh kiện tĩnh** (như thông số tiêu chuẩn của động cơ, hệ số ổ lăn). App sẽ tra cứu thẳng vào file này cực kỳ nhanh.

## 3. Đổi vai trò của Backend (Server)
Thư mục `server/` bây giờ sẽ cực kỳ nhẹ nhàng. Bản hợp đồng (Contract) gọi API lúc này nhường lại toàn bộ phần tính toán cho Mobile, Server chỉ tập trung cung cấp các API cho:
- **Lưu trữ History:** Nhận data tổng hợp đã tính xong từ Mobile bắn lên thông qua tiến trình đồng bộ ngầm khi có mạng.
- **Xác thực User:** API Đăng ký / Đăng nhập.
- **Microservices phụ:** Trạm trung chuyển gọi API Chatbot Gemini (ẩn API Key an toàn trên server).

> **Kết luận:** Contract mới quy định - Backend là cái kho lưu trữ đồng bộ, Frontend mới là cỗ máy tính toán.
