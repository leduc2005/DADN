/**
 * calc_gear.ts - Service tính toán Bộ truyền Bánh răng trụ (Offline-First)
 * Module 2 - Giai đoạn 3: Ứng suất cho phép, thiết kế và kiểm nghiệm bền bánh răng
 */

import { GEAR_MATERIALS, KA, PSI_BA, GEAR_CONSTANTS } from './mechanicalConstants';

const STANDARD_MODULES = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20];

export function pickStandardModule(m_calc: number) {
  return STANDARD_MODULES.find(m => m >= m_calc) ?? STANDARD_MODULES[STANDARD_MODULES.length - 1];
}

export function psi_bd_from_psi_ba(psi_ba: number, u: number) {
  return (psi_ba * (u + 1)) / 2;
}

export function calc_Z_epsilon(z1: number, z2: number) {
  const eps_alpha = 1.88 - 3.2 * (1 / z1 + 1 / z2);
  return parseFloat(Math.sqrt(1 / eps_alpha).toFixed(4));
}

export function calc_YF(z: number) {
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

export function calc_Y_epsilon(z1: number, z2: number) {
  const eps_alpha = 1.88 - 3.2 * (1 / z1 + 1 / z2);
  return parseFloat((1 / eps_alpha).toFixed(4));
}

export function getMaterialProps(matId: string) {
  const mat = GEAR_MATERIALS.find(m => m.id === matId);
  if (!mat) throw new Error(`Vật liệu '${matId}' không tồn tại trong catalogue.`);
  // @ts-ignore
  const sigma_Flim = mat.sigma_Flim_override ?? mat.sigma_Flim;
  return { ...mat, sigma_Flim };
}

export function getGearMaterials() {
  return GEAR_MATERIALS.map(m => ({
    id: m.id,
    name: m.name,
    HB: m.HB,
    HRC: m.HRC,
    sigma_b: m.sigma_b,
  }));
}

export interface LoadProfile {
  T1_ratio?: number;
  T2_ratio?: number;
  t1?: number;
  t2?: number;
}

export function calculateAllowableStress(
  mat1Id: string, mat2Id: string, n1_rpm: number, u: number, L_hours: number, loadProfile: LoadProfile | null = null
) {
  const mat1 = getMaterialProps(mat1Id);
  const mat2 = getMaterialProps(mat2Id);

  const n2_rpm = n1_rpm / u;

  const computeNHE = (n_rpm: number) => {
    if (!loadProfile) return 60 * n_rpm * L_hours;
    const { T1_ratio = 1, T2_ratio = 0.6, t1 = 0.5, t2 = 0.5 } = loadProfile;
    const factor = Math.pow(T1_ratio, 3) * t1 + Math.pow(T2_ratio, 3) * t2;
    return factor * 60 * n_rpm * L_hours;
  };

  const computeNFE = (n_rpm: number) => {
    if (!loadProfile) return 60 * n_rpm * L_hours;
    const { T1_ratio = 1, T2_ratio = 0.6, t1 = 0.5, t2 = 0.5 } = loadProfile;
    const factor = Math.pow(T1_ratio, 9) * t1 + Math.pow(T2_ratio, 9) * t2;
    return factor * 60 * n_rpm * L_hours;
  };

  const computeNHO = (HB: number | null) => HB ? 30 * Math.pow(HB, 2.4) : 70e6;
  const NFO = 4e6;

  const NHE1 = computeNHE(n1_rpm), NHE2 = computeNHE(n2_rpm);
  const NFE1 = computeNFE(n1_rpm), NFE2 = computeNFE(n2_rpm);
  const NHO1 = computeNHO(mat1.HB), NHO2 = computeNHO(mat2.HB);

  const KHL1 = NHE1 < NHO1 ? parseFloat(Math.pow(NHO1 / NHE1, 1 / 6).toFixed(4)) : 1.0;
  const KHL2 = NHE2 < NHO2 ? parseFloat(Math.pow(NHO2 / NHE2, 1 / 6).toFixed(4)) : 1.0;

  const KFL1 = NFE1 < NFO ? parseFloat(Math.pow(NFO / NFE1, 1 / 9).toFixed(4)) : 1.0;
  const KFL2 = NFE2 < NFO ? parseFloat(Math.pow(NFO / NFE2, 1 / 9).toFixed(4)) : 1.0;

  // Hệ số ứng suất tiếp xúc cho phép (formula5.png):
  // [σH] = σ°Hlim/sH · ZR · Zv · KxH · KHL
  // ZR = 1.0 (r ă nhám Ra = 1.25−1.6 μm), Zv = 1.0 (v ≤ 5 m/s), KxH = 1.0 (d_w1 ≤ 700 mm)
  const ZR = 1.0;   // Hệ số kể đến độ nhám mặt răng
  const Zv = 1.0;   // Hệ số kể đến ảnh hưởng vận tốc vòng
  const KxH = 1.0;  // Hệ số kể đến kích thước bánh răng

  const sigmaH1_allow = parseFloat((mat1.sigma_Hlim * KHL1 / mat1.s_H * ZR * Zv * KxH).toFixed(2));
  const sigmaH2_allow = parseFloat((mat2.sigma_Hlim * KHL2 / mat2.s_H * ZR * Zv * KxH).toFixed(2));
  const sigmaH_allow  = Math.min(sigmaH1_allow, sigmaH2_allow);

  // Hệ số ứng suất uốn cho phép (formula5.png):
  // [σF] = σ°Flim/sF · YR · YS · KxF · KFC · KFL
  // YR = 1.0 (cùng độ nhám), YS = 1.08 − 0.0695·ln(m), KxF = 1.0 (m ≤ 5), KFC = 1.0 (1 chiều)
  const YR_val = 1.0;   // Hệ số kể đến độ nhám
  const YS = 1.0;       // Sử dụng giá trị sơ bộ (bất động theo module sau khi chọn m)
  const KxF = 1.0;      // Hệ số kích thước bánh răng
  const KFC = 1.0;      // Hệ số kể đến ảnh hưởng đặt tải (1 chiều quay)

  const sigmaF1_allow = parseFloat((mat1.sigma_Flim * KFL1 / mat1.s_F * YR_val * YS * KxF * KFC).toFixed(2));
  const sigmaF2_allow = parseFloat((mat2.sigma_Flim * KFL2 / mat2.s_F * YR_val * YS * KxF * KFC).toFixed(2));

  return {
    gear1: { material: mat1.name, sigma_Hlim: mat1.sigma_Hlim, sigma_Flim: mat1.sigma_Flim, KHL: KHL1, KFL: KFL1, sigmaH_allow: sigmaH1_allow, sigmaF_allow: sigmaF1_allow },
    gear2: { material: mat2.name, sigma_Hlim: mat2.sigma_Hlim, sigma_Flim: mat2.sigma_Flim, KHL: KHL2, KFL: KFL2, sigmaH_allow: sigmaH2_allow, sigmaF_allow: sigmaF2_allow },
    sigmaH_allow,
    sigmaF1_allow,
    sigmaF2_allow,
  };
}

export function calculatePreliminaryDistance(
  T1_Nmm: number, u: number, sigmaH_allow: number, gearType = 'spur_symmetric', bearingPos = 'symmetric', sign = '+'
) {
  const Ka = KA[gearType] ?? KA.spur_symmetric;
  const psi_ba = PSI_BA[bearingPos]?.default ?? 0.4;
  // @ts-ignore
  const K_Hbeta = GEAR_CONSTANTS[`K_Hbeta_${bearingPos}`] ?? GEAR_CONSTANTS.K_Hbeta_symmetric;

  const sign_val = sign === '+' ? 1 : -1;
  const u_sign = u + sign_val;

  const inner = (T1_Nmm * K_Hbeta) / (Math.pow(sigmaH_allow, 2) * u * psi_ba);
  const aw_raw = Ka * u_sign * Math.pow(inner, 1 / 3);
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

export function selectGearParameters(aw: number, u: number, sign = '+') {
  const m_sb_min = 0.01 * aw;
  const m_sb_max = 0.02 * aw;
  const m_n = pickStandardModule((m_sb_min + m_sb_max) / 2);

  const sign_val = sign === '+' ? 1 : -1;
  const z1_raw = (2 * aw) / (m_n * (u + sign_val));
  const z1 = Math.floor(z1_raw);
  if (z1 < 17) {
    console.warn(`[GearService] Cảnh báo z1 = ${z1} < 17, kiểm tra dịch chỉnh!`);
  }
  const z2 = Math.round(u * z1);
  const u_actual = parseFloat((z2 / z1).toFixed(4));
  const u_error_pct = parseFloat((Math.abs(u_actual - u) / u * 100).toFixed(2));

  const aw_actual = parseFloat(((m_n * (z1 + z2)) / 2).toFixed(2));

  const d1 = parseFloat((m_n * z1).toFixed(2));
  const d2 = parseFloat((m_n * z2).toFixed(2));
  const d_w1 = d1, d_w2 = d2;
  const da1 = parseFloat((d1 + 2 * m_n).toFixed(2));
  const da2 = parseFloat((d2 + 2 * m_n).toFixed(2));
  const df1 = parseFloat((d1 - 2.5 * m_n).toFixed(2));
  const df2 = parseFloat((d2 - 2.5 * m_n).toFixed(2));
  const bw = null;

  return {
    m_n, m_sb_range: [parseFloat(m_sb_min.toFixed(3)), parseFloat(m_sb_max.toFixed(3))],
    z1, z2,
    u_input: u, u_actual, u_error_pct,
    aw_input: aw, aw_actual,
    d1, d2, d_w1, d_w2, da1, da2, df1, df2,
  };
}

export function checkContactStrength(geomParams: any, T1_Nmm: number, u: number, bw_mm: number, sigmaH_allow: number) {
  const { d_w1, z1, z2 } = geomParams;
  const Z_M = GEAR_CONSTANTS.Z_M_steel_steel;
  const Z_H = GEAR_CONSTANTS.Z_H;
  const Z_eps = calc_Z_epsilon(z1, z2);
  const K_H = GEAR_CONSTANTS.K_H_base;

  const inner = (2 * T1_Nmm * K_H * (u + 1)) / (bw_mm * Math.pow(d_w1, 2) * u);
  const sigma_H = parseFloat((Z_M * Z_H * Z_eps * Math.sqrt(inner)).toFixed(2));

  return {
    sigma_H,
    sigma_H_allow: sigmaH_allow,
    Z_M, Z_H, Z_eps, K_H,
    pass: sigma_H <= sigmaH_allow,
    margin_pct: parseFloat(((sigmaH_allow - sigma_H) / sigmaH_allow * 100).toFixed(1)),
  };
}

export function checkBendingStrength(
  geomParams: any, T1_Nmm: number, u: number, bw_mm: number, sigmaF1_allow: number, sigmaF2_allow: number
) {
  const { d_w1, m_n, z1, z2 } = geomParams;
  const K_F = GEAR_CONSTANTS.K_F_base;
  const Y_eps = calc_Y_epsilon(z1, z2);
  const Y_F1 = calc_YF(z1);
  const Y_F2 = calc_YF(z2);
  const Y_beta = 1.0;

  const base = (2 * T1_Nmm * K_F * Y_eps * Y_beta) / (bw_mm * d_w1 * m_n);
  const sigma_F1 = parseFloat((base * Y_F1).toFixed(2));
  const sigma_F2 = parseFloat((sigma_F1 * Y_F2 / Y_F1).toFixed(2));

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

export interface GearCalculationParams {
  mat1Id: string;
  mat2Id: string;
  T1_Nmm: number;
  n1_rpm: number;
  u: number;
  L_hours: number;
  gearType?: string;
  bearingPos?: string;
  loadProfile?: LoadProfile | null;
}

export function calculateGearFull(params: GearCalculationParams) {
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
  } = params;

  const stressResult = calculateAllowableStress(mat1Id, mat2Id, n1_rpm, u, L_hours, loadProfile);
  const distResult = calculatePreliminaryDistance(T1_Nmm, u, stressResult.sigmaH_allow, gearType, bearingPos);
  const aw = distResult.aw_rounded;
  const geomResult = selectGearParameters(aw, u);
  const bw = parseFloat((distResult.psi_ba * aw).toFixed(2));
  const contactCheck = checkContactStrength(geomResult, T1_Nmm, geomResult.u_actual, bw, stressResult.sigmaH_allow);
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
