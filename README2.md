# 📐 Module 2 — Tính toán Động cơ, Đai & Bánh răng

**DADN-252 | Đồ án Đa Ngành | Nhóm 6**

Tài liệu kỹ thuật đầy đủ cho **Module 2** của hệ thống ứng dụng hỗ trợ tính toán Hệ dẫn động Thùng trộn — bao gồm tổng quan kiến trúc, công thức cốt lõi, API endpoints, và hướng dẫn setup môi trường từng bước.

---

## 🗂 Mục lục

1. [Tổng quan kiến trúc Module 2](#1-tổng-quan-kiến-trúc-module-2)
2. [Luồng dữ liệu (Data Flow)](#2-luồng-dữ-liệu-data-flow)
3. [API Endpoints](#3-api-endpoints)
4. [Cấu trúc file Module 2](#4-cấu-trúc-file-module-2)
5. [Hướng dẫn Setup & Chạy Project](#5-hướng-dẫn-setup--chạy-project)
6. [Kết hợp với Module 1 qua Git](#6-kết-hợp-với-module-1-qua-git)

---

## 1. Tổng quan kiến trúc Module 2

Module 2 là lõi nghiệp vụ cơ khí của hệ thống, triển khai theo **3 giai đoạn tính toán tuần tự** theo đúng quy trình SGK *Thiết kế Chi tiết máy* (Trịnh Chất & Lê Văn Uyển):

```
Module 1 (Input đã validate)
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│                    MODULE 2 Backend                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │MotorService  │→ │ BeltService  │→ │  GearService  │ │
│  │  (Giai đoạn1)│  │ (Giai đoạn2) │  │  (Giai đoạn3) │ │
│  └──────────────┘  └──────────────┘  └───────────────┘ │
│         │                 │                  │          │
│         ▼                 ▼                  ▼          │
│    mechanicalConstants.js (Catalogue dữ liệu cơ khí)   │
└─────────────────────────────────────────────────────────┘
        │
        ▼
     MongoDB (Calculation Schema)
        │
        ▼
     React Native App / UI_UX Web Preview
```

### Nguyên tắc thiết kế
| Layer | Trách nhiệm | File |
|---|---|---|
| **Constants** | Dữ liệu catalogue: động cơ 4A, đai, vật liệu BR | `utils/mechanicalConstants.js` |
| **Service** | Công thức tính toán thuần túy (không DB, không HTTP) | `services/Motor/Belt/GearService.js` |
| **Controller** | Validate HTTP input, gọi Service, format response | `controllers/calculationController.js` |
| **Route** | Khai báo URL endpoints | `routes/calculationRoutes.js` |
| **Model** | Mongoose Schema lưu snapshot kết quả | `models/Calculation.js` |
| **API Bridge** | TypeScript helper nối UI_UX ↔ Backend | `UI_UX/src/services/calculationApi.ts` |

---

## 2. Luồng dữ liệu (Data Flow)

### Giai đoạn 1 — Động cơ
```
InputScreen (P_t, n_iv, η, u_sb)
    │  POST /motors/suggest
    ▼
MotorService.calculateRequiredPower()   → P_ct = P_t / η_chung
MotorService.calculateSynchronousSpeed() → n_sb = n_iv × u_total
MotorService.suggestMotors()            → Lọc catalogue MOTOR_CATALOGUE
    │
    ▼  [User chọn động cơ từ danh sách]
    │  POST /motors/select
    ▼
MotorService.calculateShaftDynamics()   → n₁, n₂, n₃, P₁, P₂, P₃, T₁, T₂, T₃
    │  Lưu vào MongoDB
    ▼
KinematicResultsScreen (hiển thị bảng trục)
```

**Công thức chính:**
- `P_ct = P_t / η_chung` *(Công thức 2.1 — SGK)*
- `T_i = 9.55 × 10⁶ × P_i / n_i` [N.mm] *(2.3.3 — SGK)*

### Giai đoạn 2 — Đai thang
```
Thông số từ Giai đoạn 1 (P_dc, n_dc, u_dai)
    │  POST /belts/calculate
    ▼
BeltService (10 bước tính theo SGK Chương 4):
  1. Chọn tiết diện đai (O/A/B/C/D)
  2. Đường kính bánh dẫn d₁ (tiêu chuẩn)
  3. d₂ = u_dai × d₁ × (1 - ε)
  4. Khoảng cách trục sơ bộ a_sb
  5. Chiều dài đai L_sb → chọn L tiêu chuẩn
  6. Khoảng cách trục thực a = [λ + √(λ²-8(d₂-d₁)²)] / 8
  7. Góc ôm α₁ = 180° - (d₂-d₁)/a × 57° ✓ (≥ 120°)
  8. Tần số uốn i = v/L ✓ (≤ 10 l/s)
  9. Số đai z = P₁×Kd / (P₀×Kα×KL×Ku×Kz)
 10. Lực tác dụng Fr = 2F₀z×sin(α₁/2)
    │
    ▼
[Đạt] → Lưu DB | [Không đạt] → Trả lỗi → User chọn lại
```

### Giai đoạn 3 — Bánh răng trụ
```
Thông số từ Giai đoạn 1 (T₁, n₁, u, L_hours) + User chọn vật liệu
    │  POST /gears/calculate
    ▼
GearService (5 bước):
  1. [σH] = σHlim × KHL / sH  |  [σF] = σFlim × KFL / sF
  2. aw = Ka(u+1) × ∛(T₁KHβ / [σH]²u×ψba)  → làm tròn
  3. m_n (tiêu chuẩn), z₁, z₂, d₁, d₂, da, df, bw
  4. Kiểm bền tiếp xúc: σH = ZM×ZH×Zε × √(2T₁KH(u+1)/bw×dw1²×u) ≤ [σH]
  5. Kiểm bền uốn:     σF = 2T₁KF×Yε×YF / (bw×dw1×mn) ≤ [σF]
    │
    ▼
[Đạt] → Lưu DB | [Không đạt] → Báo lỗi kèm lý do kỹ thuật
```

---

## 3. API Endpoints

Base URL: `http://localhost:5000/api/v1/calculation`

### 🔵 Motor

#### `POST /motors/suggest`
Tính `P_ct`, `n_sb` và trả về danh sách động cơ phù hợp.

**Request Body:**
```json
{
  "Pt": 5.5,
  "n_iv": 70,
  "ratios": [2.5, 3.71, 1],
  "systemConfig": {
    "transmissionType": "belt_vee",
    "gearboxType": "gear_spur",
    "numGearStages": 2,
    "numBearingPairs": 4,
    "hasCoupling": true
  }
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "message": "Tìm được 5 động cơ phù hợp",
  "calculation": {
    "powerResult": { "Pct": 6.275, "eta_total": 0.876 },
    "speedResult":  { "n_sb": 2921.63, "u_total": 41.74 }
  },
  "motors": [
    { "model": "4A112M2Y3", "power": 7.5, "speed": 2922, "Tmm_Tdn": 2.0 }
  ]
}
```

#### `POST /motors/select`
Xác nhận chọn động cơ, tính momen xoắn và tốc độ trên các trục.

**Request Body:**
```json
{
  "Pt": 5.5, "n_dc": 2922,
  "u_belt": 2.5, "u_stage1": 4.5, "u_stage2": 3.71,
  "transmissionType": "belt_vee", "gearboxType": "gear_bevel"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "shafts": {
    "motor":  { "n": 2922, "P": 6.275, "T": 20508.97 },
    "shaft1": { "n": 1168.8, "P": 5.994, "T": 48975.62 },
    "shaft2": { "n": 259.73, "P": 5.785, "T": 212712.07 },
    "shaft3": { "n": 70.01,  "P": 5.583, "T": 761640.12 }
  }
}
```

---

### 🟠 Belt

#### `GET /belts/sections`
Trả về danh sách tiết diện đai (O, A, B, C, D) và thông số kỹ thuật.

#### `POST /belts/calculate`
Thiết kế đầy đủ bộ truyền đai. Trả `200` nếu đạt, `422` nếu không đạt điều kiện.

**Request Body:**
```json
{
  "P1_kW": 7.5, "n1_rpm": 2922, "u_dai": 2.5,
  "section": "B",
  "engineType": "electric", "loadType": "light_shock"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "result": {
    "section": "B",
    "diameters": { "d1": 140, "d2": 355 },
    "belt": { "L": 2500, "a": 601.62 },
    "angles": { "alpha1_deg": 159.63 },
    "belts": { "z": 3 },
    "forces": { "Ft": 350.15, "Fr": 928.4, "v_dai": 21.419 },
    "overall_pass": true
  }
}
```

---

### 🟢 Gear

#### `GET /gears/materials`
Danh sách vật liệu: `steel_45_normalized`, `steel_45_tempered`, `steel_40X_tempered`, v.v.

#### `POST /gears/calculate`
Tính toán và kiểm nghiệm bánh răng trụ. Trả `200` đạt, `422` không đạt.

**Request Body:**
```json
{
  "mat1Id": "steel_45_tempered",
  "mat2Id": "steel_45_normalized",
  "T1_Nmm": 212712, "n1_rpm": 259.73,
  "u": 3.71, "L_hours": 43200,
  "gearType": "spur_symmetric", "bearingPos": "symmetric"
}
```

**Response `200 OK` (tóm tắt):**
```json
{
  "success": true,
  "result": {
    "step1_allowableStress": { "sigmaH_allow": 427.27, "sigmaF1_allow": 236.57 },
    "step3_gearParameters": { "m_n": 4, "z1": 23, "z2": 85, "d1": 92, "d2": 340, "bw": 88 },
    "step4_contactCheck": { "sigma_H": 314.77, "pass": true, "margin_pct": 26.3 },
    "step5_bendingCheck": { "sigma_F1": 30.08, "sigma_F2": 27.77, "pass1": true, "pass2": true },
    "overall_pass": true,
    "verdict": "ĐẠT - Bánh răng đủ bền"
  }
}
```

---

## 4. Cấu trúc file Module 2

```
DADN/
├── server/
│   ├── utils/
│   │   └── mechanicalConstants.js   ← Catalogue động cơ 4A, đai thang, vật liệu BR
│   ├── services/
│   │   ├── MotorService.js          ← Tính Pct, n_sb, gợi ý động cơ, momen các trục
│   │   ├── BeltService.js           ← 10 bước thiết kế đai thang
│   │   └── GearService.js           ← 5 bước thiết kế + kiểm nghiệm bánh răng
│   ├── controllers/
│   │   └── calculationController.js ← 6 handler HTTP
│   ├── routes/
│   │   └── calculationRoutes.js     ← Khai báo 6 endpoints
│   ├── models/
│   │   └── Calculation.js           ← Mongoose Schema lưu lịch sử tính toán
│   └── testModule2.js               ← Script test mock-data (node testModule2.js)
│
└── UI_UX/
    └── src/
        ├── services/
        │   └── calculationApi.ts    ← API Bridge: TypeScript wrapper tất cả endpoints
        ├── app/screens/
        │   ├── InputScreen.tsx      ← [PATCHED] Gọi API suggestMotors thật
        │   ├── MotorSelectionScreen.tsx  ← [PATCHED] Nhận motors từ API, gọi selectMotor
        │   └── KinematicResultsScreen.tsx ← Hiển thị kết quả trục từ API
        └── .env.example             ← Cấu hình VITE_API_URL
```

---

## 5. Hướng dẫn Setup & Chạy Project

### Yêu cầu hệ thống
| Công cụ | Phiên bản tối thiểu |
|---|---|
| Node.js | ≥ 18.0.0 |
| npm | ≥ 9.0.0 |
| pnpm | ≥ 8.0.0 *(dùng cho UI_UX)* |
| MongoDB | ≥ 6.0 *(hoặc dùng MongoDB Atlas)* |
| Git | ≥ 2.30.0 |

---

### Bước 1 — Kéo code về và checkout đúng branch

```bash
# Clone repo (nếu chưa có)
git clone <url-repo-nhom>
cd DADN

# Xem danh sách các branch
git branch -a

# Checkout vào branch Module 2
# (Code Module 2 đang nằm ở branch: feature/module2)
git checkout feature/module2

# Kiểm tra branch hiện tại
git branch
# Output mong đợi: * feature/module2
```

---

### Bước 2 — Setup Backend (Node.js/Express)

```bash
# Di chuyển vào thư mục server
cd server

# Cài đặt dependencies
npm install

# Tạo file .env (BẮT BUỘC)
# Liên hệ team lead để lấy file .env, hoặc tạo mới:
cp .env.example .env    # Nếu không có .env.example thì tạo tay
```

**Nội dung file `server/.env`:**
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/dadn_db
JWT_SECRET=your_super_secret_jwt_key_here_change_this
```

> ⚠️ **QUAN TRỌNG:** Không push file `.env` lên GitHub. File này đã được thêm vào `.gitignore`.

```bash
# Chạy Backend server
npm run dev

# Kết quả mong đợi:
# Server is running on http://localhost:5000
# Connected to MongoDB ✓
```

**Test nhanh Backend Module 2 (không cần MongoDB):**
```bash
# Chạy từ thư mục server/
node testModule2.js

# Kết quả mong đợi: 5 test case ✅
```

**Test API bằng curl:**
```bash
# Test gợi ý động cơ
curl -X POST http://localhost:5000/api/v1/calculation/motors/suggest \
  -H "Content-Type: application/json" \
  -d '{"Pt": 5.5, "n_iv": 70, "ratios": [2.5, 3.71, 1]}'

# Lấy danh sách vật liệu bánh răng
curl http://localhost:5000/api/v1/calculation/gears/materials
```

---

### Bước 3 — Setup UI_UX (Vite + React + TypeScript)

```bash
# Từ thư mục gốc DADN/
cd UI_UX

# Cài đặt dependencies (dùng pnpm vì project có pnpm-workspace.yaml)
pnpm install

# Nếu chưa cài pnpm:
npm install -g pnpm
pnpm install

# Tạo file cấu hình môi trường
cp .env.example .env.local
# Mở .env.local và sửa VITE_API_URL nếu server chạy trên port khác:
# VITE_API_URL=http://localhost:5000
```

```bash
# Chạy UI_UX dev server
pnpm dev

# Kết quả mong đợi:
# Local:   http://localhost:5173/
# Network: http://192.168.x.x:5173/
```

Mở trình duyệt vào `http://localhost:5173` để xem UI preview.

> 💡 **Lưu ý CORS:** Backend đã bật `cors()` nên UI_UX có thể gọi API không bị chặn. Nếu vẫn lỗi CORS khi deploy, kiểm tra cấu hình `cors({ origin: '*' })` trong `server.js`.

---

### Bước 4 — Setup Mobile App (React Native + Expo)

```bash
# Từ thư mục gốc DADN/
cd client

# Cài đặt dependencies
npm install --legacy-peer-deps

# Cấu hình IP Backend (quan trọng khi test trên điện thoại thật)
# Mở file: src/services/api.ts
# Sửa BASE_URL thành IP máy tính (dùng ipconfig / ip a để lấy IP)
# VD: const BASE_URL = "http://192.168.1.100:5000";

# Chạy Expo
npx expo start --tunnel

# Quét QR bằng app Expo Go trên điện thoại
```

---

### Bước 5 — Kiểm tra toàn bộ luồng

| STT | Test | Cách kiểm tra | Kết quả mong đợi |
|---|---|---|---|
| 1 | Backend khởi động | `npm run dev` trong `server/` | `Server is running on :5000` |
| 2 | Service tính toán | `node testModule2.js` | 4/5 test ✅ |
| 3 | API Động cơ | POST `/motors/suggest` với Pt=5.5, n_iv=70 | Danh sách 5+ động cơ |
| 4 | UI_UX preview | `pnpm dev` trong `UI_UX/` | Web UI hiển thị |
| 5 | UI→API kết nối | Nhập form InputScreen → bấm Calculate | Màn hình chọn động cơ thật |

---

## 6. Kết hợp với Module 1 qua Git

Module 1 (Auth, Database setup) đang ở branch `feat/login` và `feature/Server`.
Module 2 đang ở branch `feature/module2`.

### Cách merge Module 1 vào nhánh Module 2

```bash
# 1. Đảm bảo đang ở đúng branch Module 2
git checkout feature/module2
git status  # Phải clean (không có uncommitted changes)

# 2. Fetch toàn bộ remote branches mới nhất
git fetch origin

# 3. Merge nhánh Module 1 (chọn 1 trong 2 cách)
# CÁCH A: Merge từ feat/login (có Auth)
git merge origin/feat/login

# CÁCH B: Merge từ main (đã có Module 1 merge vào)
git merge origin/main

# 4. Xử lý conflict nếu có
# Các file thường conflict: server.js, package.json
# Luôn giữ PHẦN ĐĂNG KÝ ROUTE của cả 2:
#   app.use('/api/auth', require('./routes/authRoutes'));       ← Module 1
#   app.use('/api/v1/calculation', require('./routes/calculationRoutes'));  ← Module 2

# 5. Sau khi resolve conflict
git add .
git commit -m "chore: merge Module 1 auth into module2 branch"

# 6. Push lên remote
git push origin feature/module2
```

### Thêm JWT middleware để bảo vệ API Module 2

Sau khi merge Module 1, mở `server/routes/calculationRoutes.js` và bỏ comment dòng:

```js
// Bỏ comment dòng dưới đây SAU KHI đã merge Module 1:
const { protect } = require('../middlewares/authMiddleware');

// Thêm protect vào các route cần xác thực:
router.post('/motors/suggest',  protect, ctrl.suggestMotors);
router.post('/motors/select',   protect, ctrl.selectMotorAndCalculateShafts);
router.post('/belts/calculate', protect, ctrl.calculateBelt);
router.post('/gears/calculate', protect, ctrl.calculateGear);

// GET routes (danh sách catalogue) có thể để public:
router.get('/belts/sections',   ctrl.getBeltSections);
router.get('/gears/materials',  ctrl.getGearMaterials);
```

Và trong `UI_UX/src/services/calculationApi.ts`, bỏ comment dòng Authorization header:

```ts
// Bỏ comment sau khi tích hợp Module 1 (login/register):
Authorization: `Bearer ${localStorage.getItem("token")}`,
```

---

## 📝 Ghi chú kỹ thuật

### Sai số cho phép khi đối chiếu với sách giáo khoa
Các kết quả tính toán có thể lệch nhẹ so với thuyết minh tham khảo do:
- Hệ số hiệu suất tổng `η` có thể khác tùy cấu hình (HGT côn-trụ vs trụ-trụ).
- Chiều dài đai `L` phụ thuộc vào giá trị `a_sb` chọn theo kinh nghiệm kỹ sư — hệ thống dùng công thức `a/d₂ = 1.5` trong khi người thực hiện có thể chọn `a/d₂ = 1.1`.

Sai số **< 5% được coi là chấp nhận được** theo tiêu chuẩn thiết kế chi tiết máy.

### Mở rộng trong tương lai
- **Bánh răng côn (cấp nhanh):** Thêm `BevelGearService.js` với công thức theo Chương 7 SGK.
- **Trục & then:** Thêm `ShaftService.js` sau khi hoàn thiện Module 2.
- **Xuất PDF:** Tích hợp `pdfkit` vào một route `/export` để xuất thuyết minh.
