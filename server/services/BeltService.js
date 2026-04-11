/**
 * BeltService.js - Service tính toán Bộ truyền Đai thang
 * Module 2 - Giai đoạn 2: Thiết kế & kiểm nghiệm bộ truyền đai
 *
 * Nguồn công thức: Chương 4 - Sách Thiết kế Chi tiết máy (Trịnh Chất & Lê Văn Uyển)
 */

const {
  BELT_SECTIONS,
  BELT_STANDARD_LENGTHS,
  BELT_STANDARD_DIAMETERS,
  K_ALPHA_TABLE,
  KD_TABLE,
} = require('../utils/mechanicalConstants');

// ============================================================
// HÀM TIỆN ÍCH NỘI BỘ
// ============================================================

/**
 * Chọn tiết diện đai phù hợp với công suất và tốc độ (Hình 4.1 - SGK)
 * Dựa theo bảng tra công suất và tốc độ bánh dẫn
 */
function selectBeltSection(P_kW, n1_rpm) {
  // Logic đơn giản hóa dựa theo vùng P-n (hình 4.1 SGK)
  if (P_kW <= 1 && n1_rpm >= 400)     return 'O';
  if (P_kW <= 3.5 && n1_rpm >= 400)   return 'A';
  if (P_kW <= 10 && n1_rpm >= 300)    return 'B';
  if (P_kW <= 25)                      return 'C';
  return 'D';
}

/**
 * Lấy đường kính tiêu chuẩn gần nhất (≥ giá trị tính được) từ dãy tiêu chuẩn
 */
function pickStandardDiameter(d_calc) {
  return BELT_STANDARD_DIAMETERS.find(d => d >= d_calc) ?? BELT_STANDARD_DIAMETERS.at(-1);
}

/**
 * Lấy chiều dài đai tiêu chuẩn gần nhất (≥ L_calc)
 */
function pickStandardLength(L_calc) {
  return BELT_STANDARD_LENGTHS.find(L => L >= L_calc) ?? BELT_STANDARD_LENGTHS.at(-1);
}

/**
 * Nội suy hệ số Ka theo góc ôm α1 (Bảng 4.15 - SGK)
 */
function getKalpha(alpha1_deg) {
  if (alpha1_deg >= 180) return 1.0;
  if (alpha1_deg <= 100) return 0.74;

  const table = K_ALPHA_TABLE;
  for (let i = 0; i < table.length - 1; i++) {
    const hi = table[i], lo = table[i + 1];
    if (alpha1_deg <= hi.alpha && alpha1_deg >= lo.alpha) {
      // Nội suy tuyến tính
      const t = (alpha1_deg - lo.alpha) / (hi.alpha - lo.alpha);
      return parseFloat((lo.Ka + t * (hi.Ka - lo.Ka)).toFixed(4));
    }
  }
  return 1.0;
}

/**
 * Hệ số xét đến ảnh hưởng chiều dài đai KL (Bảng 4.16 - SGK)
 * Công thức gần đúng: KL = (L / L0)^(1/9) với L0 chuẩn theo loại đai
 */
function getKL(section, L_mm) {
  const L0_ref = { O: 1320, A: 1700, B: 2240, C: 3750, D: 4500 };
  const L0 = L0_ref[section] ?? 2240;
  return parseFloat(Math.pow(L_mm / L0, 1 / 9).toFixed(4));
}

/**
 * Hệ số xét đến ảnh hưởng tỉ số truyền Ku (Bảng 4.17 - SGK)
 */
function getKu(u_dai) {
  if (u_dai >= 3) return 1.14;
  if (u_dai >= 2) return 1.12;
  if (u_dai >= 1.5) return 1.09;
  if (u_dai >= 1.2) return 1.06;
  return 1.0;
}

/**
 * Hệ số điều chỉnh số đai Kz (Bảng 4.18 - SGK)
 * Tính sơ bộ z0 trước để lấy Kz
 */
function getKz(z_estimate) {
  if (z_estimate <= 2) return 1.0;
  if (z_estimate <= 3) return 0.95;
  if (z_estimate <= 4) return 0.90;
  if (z_estimate <= 5) return 0.85;
  return 0.80;
}

// ============================================================
// HÀM CÔNG KHAI
// ============================================================

