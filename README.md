📂 Kiến Trúc Dự Án (Hybrid / Offline-First Monorepo)
Dự án được chia làm 2 phần chính: Frontend (Client Mobile App) đóng vai trò là não bộ tính toán chính (hỗ trợ Offline), và Backend (Server) đóng vai trò lưu trữ đồng bộ và xử lý AI.

🌳 Cây Thư Mục Tổng Thể (Directory Tree)
DADN/
│
├── docs/                           # 📚 TÀI LIỆU DỰ ÁN (Mọi người đọc trước khi code)
│   ├── 01_Architecture_Design.md   # Thiết kế kiến trúc Offline-First
│   ├── 02_API_Contract.md          # Thỏa thuận cấu trúc JSON giữa FE & BE
│   └── 03_Coding_Standard.md       # Quy tắc đặt tên biến (camelCase...)
│
├── server/                         # 🖥️ BACKEND (Node.js + MongoDB)
│   ├── config/                     # File kết nối Database (db.js)
│   ├── controllers/                # Xử lý logic API (Lưu lịch sử, Auth, AI Chatbot)
│   ├── middlewares/                # Bộ lọc an ninh (Check Token, Error Handler)
│   ├── models/                     # Schema Database trên mây (User, History)
│   ├── routes/                     # Định tuyến API (auth.route, sync.route...)
│   ├── .env                        # Biến môi trường (KHÔNG PUSH LÊN GITHUB)
│   ├── .gitignore                  # Bỏ qua node_modules, .env
│   ├── package.json
│   └── server.js                   # Điểm khởi chạy Server
│
└── client/                         # 📱 FRONTEND (React Native/Expo) - Trái tim hệ thống
    ├── assets/                     # Hình ảnh, Fonts, Icon
    ├── src/
    │   ├── components/             # UI Reusable (Nút bấm, Form, Dialog...)
    │   ├── database/               # 📦 LỚP DATA: Chứa SQLite/JSON (Bảng tra ổ lăn, động cơ...)
    │   ├── logic/                  # 🧠 LỚP NÃO: Các hàm toán học tính toán cơ khí (Offline)
    │   ├── navigation/             # Điều hướng chuyển màn hình (React Navigation)
    │   ├── screens/                # 🎨 LỚP UI: Giao diện màn hình (NhapLieu, DongCo, BanhRang)
    │   ├── services/               # Cấu hình gọi API đồng bộ lên Backend (Axios/api.ts)
    │   └── store/                  # 🔄 LỚP STATE: Quản lý biến toàn cục P, n, L (Zustand)
    │
    ├── App.tsx                     # Điểm khởi chạy App Mobile (TypeScript)
    ├── app.json                    # Cấu hình Expo
    ├── package.json
    └── .gitignore                  # Bỏ qua node_modules, build files
🚀 HƯỚNG DẪN SETUP & CHẠY THỬ (Dành cho Devs)
Để chạy dự án với Kiến trúc 4-Layer mới một cách trơn tru, bạn cần mở 2 Tab Terminal trong VS Code và làm theo thứ tự sau:

📱 BƯỚC 1: KHỞI ĐỘNG FRONTEND (REACT NATIVE / EXPO)
Ở cửa sổ Terminal thứ 1, gõ lần lượt:

cd DADN/client

# Tải bộ thư viện sửa lỗi xung đột (quan trọng)
npm install --legacy-peer-deps

# Khởi chạy Expo kèm lệnh -c (Clear Cache) để xoá bộ nhớ đệm cũ
npx expo start -c
Lấy ứng dụng Expo Go trên điện thoại quét mã QR để mở App.

🖥️ BƯỚC 2: KHỞI ĐỘNG BACKEND (SERVER)
Ở cửa sổ Terminal thứ 2, gõ lần lượt:

cd DADN/server

# Cài đặt thư viện Backend
npm install

