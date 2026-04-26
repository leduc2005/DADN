/**
 * GearService.js - Service tính toán Bộ truyền Bánh răng trụ (răng thẳng / răng nghiêng)
 * Module 2 - Giai đoạn 3: Ứng suất cho phép, thiết kế và kiểm nghiệm bền bánh răng
 *
 * Phạm vi: Bánh răng trụ răng thẳng (spur gear) - áp dụng cho HGT 2 cấp.
 * Nguồn công thức: Chương 6 - Sách Thiết kế Chi tiết máy (Trịnh Chất & Lê Văn Uyển)
 */

const { GEAR_MATERIALS, KA, PSI_BA, GEAR_CONSTANTS } = require('../utils/mechanicalConstants');

// ============================================================
// HÀM TIỆN ÍCH NỘI BỘ
// ============================================================

/**
 * Dãy module tiêu chuẩn [mm] (Bảng 6.8 - SGK)
 */
const STANDARD_MODULES = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20];

function pickStandardModule(m_calc) {
  return STANDARD_MODULES.find(m => m >= m_calc) ?? STANDARD_MODULES.at(-1);
}

/**
 * Hệ số chiều rộng vành răng ψbd từ ψba:
 * ψbd = ψba * (u + 1) / 2    (Công thức 6.16 - SGK)
 */
function psi_bd_from_psi_ba(psi_ba, u) {
  return (psi_ba * (u + 1)) / 2;
}

/**
 * Hệ số đường kính dọc trục  Z_ε cho bánh răng trụ răng thẳng (ε_α ≈ 1.7):
 * Z_ε = sqrt(1 / ε_α)  trong đó ε_α = [1.88 - 3.2*(1/z1 + 1/z2)] (gần đúng 1.7)
 * Tính chính xác sau khi biết z1, z2
 */
function calc_Z_epsilon(z1, z2) {
  const eps_alpha = 1.88 - 3.2 * (1 / z1 + 1 / z2);
  return parseFloat(Math.sqrt(1 / eps_alpha).toFixed(4));
}

/**
 * Hệ số dạng răng YF (Bảng 6.18 - SGK) - tính theo số răng tương đương zv = z
 * Logic: nội suy đơn giản hóa từ bảng
 */
function calc_YF(z) {
  if (z <= 17)  return 4.28;
  if (z <= 20)  return 4.07;
  if (z <= 25)  return 3.90;
  if (z <= 30)  return 3.80;
  if (z <= 40)  return 3.70;
  if (z <= 50)  return 3.65;
  if (z <= 60)  return 3.62;
  if (z <= 80)  return 3.61;
  if (z <= 100) return 3.60;
  return 3.60;
}

/**
 * Hệ số trùng khớp uốn Y_ε = 1/ε_α
 */
function calc_Y_epsilon(z1, z2) {
  const eps_alpha = 1.88 - 3.2 * (1 / z1 + 1 / z2);
  return parseFloat((1 / eps_alpha).toFixed(4));
}

/**
 * Vật liệu: tính σ_Hlim và σ_Flim từ dữ liệu vật liệu
 */
function getMaterialProps(matId) {
  const mat = GEAR_MATERIALS.find(m => m.id === matId);
  if (!mat) throw new Error(`Vật liệu '${matId}' không tồn tại trong catalogue.`);
  const sigma_Flim = mat.sigma_Flim_override ?? mat.sigma_Flim;
  return { ...mat, sigma_Flim };
}

// ============================================================
// HÀM CÔNG KHAI
// ============================================================

/**
 * Lấy danh sách vật liệu bánh răng
 */
function getGearMaterials() {
  return GEAR_MATERIALS.map(m => ({
    id: m.id,
    name: m.name,
    HB: m.HB,
    HRC: m.HRC,
    sigma_b: m.sigma_b,
  }));
}

