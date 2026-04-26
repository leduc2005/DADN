/**
 * MECHANICAL CONSTANTS & CATALOGUE DATA
 * Nguồn: Sách Thiết kế Chi tiết máy - Trịnh Chất & Lê Văn Uyển
 * Sử dụng cho Module 2: Tính toán động cơ, bộ truyền đai, bánh răng
 */

const { MOTOR_CATALOGUE } = require('../data/motorCatalogue');

// ============================================================
// B. HIỆU SUẤT CÁC BỘ TRUYỀN (Bảng 2.3 - SGK Trịnh Chất)
// ============================================================
const EFFICIENCY = {
  belt_flat:    0.97, // Đai dẹt
  belt_vee:     0.96, // Đai thang (Đai hình thang)
  gear_spur:    0.98, // Bánh răng trụ
  gear_bevel:   0.97, // Bánh răng côn
  gear_helical: 0.98, // Bánh răng trụ răng nghiêng
  bearing_pair: 0.995, // Một cặp ổ lăn
  coupling:     0.99,  // Khớp nối
};

// ============================================================
// C. TỈ SỐ TRUYỀN KHUYẾN NGHỊ (Bảng 2.4 - SGK)
// ============================================================
const TRANSMISSION_RATIO = {
  belt_vee:       { min: 2,  max: 4,  default: 2.5 },
  gear_spur:      { min: 2,  max: 5,  default: 3.0 },
  gear_bevel:     { min: 1,  max: 5,  default: 3.0 },
  gear_worm:      { min: 5,  max: 60, default: 20 },
  gearbox_2stage: { min: 8,  max: 40, default: 12 },
};

// ============================================================
// D. THÔNG SỐ ĐAI THANG THƯỜNG (Bảng 4.13 - SGK Trịnh Chất)
// bt: chiều rộng trên, b: chiều rộng đáy, h: chiều cao, y0: khoảng cách từ tâm đến đáy
// A: diện tích tiết diện [mm²], d1_range: đường kính bánh đai nhỏ [mm]
// L_range: chiều dài giới hạn [mm]
// ============================================================
const BELT_SECTIONS = {
  O: { bt: 8.5, b: 10, h: 6, y0: 2.1, A: 47, d1_range: [70, 140], L_range: [400, 2500] },
  A: { bt: 11, b: 13, h: 8, y0: 2.8, A: 81, d1_range: [100, 200], L_range: [560, 4000] },
  B: { bt: 14, b: 17, h: 10.5, y0: 4.0, A: 138, d1_range: [140, 280], L_range: [800, 6300] },
  C: { bt: 19, b: 22, h: 13.5, y0: 4.8, A: 230, d1_range: [200, 400], L_range: [1800, 10600] },
  D: { bt: 27, b: 32, h: 19, y0: 6.9, A: 476, d1_range: [315, 630], L_range: [3150, 15000] },
  E: { bt: 32, b: 38, h: 23.5, y0: 8.3, A: 692, d1_range: [500, 1000], L_range: [4500, 18000] },
  F: { bt: 42, b: 50, h: 30, y0: 11, A: 1170, d1_range: [800, 1600], L_range: [6300, 18000] },
};

// Dãy chiều dài đai thang tiêu chuẩn [mm] (Bảng 4.13)
const BELT_STANDARD_LENGTHS = [
  400, 425, 450, 475, 500, 530, 560, 600, 630, 670, 710, 750, 800, 850, 900,
  950, 1000, 1060, 1120, 1180, 1250, 1320, 1400, 1500, 1600, 1700, 1800, 1900,
  2000, 2120, 2240, 2360, 2500, 2650, 2800, 3000, 3150, 3350, 3550, 3750, 4000,
  4250, 4500, 4750, 5000, 5300, 5600, 6000, 6300, 6700, 7100, 7500, 8000, 8500,
  9000, 9500, 10000, 10600, 11200, 11800, 12500, 13200, 14000,
];

// Dãy đường kính bánh đai tiêu chuẩn [mm]
const BELT_STANDARD_DIAMETERS = [
  63, 71, 80, 90, 100, 112, 125, 140, 160, 180, 200, 224, 250, 280, 315,
  355, 400, 450, 500, 560, 630, 710, 800, 900, 1000,
];

