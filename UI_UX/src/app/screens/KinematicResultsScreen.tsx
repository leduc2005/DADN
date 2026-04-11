import { motion } from "motion/react";

interface ShaftData {
  title: string;
  subtitle?: string;
  ratio?: number;
  power: number;
  speed: number;
  torque: number;
}

interface KinematicResultsScreenProps {
  navigate: (screen: "home" | "input" | "motor-selection" | "kinematic-results", state?: any) => void;
  state: any;
}

export function KinematicResultsScreen({ navigate, state }: KinematicResultsScreenProps) {
  const {
    motorModel = "4A112M2Y3",
    nDc = 2922,
    motorPower = 7.5,
    uHop = 11.25,
    uNgoai = 2.5
  } = state || {};

  // Calculate shaft data based on actual transmission ratios (Backend đã tự động phân phối)
  const efficiencyBelt = 0.96;
  const efficiencyGear = 0.97;
  const efficiencyBearing = 0.99;

  // Assuming gearbox has 2 stages with total ratio uHop
  const uGear1 = Math.sqrt(uHop); // First gear stage
  const uGear2 = uHop / uGear1; // Second gear stage

  const shaftData: ShaftData[] = [
    {
      title: "Motor Shaft",
      subtitle: "Trục Động cơ",
      power: motorPower * 0.96, // Accounting for efficiency
      speed: nDc,
      torque: (motorPower * 0.96 * 9550) / nDc,
    },
    {
      title: "Shaft I (Input)",
      subtitle: "Trục vào HGT",
      ratio: uNgoai,
      power: motorPower * 0.96 * efficiencyBelt,
      speed: nDc / uNgoai,
      torque: (motorPower * 0.96 * efficiencyBelt * 9550) / (nDc / uNgoai),
    },
    {
      title: "Shaft II",
      subtitle: "Trục trung gian",
      ratio: uGear1,
      power: motorPower * 0.96 * efficiencyBelt * efficiencyGear * efficiencyBearing,
      speed: nDc / (uNgoai * uGear1),
      torque: (motorPower * 0.96 * efficiencyBelt * efficiencyGear * efficiencyBearing * 9550) / (nDc / (uNgoai * uGear1)),
    },
    {
      title: "Shaft III (Output)",
      subtitle: "Trục ra HGT",
      ratio: uGear2,
      power: motorPower * 0.96 * efficiencyBelt * Math.pow(efficiencyGear, 2) * Math.pow(efficiencyBearing, 2),
      speed: nDc / (uNgoai * uHop),
      torque: (motorPower * 0.96 * efficiencyBelt * Math.pow(efficiencyGear, 2) * Math.pow(efficiencyBearing, 2) * 9550) / (nDc / (uNgoai * uHop)),
    },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => navigate("motor-selection", state)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Kinematic Results</h1>
      </div>

      {/* Context Banner */}
      <div className="bg-blue-50 px-6 py-3 border-b border-blue-100">
        <p className="text-sm font-medium text-blue-900">
          Selected Motor: <span className="font-semibold">{motorModel}</span>
        </p>
      </div>

      {/* Stepper */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm font-medium text-green-700">1. Motor</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-sm font-semibold text-white">2</span>
            </div>
            <span className="text-sm font-medium text-blue-700">2. Belt</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-600">3</span>
            </div>
            <span className="text-sm font-medium text-gray-500">3. Gear</span>
          </div>
        </div>
      </div>

      {/* Shaft Data Cards */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-3 pb-20">
          {shaftData.map((shaft, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
            >
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900">{shaft.title}</h3>
                {shaft.subtitle && (
                  <p className="text-xs text-gray-500 mt-0.5">{shaft.subtitle}</p>
                )}
              </div>

              <div className="space-y-2">
                {shaft.ratio && (
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Tỉ số truyền (u)</span>
                    <span className="text-sm font-semibold text-gray-900">{shaft.ratio}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Công suất (P)</span>
                  <span className="text-sm font-semibold text-gray-900">{shaft.power.toFixed(3)} kW</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Vòng quay (n)</span>
                  <span className="text-sm font-semibold text-gray-900">{shaft.speed.toFixed(1)} v/ph</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-gray-600">Momen xoắn (T)</span>
                  <span className="text-sm font-semibold text-gray-900">{shaft.torque.toLocaleString('en-US', { maximumFractionDigits: 1 })} N·mm</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer Button */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <button
          onClick={() => {
            // TODO: Navigate to Belt Design screen
            alert("Belt Design screen coming soon!");
          }}
          className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          Proceed to Belt Design
        </button>
      </div>
    </div>
  );
}