/**
 * Tính ứng suất tiếp xúc và uốn cho phép
 *
 * Công thức đầy đủ theo tài liệu:
 *   [σH] = (σ⁰Hlim / sH) × ZR × Zv × KxH × KHL
 *   [σF] = (σ⁰Flim / sF) × YR × YS × KxF × KFC × KFL
 *
 * Với hệ số tuổi thọ:
 *   KHL = max(1, (N_HO / N_HE)^(1/6))  (bánh răng HB ≤ 350)
 *   KFL = max(1, (N_FO / N_FE)^(1/9))  (bánh răng HB ≤ 350)
 *   N_HO = 30 * HB^2.4   (số chu kỳ cơ sở - Công thức 6.5)
 *
 * @param {string} mat1Id - ID vật liệu bánh dẫn (z1)
 * @param {string} mat2Id - ID vật liệu bánh bị dẫn (z2)
 * @param {number} n1_rpm - Tốc độ bánh dẫn [v/ph]
 * @param {number} u      - Tỉ số truyền cấp đang tính
 * @param {number} L_hours - Tuổi thọ làm việc [giờ]
 * @param {object} [loadProfile] - Chế độ tải: { T1_ratio: 1, T2_ratio:0.6, t1:0.5, t2:0.5 }
 * Giai đoạn hiện tại vẫn dùng tính sơ bộ nên các hệ số công nghệ/môi trường mặc định = 1.0.
 *
 * @param {object} [factors] - Các hệ số mở rộng của công thức đầy đủ
 * @returns {object} Ứng suất cho phép các bánh
 */
function calculateAllowableStress(mat1Id, mat2Id, n1_rpm, u, L_hours, loadProfile = null, factors = {}) {
  const mat1 = getMaterialProps(mat1Id);
  const mat2 = getMaterialProps(mat2Id);
  const {
    ZR = 1.0,
    Zv = 1.0,
    KxH = 1.0,
    YR = 1.0,
    YS = 1.0,
    KxF = 1.0,
    KFC = 1.0,
  } = factors;

  const n2_rpm = n1_rpm / u;

  // Số chu kỳ làm việc thực tế NFE, NHE (tải thay đổi hoặc không thay đổi)
  // Nếu không có loadProfile: coi tải không đổi -> NHE = 60 * n * Lh
  const computeNHE = (n_rpm) => {
    if (!loadProfile) {
      return 60 * n_rpm * L_hours;
    }
    // Σ [(Ti/Tmax)^3 * (ni/n1) * (ti/tmax)] * 60 * n_rpm * Lh
    const { T1_ratio = 1, T2_ratio = 0.6, t1 = 0.5, t2 = 0.5 } = loadProfile;
    const factor = Math.pow(T1_ratio, 3) * t1 + Math.pow(T2_ratio, 3) * t2;
    return factor * 60 * n_rpm * L_hours;
  };

  const computeNFE = (n_rpm) => {
    if (!loadProfile) {
      return 60 * n_rpm * L_hours;
    }
    const { T1_ratio = 1, T2_ratio = 0.6, t1 = 0.5, t2 = 0.5 } = loadProfile;
    const factor = Math.pow(T1_ratio, 9) * t1 + Math.pow(T2_ratio, 9) * t2; // mF = 9
    return factor * 60 * n_rpm * L_hours;
  };

  const computeNHO = (HB) => HB ? 30 * Math.pow(HB, 2.4) : 70e6; // HRC hardened
  const NFO = 4e6; // Số chu kỳ tiếp xúc cơ sở uốn (luôn = 4×10^6)

  // NHE, NFE cho bánh 1 và 2
  const NHE1 = computeNHE(n1_rpm), NHE2 = computeNHE(n2_rpm);
  const NFE1 = computeNFE(n1_rpm), NFE2 = computeNFE(n2_rpm);
  const NHO1 = computeNHO(mat1.HB), NHO2 = computeNHO(mat2.HB);

  // Hệ số tuổi thọ KHL (mH = 6 khi HB ≤ 350)
  const KHL1 = NHE1 < NHO1 ? parseFloat(Math.pow(NHO1 / NHE1, 1 / 6).toFixed(4)) : 1.0;
  const KHL2 = NHE2 < NHO2 ? parseFloat(Math.pow(NHO2 / NHE2, 1 / 6).toFixed(4)) : 1.0;

  // Hệ số tuổi thọ KFL (mF = 9 khi HB ≤ 350)
  const KFL1 = NFE1 < NFO ? parseFloat(Math.pow(NFO / NFE1, 1 / 9).toFixed(4)) : 1.0;
  const KFL2 = NFE2 < NFO ? parseFloat(Math.pow(NFO / NFE2, 1 / 9).toFixed(4)) : 1.0;

  const sigmaH1_allow = parseFloat((((mat1.sigma_Hlim / mat1.s_H) * ZR * Zv * KxH * KHL1)).toFixed(2));
  const sigmaH2_allow = parseFloat((((mat2.sigma_Hlim / mat2.s_H) * ZR * Zv * KxH * KHL2)).toFixed(2));
  // [σH] lấy giá trị nhỏ hơn của hai bánh
  const sigmaH_allow  = Math.min(sigmaH1_allow, sigmaH2_allow);

  const sigmaF1_allow = parseFloat((((mat1.sigma_Flim / mat1.s_F) * YR * YS * KxF * KFC * KFL1)).toFixed(2));
  const sigmaF2_allow = parseFloat((((mat2.sigma_Flim / mat2.s_F) * YR * YS * KxF * KFC * KFL2)).toFixed(2));

  return {
    gear1: { material: mat1.name, sigma_Hlim: mat1.sigma_Hlim, sigma_Flim: mat1.sigma_Flim, KHL: KHL1, KFL: KFL1, sigmaH_allow: sigmaH1_allow, sigmaF_allow: sigmaF1_allow },
    gear2: { material: mat2.name, sigma_Hlim: mat2.sigma_Hlim, sigma_Flim: mat2.sigma_Flim, KHL: KHL2, KFL: KFL2, sigmaH_allow: sigmaH2_allow, sigmaF_allow: sigmaF2_allow },
    factors: { ZR, Zv, KxH, YR, YS, KxF, KFC },
    sigmaH_allow, // Dùng cho bước thiết kế
    sigmaF1_allow,
    sigmaF2_allow,
  };
}

