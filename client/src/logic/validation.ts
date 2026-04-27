import {
  BearingItem,
  DriveItem,
  EfficiencyData,
  LoadData,
  OperatingData,
} from '../store/projectState';
import {
  calculateShaftDynamics,
  suggestMotors,
  SystemConfig,
  calculateRequiredPower,
  calculateSynchronousSpeed,
} from './calc_motor';

export type ValidationErrorType = 'empty' | 'format' | 'threshold';

export interface PhysicalValidationInput {
  operatingData: OperatingData;
  loadData: LoadData;
  driveItems: DriveItem[];
  bearingItems: BearingItem[];
  efficiencyData: EfficiencyData;
}

export interface ValidationResult {
  isValid: boolean;
  errorType?: ValidationErrorType;
  message?: string;
  suggestion?: string;
}

interface CalculationDriveItem {
  quantity?: string;
  transmissionRatio?: string;
  efficiencyTransmissionRatio?: string | number;
  eta?: string | number;
}

interface CalculationBearingItem {
  quantity?: string;
  efficiencyTransmissionRatio?: string | number;
  eta?: string | number;
}

interface RunMotorSuggestionInput {
  operatingData: Pick<OperatingData, 'power' | 'speed' | 'serviceLife'>;
  loadData?: Partial<LoadData>;
  efficiencyData: Pick<
    EfficiencyData,
    'etaCoupling' | 'uBelt' | 'uGearbox'
  >;
  driveItems?: CalculationDriveItem[];
  bearingItems?: CalculationBearingItem[];
}

const toPositiveNumber = (value: string | number | undefined) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  return numeric;
};

const invalidResult = (
  errorType: ValidationErrorType,
  message: string,
  suggestion: string,
): ValidationResult => ({
  isValid: false,
  errorType,
  message,
  suggestion,
});

const getEfficiency = (item: CalculationDriveItem | CalculationBearingItem) =>
  toPositiveNumber(item.efficiencyTransmissionRatio ?? item.eta) ?? 1;

export const validatePhysicalConstraints = (
  payload: PhysicalValidationInput,
): ValidationResult => {
  const { operatingData, loadData, driveItems, bearingItems, efficiencyData } = payload;

  const power = toPositiveNumber(operatingData.power);
  const speed = toPositiveNumber(operatingData.speed);
  const serviceLife = toPositiveNumber(operatingData.serviceLife);
  const workShifts = toPositiveNumber(loadData.workShifts);
  const workingDaysPerYear = toPositiveNumber(loadData.workingDaysPerYear);
  const hoursPerShift = toPositiveNumber(loadData.hoursPerShift);

  if (
    power === null ||
    speed === null ||
    serviceLife === null ||
    workShifts === null ||
    workingDaysPerYear === null ||
    hoursPerShift === null
  ) {
    return invalidResult(
      'format',
      'Có dữ liệu số không hợp lệ',
      'Vui lòng kiểm tra lại các ô nhập số, chỉ dùng số dương hợp lệ.',
    );
  }

  if (power < 0.1 || power > 500) {
    return invalidResult(
      'threshold',
      'Dữ liệu phi thực tế',
      'Công suất nên nằm trong khoảng 0.1 - 500 kW tùy quy mô hệ dẫn động.',
    );
  }

  if (speed < 10 || speed > 10000) {
    return invalidResult(
      'threshold',
      'Dữ liệu phi thực tế',
      'Vòng quay nên nằm trong khoảng 10 - 10000 rpm.',
    );
  }

  if (serviceLife < 1 || serviceLife > 50) {
    return invalidResult(
      'threshold',
      'Dữ liệu phi thực tế',
      'Thời gian phục vụ thường nằm trong khoảng 1 - 50 năm.',
    );
  }

  if (workingDaysPerYear < 1 || workingDaysPerYear > 366) {
    return invalidResult(
      'threshold',
      'Dữ liệu phi thực tế',
      'Số ngày làm việc trong năm phải nằm trong khoảng 1 - 366.',
    );
  }

  if (workShifts < 1 || workShifts > 4) {
    return invalidResult(
      'threshold',
      'Dữ liệu phi thực tế',
      'Số ca làm việc mỗi ngày thường nằm trong khoảng 1 - 4 ca.',
    );
  }

  if (hoursPerShift < 1 || hoursPerShift > 24) {
    return invalidResult(
      'threshold',
      'Dữ liệu phi thực tế',
      'Số giờ làm việc mỗi ca phải nằm trong khoảng 1 - 24 giờ.',
    );
  }

  if (driveItems.length === 0) {
    return invalidResult(
      'empty',
      'Thiếu dữ liệu bộ truyền động',
      'Vui lòng thêm ít nhất 1 bộ truyền động bằng nút + Thêm.',
    );
  }

  if (bearingItems.length === 0) {
    return invalidResult(
      'empty',
      'Thiếu dữ liệu ổ truyền động',
      'Vui lòng thêm ít nhất 1 ổ truyền động bằng nút + Thêm.',
    );
  }

  const invalidDriveQty = driveItems.find((item) => toPositiveNumber(item.quantity) === null);
  if (invalidDriveQty) {
    return invalidResult(
      'format',
      'Số lượng bộ truyền động không hợp lệ',
      'Số lượng của mỗi bộ truyền động phải là số dương.',
    );
  }

  const invalidDriveRatio = driveItems.find((item) => toPositiveNumber(item.transmissionRatio) === null);
  if (invalidDriveRatio) {
    return invalidResult(
      'format',
      'Tỉ số truyền không hợp lệ',
      'Vui lòng nhập tỉ số truyền là số dương cho mỗi bộ truyền động.',
    );
  }

  const invalidBearingQty = bearingItems.find((item) => toPositiveNumber(item.quantity) === null);
  if (invalidBearingQty) {
    return invalidResult(
      'format',
      'Số lượng ổ truyền động không hợp lệ',
      'Số lượng của mỗi ổ truyền động phải là số dương.',
    );
  }

  const missingZ = driveItems.find((item) => item.type === 'Trục vít không tự hãm' && !item.z);
  if (missingZ) {
    return invalidResult(
      'empty',
      'Thiếu thông số z',
      'Với Trục vít không tự hãm, vui lòng chọn z = 1, 2 hoặc 4.',
    );
  }

  const invalidEta = [
    efficiencyData.etaBelt,
    efficiencyData.etaBevelGear,
    efficiencyData.etaStraightGear,
    efficiencyData.etaWormSelfLocking,
    efficiencyData.etaWormNonSelfLocking,
    efficiencyData.etaChain,
    efficiencyData.etaFriction,
    efficiencyData.etaBearing,
    efficiencyData.etaSlidingBearing,
    efficiencyData.etaCoupling,
  ].find((eta) => {
    const numeric = Number(eta);
    return !Number.isFinite(numeric) || numeric <= 0 || numeric > 1;
  });

  if (invalidEta) {
    return invalidResult(
      'format',
      'Hiệu suất η không hợp lệ',
      'Tất cả giá trị η phải là số thực trong khoảng (0, 1].',
    );
  }

  if (toPositiveNumber(efficiencyData.uBelt) === null) {
    return invalidResult(
      'format',
      'u Đai không hợp lệ',
      'u Đai phải là số dương.',
    );
  }

  if (toPositiveNumber(efficiencyData.uGearbox) === null) {
    return invalidResult(
      'format',
      'u HGT không hợp lệ',
      'u HGT phải là số dương.',
    );
  }

  return { isValid: true };
};

