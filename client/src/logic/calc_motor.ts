type DriveItem = {
	eta?: number | string;
	transmissionRatio?: number | string;
};

type CalcMotorInput = {
	power?: number | string;
	speed?: number | string;
	driveItem?: DriveItem[];
};

type CalcMotorResult = {
	systemEta: number;
	Pct: number;
	Ndb: number;
};

export const calc_motor = ({ power, speed, driveItem = [] }: CalcMotorInput): CalcMotorResult => {
	const inputPower = Number(power);
	const inputSpeed = Number(speed);

	const etaProduct = Array.isArray(driveItem) && driveItem.length > 0
		? driveItem.reduce((acc: number, item: DriveItem) => {
			const eta = Number(item?.eta);
			return eta > 0 ? acc * eta : acc;
		}, 1)
		: 1;

	const ratioProduct = Array.isArray(driveItem) && driveItem.length > 0
		? driveItem.reduce((acc: number, item: DriveItem) => {
			const ratio = Number(item?.transmissionRatio);
			return ratio > 0 ? acc * ratio : acc;
		}, 1)
		: 1;

	const calculatedPct = inputPower > 0 && etaProduct > 0 ? inputPower / etaProduct : 0;
	const calculatedNdb = inputSpeed > 0 ? inputSpeed * ratioProduct : 0;

	return {
		systemEta: etaProduct,
		Pct: calculatedPct,
		Ndb: calculatedNdb,
	};
};
