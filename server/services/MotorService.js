/**
 * MotorService.js - Service tính toán Động cơ điện
 * Module 2 - Giai đoạn 1: Chọn động cơ & tính momen xoắn
 *
 * Nguồn công thức: Chương 2 - Sách Thiết kế Chi tiết máy (Trịnh Chất & Lê Văn Uyển)
 */

const { MOTOR_CATALOGUE, EFFICIENCY } = require('../utils/mechanicalConstants');

/**
 * Tính công suất cần thiết trên trục động cơ
 *
 * Công thức (2.1 - SGK): Pct = Pt / η_chung
 * Công thức (2.2 - SGK): η_chung = η1 * η2 * ... * ηn
 *
 * @param {number} Pt - Công suất tính toán trên trục máy công tác [kW]
 * @param {object} systemConfig - Cấu hình hệ thống truyền động
 *   @param {string} systemConfig.transmissionType - Loại bộ truyền ngoài: 'belt_vee' | 'belt_flat'
 *   @param {string} systemConfig.gearboxType - Loại HGT: 'gear_spur' | 'gear_bevel' | 'gear_helical'
 *   @param {number} systemConfig.numGearStages - Số cấp bánh răng trong HGT (1 hoặc 2)
 *   @param {number} systemConfig.numBearingPairs - Tổng số cặp ổ lăn trong hệ (thường = numGearStages + 1)
 *   @param {boolean} systemConfig.hasCoupling - Có khớp nối không
 * @returns {{ Pct: number, eta_total: number, etaBreakdown: object }}
 */
function calculateRequiredPower(Pt, systemConfig) {
  const {
    transmissionType = 'belt_vee',
    gearboxType = 'gear_spur',
    numGearStages = 2,
    numBearingPairs = 3,
    hasCoupling = true,
  } = systemConfig;

  const eta_belt = EFFICIENCY[transmissionType] ?? EFFICIENCY.belt_vee;
  const eta_gear = EFFICIENCY[gearboxType] ?? EFFICIENCY.gear_spur;
  const eta_bearing = Math.pow(EFFICIENCY.bearing_pair, numBearingPairs);
  const eta_coupling = hasCoupling ? EFFICIENCY.coupling : 1.0;

  // η_chung = η_belt * η_gear^(numGearStages) * η_bearing * η_coupling
  const eta_gear_total = Math.pow(eta_gear, numGearStages);
  const eta_total = eta_belt * eta_gear_total * eta_bearing * eta_coupling;

  const Pct = Pt / eta_total;

  return {
    Pct: parseFloat(Pct.toFixed(4)),
    eta_total: parseFloat(eta_total.toFixed(6)),
    etaBreakdown: {
      eta_belt,
      eta_gear_per_stage: eta_gear,
      eta_gear_total: parseFloat(eta_gear_total.toFixed(6)),
      eta_bearing,
      eta_coupling,
    },
  };
}

/**
 * Xác định số vòng quay sơ bộ của động cơ
 *
 * Công thức (2.3 - SGK): n_sb = n_iv * u_t
 * Công thức (2.4 - SGK): u_t = u1 * u2 * ... (tích tỉ số truyền từng bộ)
 *
 * @param {number} n_iv - Số vòng quay trục máy công tác [v/ph]
 * @param {number[]} ratios - Mảng tỉ số truyền dự kiến của từng bộ truyền
 *                           Ví dụ: [2.5, 3.5, 3.0] = đai, br côn, br trụ
 * @returns {{ n_sb: number, u_total: number }}
 */
function calculateSynchronousSpeed(n_iv, ratios) {
  const u_total = ratios.reduce((acc, u) => acc * u, 1);
  const n_sb = n_iv * u_total;
  return {
    n_sb: parseFloat(n_sb.toFixed(2)),
    u_total: parseFloat(u_total.toFixed(4)),
  };
}

/**
 * Đề xuất danh sách động cơ phù hợp từ catalogue
 *
 * Điều kiện chọn (biểu thức 2.19 - SGK):
 *   - P_dc >= P_ct (công suất đủ dùng)
 *   - n_db xấp xỉ n_sb (số vòng quay đồng bộ gần n_sb)
 *   - T_mm/T_dn <= T_K/T_dn (điều kiện mở máy)
 *
 * @param {number} Pct - Công suất cần thiết [kW]
 * @param {number} n_sb - Số vòng quay sơ bộ [v/ph]
 * @param {number} [Tmm_over_T=1.3] - Yêu cầu momen khởi động / momen định mức của tải
 * @returns {object[]} Mảng các động cơ phù hợp, sắp xếp theo công suất tăng dần
 */
function suggestMotors(Pct, n_sb, Tmm_over_T = 1.3) {
  const candidates = MOTOR_CATALOGUE.filter(motor => {
    // Điều kiện 1: Công suất
    if (motor.power < Pct) return false;
    // Điều kiện 2: Số vòng quay xấp xỉ n_sb (±40%)
    if (motor.speed < n_sb * 0.60 || motor.speed > n_sb * 1.40) return false;
    // Điều kiện 3: Khả năng mở máy
    if (motor.Tmm_Tdn < Tmm_over_T) return false;
    return true;
  });

  // Sắp theo công suất tăng dần (ưu tiên nhỏ vừa đủ)
  candidates.sort((a, b) => a.power - b.power);
  return candidates;
}