export function runMotorSuggestion({
  operatingData,
  efficiencyData,
  driveItems = [],
  bearingItems = [],
}: RunMotorSuggestionInput) {
  const Pt = Number(operatingData.power);
  const n_iv = Number(operatingData.speed);

  const driveEfficiency = driveItems.reduce((accumulator, item) => {
    const quantity = toPositiveNumber(item.quantity) ?? 1;
    return accumulator * Math.pow(getEfficiency(item), quantity);
  }, 1);

  const bearingEfficiency = bearingItems.reduce((accumulator, item) => {
    const quantity = toPositiveNumber(item.quantity) ?? 1;
    return accumulator * Math.pow(getEfficiency(item), quantity);
  }, 1);

  const couplingEfficiency = toPositiveNumber(efficiencyData.etaCoupling) ?? 0.99;
  const etaTotal = driveEfficiency * bearingEfficiency * couplingEfficiency;
  const Pct = etaTotal > 0 ? Pt / etaTotal : 0;

  const transmissionRatios = driveItems
    .map((item) => {
      const ratio = toPositiveNumber(item.transmissionRatio);
      const quantity = toPositiveNumber(item.quantity) ?? 1;
      return ratio ? Math.pow(ratio, quantity) : 1;
    });

  const n_sb = n_iv > 0
    ? n_iv * transmissionRatios.reduce((accumulator, ratio) => accumulator * ratio, 1)
    : 0;

  const uBelt = toPositiveNumber(efficiencyData.uBelt) ?? 2.5;
  const uGearbox = toPositiveNumber(efficiencyData.uGearbox) ?? 14;
  const uStage1 = parseFloat(Math.sqrt(uGearbox).toFixed(2));
  const uStage2 = parseFloat((uGearbox / uStage1).toFixed(2));
  const ratios = [uBelt, uStage1, uStage2];

  const fallbackConfig: SystemConfig = {
    transmissionType: 'belt_vee',
    gearboxType: 'gear_spur',
    numGearStages: 2,
    numBearingPairs: 4,
    hasCoupling: true,
  };

  const localPower = calculateRequiredPower(Pt, fallbackConfig);
  const localSpeed = calculateSynchronousSpeed(n_iv, ratios);
  const motors = suggestMotors(Pct || localPower.Pct, n_sb || localSpeed.n_sb, 1.3);

  return {
    Pct: parseFloat((Pct || localPower.Pct).toFixed(4)),
    n_sb: parseFloat((n_sb || localSpeed.n_sb).toFixed(2)),
    motors,
    ratios,
  };
}

export function runMotorSelectionAndDynamics(
  motor: { power: number; speed: number },
  Pt: number,
  u_belt: number,
  u_stage1: number,
  u_stage2 = 1,
) {
  return calculateShaftDynamics({
    Pt,
    n_dc: motor.speed,
    u_belt,
    u_stage1,
    u_stage2,
    transmissionType: 'belt_vee',
    gearboxType: 'gear_spur',
  });
}
