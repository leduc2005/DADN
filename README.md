# 📂 Kiến Trúc Dự Án (Hybrid / Offline-First Monorepo)

Dự án được chia làm 2 phần chính: **Frontend (Client Mobile App)** đóng vai trò là não bộ tính toán chính (hỗ trợ Offline), và **Backend (Server)** đóng vai trò lưu trữ đồng bộ và xử lý AI.

## 🌳 Cây Thư Mục Tổng Thể (Directory Tree)

```
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
    │   ├── hooks/                  # Custom hooks (VD: useSyncEngine.ts chạy ngầm)
    │   ├── logic/                  # 🧠 LỚP NÃO: Các hàm toán học tính toán cơ khí (Offline)
    │   ├── navigation/             # Điều hướng chuyển màn hình (React Navigation)
    │   ├── screens/                # 🎨 LỚP UI: Giao diện màn hình (InputScreen, MotorSelectionScreen, GearCalculationScreen)
    │   ├── services/               # Cấu hình gọi API đồng bộ lên Backend (Axios/api.ts)
    │   └── store/                  # 🔄 LỚP STATE: Quản lý biến toàn cục P, n, L, isReadOnly (Zustand)
    │
    ├── App.tsx                     # Điểm khởi chạy App Mobile (TypeScript)
    ├── app.json                    # Cấu hình Expo
    ├── package.json
    └── .gitignore                  # Bỏ qua node_modules, build files
```
---

## 🚀 HƯỚNG DẪN SETUP & CHẠY THỬ 

Nếu bạn không rành về code, hãy bình tĩnh làm theo **chính xác từng bước một** dưới đây.

