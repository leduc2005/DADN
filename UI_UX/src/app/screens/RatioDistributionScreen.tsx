import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

export function RatioDistributionScreen() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    motorModel = "4A112M2Y3",
    nDc = 2922, // n động cơ
    nLv = 69.9 // n làm việc (output)
  } = location.state || {};

  // Tính tỷ số truyền chung
  const uC = nDc / nLv;

  const [uHop, setUHop] = useState(11.25); // Tỷ số HGT (mặc định)
  const [uNgoai, setUNgoai] = useState(uC / 11.25); // Tỷ số ngoài (đai/xích)
  const [deltaN, setDeltaN] = useState(0);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Tự động tính u_ngoai khi u_hop thay đổi
    const calculatedUNgoai = uC / uHop;
    setUNgoai(calculatedUNgoai);

    // Tính n thực tế
    const nTt = nDc / (uHop * calculatedUNgoai);

    // Tính sai số Δn
    const error = Math.abs((nTt - nLv) / nLv) * 100;
    setDeltaN(error);

    // Kiểm tra điều kiện Δn ≤ 4%
    setIsValid(error <= 4);
  }, [uHop, uC, nDc, nLv]);

  const handleConfirm = () => {
    if (isValid) {
      navigate("/kinematic-results", {
        state: {
          motorModel,
          nDc,
          uHop,
          uNgoai,
        },
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Ratio Distribution</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Khối thông số tổng */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100"
        >
          <p className="text-sm text-blue-700 mb-2 font-medium">Tổng tỷ số truyền</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-900">{uC.toFixed(2)}</span>
            <span className="text-sm text-blue-600">= n<sub>dc</sub> / n<sub>lv</sub></span>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            {nDc} rpm / {nLv} rpm
          </p>
        </motion.div>

        {/* Khu vực điều chỉnh */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-5 mb-4 border border-gray-200"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Phân phối tỷ số truyền</h3>

          {/* u_hop - Tỷ số HGT */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tỷ số truyền Hộp giảm tốc (u<sub>hop</sub>)
            </label>
            <input
              type="number"
              step="0.1"
              min="8"
              max="40"
              value={uHop}
              onChange={(e) => setUHop(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
            />
            <p className="text-xs text-gray-500 mt-1.5">Thường trong khoảng 8 - 40</p>
          </div>

          {/* u_ngoai - Tỷ số ngoài (tự động) */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tỷ số truyền Bộ truyền ngoài (u<sub>ngoai</sub>)
            </label>
            <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-lg font-semibold text-gray-700">
              {uNgoai.toFixed(3)}
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              Tự động = u<sub>c</sub> / u<sub>hop</sub>
            </p>
          </div>

          {/* Slider cho u_hop để dễ điều chỉnh */}
          <div className="mt-4">
            <input
              type="range"
              min="8"
              max="40"
              step="0.5"
              value={uHop}
              onChange={(e) => setUHop(parseFloat(e.target.value))}
              className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>8</span>
              <span>24</span>
              <span>40</span>
            </div>
          </div>
        </motion.div>

        {/* Hộp Cảnh báo Sai số */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`rounded-xl p-5 border-2 transition-all ${
            isValid
              ? "bg-green-50 border-green-500"
              : "bg-red-50 border-red-500"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isValid ? "bg-green-500" : "bg-red-500"
            }`}>
              {isValid ? (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold mb-1 ${
                isValid ? "text-green-900" : "text-red-900"
              }`}>
                {isValid ? "Pass" : "Fail"}
              </h4>
              <p className={`text-sm mb-2 ${
                isValid ? "text-green-700" : "text-red-700"
              }`}>
                {isValid
                  ? "Sai số vòng quay nằm trong ngưỡng cho phép."
                  : "Sai số vượt quá 4%. Vui lòng điều chỉnh lại tỷ số truyền."}
              </p>
              <div className={`text-2xl font-bold ${
                isValid ? "text-green-900" : "text-red-900"
              }`}>
                Δn = {deltaN.toFixed(2)}%
              </div>
              <p className="text-xs mt-1 text-gray-600">
                Yêu cầu: Δn ≤ 4%
              </p>
            </div>
          </div>
        </motion.div>

        <div className="h-24" />
      </div>

      {/* Footer Button */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className={`w-full py-3.5 font-semibold rounded-lg transition-all ${
            isValid
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Confirm Ratios
        </button>
      </div>
    </div>
  );
}