// Hệ số Kα (góc ôm đai): tỉ lệ theo góc ôm (Bảng 4.15 - SGK)
// Nội suy tuyến tính nên lưu dưới dạng bảng tra
const K_ALPHA_TABLE = [
  { alpha: 180, Ka: 1.00 },
  { alpha: 170, Ka: 0.98 },
  { alpha: 160, Ka: 0.95 },
  { alpha: 150, Ka: 0.92 },
  { alpha: 140, Ka: 0.89 },
  { alpha: 130, Ka: 0.86 },
  { alpha: 120, Ka: 0.82 },
  { alpha: 110, Ka: 0.78 },
  { alpha: 100, Ka: 0.73 },
  { alpha: 90, Ka: 0.68 },
  { alpha: 80, Ka: 0.62 },
  { alpha: 70, Ka: 0.56 },
];

// Hệ số Cl theo tỉ số l / l0 (Bảng 4.16 - SGK)
const CL_TABLE = [
  { ratio: 0.5, Cl: 0.86 },
  { ratio: 0.6, Cl: 0.89 },
  { ratio: 0.8, Cl: 0.95 },
  { ratio: 1.0, Cl: 1.00 },
  { ratio: 1.2, Cl: 1.04 },
  { ratio: 1.4, Cl: 1.07 },
  { ratio: 1.6, Cl: 1.10 },
  { ratio: 1.8, Cl: 1.13 },
  { ratio: 2.0, Cl: 1.15 },
  { ratio: 2.4, Cl: 1.20 },
];

// Chiều dài thí nghiệm l0 dùng cùng Bảng 4.16 và 4.19
const BELT_LENGTH_REFERENCE = {
  O: 1320,
  A: 1700,
  B: 2240,
  C: 3750,
  D: 6000,
};

// Hệ số Cu theo tỉ số truyền u (Bảng 4.17 - SGK)
const CU_TABLE = [
  { u: 1.0, Cu: 1.00 },
  { u: 1.2, Cu: 1.07 },
  { u: 1.6, Cu: 1.11 },
  { u: 1.8, Cu: 1.12 },
  { u: 2.2, Cu: 1.13 },
  { u: 2.4, Cu: 1.135 },
  { u: 3.0, Cu: 1.14 },
];

