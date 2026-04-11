/**
 * api.ts - API Service Bridge cho Module 2
 * Nối UI_UX (React/Vite) với Backend Node.js/Express
 *
 * Tech: Fetch API (không cần Axios vì UI_UX dùng Vite thuần)
 * Base URL: Đọc từ biến môi trường VITE_API_URL
 */

// ============================================================
// CONFIGURATION
// ============================================================

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
const API_BASE = `${BASE_URL}/api/v1/calculation`;

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface SystemConfig {
  transmissionType?: "belt_vee" | "belt_flat";
  gearboxType?: "gear_spur" | "gear_bevel" | "gear_helical";
  numGearStages?: number;
  numBearingPairs?: number;
  hasCoupling?: boolean;
}

export interface SuggestMotorsPayload {
  Pt: number;           // Công suất công tác [kW]
  n_iv: number;         // Tốc độ trục công tác [v/ph]
  ratios?: number[];    // Tỉ số truyền dự kiến [u_dai, u_gear1, u_gear2]
  systemConfig?: SystemConfig;
  Tmm_over_T?: number;
}

export interface SelectMotorPayload {
  Pt: number;
  n_dc: number;         // Tốc độ động cơ đã chọn [v/ph]
  u_belt?: number;
  u_stage1?: number;
  u_stage2?: number;
  transmissionType?: string;
  gearboxType?: string;
}

export interface BeltCalculatePayload {
  P1_kW: number;        // Công suất đầu vào đai [kW]
  n1_rpm: number;       // Tốc độ bánh dẫn [v/ph]
  u_dai: number;        // Tỉ số truyền đai
  section?: string;     // Loại tiết diện (O/A/B/C/D)
  engineType?: "electric" | "combustion_single" | "combustion_multi";
  loadType?: "smooth" | "light_shock" | "heavy_shock";
  epsilon?: number;     // Hệ số trượt (default 0.01)
}

export interface GearCalculatePayload {
  mat1Id: string;       // ID vật liệu bánh dẫn
  mat2Id: string;       // ID vật liệu bánh bị dẫn
  T1_Nmm: number;       // Momen xoắn bánh dẫn [N.mm]
  n1_rpm: number;       // Tốc độ bánh dẫn [v/ph]
  u: number;            // Tỉ số truyền
  L_hours: number;      // Tuổi thọ [giờ]
  gearType?: string;
  bearingPos?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// ============================================================
// HELPER: FETCH WRAPPER
// ============================================================

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; message: string } & Record<string, T>> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      // Thêm JWT token khi tích hợp Module 1:
      // Authorization: `Bearer ${localStorage.getItem("token")}`,
      ...((options.headers as Record<string, string>) ?? {}),
    },
    ...options,
  });

  const json = await response.json();

  if (!response.ok && response.status !== 422) {
    // 422 = Unprocessable (tính toán không đạt vẫn trả data hợp lệ)
    throw new Error(json.message ?? `HTTP ${response.status}`);
  }

  return json;
}

// ============================================================
// MOTOR APIs
// ============================================================

/**
 * Gọi API tính Pct và lấy danh sách động cơ đề xuất
 *
 * POST /api/v1/calculation/motors/suggest
 */
export async function suggestMotors(payload: SuggestMotorsPayload) {
  return apiFetch<unknown>("/motors/suggest", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Xác nhận chọn động cơ, tính momen & tốc độ các trục
 *
 * POST /api/v1/calculation/motors/select
 */
export async function selectMotorAndCalculate(payload: SelectMotorPayload) {
  return apiFetch<unknown>("/motors/select", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ============================================================
// BELT APIs
// ============================================================

/**
 * Lấy danh sách loại tiết diện đai
 *
 * GET /api/v1/calculation/belts/sections
 */
export async function getBeltSections() {
  return apiFetch<unknown>("/belts/sections");
}

/**
 * Tính toán và kiểm nghiệm bộ truyền đai
 *
 * POST /api/v1/calculation/belts/calculate
 */
export async function calculateBelt(payload: BeltCalculatePayload) {
  return apiFetch<unknown>("/belts/calculate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ============================================================
// GEAR APIs
// ============================================================

/**
 * Lấy danh sách vật liệu bánh răng
 *
 * GET /api/v1/calculation/gears/materials
 */
export async function getGearMaterials() {
  return apiFetch<unknown>("/gears/materials");
}

/**
 * Tính toán và kiểm nghiệm bánh răng trụ
 *
 * POST /api/v1/calculation/gears/calculate
 */
export async function calculateGear(payload: GearCalculatePayload) {
  return apiFetch<unknown>("/gears/calculate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ============================================================
// CONVENIENCE: HELPER ĐỂ MAP DỮ LIỆU UI → API PAYLOAD
// ============================================================

/**
 * Chuyển đổi dữ liệu từ InputScreen sang payload cho suggestMotors
 *
 * @param inputScreenData - Dữ liệu từ form InputScreen
 * @param efficiencies    - Hiệu suất người dùng đã nhập
 * @param ratios          - Tỉ số truyền sơ bộ [u_belt, u_gear1, u_gear2]
 */
export function mapInputScreenToSuggestPayload(
  inputScreenData: {
    power: string;
    speed: string;
    serviceLife: string;
    loadType: string;
    workShifts: string;
  },
  efficiencies: {
    etaBelt: string;
    etaBevelGear: string;
    etaStraightGear: string;
    etaBearing: string;
    etaCoupling: string;
    uBelt: string;
    uGearbox: string;
  }
): SuggestMotorsPayload {
  const numShifts = parseInt(efficiencies.uGearbox) > 30 ? 3 : 2; // proxy: HGT lớn = 3 ca
  const shiftsPerDay = parseInt(inputScreenData.workShifts) || 2;
  const L_years = parseFloat(inputScreenData.serviceLife) || 9;
  const L_hours = L_years * 300 * shiftsPerDay * 8;

  const uBelt = parseFloat(efficiencies.uBelt) || 2.5;
  const uGearbox = parseFloat(efficiencies.uGearbox) || 14;
  // Phân phối sơ bộ HGT 2 cấp: u_c1 ≈ u_c2 ≈ sqrt(u_gb)
  const uStage1 = parseFloat((Math.sqrt(uGearbox)).toFixed(2));
  const uStage2 = parseFloat((uGearbox / uStage1).toFixed(2));

  return {
    Pt: parseFloat(inputScreenData.power),
    n_iv: parseFloat(inputScreenData.speed),
    ratios: [uBelt, uStage1, uStage2],
    systemConfig: {
      transmissionType: "belt_vee",
      gearboxType: "gear_spur",  // Có thể map từ loại HGT nếu UI có trường này
      numGearStages: 2,
      numBearingPairs: 4,
      hasCoupling: true,
    },
  };
}

/**
 * Chuyển đổi motor đã chọn từ MotorSelectionScreen → SelectMotorPayload
 */
export function mapSelectedMotorToPayload(
  motor: { model: string; power: number; speed: number },
  Pt: number,
  uBelt: number,
  uStage1: number,
  uStage2: number = 1
): SelectMotorPayload {
  return {
    Pt,
    n_dc: motor.speed,
    u_belt: uBelt,
    u_stage1: uStage1,
    u_stage2: uStage2,
    transmissionType: "belt_vee",
    gearboxType: "gear_bevel",
  };
}