### 🛠️ GIAI ĐOẠN 0: CHUẨN BỊ MÔI TRƯỜNG
1. **Cài đặt Node.js:** Truy cập trang [nodejs.org](https://nodejs.org/), tải và cài đặt phiên bản **LTS** (Long Term Support). Cứ bấm Next cho đến khi hoàn tất.
2. **Cài đặt Expo Go:** Lên kho ứng dụng App Store (iPhone) hoặc CH Play (Android), tìm và tải ứng dụng có tên **Expo Go** về điện thoại.
3. **Mở dự án:** Bật ứng dụng **Visual Studio Code (VS Code)**, chọn `File` > `Open Folder` và chọn thư mục `DADN`.
4. Mở cửa sổ gõ lệnh (Terminal) trong VS Code bằng cách bấm phím tắt: `` Ctrl + ` `` (dấu huyền ngay dưới nút ESC).

---

### 🖥️ GIAI ĐOẠN 1: KHỞI ĐỘNG MÁY CHỦ (SERVER / BACKEND)
Máy chủ là nơi lưu trữ cơ sở dữ liệu và xử lý đăng nhập, bạn phải bật nó lên trước.

**Bước 1:** Trong khung Terminal của VS Code, gõ lệnh sau để đi vào thư mục server:
```bash
cd DADN/server
```

**Bước 2:** Cài đặt các thư viện cần thiết bằng lệnh:
```bash
npm install
```

**Bước 3: Tạo file cấu hình bảo mật (`.env`) - BẮT BUỘC**
- Nhìn sang cột danh sách file bên trái, **click chuột phải vào thư mục `server`** -> Chọn **New File**.
- Đặt tên file chính xác là: **`.env`** (có dấu chấm ở đầu, không viết hoa).
- Copy toàn bộ nội dung dưới đây và dán vào file `.env` vừa tạo, sau đó bấm `Ctrl + S` để lưu lại:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/DADN_Database
JWT_SECRET=your_jwt_secret_key_here

# Dành cho chức năng Quên Mật Khẩu (Gửi OTP qua email)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_google_app_password
```
*(Ghi chú: Nếu bạn muốn test tính năng Quên mật khẩu, hãy lên Google tìm cách "Tạo mật khẩu ứng dụng Gmail" gồm 16 chữ số và dán vào phần `EMAIL_PASS`, tuyệt đối không dùng mật khẩu đăng nhập Gmail thường).*

**Bước 4:** Bật máy chủ lên bằng lệnh:
```bash
npm start
```
*Nếu bạn thấy chữ "Server is running on port 5000" hiện ra là bạn đã thành công! Cứ để nguyên Terminal đó không được tắt.*

---

### 📱 GIAI ĐOẠN 2: KHỞI ĐỘNG ỨNG DỤNG ĐIỆN THOẠI (CLIENT / FRONTEND)

**Bước 1:** Bấm vào **dấu cộng (+)** ở góc phải khung Terminal để mở thêm một cửa sổ Terminal thứ 2. Gõ lệnh sau để đi vào thư mục client:
```bash
cd DADN/client
```

**Bước 2: Cấu hình địa chỉ mạng LAN (CỰC KỲ QUAN TRỌNG)**
Để điện thoại và máy tính của bạn "nhìn thấy nhau", bạn phải cung cấp địa chỉ IP của máy tính cho App:
- Gõ lệnh `ipconfig` (nếu dùng Windows) hoặc `ifconfig` (nếu dùng Mac) vào Terminal rồi bấm Enter.
- Tìm đến dòng có chữ **IPv4 Address**, bạn sẽ thấy một dãy số (Ví dụ: `192.168.1.144`). Hãy copy hoặc nhớ dãy số này.
- Mở file `client/src/services/api.ts` -> Tại dòng số 9, sửa biến `LOCAL_IP` thành số IP của bạn.
- Mở file `client/src/services/api_sync.ts` -> Sửa số IP trong biến `BASE_URL` thành IP của bạn.
*(Lưu ý: Điện thoại và máy tính PHẢI kết nối chung 1 mạng Wifi).*

**Bước 3:** Cài đặt thư viện cho App điện thoại:
```bash
# Bắt buộc phải có đuôi --legacy-peer-deps để tránh lỗi xung đột phiên bản
npm install --legacy-peer-deps
```

**Bước 4:** Bật ứng dụng lên bằng lệnh:
```bash
npx expo start -c
```
Lúc này trên màn hình máy tính sẽ hiện ra một cái **Mã QR khổng lồ**.

**Bước 5:** 
- Mở ứng dụng **Expo Go** trên điện thoại của bạn.
- Chọn nút **Scan QR code** (Quét mã QR) và chĩa camera vào màn hình máy tính.
- Đợi khoảng 1-2 phút để ứng dụng tải dữ liệu lần đầu tiên (building bundles). Chúc mừng bạn đã vào được App!

---

## 🎯 TỔNG QUAN 3 MODULE TÍNH NĂNG CHÍNH ĐÃ HOÀN THÀNH

App được thiết kế theo luồng quy trình đồ án chi tiết máy, chia làm 3 Module cốt lõi liên kết chặt chẽ với nhau:

1. **Module 1 - Thu thập Thông số Đầu vào:**
   - Tiếp nhận các thông số gốc (Công suất P, Vòng quay n, Tuổi thọ L) và Điều kiện tải.
   - Thêm/Xóa động linh hoạt các Bộ truyền động (Đai, Răng trụ, Trục vít...) và Ổ truyền động. Hệ thống tự động validation dữ liệu và áp dụng các thông số chuẩn (hiệu suất η, tỉ số truyền u).

2. **Module 2 - Tính toán & Lựa chọn Động cơ:**
   - App tự động phân tích Module 1, tính toán Công suất yêu cầu (Pct) và Tốc độ đồng bộ (Nsb).
   - Truy vấn Offline (Data cục bộ) và Online (Gọi API từ Server) để đưa ra danh sách đề xuất Động cơ phù hợp nhất.
   - Tự động phân phối tỉ số truyền (uHop, uNgoai) và tính toán sai số động học.

3. **Module 3 - Quản lý Lịch sử & Đồng bộ Offline-First:**
   - **Offline-First:** Mọi bài toán sau khi tính xong đều được nén lại (serialize) và lưu ngay vào Database SQLite cục bộ trên điện thoại.
   - **Background Sync Engine:** Tự động đồng bộ ngầm các bài toán lên mây (MongoDB) khi có mạng.
   - **Bảo vệ toàn vẹn dữ liệu (Read-Only Mode):** Khi mở lại một lịch sử cũ từ trang chủ, hệ thống sẽ tự động khôi phục giao diện, khóa cứng (disable) toàn bộ các form nhập liệu, bôi đậm động cơ đã chọn và hiển thị kết quả cũ để đảm bảo tính lịch sử không bị bóp méo.

---

## 📋 Bảng Đặc Tả Chi Tiết (Quy Tắc Code Theo Thư Mục)

| 🎯 Tên Thư Mục | 📌 Vai Trò & Quy Tắc Code (Luật Thép) |
| --- | --- |
| **`src/screens/`** | 🎨 **Chỉ vẽ giao diện.** File trong này tuyệt đối không chứa các phép toán cộng trừ nhân chia hay IF/ELSE kiểm tra ngưỡng vật lý. Nó chỉ lấy dữ liệu từ store để in ra màn hình. |
| **`src/store/`** | 🔄 **Trạm trung chuyển dữ liệu (Zustand).** Nơi chứa bộ nhớ tạm của App. Input người dùng gõ vào sẽ lưu ở đây. Các màn hình khác muốn lấy số liệu để tính toán phải truy cập vào file này. |
| **`src/logic/`** | 🧠 **Bộ não tính toán cơ khí.** Chứa toàn bộ công thức đồ án (ví dụ: `calc_motor.ts`, `calc_belt.ts`). Nhận đầu vào là số, nhổ đầu ra là số. File ở đây hoàn toàn độc lập về giao diện. |
| **`src/database/`** | 📚 **Bách khoa toàn thư Local.** Chứa file `sqlite.ts`. Khi `src/logic/` cần tìm động cơ hợp lệ, nó sẽ truy vấn vào đây để lấy dữ liệu (tốc độ < 1ms) mà không cần mạng. Ngoài ra còn lưu trữ các dự án Offline. |

---

## 📱 A. Thư mục `client/` (Frontend React Native & Expo)

Giao diện ứng dụng Mobile tích hợp luôn bộ xử lý logic nghiệp vụ và cơ sở dữ liệu cục bộ (Local DB) để đảm bảo App có thể hoạt động 100% khi không có mạng. Quản lý trạng thái bằng Zustand. Hiện sử dụng Expo SDK 54.

### Cấu trúc thư mục:
- `src/components/`: Các UI components dùng chung (button, input form, popup...).
- `src/screens/`: Các màn hình chính (Login, Nhập liệu, Tính toán động cơ, Lịch sử...).
- `src/navigation/`: Cấu hình chuyển trang (Navigators).
- `src/store/`: Quản lý biến dữ liệu toàn cục (Zustand) - Lưu trữ input (P, n, L) và kết quả tính toán tạm thời.
- **`src/logic/` (MỚI 🚀)**: Chứa toàn bộ công thức tính toán cơ khí cốt lõi (Động cơ, Bánh răng, Đai). Tách biệt hoàn toàn khỏi UI để dễ dàng tái sử dụng.
- **`src/database/` (MỚI 🚀)**: Chứa Local DB (SQLite / file JSON) lưu trữ các Bảng tra cơ lý thuyết (danh mục động cơ, tiêu chuẩn ổ lăn). Giúp truy vấn tức thời không cần gọi API.
- `src/services/`: Cài đặt `api.ts` dùng Axios để gọi API đồng bộ lên Backend khi có mạng.

---

## 🖥️ B. Thư mục `server/` (Backend Node.js)

Xử lý đồng bộ dữ liệu (Sync), xác thực người dùng (Auth) và làm trạm trung chuyển kết nối AI. Áp dụng chuẩn MVC kết hợp design pattern Singleton.

### Cấu trúc thư mục:
- `config/`: Kết nối cơ sở dữ liệu trên mây MongoDB (`db.js` áp dụng Singleton).
- `controllers/`: Logic xử lý nghiệp vụ (Ví dụ: Đăng ký/Đăng nhập, Nhận cục data từ Mobile để lưu Lịch sử, Gọi API Chatbot Gemini).
- `models/`: Cấu trúc bảng lưu trữ dữ liệu (Database Schema: User, History).
- `routes/`: Đường dẫn API (Ví dụ: `api/v1/sync`, `api/v1/auth`, `api/v1/chatbot`).
- `middlewares/`: Bộ lọc kiểm tra quyền truy cập (Ví dụ: Check token JWT).
- `server.js`: Trái tim khởi chạy server.

---

## 🔄 Luồng Đồng Bộ Dữ Liệu (Data Flow) - ĐỌC KỸ TRƯỚC KHI CODE

Dự án áp dụng nguyên tắc **Local-Write, Cloud-Sync** (Lưu cục bộ trước, Đồng bộ mây sau):

### Khi Offline:
- User nhập liệu → `src/logic/` tính toán → Tra cứu linh kiện tại `src/database/` → Kết quả lưu tạm vào điện thoại (SQLite) với cờ `is_synced = false`.

### Khi Online:
- **Immediate Sync:** Khi người dùng bấm "Lưu" hoặc "Xóa" một bài toán, Trigger sẽ gọi API `/api/sync` đồng bộ tức thì lên Server.
- **Background Sync:** Hook `useSyncEngine` chạy ngầm, phát hiện có mạng sẽ gom các dự án `is_synced = false` đẩy lên Backend. Backend lưu vào MongoDB và Client chuyển cờ thành `is_synced = true`.

---

## 🏗️ 4. Kiến Trúc Ứng Dụng (4-Layer Architecture)

Dự án áp dụng kiến trúc **4 lớp** để tách biệt rõ ràng các trách nhiệm, dễ bảo trì và mở rộng.

### 🎨 LỚP 1: UI / PRESENTATION LAYER (Giao diện hiển thị)

#### Nhiệm vụ
Chỉ chứa các nút bấm, ô nhập liệu, biểu đồ. **Tuyệt đối KHÔNG chứa công thức tính toán.**

#### Cấu trúc
- **InputScreen**: Giao diện thu thập đầu vào.
- **MotorSelectionScreen**: Giao diện hiển thị danh sách đề xuất động cơ.
- **GearCalculationScreen**: Giao diện hiển thị kết quả kiểm nghiệm bền và tính toán bánh răng.
- **HomeScreen**: Dashboard hiển thị danh sách lịch sử tính toán, quản lý đồng bộ và đăng xuất.

---

### 🔄 LỚP 2: STATE MANAGEMENT LAYER (Trạm trung chuyển dữ liệu)

#### Nhiệm vụ
Lưu trữ dữ liệu tạm thời (Input của người dùng và Output của các công thức) trong lúc App đang mở. 

#### Cấu trúc (Dùng Zustand hoặc Redux)
- `store/projectState.js`: Chứa biến `input_data` (P, n, L) và `calculated_results` (Động cơ, Đai, Bánh răng). Mọi màn hình ở Lớp 1 đều gửi và lấy dữ liệu từ trạm này.

---

### 🧠 LỚP 3: BUSINESS LOGIC LAYER (Bộ não tính toán)

#### Nhiệm vụ
Chứa các file toán học, công thức cơ lý thuyết. Nhận số từ Lớp 2, tính toán, và trả kết quả lại cho Lớp 2.

#### Cấu trúc
- `utils/validation.ts`: Hàm kiểm tra P, n, L có hợp lệ không.
- `logic/calc_motor.ts`: Chứa công thức tính công suất cần thiết, phân phối tỉ số truyền.
- `logic/calc_gear.ts`: Chứa công thức tính module, số răng bánh răng.

---

### 📦 LỚP 4: DATA & NETWORK LAYER (Lưu trữ và Đồng bộ)

#### Nhiệm vụ
Quản lý Database offline trên máy và gọi API lên Server.

#### Cấu trúc (Frontend)
- `database/sqlite.ts`: Quản lý Local SQLite Database, lưu trữ offline lịch sử bài toán và cấu hình ổ lăn/bánh răng.
- `hooks/useSyncEngine.ts`: Động cơ đồng bộ nền, tự động kết nối Backend.
- `services/api_sync.ts`: Hàm quét các dự án đã xong để gửi lên Server.

#### Cấu trúc (Backend - Server)
- `routes/syncRoutes.js`: Hứng API đồng bộ từ FE (`/api/sync`).
- `controllers/authController.js`: Xử lý lưu lịch sử, xác thực người dùng.

> *Với cấu trúc này, sau này anh em muốn mở rộng ra làm Web, anh em chỉ cần giữ nguyên Lớp 2, Lớp 3, Lớp 4. Và chỉ việc code lại Lớp 1 thôi!*
