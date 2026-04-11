import { motion } from "motion/react";
import { useState } from "react";
import { selectMotorAndCalculate, mapSelectedMotorToPayload } from "../../services/calculationApi";

interface Motor {
  id: number;
  model: string;
  power: number;
  speed: number;
  torqueRatio: number;
}

interface MotorSelectionScreenProps {
  navigate: (screen: "home" | "input" | "motor-selection" | "kinematic-results", state?: any) => void;
  state: any;
}

export function MotorSelectionScreen({ navigate, state }: MotorSelectionScreenProps) {
  const {
    calculatedPower = 6.21,
    requiredSpeed = 1450,
    motors: apiMotors = [],     // Danh sách máy động cơ thật từ API
    inputData = {},
  } = state || {};

  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fall-back sang danh sách cứng khi chỡ Backend (dev mode)
  const motors: Motor[] = apiMotors.length > 0
    ? apiMotors.map((m: any, i: number) => ({
        id: i + 1,
        model: m.model,
        power: m.power,
        speed: m.speed,
        torqueRatio: m.Tmm_Tdn ?? m.torqueRatio ?? 2.2,
      }))
    : [
        { id: 1, model: "4A112M2Y3", power: 7.5, speed: 2922, torqueRatio: 2.2 },
        { id: 2, model: "4A132S4Y3", power: 7.5, speed: 1440, torqueRatio: 1.8 },
        { id: 3, model: "4A100L2Y3", power: 5.5, speed: 2880, torqueRatio: 2.5 },
        { id: 4, model: "4A132M4Y3", power: 11,  speed: 1460, torqueRatio: 1.5 },
      ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center border-b border-gray-200">
        <button
          onClick={() => navigate("input")}
          className="w-9 h-9 -ml-2 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="ml-2 text-xl font-semibold text-gray-900">Select Motor</h1>
      </div>

      {/* Calculated Requirements Banner */}
      <div className="bg-blue-50 px-6 py-3 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-700 mb-0.5">Required Power (P<sub>ct</sub>)</p>
            <p className="text-base font-bold text-blue-900">{calculatedPower.toFixed(2)} kW</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-700 mb-0.5">Required Speed (n<sub>sb</sub>)</p>
            <p className="text-base font-bold text-blue-900">{requiredSpeed.toFixed(0)} rpm</p>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold">
              1
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium text-gray-900">Motor</p>
            </div>
          </div>

          <div className="flex-1 h-0.5 bg-gray-200 mx-2" />

          <div className="flex items-center flex-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-500 text-sm font-semibold">
              2
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium text-gray-400">Belt</p>
            </div>
          </div>

          <div className="flex-1 h-0.5 bg-gray-200 mx-2" />

          <div className="flex items-center flex-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-500 text-sm font-semibold">
              3
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium text-gray-400">Gear</p>
            </div>
          </div>
        </div>
      </div>

      {/* Motor List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-3">
          {motors.map((motor, index) => (
            <motion.div
              key={motor.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white rounded-xl p-4 border-2 transition-all ${
                selectedMotor?.id === motor.id
                  ? "border-blue-600 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Model: {motor.model}</h3>
                </div>
                <button
                  onClick={() => handleSelectMotor(motor)}
                  className={`px-4 py-1.5 rounded-lg font-medium text-sm transition-colors ${
                    selectedMotor?.id === motor.id
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  {selectedMotor?.id === motor.id ? "Selected" : "Select"}
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-28">Power:</span>
                  <span className="font-medium text-gray-900">{motor.power} kW</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-28">Speed:</span>
                  <span className="font-medium text-gray-900">{motor.speed} rpm</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="text-gray-500 w-28">Torque Ratio:</span>
                  <span className="font-medium text-gray-900">{motor.torqueRatio}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Continue Button (only show when motor selected) */}
      {selectedMotor && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="p-6 bg-white border-t border-gray-200"
        >
          <button
            disabled={isLoading}
            onClick={async () => {
              setIsLoading(true);
              try {
                const payload = mapSelectedMotorToPayload(
                  selectedMotor,
                  inputData.Pt ?? calculatedPower,
                  inputData.ratios?.[0] ?? 2.5,
                  inputData.ratios?.[1] ?? 3.71,
                  inputData.ratios?.[2] ?? 1
                );
                const result = await selectMotorAndCalculate(payload);
                navigate("kinematic-results", {
                  motorModel: selectedMotor.model,
                  nDc: selectedMotor.speed,
                  motorPower: selectedMotor.power,
                  shafts: result.shafts,         // Dữ liệu trục thật từ API
                  ratios: result.ratios,
                  uHop: result.ratios?.u_stage1 * (result.ratios?.u_stage2 ?? 1) ?? 11.25,
                  uNgoai: result.ratios?.u_belt ?? 2.5,
                });
              } catch {
                navigate("kinematic-results", {
                  motorModel: selectedMotor.model,
                  nDc: selectedMotor.speed,
                  motorPower: selectedMotor.power,
                  uHop: 11.25,
                  uNgoai: 2.5,
                });
              } finally {
                setIsLoading(false);
              }
            }}
            className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Đang tính..." : "Continue to Kinematic Results"}
          </button>
        </motion.div>
      )}
    </div>
  );
}
