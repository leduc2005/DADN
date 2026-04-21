# 📜 ĐỀ XUẤT KIẾN TRÚC HYBRID & API CONTRACT
**Dự án:** Ứng dụng Thiết kế Hệ dẫn động thùng trộn

---

## 🏗️ PHẦN 1: ĐỀ XUẤT KIẾN TRÚC LUỒNG DỮ LIỆU (DATA FLOW)
Để đáp ứng được tính năng **Offline-First** (mang App vào xưởng thực hành hoặc thư viện không có WiFi vẫn tính toán mượt mà), mình đề xuất tinh chỉnh lại kiến trúc mà Admin đã setup trên thư mục gốc.

Hiện tại, thư mục `server/` đang gánh việc tính toán (VD: `strategies/` đai dẹt, đai thang). Nếu giữ nguyên, chỉ cần rớt mạng là App sẽ "liệt". Đề xuất điều chỉnh 3 điểm sau:

1. **Chuyển "Bộ não tính toán" về Client:** Bê toàn bộ thư mục logic tính toán cơ khí từ Backend sang Frontend (như `client/src/utils/` hoặc `client/src/logic/`). App Mobile sẽ tự lấy số $P, n, L$ và kiểm tra hợp lệ ngay trên thiết bị mà **không cần gọi API**.
2. **Thêm Local Database cho Client:** Tạo thêm thư mục `client/src/database/` để nhúng sẵn file JSON/SQLite. Chứa các bảng tra linh kiện tĩnh (Động cơ, Ổ lăn).
3. **Đổi vai trò của Backend:** Thư mục `server/` bây giờ sẽ được tối ưu siêu nhẹ. Chỉ tập trung vào 3 việc: 
   * Lưu trữ Lịch sử tính toán (Nhận data đã tính xong từ Mobile bắn lên).
   * Xác thực User (Đăng nhập/Đăng ký).
   * Làm trạm trung chuyển gọi API Chatbot AI (Gemini).

---

## 🌐 PHẦN 2: API CONTRACT (GIAO KÈO DỮ LIỆU FE - BE)

*(Lưu ý: Vì toàn bộ logic kiểm tra đúng/sai đã được xử lý Offline ở Frontend, API này chỉ dùng để "Đồng bộ" dự án đã tính toán xong lên Server khi điện thoại có mạng).*

### API 1: Đồng bộ Hồ sơ Thiết kế (Sync History)
* **Mục đích:** Gửi toàn bộ thông số đầu vào và kết quả đã tính toán từ thiết bị di động lên Server để lưu trữ.
* **Endpoint:** `POST /api/v1/history/sync`
* **Định dạng:** `JSON` (Sử dụng chuẩn `snake_case`)

#### 1. Request Payload (Frontend gửi lên Backend)
Frontend sẽ gom các dữ liệu đã tính toán thành công để bắn lên Server.

```json
{
  "project_name": "Đồ án Động cơ băng tải",
  "student_id": "2352440",
  "input_data": {
    "power_p": 8.5,             
    "rotation_speed_n": 65,     
    "service_life_l": 10,       
    "load_characteristic": "light_impact", 
    "rotation_direction": "one_way",       
    "bearing_brand_constraint": "SKF"      
  },
  "calculated_results": {
    "is_valid": true,
    "selected_motor_code": "4A112M4Y3",
    "total_ratio": 15.3
  }
}
```

#### 2. Response Payload (Backend trả về cho Frontend)
**Trường hợp 1:** Đồng bộ thành công (Happy Path)
Backend ghi vào MongoDB thành công. Frontend nhận được mã này sẽ cập nhật trạng thái đã lưu trên máy.

```json
{
  "status_code": 201,
  "success": true,
  "message": "Đã lưu lịch sử tính toán thành công lên hệ thống.",
  "data": {
    "history_id": "64a7b8f9e4b0123456789abc"
  }
}
```

**Trường hợp 2:** Lỗi xác thực hoặc Sever (Ngoại lệ)
Xảy ra khi Token hết hạn hoặc Server quá tải. Frontend hiển thị thông báo "Sẽ đồng bộ lại sau".

```json
{
  "status_code": 401,
  "success": false,
  "error_type": "UNAUTHORIZED",
  "message": "Phiên đăng nhập hết hạn, vui lòng đăng nhập lại."
}
```
***

Bản này vừa giải thích được tại sao không cần API Validation, vừa chốt hạ luôn cấu trúc của API Đồng bộ cực kỳ chuẩn xác. 

Em thấy bản chỉnh sửa này đã hoàn toàn khớp với ý đồ "thiết kế một App thực chiến" của em chưa? Bước tiếp theo, em muốn chúng ta đi vào thiết kế Schema cho Database MongoDB (của bạn Backend), hay là bắt tay vào code các file Logic Toán học chạy Offline (của em bên Frontend)?
