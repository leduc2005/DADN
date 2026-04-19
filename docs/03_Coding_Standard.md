# QUY CHUẨN LẬP TRÌNH VÀ Làm VIỆC NHÓM (CODING STANDARD)

Để không bị xung đột (collision) khi merge các module do nhiều thành viên cùng làm, toàn bộ team thống nhất tuân thủ nghiêm ngặt các quy ước sau đây:

## 1. Quy tắc Nguồn dữ liệu chung (Single Source of Truth)
- **UI (Giao diện):** Tuyệt đối KHÔNG ĐƯỢC CHỨA code tính toán. Giao diện chỉ có trách nhiệm duy nhất là lấy Input và hiển thị Output.
- **Form nhập liệu:** Sau khi Submit, data sẽ được đẩy vào 1 kho chung (Global State - Zustand). 
- Các module tính toán như Động cơ, Bánh răng, Đai... **chỉ được phép "hút" data từ kho chung này ra để tính**, không được phép làm thay đổi trực tiếp Input gốc của người dùng.

## 2. Quy tắc Đặt tên biến (Cực kỳ quan trọng để ráp code)
Để code của người này ráp vào code của người kia vẫn chạy được, bắt buộc dùng chuẩn chung:
- **Tên biến:** Viết theo kiểu `camelCase` (VD: `congSuatYeuCau`, `soVongQuay`).
- **Tên hàm:** Phải gắn thêm động từ phía trước (VD: `calculateMotorPower()`, `validateInput()`).
- **Biến số học chuẩn:** Các biến số học mặc định dùng tiếng Anh viết tắt cho đúng chuẩn ngành Kỹ thuật Cơ khí:
  - Công suất: `powerP`
  - Số vòng quay: `speedN`
  - Thời gian phục vụ (Tuổi thọ): `lifeTimeL`

## 3. Phân chia rõ ràng Frontend & Backend
- **FE (App/Web):** Gánh phần vẽ UI, quản lý State (Zustand), chạy logic tính toán cơ khí cốt lõi (Offline trên thuật toán JavaScript), tra cứu bảng linh kiện (bằng SQLite/JSON local).
- **BE (Server):** Gánh phần lưu lịch sử đồng bộ (Sync API), xác thực định danh User, và đóng vai trò trạm kết nối gọi Chatbot AI. *(Lưu ý: BE được viết 1 lần nhưng xài chung cho cả App Mobile và giao diện Web sau này).*

---

> ⚠️ **LƯU Ý QUAN TRỌNG TỪ LEADER:**
> Chi tiết API Contract và Cấu trúc thư mục đã có đầy đủ trong folder `docs/`. Mọi người bắt buộc phải đọc kỹ các file tài liệu này. 
> Khi toàn team đã xem và chốt xong bộ JSON Payload thì chúng ta sẽ bắt đầu triển khai code đồng loạt!
