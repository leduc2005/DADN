/**
 * calc_belt.ts - Service tính toán Bộ truyền Đai thang (Offline-First)
 * Module 2 - Giai đoạn 2: Thiết kế & kiểm nghiệm bộ truyền đai
 */

import {
  BELT_SECTIONS,
  BELT_STANDARD_LENGTHS,
  BELT_STANDARD_DIAMETERS,
  K_ALPHA_TABLE,
  KD_TABLE,
  KD_SHIFT_ADJUSTMENT,
  getKd,
} from './mechanicalConstants';

export function selectBeltSection(P_kW: number, n1_rpm: number): string {
  if (P_kW <= 1 && n1_rpm >= 400) return 'O';
  if (P_kW <= 3.5 && n1_rpm >= 400) return 'A';
  if (P_kW <= 10 && n1_rpm >= 300) return 'B';
  if (P_kW <= 25) return 'C';
  return 'D';
}

export function pickStandardDiameter(d_calc: number) {
  return BELT_STANDARD_DIAMETERS.find(d => d >= d_calc) ?? BELT_STANDARD_DIAMETERS[BELT_STANDARD_DIAMETERS.length - 1];
}

export function pickStandardLength(L_calc: number) {
  return BELT_STANDARD_LENGTHS.find(L => L >= L_calc) ?? BELT_STANDARD_LENGTHS[BELT_STANDARD_LENGTHS.length - 1];
}

export function getKalpha(alpha1_deg: number) {
  if (alpha1_deg >= 180) return 1.0;
  if (alpha1_deg <= 100) return 0.74;

  const table = K_ALPHA_TABLE;
  for (let i = 0; i < table.length - 1; i++) {
    const hi = table[i], lo = table[i + 1];
    if (alpha1_deg <= hi.alpha && alpha1_deg >= lo.alpha) {
      const t = (alpha1_deg - lo.alpha) / (hi.alpha - lo.alpha);
      return parseFloat((lo.Ka + t * (hi.Ka - lo.Ka)).toFixed(4));
    }
  }
  return 1.0;
}

export function getKL(section: string, L_mm: number) {
  const L0_ref: Record<string, number> = { O: 1320, A: 1700, B: 2240, C: 3750, D: 4500 };
  const L0 = L0_ref[section] ?? 2240;
  return parseFloat(Math.pow(L_mm / L0, 1 / 9).toFixed(4));
}

export function getKu(u_dai: number) {
  if (u_dai >= 3) return 1.14;
  if (u_dai >= 2) return 1.12;
  if (u_dai >= 1.5) return 1.09;
  if (u_dai >= 1.2) return 1.06;
  return 1.0;
}

export function getKz(z_estimate: number) {
  if (z_estimate <= 2) return 1.0;
  if (z_estimate <= 3) return 0.95;
  if (z_estimate <= 4) return 0.90;
  if (z_estimate <= 5) return 0.85;
  return 0.80;
}

export interface BeltParams {
  P1_kW: number;
  n1_rpm: number;
  u_dai: number;
  section?: string | null;
  /** Loại tải theo bảng Kd: 'static_load' | 'light_vibration' | 'heavy_vibration' | 'shock_load' */
  loadType?: keyof typeof KD_TABLE;
  /** Nhóm động cơ: 'groupI' (điện) | 'groupII' (đốt trong 1-2 xi-lanh) */
  motorGroup?: 'groupI' | 'groupII';
  /** Số ca làm việc: 1, 2 hoặc 3 */
  shifts?: number;
  epsilon?: number;
}

export function calculateBeltTransmission(params: BeltParams) {
  const {
    P1_kW,
    n1_rpm,
    u_dai,
    section: sectionInput = null,
    loadType = 'static_load',
    motorGroup = 'groupI',
    shifts = 1,
    epsilon = 0.01,
  } = params;

  const section = sectionInput ?? selectBeltSection(P1_kW, n1_rpm);
  const sectionData = BELT_SECTIONS[section];
  if (!sectionData) throw new Error(`Tiết diện đai '${section}' không hợp lệ`);

  const d1_calc = sectionData.d1_range[0];
  const d1 = pickStandardDiameter(d1_calc);

  const v_dai = parseFloat(((Math.PI * d1 * n1_rpm) / 60000).toFixed(3));

  const d2_calc = u_dai * d1 * (1 - epsilon);
  const d2 = pickStandardDiameter(d2_calc);

  const u_actual = parseFloat((d2 / (d1 * (1 - epsilon))).toFixed(4));
  const u_error_percent = parseFloat((Math.abs(u_actual - u_dai) / u_dai * 100).toFixed(2));

  let a_multiplier;
  if (u_dai >= 3)      a_multiplier = 0.95;
  else if (u_dai >= 2) a_multiplier = 1.5;
  else                 a_multiplier = 2.0;

  const a_sb = parseFloat((a_multiplier * d2).toFixed(2));
  const a_min = 0.55 * (d1 + d2) + sectionData.h;
  const a_max = 2 * (d1 + d2);
  const a_sb_valid = a_sb >= a_min && a_sb <= a_max;

  const L_sb = 2 * a_sb + (Math.PI * (d1 + d2)) / 2 + Math.pow(d2 - d1, 2) / (4 * a_sb);
  const L = pickStandardLength(L_sb);

  // Công thức đúng: a = (λ + √(λ² − 8Δ²)) / 4
  // với λ = l − π(d₁+d₂)/2  và  Δ = (d₂−d₁)/2  (formula2.png)
  const lambda = L - (Math.PI * (d1 + d2)) / 2;
  const Delta = (d2 - d1) / 2;
  const discriminant = Math.pow(lambda, 2) - 8 * Math.pow(Delta, 2);
  if (discriminant < 0) throw new Error('Không thể tính khoảng cách trục thực tế: discriminant âm');
  const a = parseFloat(((lambda + Math.sqrt(discriminant)) / 4).toFixed(2));

  const alpha1_deg = parseFloat((180 - ((d2 - d1) / a) * 57).toFixed(2));
  const alpha1_pass = alpha1_deg >= 120;

  const bending_freq = parseFloat(((v_dai * 1000) / L).toFixed(4));
  const bending_freq_pass = bending_freq <= 10;

  const Kd = getKd(loadType as keyof typeof KD_TABLE, shifts, motorGroup);
  const Ka = getKalpha(alpha1_deg);
  const KL = getKL(section, L);
  const Ku = getKu(u_dai);
  const P0 = sectionData.P0_ref;

  const z_estimate = Math.ceil((P1_kW * Kd) / (P0 * Ka * KL * Ku));
  const Kz = getKz(z_estimate);

  const z_calc = (P1_kW * Kd) / (P0 * Ka * KL * Ku * Kz);
  const z = Math.ceil(z_calc);

  const Ft = parseFloat((1000 * P1_kW / v_dai).toFixed(2));
  const F0 = parseFloat((sectionData.A * 1.5).toFixed(2));
  const Fr = parseFloat((2 * F0 * z * Math.sin((alpha1_deg / 2) * Math.PI / 180)).toFixed(2));

  const checks = {
    speed_pass: v_dai <= 25,
    wrap_angle_pass: alpha1_pass,
    bending_freq_pass,
    ratio_error_pass: u_error_percent <= 4,
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

export function getBeltSections() {
  return Object.entries(BELT_SECTIONS).map(([key, data]) => ({
    id: key,
    name: `Đai thang loại ${key}`,
    ...data,
  }));
}