/**
 * Tính sơ bộ khoảng cách trục a_w (Công thức 6.15a - SGK)
 *
 * aw = Ka * (u ± 1) * ∛(T1 * K_Hβ / ([σH]² * u * ψ_ba))   [mm]
 *
 * @param {number} T1_Nmm       - Momen xoắn bánh dẫn [N.mm]
 * @param {number} u            - Tỉ số truyền cấp đang tính
 * @param {number} sigmaH_allow - Ứng suất tiếp xúc cho phép [MPa]
 * @param {string} gearType     - 'spur_symmetric' | 'helical_symmetric'
 * @param {string} bearingPos   - 'symmetric' | 'asymmetric' | 'cantilever'
 * @param {string} [sign='+'  ] - '+' cho BR ngoài, '-' cho BR trong
 * @returns {{ aw: number, aw_rounded: number, psi_ba: number, psi_bd: number }}
 */
function calculatePreliminaryDistance(T1_Nmm, u, sigmaH_allow, gearType = 'spur_symmetric', bearingPos = 'symmetric', sign = '+') {
  const Ka = KA[gearType] ?? KA.spur_symmetric;
  const psi_ba = PSI_BA[bearingPos]?.default ?? 0.4;
  const K_Hbeta = GEAR_CONSTANTS[`K_Hbeta_${bearingPos}`] ?? GEAR_CONSTANTS.K_Hbeta_symmetric;

  const sign_val = sign === '+' ? 1 : -1;
  const u_sign = u + sign_val;

  // aw = Ka * (u ± 1) * ∛(T1 * K_Hβ / (σH² * u * ψ_ba))
  const inner = (T1_Nmm * K_Hbeta) / (Math.pow(sigmaH_allow, 2) * u * psi_ba);
  const aw_raw = Ka * u_sign * Math.pow(inner, 1 / 3);
  // Làm tròn lên bội số của 5
  const aw_rounded = Math.ceil(aw_raw / 5) * 5;

  const psi_bd = psi_bd_from_psi_ba(psi_ba, u);

  return {
    aw: parseFloat(aw_raw.toFixed(2)),
    aw_rounded,
    Ka, K_Hbeta,
    psi_ba: parseFloat(psi_ba.toFixed(4)),
    psi_bd: parseFloat(psi_bd.toFixed(4)),
  };
}