# Khởi chạy server API ngầm
npm start 
# hoặc gõ: node server.js
🔥 QUAN TRỌNG: CÁCH SET IP KHI CHẠY EXPO GO Nếu bạn test vòng lặp Đăng nhập/Đăng ký trên điện thoại thật thì phải cấu hình Local IP:

Gõ ipconfig ở Terminal, tìm dãy số IPv4 Address (vd: 192.168.1.144).
Mở file client/src/services/api.ts dòng số 9, điền IP vào biến LOCAL_IP.
Mở file client/src/services/api_sync.ts sửa IP ở biến BASE_URL.
📋 Bảng Đặc Tả Chi Tiết (Quy Tắc Code Theo Thư Mục)
🎯 Tên Thư Mục	📌 Vai Trò & Quy Tắc Code (Luật Thép)
src/screens/	🎨 Chỉ vẽ giao diện. File trong này tuyệt đối không chứa các phép toán cộng trừ nhân chia hay IF/ELSE kiểm tra ngưỡng vật lý. Nó chỉ lấy dữ liệu từ store để in ra màn hình.
src/store/	🔄 Trạm trung chuyển dữ liệu (Zustand). Nơi chứa bộ nhớ tạm của App. Input người dùng gõ vào sẽ lưu ở đây. Các màn hình khác muốn lấy số liệu để tính toán phải truy cập vào file này.
src/logic/	🧠 Bộ não tính toán cơ khí. Chứa toàn bộ công thức đồ án (ví dụ: calc_motor.ts, calc_belt.ts). Nhận đầu vào là số, nhổ đầu ra là số. File ở đây hoàn toàn độc lập về giao diện.
src/database/	📚 Bách khoa toàn thư Local. Chứa file sqlite.db hoặc data_dongco.json. Khi src/logic/ cần tìm động cơ hợp lệ, nó sẽ truy vấn vào thư mục này để lấy dữ liệu (tốc độ < 1ms) mà không cần mạng.
📱 A. Thư mục client/ (Frontend React Native & Expo)
Giao diện ứng dụng Mobile tích hợp luôn bộ xử lý logic nghiệp vụ và cơ sở dữ liệu cục bộ (Local DB) để đảm bảo App có thể hoạt động 100% khi không có mạng. Quản lý trạng thái bằng Zustand. Hiện sử dụng Expo SDK 54.

Cấu trúc thư mục:
src/components/: Các UI components dùng chung (button, input form, popup...).
src/screens/: Các màn hình chính (Login, Nhập liệu, Tính toán động cơ, Lịch sử...).
src/navigation/: Cấu hình chuyển trang (Navigators).
src/store/: Quản lý biến dữ liệu toàn cục (Zustand) - Lưu trữ input (P, n, L) và kết quả tính toán tạm thời.
src/logic/ (MỚI 🚀): Chứa toàn bộ công thức tính toán cơ khí cốt lõi (Động cơ, Bánh răng, Đai). Tách biệt hoàn toàn khỏi UI để dễ dàng tái sử dụng.
src/database/ (MỚI 🚀): Chứa Local DB (SQLite / file JSON) lưu trữ các Bảng tra cơ lý thuyết (danh mục động cơ, tiêu chuẩn ổ lăn). Giúp truy vấn tức thời không cần gọi API.
src/services/: Cài đặt api.ts dùng Axios để gọi API đồng bộ lên Backend khi có mạng.
🖥️ B. Thư mục server/ (Backend Node.js)
Xử lý đồng bộ dữ liệu (Sync), xác thực người dùng (Auth) và làm trạm trung chuyển kết nối AI. Áp dụng chuẩn MVC kết hợp design pattern Singleton.

