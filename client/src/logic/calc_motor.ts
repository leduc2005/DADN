/**
 * calc_motor.ts - Service tính toán Động cơ điện (Offline-First)
 * Module 2 - Giai đoạn 1: Chọn động cơ & tính momen xoắn
 */

import { EFFICIENCY, MOTOR_CATALOGUE } from './mechanicalConstants';

export interface SystemConfig {
  transmissionType?: string;
  gearboxType?: string;
  numGearStages?: number;
  numBearingPairs?: number;
  hasCoupling?: boolean;
}

export interface ShaftDynamicsParams {
  Pt: number;
  n_dc: number;
  u_belt: number;
  u_stage1: number;
  u_stage2?: number;
  transmissionType?: string;
  gearboxType?: string;
}

export interface DriveCalcItem {
  type?: string;
  efficiencyTransmissionRatio?: number | string;
  eta?: number | string;
  quantity?: number | string;
  transmissionRatio?: number | string;
}

export interface BearingCalcItem {
  type?: string;
  efficiencyTransmissionRatio?: number | string;
  eta?: number | string;
  quantity?: number | string;
}

export interface SystemTransmissionResult {
  uh: number;
  u1: number;
  u2: number;
  Pdc: number;
  P1: number;
  P2: number;
  P3: number;
  ndc: number;
  n1: number;
  n2: number;
  n3: number;
  tdc: number;
  t1: number;
  t2: number;
  t3: number;
}

type Point = [number, number];

const U1_TABLE: Record<number, Point[]> = {
  60: [
    [7, 1.7], [10, 2.0], [15, 2.8], [20, 3.6], [25, 4.4],
    [30, 4.8], [35, 5.4], [40, 5.9], [45, 6.5], [50, 7.0], [60, 8.0],
  ],
  50: [
    [7, 1.9], [10, 2.2], [15, 3.0], [20, 3.8], [25, 4.5],
    [30, 5.1], [35, 5.6], [40, 6.4], [45, 7.2], [50, 7.6], [54, 8.0],
  ],
  40: [
    [7, 2.1], [10, 2.4], [15, 3.3], [20, 4.2], [25, 5.1],
    [30, 5.9], [35, 6.6], [40, 7.2], [45, 7.6], [50, 8.0],
  ],
  30: [
    [7, 2.3], [10, 2.6], [15, 3.5], [20, 4.4], [25, 5.2],
    [30, 5.9], [35, 6.6], [40, 7.3], [46, 8.0],
  ],
  20: [
    [7, 2.5], [10, 3.0], [15, 4.0], [20, 4.7], [25, 5.7],
    [30, 5.9], [35, 7.1], [38, 8.0],
  ],
  15: [
    [7, 2.7], [10, 3.3], [15, 4.4], [20, 5.2], [25, 6.2],
    [30, 6.9], [34, 7.6], [36, 8.0],
  ],
  10: [
    [7, 2.9], [10, 3.7], [15, 4.6], [20, 5.9], [25, 6.1],
    [30, 7.5], [34, 8.0],
  ],
};

const toPositiveNumber = (value: number | string | undefined, fallback = 0): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
};

const getItemEfficiency = (item: DriveCalcItem | BearingCalcItem): number =>
  toPositiveNumber(item.efficiencyTransmissionRatio ?? item.eta, 1);

function interpolate(points: Point[], x: number): number | null {
  if (points.length === 0) return null;
  if (x === points[0][0]) return points[0][1];

  for (let index = 0; index < points.length - 1; index += 1) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[index + 1];

    if (x >= x1 && x <= x2) {
      return y1 + ((y2 - y1) * (x - x1)) / (x2 - x1);
    }
  }

  return null;
}

function getU1(lambda: number, uh: number): number | null {
  const lambdas = Object.keys(U1_TABLE)
    .map(Number)
    .sort((left, right) => left - right);

  for (let index = 0; index < lambdas.length - 1; index += 1) {
    const lambda1 = lambdas[index];
    const lambda2 = lambdas[index + 1];

    if (lambda >= lambda1 && lambda <= lambda2) {
      const u1AtLambda1 = interpolate(U1_TABLE[lambda1], uh);
      const u1AtLambda2 = interpolate(U1_TABLE[lambda2], uh);

      if (u1AtLambda1 === null || u1AtLambda2 === null) {
        return null;
      }

      return u1AtLambda1 + ((u1AtLambda2 - u1AtLambda1) * (lambda - lambda1)) / (lambda2 - lambda1);
    }
  }

  return null;
}