/**
 * Xác định thông số ăn khớp: module, số răng, đường kính
 *
 * Bước thực hiện:
 *   m ≈ (0.01 ÷ 0.02) * aw  → chọn m tiêu chuẩn
 *   z1 = 2*aw*cosβ / (m*(u+1)) → làm tròn xuống
 *   z2 = u * z1              → làm tròn gần nhất, kiểm tra lại u_actual
 *   aw_actual = m*(z1+z2)/2  (Bánh răng trụ thẳng, dịch chỉnh bằng 0)
 *   dw1 = 2*aw/(u_actual+1); dw2 = dw1 * u_actual
 *
 * @param {number} aw  - Khoảng cách trục đã làm tròn [mm]
 * @param {number} u   - Tỉ số truyền
 * @param {string} [sign] - '+' bánh ngoài
 * @param {number} [beta_rad=0] - Góc nghiêng răng [rad]
 * @returns {object} Thông số ăn khớp
 */
function selectGearParameters(aw, u, sign = '+', beta_rad = 0) {
  // Module sơ bộ m_n ∈ [0.01, 0.02] * aw
  const m_sb_min = 0.01 * aw;
  const m_sb_max = 0.02 * aw;
  const m_n = pickStandardModule((m_sb_min + m_sb_max) / 2); // lấy module ứng với trung bình

  // Số răng bánh dẫn z1
  const sign_val = sign === '+' ? 1 : -1;
  const z1_raw = (2 * aw * Math.cos(beta_rad)) / (m_n * (u + sign_val));
  const z1 = Math.floor(z1_raw); // Lấy số nguyên
  if (z1 < 17) {
    // Cảnh báo: có thể phát sinh cắt chân răng
    console.warn(`[GearService] Cảnh báo z1 = ${z1} < 17, kiểm tra dịch chỉnh!`);
  }
  const z2 = Math.round(u * z1);
  const u_actual = parseFloat((z2 / z1).toFixed(4));
  const u_error_pct = parseFloat((Math.abs(u_actual - u) / u * 100).toFixed(2));

  // Khoảng cách trục thực tế (không dịch chỉnh)
  const aw_actual = parseFloat(((m_n * (z1 + z2)) / 2).toFixed(2));

  // Đường kính vòng lăn tách riêng để dùng cho kiểm nghiệm bền.
  const dw1 = parseFloat(((2 * aw) / (u_actual + sign_val)).toFixed(2));
  const dw2 = parseFloat((dw1 * u_actual).toFixed(2));

  // Đường kính vòng chia d = m*z
  const d1 = parseFloat((m_n * z1).toFixed(2));
  const d2 = parseFloat((m_n * z2).toFixed(2));
  // Đường kính đỉnh răng da = d + 2m
  const da1 = parseFloat((d1 + 2 * m_n).toFixed(2));
  const da2 = parseFloat((d2 + 2 * m_n).toFixed(2));
  // Đường kính chân răng df = d - 2.5m
  const df1 = parseFloat((d1 - 2.5 * m_n).toFixed(2));
  const df2 = parseFloat((d2 - 2.5 * m_n).toFixed(2));
  // Chiều rộng vành răng bw = ψba * aw
  // ψba lấy từ bước trước (truyền vào hoặc dùng default)
  const bw = null; // Sẽ được tính ở bước calculateGearGeometry

  return {
    m_n, m_sb_range: [parseFloat(m_sb_min.toFixed(3)), parseFloat(m_sb_max.toFixed(3))],
    z1, z2,
    u_input: u, u_actual, u_error_pct,
    aw_input: aw, aw_actual,
    beta_rad: parseFloat(beta_rad.toFixed(6)),
    beta_deg: parseFloat((beta_rad * 180 / Math.PI).toFixed(4)),
    dw1, dw2,
    d1, d2, d_w1: dw1, d_w2: dw2, da1, da2, df1, df2,
  };
}

/**
 * Kiểm nghiệm độ bền tiếp xúc (Công thức 6.33 - SGK)
 *
 * σH = ZM * ZH * Zε * sqrt(2*T1*KH*(u+1) / (bw*d_w1²*u)) ≤ [σH]
 *
 * @param {object} geomParams - Kết quả từ selectGearParameters()
 * @param {number} T1_Nmm    - Moment xoắn trục 1 [N.mm]
 * @param {number} u          - Tỉ số truyền thực tế
 * @param {number} bw_mm      - Chiều rộng vành răng [mm]
 * @param {number} sigmaH_allow - Ứng suất tiếp xúc cho phép [MPa]
 * @returns {{ sigma_H: number, pass: boolean }}
 */