Cấu trúc thư mục:
config/: Kết nối cơ sở dữ liệu trên mây MongoDB (db.js áp dụng Singleton).
controllers/: Logic xử lý nghiệp vụ (Ví dụ: Đăng ký/Đăng nhập, Nhận cục data từ Mobile để lưu Lịch sử, Gọi API Chatbot Gemini).
models/: Cấu trúc bảng lưu trữ dữ liệu (Database Schema: User, History).
routes/: Đường dẫn API (Ví dụ: api/v1/sync, api/v1/auth, api/v1/chatbot).
middlewares/: Bộ lọc kiểm tra quyền truy cập (Ví dụ: Check token JWT).
server.js: Trái tim khởi chạy server.
🔄 2. Luồng Đồng Bộ Dữ Liệu (Data Flow) - ĐỌC KỸ TRƯỚC KHI CODE
Dự án áp dụng nguyên tắc Local-Write, Cloud-Sync (Lưu cục bộ trước, Đồng bộ mây sau):

Khi Offline:
User nhập liệu → src/logic/ tính toán → Tra cứu linh kiện tại src/database/ → Kết quả lưu tạm vào thiết bị với cờ is_synced = false.
Khi Online:
App phát hiện có mạng → Gọi api/v1/sync trong thư mục services/ → Gửi toàn bộ các dự án is_synced = false lên Backend → Backend lưu vào MongoDB và trả về HTTP 200 → Client chuyển cờ thành is_synced = true.
🏗️ 4. Kiến Trúc Ứng Dụng (4-Layer Architecture)
Dự án áp dụng kiến trúc 4 lớp để tách biệt rõ ràng các trách nhiệm, dễ bảo trì và mở rộng.

🎨 LỚP 1: UI / PRESENTATION LAYER (Giao diện hiển thị)
Nhiệm vụ
Chỉ chứa các nút bấm, ô nhập liệu, biểu đồ. Tuyệt đối KHÔNG chứa công thức tính toán.

Cấu trúc
Screen_NhapLieu: Giao diện cho Module 1.
Screen_TinhDongCo: Giao diện cho Module 2.
Screen_TinhBanhRang: Giao diện cho Module 3.
Screen_Dashboard: Màn hình vẽ biểu đồ tổng kết và nút xuất PDF.
🔄 LỚP 2: STATE MANAGEMENT LAYER (Trạm trung chuyển dữ liệu)
Nhiệm vụ
Lưu trữ dữ liệu tạm thời (Input của người dùng và Output của các công thức) trong lúc App đang mở.

Cấu trúc (Dùng Zustand hoặc Redux)
store/projectState.js: Chứa biến input_data (P, n, L) và calculated_results (Động cơ, Đai, Bánh răng). Mọi màn hình ở Lớp 1 đều gửi và lấy dữ liệu từ trạm này.
🧠 LỚP 3: BUSINESS LOGIC LAYER (Bộ não tính toán)
Nhiệm vụ
Chứa các file toán học, công thức cơ lý thuyết. Nhận số từ Lớp 2, tính toán, và trả kết quả lại cho Lớp 2.

Cấu trúc
utils/validation.js: Hàm kiểm tra P, n, L có hợp lệ không.
utils/calc_motor.js: Chứa công thức tính công suất cần thiết, phân phối tỉ số truyền.
utils/calc_gear.js: Chứa công thức tính module, số răng bánh răng.
📦 LỚP 4: DATA & NETWORK LAYER (Lưu trữ và Đồng bộ)
Nhiệm vụ
Quản lý Database offline trên máy và gọi API lên Server.

Cấu trúc (Frontend)
database/sqlite_local.js: Kết nối database bảng tra cơ khí trên máy tính/điện thoại.
services/api_sync.ts: Hàm quét các dự án đã xong để gửi lên Server.
Cấu trúc (Backend - Server)
NodeJS_Server/routes: Hứng API từ FE.
NodeJS_Server/controllers: Xử lý lưu lịch sử vào MongoDB/PostgreSQL, kết nối Chatbot Gemini.
Với cấu trúc này, sau này anh em muốn mở rộng ra làm Web, anh em chỉ cần giữ nguyên Lớp 2, Lớp 3, Lớp 4. Và chỉ việc code lại Lớp 1 thôi!