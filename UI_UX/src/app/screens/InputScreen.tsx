import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { suggestMotors, mapInputScreenToSuggestPayload } from "../../services/calculationApi";

interface InputScreenProps {
  navigate: (screen: "home" | "input" | "motor-selection" | "kinematic-results", state?: any) => void;
}

export function InputScreen({ navigate }: InputScreenProps) {
  // Khối 1 - Operating Parameters
  const [operatingData, setOperatingData] = useState({
    power: "", // P (kW)
    speed: "", // n (v/ph)
    serviceLife: "", // L (năm)
  });

  // Khối 2 - Load Conditions
  const [loadType, setLoadType] = useState(""); // Đặc tính tải
  const [workShifts, setWorkShifts] = useState(""); // Số ca

  // Khối 3 - Kinematic Scheme Configuration (theo nhóm cụ thể)
  const [efficiencyData, setEfficiencyData] = useState({
    etaBelt: "0.96", // η Đai
    etaBevelGear: "0.97", // η Bánh răng Côn
    etaStraightGear: "0.98", // η Bánh răng Trụ
    etaBearing: "0.995", // η Ổ lăn
    etaCoupling: "0.99", // η Khớp nối
    uBelt: "4", // u Đai
    uGearbox: "10", // u HGT
  });

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorType, setErrorType] = useState<"empty" | "format" | "threshold" | "server">("empty");
  const [errorSuggestion, setErrorSuggestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadTypeOptions = [
    "Tải êm",
    "Tải va đập nhẹ",
    "Tải va đập vừa",
    "Tải va đập nặng",
  ];

  const workShiftOptions = ["1 ca", "2 ca", "3 ca"];

  const validateAndCalculate = async () => {
    // TẦNG 1: LỖI RỖNG (Empty validation)
    if (!operatingData.power || !operatingData.speed || !operatingData.serviceLife) {
      setErrorType("empty");
      setErrorMessage("Thiếu dữ liệu bắt buộc");
      setErrorSuggestion("Vui lòng nhập đầy đủ Công suất (P), Vòng quay (n) và Thời gian phục vụ (L)");
      setShowErrorModal(true);
      return;
    }

    if (!loadType || !workShifts) {
      setErrorType("empty");
      setErrorMessage("Thiếu dữ liệu bắt buộc");
      setErrorSuggestion("Vui lòng chọn đặc tính tải và số ca làm việc");
      setShowErrorModal(true);
      return;
    }

    // TẦNG 2: LỖI ĐỊNH DẠNG (Format validation)
    const power = parseFloat(operatingData.power);
    const speed = parseFloat(operatingData.speed);
    const serviceLife = parseFloat(operatingData.serviceLife);

    if (isNaN(power) || isNaN(speed) || isNaN(serviceLife)) {
      setErrorType("format");
      setErrorMessage("Sai kiểu dữ liệu");
      setErrorSuggestion("Công suất, Vòng quay và Thời gian phục vụ phải là số hợp lệ");
      setShowErrorModal(true);
      return;
    }

    // TẦNG 3: LỖI NGƯỠNG VẬT LÝ (Physical threshold validation)
    if (power <= 0 || power > 500) {
      setErrorType("threshold");
      setErrorMessage("Dữ liệu phi thực tế");
      setErrorSuggestion("Công suất phải nằm trong khoảng 0.1 - 500 kW. Đối với hệ thống công nghiệp nhỏ, công suất thường từ 0.5 - 50 kW.");
      setShowErrorModal(true);
      return;
    }

    if (speed <= 0 || speed > 10000) {
      setErrorType("threshold");
      setErrorMessage("Dữ liệu phi thực tế");
      setErrorSuggestion("Vòng quay phải nằm trong khoảng 10 - 10000 rpm. Động cơ điện thường có vòng quay 750, 1000, 1500, hoặc 3000 rpm.");
      setShowErrorModal(true);
      return;
    }

    if (serviceLife <= 0 || serviceLife > 50) {
      setErrorType("threshold");
      setErrorMessage("Dữ liệu phi thực tế");
      setErrorSuggestion("Thời gian phục vụ thường từ 1 - 25 năm cho máy công nghiệp thông thường.");
      setShowErrorModal(true);
      return;
    }

    // All validations passed - gọi API thật
    setIsLoading(true);
    try {
      const payload = mapInputScreenToSuggestPayload(
        {
          power: operatingData.power,
          speed: operatingData.speed,
          serviceLife: operatingData.serviceLife,
          loadType,
          workShifts,
        },
        efficiencyData
      );

      const result = await suggestMotors(payload);

      navigate("motor-selection", {
        calculatedPower: result.calculation?.powerResult?.Pct ?? power * 1.15,
        requiredSpeed: result.calculation?.speedResult?.n_sb ?? speed,
        motors: result.motors ?? [],         // Danh sách động cơ thật từ catalogue
        inputData: payload,                   // Lưu lại cho bước sau
        loadType,
        workShifts,
      });
    } catch (err: unknown) {
      setErrorType("server");
      setErrorMessage("Lỗi kết nối Server");
      setErrorSuggestion(
        err instanceof Error
          ? err.message
          : "Không thể kết nối đến Backend. Hãy kiểm tra server đang chạy tại localhost:5000."
      );
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center border-b border-gray-200">
        <button
          onClick={() => navigate("home")}
          className="w-9 h-9 -ml-2 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="ml-2 text-xl font-semibold text-gray-900">System Parameters</h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6">
          {/* KHỐI 1 - Operating Parameters (Thông số gốc) */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Thông số gốc</h3>
            <div className="space-y-4">
              {/* Power Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Công suất (P) - kW
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={operatingData.power}
                  onChange={(e) =>
                    setOperatingData({ ...operatingData, power: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập công suất"
                />
              </div>

              {/* Speed Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vòng quay (n) - v/ph
                </label>
                <input
                  type="number"
                  step="1"
                  value={operatingData.speed}
                  onChange={(e) =>
                    setOperatingData({ ...operatingData, speed: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập vòng quay"
                />
              </div>

              {/* Service Life Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian phục vụ (L) - năm
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={operatingData.serviceLife}
                  onChange={(e) =>
                    setOperatingData({ ...operatingData, serviceLife: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nhập thời gian"
                />
              </div>
            </div>
          </div>

          {/* KHỐI 2 - Load Conditions (Điều kiện tải) */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Điều kiện tải</h3>
            <div className="space-y-4">
              {/* Load Type Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đặc tính tải
                </label>
                <select
                  value={loadType}
                  onChange={(e) => setLoadType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Chọn đặc tính tải</option>
                  {loadTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Shifts Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số ca làm việc
                </label>
                <select
                  value={workShifts}
                  onChange={(e) => setWorkShifts(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="">Chọn số ca</option>
                  {workShiftOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* KHỐI 3 - Kinematic Scheme (Cấu hình Sơ đồ động) */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Cấu hình Sơ đồ động</h3>

            {/* Efficiency Coefficients Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  η Đai
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.5"
                  max="1"
                  value={efficiencyData.etaBelt}
                  onChange={(e) =>
                    setEfficiencyData({ ...efficiencyData, etaBelt: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  η Bánh răng Côn
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.5"
                  max="1"
                  value={efficiencyData.etaBevelGear}
                  onChange={(e) =>
                    setEfficiencyData({ ...efficiencyData, etaBevelGear: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  η Bánh răng Trụ
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.5"
                  max="1"
                  value={efficiencyData.etaStraightGear}
                  onChange={(e) =>
                    setEfficiencyData({ ...efficiencyData, etaStraightGear: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  η Ổ lăn
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.5"
                  max="1"
                  value={efficiencyData.etaBearing}
                  onChange={(e) =>
                    setEfficiencyData({ ...efficiencyData, etaBearing: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  η Khớp nối
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.5"
                  max="1"
                  value={efficiencyData.etaCoupling}
                  onChange={(e) =>
                    setEfficiencyData({ ...efficiencyData, etaCoupling: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Preliminary Transmission Ratios */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  u Đai
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={efficiencyData.uBelt}
                  onChange={(e) =>
                    setEfficiencyData({ ...efficiencyData, uBelt: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  u HGT
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="50"
                  value={efficiencyData.uGearbox}
                  onChange={(e) =>
                    setEfficiencyData({ ...efficiencyData, uGearbox: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="p-6 bg-white border-t border-gray-200">
        <button
          onClick={validateAndCalculate}
          disabled={isLoading}
          className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Đang tính toán...
            </>
          ) : (
            "Calculate Requirement"
          )}
        </button>
      </div>

      {/* Error Modal */}
      <AnimatePresence>
        {showErrorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
            onClick={() => setShowErrorModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="flex flex-col items-center text-center">
                {/* Icon thay đổi theo loại lỗi */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  errorType === "empty" ? "bg-yellow-100" :
                  errorType === "format" ? "bg-orange-100" :
                  "bg-red-100"
                }`}>
                  {errorType === "empty" ? (
                    // Icon Info cho lỗi rỗng
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : errorType === "format" ? (
                    // Icon X cho lỗi định dạng
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    // Icon Warning cho lỗi ngưỡng
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {errorMessage}
                </h3>

                {/* System Suggestion - chỉ hiện với lỗi ngưỡng */}
                {errorSuggestion && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left w-full">
                    <p className="text-xs font-semibold text-blue-900 mb-1">💡 Gợi ý hệ thống:</p>
                    <p className="text-xs text-blue-700 leading-relaxed">{errorSuggestion}</p>
                  </div>
                )}

                <div className="flex gap-3 w-full mt-2">
                  <button
                    onClick={() => setShowErrorModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setShowErrorModal(false)}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Data
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
