// TODO: Triển khai thuật toán kiểm tra dữ liệu sau
import {
	BearingItem,
	DriveItem,
	EfficiencyData,
	LoadData,
	OperatingData,
} from '../store/projectState';

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

const toPositiveNumber = (value: string) => {
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

	const invalidDriveQty = driveItems.find(
		(item) => toPositiveNumber(item.quantity) === null,
	);
	if (invalidDriveQty) {
		return invalidResult(
			'format',
			'Số lượng bộ truyền động không hợp lệ',
			'Số lượng của mỗi bộ truyền động phải là số dương.',
		);
	}

	const invalidDriveRatio = driveItems.find(
		(item) => toPositiveNumber(item.transmissionRatio) === null,
	);
	if (invalidDriveRatio) {
		return invalidResult(
			'format',
			'Tỉ số truyền không hợp lệ',
			'Vui lòng nhập tỉ số truyền là số dương cho mỗi bộ truyền động.',
		);
	}

	const invalidBearingQty = bearingItems.find(
		(item) => toPositiveNumber(item.quantity) === null,
	);
	if (invalidBearingQty) {
		return invalidResult(
			'format',
			'Số lượng ổ truyền động không hợp lệ',
			'Số lượng của mỗi ổ truyền động phải là số dương.',
		);
	}

	const missingZ = driveItems.find(
		(item) => item.type === 'Trục vít không tự hãm' && !item.z,
	);
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
