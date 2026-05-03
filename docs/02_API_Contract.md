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

## 🌐 PHẦN 2: API CONTRACT (GIAO KÈO DỮ LIỆU ĐỒNG BỘ FE - BE)

*(Lưu ý: Vì toàn bộ logic kiểm tra đúng/sai đã được xử lý Offline ở Frontend, API này chỉ dùng để "Đồng bộ nền" dự án đã tính toán xong lên Server).*

### API 1: Đồng bộ Dự án (Upsert Sync)
* **Mục đích:** Đẩy dữ liệu dự án lên Server. Nếu `sessionId` đã tồn tại thì ghi đè, chưa có thì tạo mới (Cơ chế Upsert).
* **Endpoint:** `POST /api/sync/project`
* **Xác thực:** Yêu cầu header `Authorization: Bearer <token>`
* **Định dạng Payload:** `JSON` (Chuẩn `camelCase`)

#### 1. Request Payload (Frontend gửi lên Backend)
```json
{
  "sessionId": "b4a7b8f9-e4b0-1234-5678-9abc",
  "name": "Đồ án Động cơ băng tải",
  "status": "HOÀN THÀNH",
  "inputData": {
    "calculateSession": "Đồ án Động cơ băng tải",
    "operatingData": { "power": "8.5", "speed": "65", "serviceLife": "10" },
    "loadData": { "loadType": "Tải va đập nhẹ", "workShifts": "2" },
    "driveItems": [],
    "bearingItems": []
  },
  "resultData": {
    "systemTransmission": { "uHop": 3.1, "uNgoai": 2.5 },
    "beltResult": null,
    "gearResult": null
  },
  "createdAt": "2026-05-03T10:00:00.000Z"
}
```

#### 2. Response Payload
**Thành công (200 OK):**
```json
{
  "message": "Đồng bộ thành công!",
  "sessionId": "b4a7b8f9-e4b0-1234-5678-9abc"
}
```

**Lỗi Token Hết Hạn (401 Unauthorized):**
Client nhận được sẽ không xóa dữ liệu offline, mà chờ người dùng đăng nhập lại.
```json
{
  "message": "Token không hợp lệ hoặc đã hết hạn!"
}
```

---

### API 2: Xóa Đồng Bộ (Delete Sync)
* **Mục đích:** Đồng bộ hành động xóa của người dùng từ Offline lên Cloud.
* **Endpoint:** `DELETE /api/sync/project/:sessionId`
* **Xác thực:** Yêu cầu header `Authorization: Bearer <token>`

#### Response Payload
**Thành công (200 OK):**
```json
{
  "message": "Xóa thành công!"
}
```