export function calculateRequiredPower(Pt: number, systemConfig: SystemConfig) {
  const {
    transmissionType = 'belt_vee',
    gearboxType = 'gear_spur',
    numGearStages = 2,
    numBearingPairs = 3,
    hasCoupling = true,
  } = systemConfig;

  const eta_belt = EFFICIENCY[transmissionType as keyof typeof EFFICIENCY] ?? EFFICIENCY.belt_vee;
  const eta_gear = EFFICIENCY[gearboxType as keyof typeof EFFICIENCY] ?? EFFICIENCY.gear_spur;
  const eta_bearing = Math.pow(EFFICIENCY.bearing_pair, numBearingPairs);
  const eta_coupling = hasCoupling ? EFFICIENCY.coupling : 1.0;

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

export function calculateSynchronousSpeed(n_iv: number, ratios: number[]) {
  const u_total = ratios.reduce((accumulator, ratio) => accumulator * ratio, 1);
  const n_sb = n_iv * u_total;

  return {
    n_sb: parseFloat(n_sb.toFixed(2)),
    u_total: parseFloat(u_total.toFixed(4)),
  };
}

export function suggestMotors(Pct: number, n_sb: number, Tmm_over_T = 1.3) {
  const candidates = MOTOR_CATALOGUE.filter((motor) => {
    if (motor.power < Pct) return false;
    if (motor.speed < n_sb * 0.60 || motor.speed > n_sb * 1.40) return false;
    if (motor.Tmm_Tdn < Tmm_over_T) return false;
    return true;
  });

  candidates.sort((left, right) => left.power - right.power);
  return candidates;
}

export function distributeTransmissionRatio(n_dc: number, n_iv: number, u_belt: number) {
  const u_total = n_dc / n_iv;
  const u_gearbox = u_total / u_belt;

  return {
    u_total: parseFloat(u_total.toFixed(4)),
    u_gearbox: parseFloat(u_gearbox.toFixed(4)),
    u_belt: parseFloat(u_belt.toFixed(4)),
  };
}

export function calculateShaftDynamics(params: ShaftDynamicsParams) {
  const {
    Pt,
    n_dc,
    u_belt,
    u_stage1,
    u_stage2 = 1,
    transmissionType = 'belt_vee',
    gearboxType = 'gear_spur',
  } = params;

  const eta_belt = EFFICIENCY[transmissionType as keyof typeof EFFICIENCY] ?? EFFICIENCY.belt_vee;
  const eta_gear = EFFICIENCY[gearboxType as keyof typeof EFFICIENCY] ?? EFFICIENCY.gear_spur;
  const eta_bearing = EFFICIENCY.bearing_pair;
  const eta_coupling = EFFICIENCY.coupling;

  const n1 = parseFloat((n_dc / u_belt).toFixed(2));
  const n2 = parseFloat((n1 / u_stage1).toFixed(2));
  const n3 = parseFloat((n2 / u_stage2).toFixed(2));

  const P3 = parseFloat((Pt / (eta_coupling * eta_bearing)).toFixed(4));
  const P2 = parseFloat((P3 / (eta_gear * eta_bearing)).toFixed(4));
  const P1 = u_stage2 > 1
    ? parseFloat((P2 / (eta_gear * eta_bearing)).toFixed(4))
    : P2;
  const Pdc = parseFloat((P1 / (eta_belt * eta_bearing)).toFixed(4));

  const T_dc = parseFloat(((9.55e6 * Pdc) / n_dc).toFixed(2));
  const T1 = parseFloat(((9.55e6 * P1) / n1).toFixed(2));
  const T2 = parseFloat(((9.55e6 * P2) / n2).toFixed(2));
  const T3 = parseFloat(((9.55e6 * P3) / n3).toFixed(2));

  return {
    shafts: {
      motor: { n: n_dc, P: Pdc, T: T_dc, label: 'Trục động cơ' },
      shaft1: { n: n1, P: P1, T: T1, label: 'Trục vào HGT (Trục 1)' },
      shaft2: { n: n2, P: P2, T: T2, label: 'Trục trung gian (Trục 2)' },
      shaft3: { n: n3, P: P3, T: T3, label: 'Trục ra HGT (Trục 3)' },
    },
    ratios: { u_belt, u_stage1, u_stage2, u_total: u_belt * u_stage1 * u_stage2 },
  };
}

export function calcSystemTransmission(
  ud: number | string,
  ndc: number | string,
  nlv: number | string,
  ck: number | string,
  kbe: number | string,
  psibd2: number | string,
  driveItems: DriveCalcItem[],
  bearingItems: BearingCalcItem[],
  power: number | string,
): SystemTransmissionResult {
  const udNum = toPositiveNumber(ud, 1);
  const ndcNum = toPositiveNumber(ndc, 1);
  const nlvNum = toPositiveNumber(nlv, 1);
  const ckNum = toPositiveNumber(ck, 1);
  const kbeNum = toPositiveNumber(kbe, 0.5);
  const psibd2Num = toPositiveNumber(psibd2, 0.3);
  const pNum = toPositiveNumber(power, 0);

  const uh = (ndcNum / nlvNum) / udNum;
  const lambda = (2.25 * psibd2Num * Math.pow(ckNum, 3)) / ((1 - kbeNum) * kbeNum);
  const u1 = getU1(lambda, uh) ?? 0;
  const u2 = u1 > 0 ? uh / u1 : 0;

  const n1 = ndcNum / udNum;
  const n2 = u1 > 0 ? n1 / u1 : 0;
  const n3 = u2 > 0 ? n2 / u2 : 0;

  const bearingEfficiency = getItemEfficiency(bearingItems[0] ?? {});
  const p3 = pNum / (bearingEfficiency * EFFICIENCY.coupling);

  const spurEfficiency = getItemEfficiency(
    driveItems.find((item) => item.type === 'Bánh răng trụ') ?? {},
  );
  const p2 = p3 / (bearingEfficiency * spurEfficiency);
  const p1 = p2 / (bearingEfficiency * spurEfficiency);

  const bevelEfficiency = getItemEfficiency(
    driveItems.find((item) => item.type === 'Bánh răng côn') ?? {},
  );
  const pdc = p1 / (bearingEfficiency * bevelEfficiency);

  const t1 = n1 > 0 ? (9.55e6 * p1) / n1 : 0;
  const t2 = n2 > 0 ? (9.55e6 * p2) / n2 : 0;
  const t3 = n3 > 0 ? (9.55e6 * p3) / n3 : 0;
  const tdc = (9.55e6 * pdc) / ndcNum;

  return {
    uh,
    u1,
    u2,
    Pdc: pdc,
    P1: p1,
    P2: p2,
    P3: p3,
    ndc: ndcNum,
    n1,
    n2,
    n3,
    tdc,
    t1,
    t2,
    t3,
  };
}

export const calc_system_transmission = calcSystemTransmission;
