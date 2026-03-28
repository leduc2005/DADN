# ⚙️ Hệ Thống Tính Toán & Thiết Kế Hệ Dẫn Động Thùng Trộn

Ứng dụng môn Đồ án Đa ngành (DADN) hỗ trợ sinh viên/kỹ sư tự động tính toán hệ dẫn động (chọn động cơ, thiết kế bộ truyền đai, bánh răng, trục, và ổ lăn) thay vì tra bảng thủ công, tối ưu hóa thời gian thiết kế chi tiết máy.

---

## 📂 1. Cấu Trúc Dự Án (Monorepo)
Dự án được chia làm 2 phần chính: Backend (Server) và Frontend (Client Mobile App).

### 🖥️ A. Thư mục `server/` (Backend Node.js)
Xử lý logic tính toán cơ khí cốt lõi, lưu trữ CSDL và xác thực người dùng. Áp dụng chuẩn **MVC** kết hợp design pattern **Singleton** & **Strategy**.

* `config/`: Kết nối cơ sở dữ liệu MongoDB (`db.js` áp dụng Singleton).
* `controllers/`: Logic xử lý nghiệp vụ chính khi có yêu cầu (Ví dụ: Tính toán lưu lịch sử, Đăng ký user...).
* `models/`: Cấu trúc bảng lưu trữ dữ liệu (Database Schema: User, History).
* `routes/`: Đường dẫn API (Ví dụ: `api/v1/history`, `api/v1/auth`).
* `middlewares/`: Bộ lọc kiểm tra quyền truy cập (Ví dụ: Check token JWT).
* `strategies/`: Tính toán linh hoạt (Ví dụ: Công thức tính Đai dẹt vs Đai thang).
* `server.js`: Trái tim khởi chạy server.

### 📱 B. Thư mục `client/` (Frontend React Native & Expo)
Giao diện ứng dụng Mobile với luồng quản lý trạng thái bằng **Zustand**. Hiện đã chuyển sang **Expo SDK 54** để tối ưu hóa việc test trên thiết bị thật.

* `src/components/`: Các button, input form... dùng đi dùng lại nhiều chỗ.
* `src/screens/`: Các màn hình chính (Login, Trang chủ, Màn hình nhập Lịch sử...).
* `src/navigation/`: Cấu hình chuyển trang (Navigators).
* `src/store/`: Quản lý biến dữ liệu toàn cục (Zustand).
* `src/services/`: Nơi cài đặt file `api.ts` để gọi API từ Backend thông qua Axios.

---

## 🚀 2. Hướng Dẫn Setup & Chạy Thử (Dành cho Devs)

**Bước 1: Kéo Code Về Máy**
```bash
git clone <url-repo-cua-nhom>
cd DADN
```
> ⚠️ **QUAN TRỌNG:** Copy file `.env` từ nhóm vào thư mục `server/`. Bắt buộc phải có file này để chạy!

**Bước 2: Chạy Backend (Node.js)**
1. Mở Terminal, di chuyển vào thư mục server:
```bash
cd server
npm install
npm run dev
```
*Kết quả in ra `Server is running` & `Connected to MongoDB` là OK.*

**Bước 3: Chạy Frontend (Expo Go)**
1. Mở 1 tab Terminal mới, di chuyển vào thư mục client:
```bash
cd client
npm install --legacy-peer-deps
```
2. **Cấu hình IP**: Mở `src/services/api.ts`, sửa `LOCAL_IP` thành IP máy tính của bạn (lấy từ `ipconfig`).
3. Chạy ứng dụng qua điện thoại:
```bash
npx expo start --tunnel
```
*Quét mã QR bằng ứng dụng Expo Go (iOS/Android) để bắt đầu test.*

---

## 🤝 3. Quy Tắc Làm Việc Nhóm (Git Flow)

1. **🔒 Bảo mật**: KHÔNG push file `.env` lên GitHub.
2. **🚫 Nhánh chính**: Nhánh `main` là code sạch. Không push trực tiếp vào đây.
3. **🌱 Tạo nhánh module**: Luôn làm việc trên nhánh tính năng (Ví dụ: `feat/login`).
4. **👀 Quy trình Merge**: Tạo Pull Request (PR) và đợi Review trước khi merge vào `main`.
