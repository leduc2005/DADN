
type DriveItem = {
	type ?: string;
	efficiencyTransmissionRatio?: number | string;
	quantity?: number | string;
	transmissionRatio?: number | string;
};

type BearingItem = {
	type?: string;
	efficiencyTransmissionRatio?: number | string;
	quantity?: number | string;
	transmissionRatio?: number | string;
};

type CalcMotorInput = {
	power?: number | string;
	speed?: number | string;
	driveItem?: DriveItem[];
	bearingItem?: BearingItem[];
};

type CalcMotorResult = {
	systemEfficiency: number;
	Pct: number;
	Nsb: number;
};

type Point = [number, number]; 

const data: Record<number, [number, number][]> = {
  60: [
    [7, 1.7],[10, 2.0],[15, 2.8],[20, 3.6],[25, 4.4],
    [30, 4.8],[35, 5.4],[40, 5.9],[45, 6.5],[50, 7.0],[60, 8.0],
  ],
  50: [
    [7, 1.9],[10, 2.2],[15, 3.0],[20, 3.8],[25, 4.5],
    [30, 5.1],[35, 5.6],[40, 6.4],[45, 7.2],[50, 7.6],[5.4, 8.0],
  ],
  40: [
    [7, 2.1],[10, 2.4],[15, 3.3],[20, 4.2],[25, 5.1],
    [30, 5.9],[35, 6.6],[40, 7.2],[45, 7.6],[50, 8.0],
  ],
  30: [
    [7, 2.3],[10, 2.6],[15, 3.5],[20, 4.4],[25, 5.2],
    [30, 5.9],[35, 6.6],[40, 7.3],[46, 8.0]
  ],
  20: [
    [7, 2.5],[10, 3.0],[15, 4.0],[20, 4.7],[25, 5.7],
    [30, 5.9],[35, 7.1],[38, 8.0],
  ],
  15: [
    [7, 2.7],[10, 3.3],[15, 4.4],[20, 5.2],[25, 6.2],
    [30, 6.9],[34, 7.6], [36, 8] 
  ],
  10: [
    [7, 2.9],[10, 3.7],[15, 4.6],[20, 5.9],[25, 6.1],
    [30, 7.5],[34, 8],
  ],
};

function interp1D(points: Point[], uh: number): number | null {
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];

    if (uh >= x1 && uh <= x2) {
      return y1 + (y2 - y1) * (uh - x1) / (x2 - x1);
    }
  }
  return null; 
}


function getU1(lambda: number, uh: number): number | null {
  const lambdas = Object.keys(data)
    .map(Number)
    .sort((a, b) => a - b);

  for (let i = 0; i < lambdas.length - 1; i++) {
    const l1 = lambdas[i];
    const l2 = lambdas[i + 1];

    if (lambda >= l1 && lambda <= l2) {
      const u1_l1 = interp1D(data[l1], uh);
      const u1_l2 = interp1D(data[l2], uh);

      if (u1_l1 === null || u1_l2 === null) return null;

      return u1_l1 + (u1_l2 - u1_l1) * (lambda - l1) / (l2 - l1);
    }
  }

  return null; 
}

export const calc_motor = ({ power, speed, driveItem = [], bearingItem = [] }: CalcMotorInput): CalcMotorResult => {
	const inputPower = Number(power);
	const inputSpeed = Number(speed);

	console.log('Input Power:', inputPower, 'Input Speed:', inputSpeed);
	console.log('Drive Items:', driveItem);
	console.log('Bearing Items:', bearingItem);
	
	const etaProduct = Array.isArray(driveItem) && driveItem.length > 0
		? driveItem.reduce((acc: number, item: DriveItem) => {
			const efficiency = Number(item?.efficiencyTransmissionRatio);
			return efficiency > 0 ? acc * Math.pow(efficiency, Number(item.quantity) || 1) : acc;
		}, 1)
		: 1;

	const bearingEtaProduct = Array.isArray(bearingItem) && bearingItem.length > 0
		? bearingItem.reduce((acc: number, item: BearingItem) => {
			const efficiency = Number(item?.efficiencyTransmissionRatio);
			return efficiency > 0 ? acc * Math.pow(efficiency, Number(item.quantity) || 1) : acc;
		}, 1)
		: 1;

	const ratioProduct = Array.isArray(driveItem) && driveItem.length > 0
		? driveItem.reduce((acc: number, item: DriveItem) => {
			const ratio = Number(item?.transmissionRatio);
			return ratio > 0 ? acc * Math.pow(ratio, Number(item.quantity) || 1) : acc;
		}, 1)
		: 1;

	console.log('Drive Efficiency Product:', ratioProduct);
	console.log('Bearing Efficiency Product:', bearingEtaProduct);
	console.log('Drive Efficiency Product:', etaProduct);

	const systemEfficiency = etaProduct * bearingEtaProduct * 0.99;

	const calculatedPct = inputPower > 0 && etaProduct > 0 ? inputPower /  systemEfficiency : 0;
	const calculatedNsb = inputSpeed > 0 ? inputSpeed * ratioProduct : 0;

	console.log(systemEfficiency, calculatedPct, calculatedNsb);

	return {
		systemEfficiency: systemEfficiency,
		Pct: calculatedPct,
		Nsb: calculatedNsb,
	};
};

