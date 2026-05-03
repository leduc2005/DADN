# 🚀 QUY CHUẨN LẬP TRÌNH VÀ Làm VIỆC NHÓM (CODING STANDARD)
**Dự án:** Ứng dụng Thiết kế Hệ dẫn động thùng trộn (Đồ án Đa ngành)

Chào mừng các bạn đến với dự án! Tài liệu này là "kim chỉ nam" giúp toàn bộ team hiểu rõ kiến trúc hệ thống, thống nhất cách viết code và luồng làm việc. Việc tuân thủ nghiêm ngặt tài liệu này sẽ giúp dự án tránh được 99% các lỗi "conflict" (xung đột) khi ghép code và giúp ứng dụng dễ dàng mở rộng trong tương lai.

---

## 🏗️ 1. Bức Tranh Tổng Thể: Kiến trúc Hybrid (Offline-First)
Hệ thống của chúng ta được chia tách rõ ràng vai trò giữa **Frontend** và **Backend**. Đặc biệt, ứng dụng ưu tiên tính năng **Offline-First** (tính toán không cần mạng).

### 📱 Frontend (App Mobile / Web) - Trái tim hệ thống
* **Nhiệm vụ:** Không chỉ vẽ giao diện (UI), Frontend sẽ "gánh" toàn bộ logic tính toán cơ khí.
* **Database Cục bộ:** Thực hiện tra cứu bảng thông số linh kiện (động cơ, bánh răng) thông qua cơ sở dữ liệu SQLite/JSON nhúng thẳng vào App.
* **Offline Mode:** Đảm bảo sinh viên có thể mang App vào xưởng/thư viện không có WiFi vẫn tính toán mượt mà.

### 🖥️ Backend (Node.js Server) - Hậu phương vững chắc
* **Nhiệm vụ:** Quản lý lưu trữ lịch sử tính toán và đồng bộ dữ liệu (Sync API).
* **Nâng cao:** Xử lý xác thực người dùng (Auth) và cung cấp API kết nối với Chatbot AI.
* **Quy tắc:** Backend được thiết kế Platform-Agnostic (Không phụ thuộc nền tảng). Viết 1 lần, phục vụ chung cho cả App Mobile và Web sau này.

---

## 🔄 2. Nguyên tắc Luồng Dữ Liệu (Data Flow & State)
Để dữ liệu không bị sai lệch giữa các module (Nhập liệu -> Tính Động cơ -> Tính Bánh răng), team áp dụng nguyên tắc **Single Source of Truth (Nguồn dữ liệu duy nhất)**.

1. **Tách biệt Logic và UI:** Toàn bộ file UI (Giao diện màn hình) tuyệt đối **KHÔNG** chứa code IF/ELSE xử lý logic tính toán cơ lý thuyết. UI chỉ làm nhiệm vụ lấy data và in ra màn hình.
2. **Kho chứa chung (Global State - Zustand):** Dữ liệu sau khi user nhập từ `Screen A` sẽ được đẩy thẳng vào một Kho chung. 
3. **Quyền truy xuất (Read-only):** Khi `Screen B` cần tính toán, nó sẽ "hút" dữ liệu từ Kho chung này ra để dùng. **Tuyệt đối không** biến đổi trực tiếp hay ghi đè lên các tham số Input gốc ($P, n, L$) của user.

---

## ✍️ 3. Style Guide & Quy Ước Đặt Tên (Naming Conventions)
Luật thép áp dụng cho cả FE và BE. Mã nguồn (Source code) cần được viết ra để "con người đọc hiểu", sau đó mới đến máy tính. Khuyến khích sử dụng tiếng Anh cho các biến số học chuẩn ngành.

| Thành phần | Quy tắc | Ví dụ KHÔNG hợp lệ (❌) | Ví dụ CHUẨN (✅) |
| :--- | :--- | :--- | :--- |
| **Biến (Variables)** | `camelCase`<br>*(Danh từ, rõ nghĩa)* | `congsuat`, `P`, `checkData` | `requiredPower`, `congSuatYeuCau`, `powerP` |
| **Hàm (Functions)** | `camelCase`<br>*(Bắt đầu bằng Động từ)* | `tinh_toan()`, `Data()` | `calculateMotorPower()`, `validateInput()` |
| **Lớp (Classes) & Model** | `PascalCase`<br>*(Viết hoa chữ đầu mọi từ)* | `dongCoModel`, `gear_box` | `ElectricMotor`, `GearBoxController` |
| **Hằng số (Constants)** | `UPPER_SNAKE_CASE`<br>*(Giá trị vật lý cố định)* | `pi`, `Gravity`, `max_speed` | `PI_VALUE`, `MAX_ROTATION_SPEED` |

> 💡 **Tip:** Nếu không biết đặt tên biến tiếng Anh sao cho chuẩn, hãy hỏi trên group team để thống nhất, tuyệt đối không dùng Google Translate dịch Word-by-Word ghép vào code.

Chúc anh em code mượt, ít bug và ghép code thành công ngay lần đầu tiên! 🔥