function checkContactStrength(geomParams, T1_Nmm, u, bw_mm, sigmaH_allow) {
  const { z1, z2 } = geomParams;
  const dw1 = geomParams.dw1 ?? geomParams.d_w1;
  const Z_M = GEAR_CONSTANTS.Z_M_steel_steel; // 274 MPa^0.5
  const Z_H = GEAR_CONSTANTS.Z_H;             // 1.76 (α=20°, răng thẳng)
  const Z_eps = calc_Z_epsilon(z1, z2);
  const K_H = GEAR_CONSTANTS.K_H_base;        // Lấy sơ bộ (≈ 1.0 để test, sẽ nội suy bảng sau)

  // σH = ZM * ZH * Zε * sqrt(2*T1*KH*(u+1)/ (bw*dw1²*u))
  const inner = (2 * T1_Nmm * K_H * (u + 1)) / (bw_mm * Math.pow(dw1, 2) * u);
  const sigma_H = parseFloat((Z_M * Z_H * Z_eps * Math.sqrt(inner)).toFixed(2));

  return {
    sigma_H,
    sigma_H_allow: sigmaH_allow,
    Z_M, Z_H, Z_eps, K_H,
    pass: sigma_H <= sigmaH_allow,
    margin_pct: parseFloat(((sigmaH_allow - sigma_H) / sigmaH_allow * 100).toFixed(1)),
  };
}

/**
 * Kiểm nghiệm độ bền uốn (Công thức 6.43 - SGK)
 *
 * σF = 2*T1*KF*Yε*YF / (bw * d_w1 * m_n) ≤ [σF]
 *
 * @param {object} geomParams  - Kết quả từ selectGearParameters()
 * @param {number} T1_Nmm      - Moment xoắn trục 1 [N.mm]
 * @param {number} u            - Tỉ số truyền thực tế
 * @param {number} bw_mm        - Chiều rộng vành răng [mm]
 * @param {number} sigmaF1_allow - Ứng suất uốn cho phép bánh 1 [MPa]
 * @param {number} sigmaF2_allow - Ứng suất uốn cho phép bánh 2 [MPa]
 * @returns {{ sigma_F1, sigma_F2, pass1, pass2 }}
 */
function checkBendingStrength(geomParams, T1_Nmm, u, bw_mm, sigmaF1_allow, sigmaF2_allow) {
  const { m_n, z1, z2 } = geomParams;
  const dw1 = geomParams.dw1 ?? geomParams.d_w1;
  const K_F = GEAR_CONSTANTS.K_F_base;
  const Y_eps = calc_Y_epsilon(z1, z2);
  const Y_F1 = calc_YF(z1);
  const Y_F2 = calc_YF(z2);
  const Y_beta = 1.0; // Răng thẳng β = 0°

  // σF1 chính xác: Công thức 6.43a
  const base = (2 * T1_Nmm * K_F * Y_eps * Y_beta) / (bw_mm * dw1 * m_n);
  const sigma_F1 = parseFloat((base * Y_F1).toFixed(2));
  const sigma_F2 = parseFloat((sigma_F1 * Y_F2 / Y_F1).toFixed(2)); // 6.43b: σF2 = σF1*YF2/YF1

  return {
    sigma_F1, sigma_F2,
    sigma_F1_allow: sigmaF1_allow, sigma_F2_allow: sigmaF2_allow,
    Y_eps, Y_F1, Y_F2, K_F,
    pass1: sigma_F1 <= sigmaF1_allow,
    pass2: sigma_F2 <= sigmaF2_allow,
    margin1_pct: parseFloat(((sigmaF1_allow - sigma_F1) / sigmaF1_allow * 100).toFixed(1)),
    margin2_pct: parseFloat(((sigmaF2_allow - sigma_F2) / sigmaF2_allow * 100).toFixed(1)),
  };
}