/**
 * Phân phối tỉ số truyền sau khi đã chọn động cơ
 *
 * Công thức (2.5): u_t = n_dc / n_iv
 * Công thức (2.6): u_t = u_belt * u_gearbox
 *
 * @param {number} n_dc - Số vòng quay thực tế của động cơ đã chọn [v/ph]
 * @param {number} n_iv - Số vòng quay trục máy công tác [v/ph]
 * @param {number} u_belt - Tỉ số truyền bộ truyền đai (người dùng chọn)
 * @returns {{ u_total: number, u_gearbox: number }}
 */
function distributeTransmissionRatio(n_dc, n_iv, u_belt) {
  const u_total = n_dc / n_iv;
  const u_gearbox = u_total / u_belt;
  return {
    u_total: parseFloat(u_total.toFixed(4)),
    u_gearbox: parseFloat(u_gearbox.toFixed(4)),
    u_belt: parseFloat(u_belt.toFixed(4)),
  };
}

/**
 * Tính toán thông số động học & động lực học trên các trục
 *
 * Công thức tốc độ quay:
 *   n1 = n_dc / u_belt
 *   n2 = n1 / u_stage1  (trục trung gian)
 *   n3 = n2 / u_stage2  (trục ra HGT)
 *
 * Công suất trên trục (tính ngược từ tải):
 *   P3 = Pt / (η_coupling * η_bearing)         => trục ra HGT
 *   P2 = P3 / (η_gear * η_bearing)             => trục giữa HGT
 *   P1 = P2 / (η_gear * η_bearing)             => trục vào HGT
 *   Pdc = P1 / (η_belt * η_bearing)            => trục động cơ (kiểm tra)
 *
 * Momen xoắn (2.3.3 - SGK):
 *   Ti = 9.55 × 10^6 × Pi / ni   [N.mm]
 *
 * @param {object} params
 *   @param {number} params.Pt  - Công suất công tác [kW]
 *   @param {number} params.n_dc - Số vòng quay động cơ [v/ph]
 *   @param {number} params.u_belt  - Tỉ số truyền đai
 *   @param {number} params.u_stage1  - Tỉ số truyền cấp nhanh HGT
 *   @param {number} params.u_stage2  - Tỉ số truyền cấp chậm HGT (nếu 2 cấp, ngược lại = 1)
 *   @param {string} params.transmissionType - Loại đai ('belt_vee' | 'belt_flat')
 *   @param {string} params.gearboxType - Loại BR ('gear_spur' | 'gear_bevel' | 'gear_helical')
 * @returns {object} Dữ liệu chi tiết các trục
 */
function calculateShaftDynamics(params) {
  const {
    Pt,
    n_dc,
    u_belt,
    u_stage1,
    u_stage2 = 1,
    transmissionType = 'belt_vee',
    gearboxType = 'gear_spur',
  } = params;

  const eta_belt    = EFFICIENCY[transmissionType] ?? EFFICIENCY.belt_vee;
  const eta_gear    = EFFICIENCY[gearboxType]      ?? EFFICIENCY.gear_spur;
  const eta_bearing = EFFICIENCY.bearing_pair;
  const eta_coupling = EFFICIENCY.coupling;

  // --- Số vòng quay ---
  const n1 = parseFloat((n_dc / u_belt).toFixed(2));
  const n2 = parseFloat((n1 / u_stage1).toFixed(2));
  const n3 = parseFloat((n2 / u_stage2).toFixed(2));

  // --- Công suất (tính ngược từ công suất máy công tác, tính trên mỗi trục) ---
  const P3  = parseFloat((Pt / (eta_coupling * eta_bearing)).toFixed(4));           // Trục ra HGT
  const P2  = parseFloat((P3 / (eta_gear * eta_bearing)).toFixed(4));               // Trục giữa / vào cấp chậm
  const P1  = u_stage2 > 1
    ? parseFloat((P2 / (eta_gear * eta_bearing)).toFixed(4))                         // Trục vào cấp nhanh (2 cấp)
    : P2;
  const Pdc = parseFloat((P1 / (eta_belt * eta_bearing)).toFixed(4));               // Trục động cơ (validate)

  // --- Momen xoắn: Ti = 9.55e6 * Pi / ni [N.mm] ---
  const T_dc = parseFloat(((9.55e6 * Pdc) / n_dc).toFixed(2));
  const T1   = parseFloat(((9.55e6 * P1)  / n1).toFixed(2));
  const T2   = parseFloat(((9.55e6 * P2)  / n2).toFixed(2));
  const T3   = parseFloat(((9.55e6 * P3)  / n3).toFixed(2));

  return {
    shafts: {
      motor: { n: n_dc, P: Pdc, T: T_dc, label: 'Trục động cơ' },
      shaft1: { n: n1,  P: P1,  T: T1,  label: 'Trục vào HGT (Trục 1)' },
      shaft2: { n: n2,  P: P2,  T: T2,  label: 'Trục trung gian (Trục 2)' },
      shaft3: { n: n3,  P: P3,  T: T3,  label: 'Trục ra HGT (Trục 3)' },
    },
    ratios: { u_belt, u_stage1, u_stage2, u_total: u_belt * u_stage1 * u_stage2 },
  };
}

module.exports = {
  calculateRequiredPower,
  calculateSynchronousSpeed,
  suggestMotors,
  distributeTransmissionRatio,
  calculateShaftDynamics,
};
