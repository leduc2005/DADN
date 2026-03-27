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

### 📱 B. Thư mục `client/` (Frontend React Native)
Giao diện ứng dụng Mobile với luồng quản lý trạng thái bằng **Zustand**.

* `src/components/`: Các button, input form... dùng đi dùng lại nhiều chỗ.
* `src/screens/`: Các màn hình chính (Login, Trang chủ, Màn hình nhập Lịch sử...).
* `src/navigation/`: Cấu hình chuyển trang (Navigators).
* `src/store/`: Quản lý biến dữ liệu toàn cục (Zustand).
* `src/services/`: Nơi cài đặt file `Axios` để gọi cục API từ Backend.

---

## 🚀 2. Hướng Dẫn Setup & Chạy Thử (Dành cho Devs)

**Bước 1: Kéo Code Về Máy & Yêu Cầu Gốc**
```bash
git clone <url-repo-cua-nhom>
cd DADN
```
> ⚠️ **QUAN TRỌNG:** Xin nhóm trưởng (Đức) file `.env` chứa chuỗi bảo mật JWT và MongoDB, và copy bẳng tay vào trong thư mục `server/`. Bắt buộc phải có file này để chạy!

**Bước 2: Chạy Backend (Node.js)**
1. Mở Terminal, di chuyển vào thư mục server:
```bash
cd server
npm install
npm start
```
*Kết quả in ra `Server is running` & `MongoDB connection successful!` là OK.*

**Bước 3: Chạy Frontend (React Native)**
1. Mở 1 tab Terminal mới, di chuyển vào thư mục client:
```bash
cd client
npm install
```
2. Bật máy ảo Android/iOS lên và chạy lệnh:
```bash
npx react-native run-android  # Cho Android
npx react-native run-ios      # Cho iOS
```

---

## 🤝 3. Quy Tắc Làm Việc Nhóm (Git Flow)

1. **🔒 Tôn trọng bảo mật:** KHÔNG BAO GIỜ được dùng lệnh ép git push file `.env` lên GitHub. File này đã được chặn bởi `.gitignore`. Mọi người tự truyền tay file `.env` qua Zalo.
2. **🚫 Cấm code đè lên nhánh `main`:** Nhánh `main` là code sạch đã được kiểm duyệt. Bạn không được push trực tiếp vào đây.
3. **🌱 Tạo nhánh cá nhân khi làm module mới:**
   Bạn nhận task nào (VD: Làm api lịch sử), hãy tạo nhánh theo tính năng:
   ```bash
   git checkout -b feat/api-history
   ```
4. **👀 Quy trình Merge:** Khi code xong nhánh của mình, hãy đẩy lên Github và tạo một **Pull Request (PR)**. Nhóm trưởng/bạn khác sẽ Review Code. Chốt OK không có lỗi vặt thì mới bấm Merge vào `main`.