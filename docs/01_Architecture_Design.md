# ĐỀ XUẤT KIẾN TRÚC HYBRID (OFFLINE-FIRST) CHO ĐỒ ÁN HỆ DẪN ĐỘNG

---

## Mục lục 

I. Mục tiêu dự án & Vấn đề hiện tại  
II. Giải pháp Kiến trúc Hybrid (Local + Cloud)  
III. Trải nghiệm người dùng (Use-case)  
IV. Kết luận  

---

## I. Mục tiêu dự án & Vấn đề hiện tại
Yêu cầu của đồ án là sinh viên phải "tính toán liên hoàn" và truy vấn thông số cơ khí nhanh chóng.

Nếu chúng ta chỉ code theo hướng **Online-Only** (bấm nút -> gửi MongoDB Server -> chờ trả kết quả), chúng ta sẽ gặp 3 rủi ro:
1. **Trải nghiệm tệ (UX kém):** Server lag hoặc mạng thư viện yếu, app sẽ xoay vòng vòng (loading) giữa mỗi bước chuyển màn hình.
2. **Tốn chi phí Server:** Các bảng tra ổ lăn, bánh răng là dữ liệu TĨNH. Việc cứ gọi API lên mây để lấy một con số đã biết trước là lãng phí băng thông và tài nguyên.
3. **App vô dụng khi mất mạng:** Trái với yêu cầu tạo ra một công cụ bỏ túi tiện lợi cho sinh viên cơ khí.

## II. Giải pháp Kiến trúc Hybrid (Local + Cloud)
Chúng ta sẽ chia dữ liệu làm 2 luồng, kết hợp điểm mạnh của cả FE và BE:

### 1. Tầng Local (Offline trên App Mobile):
- **Công nghệ:** Nhúng một file CSDL siêu nhẹ (SQLite/WatermelonDB) vào thẳng App (chỉ tốn thêm ~3MB dung lượng).
- **Nhiệm vụ:** Chứa các bảng tra cơ lý thuyết (Động cơ, Ổ lăn). Đảm nhận việc chạy các công thức tính toán và validate ngưỡng hợp lệ.
- **Ưu điểm:** Tính toán tức thời (0 delay). App nặng dưới 50MB, chạy mượt trên máy RAM 4GB. Thêm/Sửa/Xóa dữ liệu tính toán tạm thời cực nhanh bằng B-Tree Indexing, không lag như mở file Excel.

### 2. Tầng Cloud (Online trên Server):
- **Công nghệ:** NodeJS + MongoDB + Mongoose.
- **Nhiệm vụ:** Lưu trữ User Account, đồng bộ Lịch sử thiết kế (Sync History), và xử lý tác vụ nặng (Gọi API Chatbot Gemini).
- **Ưu điểm:** Giảm tải cho điện thoại, lưu trữ lâu dài.

## III. Trải nghiệm người dùng (Use-case)
- **Khi mất mạng (Offline):** Người dùng vẫn có thể tạo dự án mới, nhập $P, n, L$, app tự động tra bảng Local DB và tính ra trọn bộ thông số. Dữ liệu lưu vào bộ nhớ máy (chúng ta có thể dùng flag, ví dụ: `is_synced = false`). Mờ đi tính năng Chatbot AI.
- **Khi có mạng (Online):** App ngầm đồng bộ dự án lên MongoDB (`is_synced = true`). Người dùng có thể chat với AI, xuất file PDF lịch sử tính toán.

## IV. Kết luận
Kiến trúc Hybrid đáp ứng đúng nỗi lo khi làm Backend (không dồn hết lên Mobile), đồng thời giúp Frontend tự tin kiểm soát độ mượt của App. Đây là kiến trúc tiêu chuẩn của các app lớn hiện nay. Đề xuất anh em chốt phương án này để bắt đầu thiết kế Schema cho Database!