export const calc_system_transmission = (
	ud : number | string, 
	ndc : number | string,
	nlv : number | string,
	ck : number | string,
	kbe : number | string,
	psibd2 : number | string,
	driveItem : DriveItem[],
	bearingItem : BearingItem[],
	p : number | string
	) : { 
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

		tdc : number;
		t1 : number;
		t2 : number;
		t3 : number;    
	}  => {
		
		const udNum = Number(ud);
		const ndcNum = Number(ndc);
		const nlvNum = Number(nlv);
		const ckNum = Number(ck);
		const kbeNum = Number(kbe);
		const psibd2Num = Number(psibd2);
		const pNum = Number(p);

		console.log('Input Parameters:', { ud: udNum, ndc: ndcNum, nlv: nlvNum, ck: ckNum, kbe: kbeNum, psibd2: psibd2Num });


		const uh = ( ndcNum / nlvNum ) / udNum;    				// ut = ndc / nlv ; uh = ut / ud 
		const lambdak_cubedCk = ( 2.25 * psibd2Num ) * Math.pow(ckNum, 3) /  (( 1 - kbeNum) * kbeNum)
	
		const u1 = getU1(lambdak_cubedCk, uh) || 0;
		const u2 = uh / u1;

		const n1 = ndcNum / udNum;
		const n2 = n1 / u1;
		const n3 = n2 / u2;

		const efficiency = bearingItem[0]?.efficiencyTransmissionRatio;
		const efficiencyNum = efficiency !== undefined && !isNaN(Number(efficiency)) && Number(efficiency) !== 0 ? Number(efficiency) : 1;
		
		const p3 = pNum / (efficiencyNum * 0.99) ;

		const etabrt = driveItem.find(item => item.type === "Bánh răng trụ")?.efficiencyTransmissionRatio ? Number(driveItem.find(item => item.type === "Bánh răng trụ")?.efficiencyTransmissionRatio) : 1;
		
		const p2 = p3 / ( efficiencyNum * etabrt );
	
		const p1 = p2 / ( efficiencyNum * etabrt );

		const etabrc = driveItem.find(item => item.type === "Bánh răng côn")?.efficiencyTransmissionRatio ? Number(driveItem.find(item => item.type === "Bánh răng côn")?.efficiencyTransmissionRatio) : 1;
		const pdc = p1 / ( efficiencyNum * etabrc );


		const t1 = 9.55 * Math.pow(10, 6) * p1 / n1;
		const t2 = 9.55 * Math.pow(10, 6) * p2 / n2;
		const t3 = 9.55 * Math.pow(10, 6) * p3 / n3;
		const tdc = 9.55 * Math.pow(10, 6) * pdc / ndcNum;

		console.log({ uh, u1, u2, Pdc: pdc, P1: p1, P2: p2, P3: p3, ndc: ndcNum, n1, n2, n3, tdc, t1, t2, t3 });
	
		return {
			uh: uh,
			u1: u1,
			u2: u2,
			Pdc: pdc,
			P1: p1,
			P2: p2,
			P3: p3,
			ndc: ndcNum,
			n1: n1,
			n2: n2,
			n3: n3,
			tdc: tdc,
			t1: t1,
			t2: t2,
			t3: t3,
		};
};