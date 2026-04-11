/**
 * MECHANICAL CONSTANTS & CATALOGUE DATA
 * Nguồn: Sách Thiết kế Chi tiết máy - Trịnh Chất & Lê Văn Uyển
 * Sử dụng cho Module 2: Tính toán động cơ, bộ truyền đai, bánh răng
 */

// ============================================================
// A. DỮ LIỆU CATALOGUE ĐỘNG CƠ ĐIỆN 4A (Bảng P1.3 - SGK)
// Chọn loại: Động cơ 3 pha không đồng bộ roto ngắn mạch
// Đơn vị: P [kW], n [v/ph]
// ============================================================
const MOTOR_CATALOGUE = [
  // 1500 rpm sync (~1450 rpm actual) - 4 cực
  { model: '4A71B4Y3',  power: 0.55, speed: 1390, cosPhi: 0.70, eta: 70.0, Tk_Tdn: 2.0, Tmm_Tdn: 2.0 },
  { model: '4A80A4Y3',  power: 0.75, speed: 1430, cosPhi: 0.81, eta: 75.5, Tk_Tdn: 2.2, Tmm_Tdn: 2.0 },
  { model: '4A80B4Y3',  power: 1.10, speed: 1430, cosPhi: 0.83, eta: 77.0, Tk_Tdn: 2.2, Tmm_Tdn: 2.0 },
  { model: '4A90L4Y3',  power: 2.20, speed: 1435, cosPhi: 0.83, eta: 80.0, Tk_Tdn: 2.2, Tmm_Tdn: 2.0 },
  { model: '4A100L4Y3', power: 4.00, speed: 1430, cosPhi: 0.84, eta: 84.0, Tk_Tdn: 2.2, Tmm_Tdn: 2.0 },
  { model: '4A112M4Y3', power: 5.50, speed: 1445, cosPhi: 0.85, eta: 85.5, Tk_Tdn: 2.2, Tmm_Tdn: 2.0 },
  { model: '4A132S4Y3', power: 7.50, speed: 1455, cosPhi: 0.86, eta: 87.5, Tk_Tdn: 2.2, Tmm_Tdn: 2.2 },
  { model: '4A132M4Y3', power: 11.0, speed: 1460, cosPhi: 0.87, eta: 87.5, Tk_Tdn: 2.2, Tmm_Tdn: 2.2 },
  { model: '4A160S4Y3', power: 15.0, speed: 1465, cosPhi: 0.88, eta: 89.0, Tk_Tdn: 2.2, Tmm_Tdn: 2.2 },
  { model: '4A160M4Y3', power: 18.5, speed: 1465, cosPhi: 0.89, eta: 90.0, Tk_Tdn: 2.2, Tmm_Tdn: 2.2 },
  // 3000 rpm sync (~2900 rpm actual) - 2 cực
  { model: '4A80A2Y3',  power: 1.50, speed: 2850, cosPhi: 0.85, eta: 77.0, Tk_Tdn: 2.2, Tmm_Tdn: 2.0 },
  { model: '4A80B2Y3',  power: 2.20, speed: 2850, cosPhi: 0.87, eta: 80.0, Tk_Tdn: 2.2, Tmm_Tdn: 2.0 },
  { model: '4A90L2Y3',  power: 3.00, speed: 2850, cosPhi: 0.88, eta: 82.5, Tk_Tdn: 2.2, Tmm_Tdn: 2.0 },
  { model: '4A100S2Y3', power: 4.00, speed: 2880, cosPhi: 0.89, eta: 83.0, Tk_Tdn: 2.5, Tmm_Tdn: 2.0 },
  { model: '4A100L2Y3', power: 5.50, speed: 2880, cosPhi: 0.89, eta: 85.5, Tk_Tdn: 2.5, Tmm_Tdn: 2.0 },
  { model: '4A112M2Y3', power: 7.50, speed: 2922, cosPhi: 0.88, eta: 87.5, Tk_Tdn: 2.5, Tmm_Tdn: 2.0 },
  { model: '4A132M2Y3', power: 11.0, speed: 2930, cosPhi: 0.90, eta: 88.0, Tk_Tdn: 2.5, Tmm_Tdn: 2.0 },
  { model: '4A160S2Y3', power: 15.0, speed: 2940, cosPhi: 0.91, eta: 89.5, Tk_Tdn: 2.2, Tmm_Tdn: 2.0 },
  { model: '4A160M2Y3', power: 18.5, speed: 2940, cosPhi: 0.92, eta: 90.0, Tk_Tdn: 2.2, Tmm_Tdn: 2.0 },
  { model: '4A200M2Y3', power: 37.0, speed: 2950, cosPhi: 0.89, eta: 91.0, Tk_Tdn: 2.0, Tmm_Tdn: 2.0 },
];

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
// A: diện tích tiết diện [mm²], d1_min/d1_max: đường kính bánh đai nhỏ [mm]
// L_min/L_max: chiều dài giới hạn [mm], P0: công suất cơ sở [kW] tại n=960rpm (tra bảng)
// ============================================================
const BELT_SECTIONS = {
  O: { bt: 10, b: 13, h:  8, y0: 2.8, A:  47, d1_range: [63, 180],  L_range: [400,  2500], P0_ref: 0.96  },
  A: { bt: 13, b: 16, h: 10, y0: 3.3, A:  81, d1_range: [90, 220],  L_range: [560,  4000], P0_ref: 1.84  },
  B: { bt: 17, b: 19, h: 11, y0: 4.0, A: 138, d1_range: [140, 380], L_range: [800,  6300], P0_ref: 3.76  },
  C: { bt: 22, b: 22, h: 14, y0: 4.8, A: 230, d1_range: [200, 560], L_range: [1800, 10600], P0_ref: 7.64  },
  D: { bt: 32, b: 32, h: 19, y0: 6.0, A: 476, d1_range: [355, 600], L_range: [3150, 15000], P0_ref: 15.3  },
};

// Dãy chiều dài đai thang tiêu chuẩn [mm] (Bảng 4.13)
const BELT_STANDARD_LENGTHS = [
  400, 450, 500, 560, 630, 710, 800, 900, 1000, 1120, 1250, 1400, 1600, 1800,
  2000, 2240, 2500, 2800, 3150, 3550, 4000, 4500, 5000, 5600, 6300, 7100,
  8000, 9000, 10000, 11200, 12500, 14000,
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
  { alpha: 100, Ka: 0.74 },
];

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
    sigma_Hlim: 17 * 52,        // = 884 MPa (công thức HRC > 45)
    sigma_Flim: 1.8 * 52 * 10,  // sử dụng giá trị bảng ~ 500..600 (lấy 500 an toàn)
    sigma_Flim_override: 500,
    s_H: 1.2, s_F: 1.75,
  },
  {
    id: 'steel_45_case_hardened',
    name: 'Thép 45 - Thấm cacbon HRC 56..62',
    HB: null, HRC: 60,
    sigma_b: 800, sigma_ch: 650,
    sigma_Hlim: 23 * 60,        // = 1380 MPa
    sigma_Flim_override: 450,   // Lấy theo bảng
    s_H: 1.2, s_F: 1.75,
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
  KD_TABLE,
  GEAR_MATERIALS,
  KA,
  PSI_BA,
  GEAR_CONSTANTS,
};
