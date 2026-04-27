/**
 * MECHANICAL CONSTANTS & CATALOGUE DATA
 * Nguồn: Sách Thiết kế Chi tiết máy - Trịnh Chất & Lê Văn Uyển
 * Dành cho kiến trúc Hybrid Offline-First (Tính toán tại Client)
 */

// ============================================================
// A. DỮ LIỆU CATALOGUE ĐỘNG CƠ ĐIỆN 4A (Bảng P1.3 - SGK)
// Chọn loại: Động cơ 3 pha không đồng bộ roto ngắn mạch
// Đơn vị: P [kW], n [v/ph]
// ============================================================
export const MOTOR_CATALOGUE = [
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

export const EFFICIENCY = {
  belt_flat:    0.97, // Đai dẹt
  belt_vee:     0.96, // Đai thang (Đai hình thang)
  gear_spur:    0.98, // Bánh răng trụ
  gear_bevel:   0.97, // Bánh răng côn
  gear_helical: 0.98, // Bánh răng trụ răng nghiêng
  bearing_pair: 0.995,// Một cặp ổ lăn
  coupling:     0.99, // Khớp nối
};

export const TRANSMISSION_RATIO = {
  belt_vee:       { min: 2,  max: 4,  default: 2.5 },
  gear_spur:      { min: 2,  max: 5,  default: 3.0 },
  gear_bevel:     { min: 1,  max: 5,  default: 3.0 },
  gear_worm:      { min: 5,  max: 60, default: 20 },
  gearbox_2stage: { min: 8,  max: 40, default: 12 },
};

// Đai hình thang thường (ký hiệu theo ГОСТ, dùng phổ biến ở VN)
export const BELT_SECTIONS: Record<string, any> = {
  O:  { bt:  8.5, b: 10, h:  6,   y0: 2.1, A:   47, d1_range: [ 70, 140], L_range: [ 400,  2500], P0_ref: 0.96 },
  A:  { bt: 11,   b: 13, h:  8,   y0: 2.8, A:   81, d1_range: [100, 200], L_range: [ 560,  4000], P0_ref: 1.84 },
  B:  { bt: 14,   b: 17, h: 10.5, y0: 4.0, A:  138, d1_range: [140, 280], L_range: [ 800,  6300], P0_ref: 3.76 },
  C:  { bt: 19,   b: 22, h: 13.5, y0: 4.8, A:  230, d1_range: [200, 400], L_range: [1800, 10600], P0_ref: 7.64 },
  D:  { bt: 27,   b: 32, h: 19.0, y0: 6.9, A:  476, d1_range: [315, 630], L_range: [3150, 15000], P0_ref: 15.3 },
  E:  { bt: 32,   b: 38, h: 23.5, y0: 8.3, A:  692, d1_range: [500, 1000],L_range: [4500, 18000], P0_ref: 24.0 },
  F:  { bt: 42,   b: 50, h: 30,   y0: 11,  A: 1170, d1_range: [800, 1600],L_range: [6300, 18000], P0_ref: 38.0 },
  // Đai hình thang hẹp
  YO: { bt:  8.5, b: 10, h:  8,   y0: 2.0, A:   56, d1_range: [ 63, 180], L_range: [ 630,  3550], P0_ref: 1.46 },
  YA: { bt: 11,   b: 13, h: 10,   y0: 2.8, A:   95, d1_range: [ 90, 250], L_range: [ 800,  4500], P0_ref: 3.05 },
  YB: { bt: 14,   b: 17, h: 13,   y0: 3.5, A:  158, d1_range: [140, 200], L_range: [1250,  8000], P0_ref: 6.0  },
  YC: { bt: 19,   b: 22, h: 18,   y0: 4.8, A:  278, d1_range: [224, 315], L_range: [2000,  8000], P0_ref: 12.0 },
};

// Alias Latin-letter mapping (dùng khi nhập tiết diện bằng chữ cái Latin)
export const BELT_SECTION_ALIASES: Record<string, string> = {
  // 'B' Latin → 'Б', 'G' → 'Г', 'D' → 'Д'
  'B_lat': 'Б',
  'G':     'Г',
  'D':     'Д',
};

export const BELT_STANDARD_LENGTHS = [
  400, 450, 500, 560, 630, 710, 800, 900, 1000, 1120, 1250, 1400, 1600, 1800,
  2000, 2240, 2500, 2800, 3150, 3550, 4000, 4500, 5000, 5600, 6300, 7100,
  8000, 9000, 10000, 11200, 12500, 14000,
];

// Đường kính bánh đai tiêu chuẩn (mm) — ГОСТ / TCVN — theo mechanicalStandards.json
export const BELT_STANDARD_DIAMETERS = [
   63,  71,  80,  90, 100, 112, 125, 140, 160, 180,
  200, 224, 250, 280, 315, 355, 400, 450, 500, 560,
  630, 710, 800, 900, 1000, 1120, 1250, 1400, 1600, 1800,
  2000, 2240, 2500, 2800, 3150, 3550, 4000,
];

// Bảng hệ số góc ôm Cα (Ca) — Bảng 4.15 SGK — theo beltCalculationFactors.json
export const K_ALPHA_TABLE = [
  { alpha: 180, Ka: 1.00 },
  { alpha: 170, Ka: 0.98 },
  { alpha: 160, Ka: 0.95 },
  { alpha: 150, Ka: 0.92 },
  { alpha: 140, Ka: 0.89 },
  { alpha: 130, Ka: 0.86 },
  { alpha: 120, Ka: 0.82 },
  { alpha: 110, Ka: 0.78 },
  { alpha: 100, Ka: 0.73 },
  { alpha:  90, Ka: 0.68 },
  { alpha:  80, Ka: 0.62 },
  { alpha:  70, Ka: 0.56 },
];

// Bảng hệ số tải trọng động Kd — Bảng 4.7 SGK — theo beltCalculationFactors.json
// groupI = Động cơ điện 3 pha, động cơ đốt trong nhiều xi-lanh
// groupII = Động cơ đốt trong 1-2 xi-lanh
// Điều chỉnh theo số ca: ca 1 (+0), ca 2 (+0.1), ca 3 (+0.2)
export const KD_TABLE: Record<string, { groupI: number; groupII: number; label: string }> = {
  static_load:    { groupI: 1.00, groupII: 1.10, label: 'Tải trọng tĩnh, mở máy ≤120% tải danh nghĩa' },
  light_vibration:{ groupI: 1.10, groupII: 1.25, label: 'Tải trọng dao động nhẹ, mở máy ≤150%' },
  heavy_vibration:{ groupI: 1.25, groupII: 1.50, label: 'Tải trọng dao động mạnh, mở máy ≤200%' },
  shock_load:     { groupI: 1.55, groupII: 1.70, label: 'Tải trọng va đập, mở máy ≤300%' },
};

export const KD_SHIFT_ADJUSTMENT: Record<string, number> = {
  '1': 0.0,
  '2': 0.1,
  '3': 0.2,
};

/** Hàm tiện lợi: lấy Kd theo loại tải và số ca (mặc định groupI = động cơ điện) */
export function getKd(
  loadType: keyof typeof KD_TABLE = 'static_load',
  shifts: number = 1,
  group: 'groupI' | 'groupII' = 'groupI',
): number {
  const row = KD_TABLE[loadType] ?? KD_TABLE.static_load;
  const shiftKey = String(Math.min(Math.max(shifts, 1), 3)) as keyof typeof KD_SHIFT_ADJUSTMENT;
  return row[group] + (KD_SHIFT_ADJUSTMENT[shiftKey] ?? 0);
}

export const GEAR_MATERIALS = [
  {
    id: 'steel_45_normalized',
    name: 'Thép 45 - Thường hóa',
    HB: 200, HRC: null,
    sigma_b: 600, sigma_ch: 340,
    sigma_Hlim: 2 * 200 + 70,  // = 470 MPa
    sigma_Flim: 1.8 * 200,     // = 360 MPa
    s_H: 1.1, s_F: 1.75,
  },
  {
    id: 'steel_45_tempered',
    name: 'Thép 45 - Tôi cải thiện',
    HB: 230, HRC: null,
    sigma_b: 750, sigma_ch: 450,
    sigma_Hlim: 2 * 230 + 70,  // = 530 MPa
    sigma_Flim: 1.8 * 230,     // = 414 MPa
    s_H: 1.1, s_F: 1.75,
  },
  {
    id: 'steel_40X_tempered',
    name: 'Thép 40X - Tôi cải thiện',
    HB: 260, HRC: null,
    sigma_b: 850, sigma_ch: 650,
    sigma_Hlim: 2 * 260 + 70,  // = 590 MPa
    sigma_Flim: 1.8 * 260,     // = 468 MPa
    s_H: 1.1, s_F: 1.75,
  },
  {
    id: 'cast_iron_SCh20',
    name: 'Gang xám SCh20',
    HB: 190, HRC: null,
    sigma_b: 200, sigma_ch: null,
    sigma_Hlim: 2 * 190,       // ≈ 380 MPa
    sigma_Flim: 0.9 * 190,     // ≈ 171 MPa
    s_H: 1.1, s_F: 1.75,
  },
];

export const KA: Record<string, number> = {
  spur_symmetric: 49.5,  // Bánh răng trụ răng thẳng, bố trí đối xứng
  helical_symmetric: 43, // Bánh răng trụ răng nghiêng, đối xứng
  bevel_straight: 0.85,  // Bánh răng côn (dùng cho công thức Kd = f(Re))
};

export const PSI_BA: Record<string, any> = {
  symmetric:  { min: 0.3, max: 0.5, default: 0.4 },         // Có ổ hai bên, xa tải
  asymmetric: { min: 0.25, max: 0.4, default: 0.315 },      // Bất đối xứng
  cantilever: { min: 0.2, max: 0.25, default: 0.225 },      // Console
};

export const GEAR_CONSTANTS = {
  Z_M_steel_steel: 274,   // Hệ số cơ tính vật liệu ZM (thép-thép) [MPa^0.5]
  Z_H: 1.76,              // Hệ số dạng răng ZH (alpha_w = 20°, răng thẳng)
  K_H_base: 1.0,          // KH = KHα * KHβ * KHv (lấy sơ bộ)
  K_F_base: 1.0,          // KF = KFα * KFβ * KFv (lấy sơ bộ)
  K_Hbeta_symmetric: 1.02,
  K_Hbeta_asymmetric: 1.05,
  K_Hbeta_cantilever: 1.12,
};