/**
 * FULL PIPELINE: Tính toán và kiểm nghiệm hoàn chỉnh bánh răng trụ
 *
 * @param {object} params
 *   @param {string} params.mat1Id       - Vật liệu bánh dẫn
 *   @param {string} params.mat2Id       - Vật liệu bánh bị dẫn
 *   @param {number} params.T1_Nmm       - Momen xoắn bánh dẫn [N.mm]
 *   @param {number} params.n1_rpm       - Tốc độ bánh dẫn [v/ph]
 *   @param {number} params.u            - Tỉ số truyền
 *   @param {number} params.L_hours      - Tuổi thọ [giờ]
 *   @param {string} [params.gearType]   - 'spur_symmetric'
 *   @param {string} [params.bearingPos] - 'symmetric' | 'asymmetric' | 'cantilever'
 *   @param {number} [params.beta_deg=0] - Góc nghiêng răng [độ]
 *   @param {number} [params.beta_rad]   - Góc nghiêng răng [rad], ưu tiên nếu có
 * @returns {object} Kết quả đầy đủ + trạng thái kiểm nghiệm
 */
function calculateGearFull(params) {
  const {
    mat1Id,
    mat2Id,
    T1_Nmm,
    n1_rpm,
    u,
    L_hours,
    gearType = 'spur_symmetric',
    bearingPos = 'symmetric',
    loadProfile = null,
    beta_deg = 0,
    beta_rad = null,
    ZR = 1.0,
    Zv = 1.0,
    KxH = 1.0,
    YR = 1.0,
    YS = 1.0,
    KxF = 1.0,
    KFC = 1.0,
  } = params;

  const betaRad = beta_rad ?? (beta_deg * Math.PI / 180);
  const stressFactors = { ZR, Zv, KxH, YR, YS, KxF, KFC };

  // --- Bước 1: Ứng suất cho phép ---
  const stressResult = calculateAllowableStress(mat1Id, mat2Id, n1_rpm, u, L_hours, loadProfile, stressFactors);

  // --- Bước 2: Khoảng cách trục sơ bộ ---
  const distResult = calculatePreliminaryDistance(T1_Nmm, u, stressResult.sigmaH_allow, gearType, bearingPos);
  const aw = distResult.aw_rounded;

  // --- Bước 3: Thông số ăn khớp ---
  const geomResult = selectGearParameters(aw, u, '+', betaRad);

  // Chiều rộng vành răng bw = ψba * aw [mm]
  const bw = parseFloat((distResult.psi_ba * aw).toFixed(2));

  // --- Bước 4: Kiểm nghiệm tiếp xúc ---
  const contactCheck = checkContactStrength(geomResult, T1_Nmm, geomResult.u_actual, bw, stressResult.sigmaH_allow);

  // --- Bước 5: Kiểm nghiệm uốn ---
  const bendingCheck = checkBendingStrength(geomResult, T1_Nmm, geomResult.u_actual, bw, stressResult.sigmaF1_allow, stressResult.sigmaF2_allow);

  const overall_pass = contactCheck.pass && bendingCheck.pass1 && bendingCheck.pass2;

  return {
    step1_allowableStress: stressResult,
    step2_preliminaryDistance: distResult,
    step3_gearParameters: { ...geomResult, bw },
    step4_contactCheck: contactCheck,
    step5_bendingCheck: bendingCheck,
    overall_pass,
    verdict: overall_pass ? 'ĐẠT - Bánh răng đủ bền' : 'KHÔNG ĐẠT - Cần điều chỉnh vật liệu hoặc thông số',
    warnings: [
      ...(contactCheck.pass ? [] : [`Độ bền tiếp xúc không đạt: σH=${contactCheck.sigma_H} > [σH]=${stressResult.sigmaH_allow}`]),
      ...(bendingCheck.pass1 ? [] : [`Độ bền uốn bánh 1 không đạt: σF1=${bendingCheck.sigma_F1} > [σF1]=${stressResult.sigmaF1_allow}`]),
      ...(bendingCheck.pass2 ? [] : [`Độ bền uốn bánh 2 không đạt: σF2=${bendingCheck.sigma_F2} > [σF2]=${stressResult.sigmaF2_allow}`]),
    ],
  };
}

module.exports = {
  getGearMaterials,
  calculateAllowableStress,
  calculatePreliminaryDistance,
  selectGearParameters,
  checkContactStrength,
  checkBendingStrength,
  calculateGearFull,
};