/**
 * Thực hiện toàn bộ tính toán thiết kế bộ truyền đai thang
 *
 * Flow: d1 → d2 → a_sb → L_sb → L_chuẩn → a_thực → α1 → số đai z → lực đai
 *
 * @param {object} params
 *   @param {number} params.P1_kW   - Công suất trục vào bộ truyền đai [kW]
 *   @param {number} params.n1_rpm  - Số vòng quay bánh dẫn (trục động cơ) [v/ph]
 *   @param {number} params.u_dai   - Tỉ số truyền đai đã quyết định
 *   @param {string} [params.section] - Tiết diện đai ('O','A','B','C','D'), nếu null tự chọn
 *   @param {string} [params.engineType] - 'electric' | 'combustion_single' | 'combustion_multi'
 *   @param {string} [params.loadType]   - 'smooth' | 'light_shock' | 'heavy_shock'
 *   @param {number} [params.epsilon]    - Hệ số trượt đai (mặc định 0.01)
 * @returns {object} Kết quả thiết kế + trạng thái kiểm nghiệm
 */
function calculateBeltTransmission(params) {
  const {
    P1_kW,
    n1_rpm,
    u_dai,
    section: sectionInput = null,
    engineType = 'electric',
    loadType = 'smooth',
    epsilon = 0.01,
  } = params;

  // --- Bước 1: Chọn tiết diện đai ---
  const section = sectionInput ?? selectBeltSection(P1_kW, n1_rpm);
  const sectionData = BELT_SECTIONS[section];
  if (!sectionData) throw new Error(`Tiết diện đai '${section}' không hợp lệ`);

  // --- Bước 2: Chọn đường kính bánh dẫn d1 (lấy theo tiêu chuẩn) ---
  // Tính d1 sơ bộ từ công thức kinh nghiệm: d1 ≈ (5.2 ÷ 6.4) × cbrt(P/n)^(1/3) [mm]
  // Để đơn giản: lấy d1_min của tiết diện đã chọn, nội suy theo công suất
  const d1_calc = sectionData.d1_range[0];
  const d1 = pickStandardDiameter(d1_calc);

  // Kiểm tra vận tốc đai v ≤ 25 m/s
  const v_dai = parseFloat(((Math.PI * d1 * n1_rpm) / 60000).toFixed(3)); // [m/s]

  // --- Bước 3: Đường kính bánh bị dẫn d2 ---
  // d2 = u_dai * d1 * (1 - ε)   [mm]
  const d2_calc = u_dai * d1 * (1 - epsilon);
  const d2 = pickStandardDiameter(d2_calc);

  // Tỉ số truyền thực tế
  const u_actual = parseFloat((d2 / (d1 * (1 - epsilon))).toFixed(4));
  const u_error_percent = parseFloat((Math.abs(u_actual - u_dai) / u_dai * 100).toFixed(2));

  // --- Bước 4: Khoảng cách trục sơ bộ a_sb ---
  // Điều kiều: 0.55*(d1+d2) + h ≤ a ≤ 2*(d1+d2)
  // Chọn a dựa theo u_dai: nếu u ≈ 2.5 thì a/d2 ≈ 1.1
  // Chọn a_sb theo khuyến nghị SGK Bảng 4.14:
  // u ≥ 3: a/d2 ≈ 0.95; u ∈ [2,3): a/d2 ≈ 1.5; u < 2: a/d2 ≈ 1.5..2
  // Dùng công thức gợi ý: a_sb = 1.5 * d2 cho đai thang thông thường → L_sb lớn hơn → L_chuẩn đúng
  let a_multiplier;
  if (u_dai >= 3)      a_multiplier = 0.95;
  else if (u_dai >= 2) a_multiplier = 1.5;
  else                 a_multiplier = 2.0;

  const a_sb = parseFloat((a_multiplier * d2).toFixed(2));
  const a_min = 0.55 * (d1 + d2) + sectionData.h;
  const a_max = 2 * (d1 + d2);
  const a_sb_valid = a_sb >= a_min && a_sb <= a_max;

  // --- Bước 5: Chiều dài đai sơ bộ ---
  // L_sb = 2*a + π*(d1+d2)/2 + (d2-d1)²/(4*a)
  const L_sb = 2 * a_sb + (Math.PI * (d1 + d2)) / 2 + Math.pow(d2 - d1, 2) / (4 * a_sb);

  // Lấy chiều dài tiêu chuẩn
  const L = pickStandardLength(L_sb);

  // --- Bước 6: Khoảng cách trục thực tế ---
  // lambda = 2*L - π*(d1+d2)
  // a = [lambda + sqrt(lambda^2 - 8*(d2-d1)^2)] / 8
  const lambda = 2 * L - Math.PI * (d1 + d2);
  const discriminant = Math.pow(lambda, 2) - 8 * Math.pow(d2 - d1, 2);
  if (discriminant < 0) throw new Error('Không thể tính khoảng cách trục thực tế: discriminant âm');
  const a = parseFloat(((lambda + Math.sqrt(discriminant)) / 8).toFixed(2));

  // --- Bước 7: Kiểm tra góc ôm đai ---
  // α1 = 180° - (d2 - d1)/a * 57°    [độ]   (Công thức 4.7 - SGK)
  const alpha1_deg = parseFloat((180 - ((d2 - d1) / a) * 57).toFixed(2));
  const alpha1_pass = alpha1_deg >= 120; // Điều kiện: α ≥ 120°

  // --- Bước 8: Kiểm tra tuổi thọ (số lần uốn trong 1 giây) ---
  // i = v/L ≤ [i] = 10 (lần/s) - Bảng 4.14
  const bending_freq = parseFloat(((v_dai * 1000) / L).toFixed(4));
  const bending_freq_pass = bending_freq <= 10;

  // --- Bước 9: Xác định số đai ---
  // z = (Pct * Kd) / (P0 * Ka * KL * Ku * Kz)   [Công thức 4.16 - SGK]
  const Kd = KD_TABLE[engineType]?.[loadType] ?? 1.0;
  const Ka = getKalpha(alpha1_deg);
  const KL = getKL(section, L);
  const Ku = getKu(u_dai);
  const P0 = sectionData.P0_ref; // Công suất cho phép cơ sở

  // Tính sơ bộ z_estimate (với Kz = 1.0 trước)
  const z_estimate = Math.ceil((P1_kW * Kd) / (P0 * Ka * KL * Ku));
  const Kz = getKz(z_estimate);

  // Tính lại z chính xác
  const z_calc = (P1_kW * Kd) / (P0 * Ka * KL * Ku * Kz);
  const z = Math.ceil(z_calc); // Làm tròn lên số nguyên

  // --- Bước 10: Lực tác dụng lên bộ truyền đai ---
  // Lực căng ban đầu trên 1 đai:
  // F0 = σ0 * A = 1.5 * A_mm² (lấy σ0 ≈ 1.5 MPa cho đai thang)
  // Lực vòng:
  // Ft = 1000 * P1_kW / v_dai  [N]
  const Ft = parseFloat((1000 * P1_kW / v_dai).toFixed(2)); // Lực vòng [N]
  const F0 = parseFloat((sectionData.A * 1.5).toFixed(2));   // Lực căng ban đầu/đai [N]
  // Lực tổng tác dụng lên trục:
  // Fr = 2 * F0 * z * sin(α1/2)
  const Fr = parseFloat((2 * F0 * z * Math.sin((alpha1_deg / 2) * Math.PI / 180)).toFixed(2));

  const checks = {
    speed_pass: v_dai <= 25,      // v ≤ 25 m/s
    wrap_angle_pass: alpha1_pass, // α ≥ 120°
    bending_freq_pass,            // i ≤ 10 lần/s
    ratio_error_pass: u_error_percent <= 4, // Sai số tỉ số truyền ≤ 4%
  };
  const overall_pass = Object.values(checks).every(v => v === true);

  return {
    section,
    sectionData: { bt: sectionData.bt, b: sectionData.b, h: sectionData.h, A: sectionData.A },
    diameters: { d1, d2, d1_calc, d2_calc },
    belt: { L_sb: parseFloat(L_sb.toFixed(2)), L, a_sb, a },
    angles: { alpha1_deg },
    ratio: { u_dai_input: u_dai, u_actual, u_error_percent },
    belts: { z_calc: parseFloat(z_calc.toFixed(3)), z, Ka, KL, Ku, Kz, Kd, P0 },
    forces: { Ft, F0, Fr, v_dai },
    checks,
    overall_pass,
    warnings: overall_pass ? [] : Object.entries(checks).filter(([, v]) => !v).map(([k]) => k),
  };
}

/**
 * Lấy danh sách tiết diện đai có trong catalogue
 */
function getBeltSections() {
  return Object.entries(BELT_SECTIONS).map(([key, data]) => ({
    id: key,
    name: `Đai thang loại ${key}`,
    ...data,
  }));
}

module.exports = {
  calculateBeltTransmission,
  getBeltSections,
  // Export hàm nội bộ để viết unit test
  _selectBeltSection: selectBeltSection,
  _getKalpha: getKalpha,
};