// Bảng công suất cho phép cơ sở [P0] cho đai thang thường (Bảng 4.19 - SGK)
const P0_TABLE = {
  O: [
    { d1: 63, values: [{ v: 3, P0: 0.33 }, { v: 5, P0: 0.49 }, { v: 10, P0: 0.83 }, { v: 15, P0: 1.04 }, { v: 20, P0: 1.14 }] },
    { d1: 90, values: [{ v: 3, P0: 0.46 }, { v: 5, P0: 0.64 }, { v: 10, P0: 1.17 }, { v: 15, P0: 1.54 }, { v: 20, P0: 1.80 }, { v: 25, P0: 1.88 }] },
    { d1: 112, values: [{ v: 3, P0: 0.48 }, { v: 5, P0: 0.75 }, { v: 10, P0: 1.33 }, { v: 15, P0: 1.78 }, { v: 20, P0: 2.12 }, { v: 25, P0: 2.30 }] },
  ],
  A: [
    { d1: 112, values: [{ v: 3, P0: 0.70 }, { v: 5, P0: 1.08 }, { v: 10, P0: 1.85 }, { v: 15, P0: 2.40 }, { v: 20, P0: 2.73 }, { v: 25, P0: 2.85 }] },
    { d1: 125, values: [{ v: 3, P0: 0.78 }, { v: 5, P0: 1.17 }, { v: 10, P0: 2.00 }, { v: 15, P0: 2.75 }, { v: 20, P0: 3.08 }, { v: 25, P0: 3.26 }] },
    { d1: 140, values: [{ v: 3, P0: 0.80 }, { v: 5, P0: 1.25 }, { v: 10, P0: 2.20 }, { v: 15, P0: 2.92 }, { v: 20, P0: 3.44 }, { v: 25, P0: 3.75 }] },
    { d1: 160, values: [{ v: 3, P0: 0.84 }, { v: 5, P0: 1.32 }, { v: 10, P0: 2.34 }, { v: 15, P0: 3.14 }, { v: 20, P0: 3.78 }, { v: 25, P0: 4.09 }] },
    { d1: 180, values: [{ v: 3, P0: 0.88 }, { v: 5, P0: 1.38 }, { v: 10, P0: 2.47 }, { v: 15, P0: 3.37 }, { v: 20, P0: 4.06 }, { v: 25, P0: 4.46 }] },
  ],
  B: [
    { d1: 125, values: [{ v: 3, P0: 0.92 }, { v: 5, P0: 1.38 }, { v: 10, P0: 2.25 }, { v: 15, P0: 2.61 }] },
    { d1: 180, values: [{ v: 3, P0: 1.20 }, { v: 5, P0: 2.13 }, { v: 10, P0: 3.38 }, { v: 15, P0: 4.61 }, { v: 20, P0: 5.34 }, { v: 25, P0: 5.93 }] },
    { d1: 224, values: [{ v: 3, P0: 1.35 }, { v: 5, P0: 2.30 }, { v: 10, P0: 4.00 }, { v: 15, P0: 5.53 }, { v: 20, P0: 6.46 }, { v: 25, P0: 7.08 }] },
    { d1: 280, values: [{ v: 3, P0: 1.65 }, { v: 5, P0: 2.51 }, { v: 10, P0: 4.47 }, { v: 15, P0: 5.57 }, { v: 20, P0: 7.38 }, { v: 25, P0: 8.22 }] },
  ],
  C: [
    { d1: 200, values: [{ v: 3, P0: 1.83 }, { v: 5, P0: 2.73 }, { v: 10, P0: 4.55 }, { v: 15, P0: 5.75 }, { v: 20, P0: 6.28 }] },
    { d1: 250, values: [{ v: 3, P0: 2.30 }, { v: 5, P0: 3.54 }, { v: 10, P0: 6.02 }, { v: 15, P0: 8.00 }, { v: 20, P0: 9.23 }, { v: 25, P0: 9.69 }] },
    { d1: 280, values: [{ v: 3, P0: 2.46 }, { v: 5, P0: 3.77 }, { v: 10, P0: 6.59 }, { v: 15, P0: 8.82 }, { v: 20, P0: 10.27 }, { v: 25, P0: 11.00 }] },
    { d1: 315, values: [{ v: 3, P0: 2.63 }, { v: 5, P0: 3.88 }, { v: 10, P0: 7.39 }, { v: 15, P0: 9.71 }, { v: 20, P0: 11.33 }, { v: 25, P0: 12.27 }] },
    { d1: 355, values: [{ v: 3, P0: 2.84 }, { v: 5, P0: 4.29 }, { v: 10, P0: 7.57 }, { v: 15, P0: 10.51 }, { v: 20, P0: 12.42 }, { v: 25, P0: 13.63 }] },
    { d1: 450, values: [{ v: 3, P0: 3.08 }, { v: 5, P0: 4.74 }, { v: 10, P0: 8.54 }, { v: 15, P0: 11.53 }, { v: 20, P0: 14.15 }, { v: 25, P0: 15.62 }] },
  ],
  D: [
    { d1: 355, values: [{ v: 5, P0: 6.67 }, { v: 10, P0: 11.17 }, { v: 15, P0: 14.91 }, { v: 20, P0: 16.50 }, { v: 25, P0: 17.51 }] },
    { d1: 500, values: [{ v: 5, P0: 9.75 }, { v: 10, P0: 15.57 }, { v: 15, P0: 20.23 }, { v: 20, P0: 24.90 }, { v: 25, P0: 26.47 }] },
    { d1: 630, values: [{ v: 5, P0: 10.76 }, { v: 10, P0: 17.46 }, { v: 15, P0: 23.60 }, { v: 20, P0: 27.89 }, { v: 25, P0: 32.19 }] },
    { d1: 800, values: [{ v: 5, P0: 11.14 }, { v: 10, P0: 19.16 }, { v: 15, P0: 26.50 }, { v: 20, P0: 31.11 }, { v: 25, P0: 34.23 }] },
  ],
};

// Hệ số tải trọng động Kd (Bảng 4.7 - SGK)
// engine_type: 'electric' | 'combustion_single' | 'combustion_multi'
// load_type: 'smooth' | 'light_shock' | 'heavy_shock'
const KD_TABLE = {
  electric: { smooth: 1.0, light_shock: 1.1, heavy_shock: 1.2 },
  combustion_single: { smooth: 1.3, light_shock: 1.4, heavy_shock: 1.5 },
  combustion_multi:  { smooth: 1.1, light_shock: 1.2, heavy_shock: 1.3 },
};

// ============================================================
// E. VẬT LIỆU BÁNH RĂNG (Bảng 6.1 - 6.2 SGK Trịnh Chất)
// σ_Hlim: giới hạn bền mỏi tiếp xúc [MPa]
// σ_Flim: giới hạn bền mỏi uốn [MPa]
// s_H, s_F: hệ số an toàn
// HB: độ cứng HB (dùng khi HB ≤ 350)
// ============================================================
const GEAR_MATERIALS = [
  {
    id: 'steel_45_normalized',
    name: 'Thép 45 - Thường hóa',
    HB: 200, HRC: null,
    sigma_b: 600, sigma_ch: 340,
    sigma_Hlim: 2 * 200 + 70,  // = 470 MPa (công thức HB ≤ 350)
    sigma_Flim: 1.8 * 200,      // = 360 MPa
    s_H: 1.1, s_F: 1.75,
  },
  {
    id: 'steel_45_tempered',
    name: 'Thép 45 - Tôi cải thiện',
    HB: 230, HRC: null,
    sigma_b: 750, sigma_ch: 450,
    sigma_Hlim: 2 * 230 + 70,  // = 530 MPa
    sigma_Flim: 1.8 * 230,      // = 414 MPa
    s_H: 1.1, s_F: 1.75,
  },
  {
    id: 'steel_40X_tempered',
    name: 'Thép 40X - Tôi cải thiện',
    HB: 260, HRC: null,
    sigma_b: 850, sigma_ch: 650,
    sigma_Hlim: 2 * 260 + 70,  // = 590 MPa
    sigma_Flim: 1.8 * 260,      // = 468 MPa
    s_H: 1.1, s_F: 1.75,
  },
  {
    id: 'steel_40X_surf_hardened',
    name: 'Thép 40X - Tôi bề mặt HRC 50..54',
    HB: null, HRC: 52,
    sigma_b: 1000, sigma_ch: 800,
    sigma_Hlim: 17 * 52 + 200,  // = 1084 MPa (tôi bề mặt bằng dòng điện)
    sigma_Flim_override: 550,
    s_H: 1.2, s_F: 1.75,
  },
  {
    id: 'steel_45_case_hardened',
    name: 'Thép 45 - Thấm cacbon HRC 56..62',
    HB: null, HRC: 60,
    sigma_b: 800, sigma_ch: 650,
    sigma_Hlim: 23 * 60,        // = 1380 MPa
    sigma_Flim_override: 750,
    s_H: 1.2, s_F: 1.55,
  },
  {
    id: 'cast_iron_SCh20',
    name: 'Gang xám SCh20',
    HB: 190, HRC: null,
    sigma_b: 200, sigma_ch: null,
    sigma_Hlim: 2 * 190,        // ≈ 380 MPa
    sigma_Flim: 0.9 * 190,      // ≈ 171 MPa (công thức cho gang)
    s_H: 1.1, s_F: 1.75,
  },
];

// ============================================================
// F. HỆ SỐ KHA (Ka) VÀ PSIBA (ψba) - Bảng 6.5 SGK
// Ka phụ thuộc loại răng; ψba phụ thuộc vị trí ổ bi
// ============================================================
const KA = {
  spur_symmetric: 49.5,  // Bánh răng trụ răng thẳng, bố trí đối xứng
  helical_symmetric: 43, // Bánh răng trụ răng nghiêng, đối xứng
  bevel_straight: 0.85,  // Bánh răng côn (dùng cho công thức Kd = f(Re))
};

// ψba (Bảng 6.6 - SGK) theo vị trí ổ đỡ trục
// bearingPos: 'symmetric' | 'asymmetric_bearing' | 'cantilever'
const PSI_BA = {
  symmetric:  { min: 0.3, max: 0.5, default: 0.4 },         // Có ổ hai bên, xa tải
  asymmetric: { min: 0.25, max: 0.4, default: 0.315 },      // Bất đối xứng
  cantilever: { min: 0.2, max: 0.25, default: 0.225 },      // Console
};

// ============================================================
// G. CÁC HỆ SỐ KIỂM NGHIỆM BÁNH RĂNG (công thức 6.33, 6.43 SGK)
// ============================================================
const GEAR_CONSTANTS = {
  Z_M_steel_steel: 274,   // Hệ số cơ tính vật liệu ZM (thép-thép) [MPa^0.5]
  Z_H: 1.76,              // Hệ số dạng răng ZH (alpha_w = 20°, răng thẳng)
  K_H_base: 1.0,          // KH = KHα * KHβ * KHv (lấy sơ bộ)
  K_F_base: 1.0,          // KF = KFα * KFβ * KFv (lấy sơ bộ)
  // Hệ số tải trọng động (sơ bộ - có thể nội suy bảng 6.13, 6.14)
  K_Hbeta_symmetric: 1.02,
  K_Hbeta_asymmetric: 1.05,
  K_Hbeta_cantilever: 1.12,
};

module.exports = {
  MOTOR_CATALOGUE,
  EFFICIENCY,
  TRANSMISSION_RATIO,
  BELT_SECTIONS,
  BELT_STANDARD_LENGTHS,
  BELT_STANDARD_DIAMETERS,
  K_ALPHA_TABLE,
  CL_TABLE,
  BELT_LENGTH_REFERENCE,
  CU_TABLE,
  P0_TABLE,
  KD_TABLE,
  GEAR_MATERIALS,
  KA,
  PSI_BA,
  GEAR_CONSTANTS,
};
