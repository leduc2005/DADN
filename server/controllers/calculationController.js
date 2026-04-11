/**
 * calculationController.js - Controller Module 2
 * Xử lý HTTP Request/Response, delegate logic sang Service layer
 * 
 * Nguyên tắc: Controller chỉ validate input và format output.
 *             Toàn bộ nghiệp vụ cơ khí nằm trong Service.
 */

const MotorService  = require('../services/MotorService');
const BeltService   = require('../services/BeltService');
const GearService   = require('../services/GearService');

// ============================================================
// MOTOR CONTROLLERS
// ============================================================

/**
 * POST /api/v1/calculation/motors/suggest
 * Tính Pct và đề xuất danh sách động cơ phù hợp
 *
 * Body: { Pt, systemConfig: { transmissionType, gearboxType, numGearStages,
 *           numBearingPairs, hasCoupling }, n_iv, ratios: [u_belt, u_gear1, u_gear2] }
 */
exports.suggestMotors = async (req, res) => {
  try {
    const { Pt, systemConfig, n_iv, ratios = [2.5, 3.5, 3.0], Tmm_over_T = 1.3 } = req.body;

    // --- Validation ---
    if (!Pt || !n_iv) {
      return res.status(400).json({ success: false, message: 'Thiếu trường bắt buộc: Pt (kW) và n_iv (v/ph)' });
    }
    if (Pt <= 0 || n_iv <= 0) {
      return res.status(400).json({ success: false, message: 'Pt và n_iv phải là số dương' });
    }

    // --- Tính công suất cần thiết ---
    const powerResult = MotorService.calculateRequiredPower(Pt, systemConfig ?? {});

    // --- Tính số vòng quay sơ bộ ---
    const speedResult = MotorService.calculateSynchronousSpeed(n_iv, ratios);

    // --- Đề xuất động cơ ---
    const candidates = MotorService.suggestMotors(powerResult.Pct, speedResult.n_sb, Tmm_over_T);

    if (candidates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm được động cơ phù hợp trong catalogue. Kiểm tra lại các tham số đầu vào.',
        calculation: { powerResult, speedResult },
      });
    }

    res.status(200).json({
      success: true,
      message: `Tìm được ${candidates.length} động cơ phù hợp`,
      calculation: { powerResult, speedResult },
      motors: candidates,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi Server', error: error.message });
  }
};

/**
 * POST /api/v1/calculation/motors/select
 * Người dùng chọn động cơ → Tính momen xoắn các trục
 *
 * Body: { Pt, n_dc, u_belt, u_stage1, u_stage2, transmissionType, gearboxType }
 */
exports.selectMotorAndCalculateShafts = async (req, res) => {
  try {
    const {
      Pt, n_dc,
      u_belt = 2.5, u_stage1 = 3.5, u_stage2 = 1,
      transmissionType = 'belt_vee',
      gearboxType = 'gear_spur',
    } = req.body;

    if (!Pt || !n_dc) {
      return res.status(400).json({ success: false, message: 'Thiếu trường: Pt và n_dc' });
    }

    const shafts = MotorService.calculateShaftDynamics({
      Pt, n_dc, u_belt, u_stage1, u_stage2, transmissionType, gearboxType,
    });

    const ratioDistribution = MotorService.distributeTransmissionRatio(n_dc, Pt / shafts.shafts.shaft3.P, u_belt);

    res.status(200).json({
      success: true,
      message: 'Tính toán thành công momen xoắn và tốc độ quay trên các trục',
      shafts: shafts.shafts,
      ratios: shafts.ratios,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi Server', error: error.message });
  }
};

// ============================================================
// BELT CONTROLLERS
// ============================================================

/**
 * GET /api/v1/calculation/belts/sections
 * Lấy danh sách loại tiết diện đai
 */
exports.getBeltSections = (req, res) => {
  res.status(200).json({
    success: true,
    sections: BeltService.getBeltSections(),
  });
};

/**
 * POST /api/v1/calculation/belts/calculate
 * Tính toán đầy đủ bộ truyền đai
 *
 * Body: { P1_kW, n1_rpm, u_dai, section?, engineType?, loadType?, epsilon? }
 */
exports.calculateBelt = async (req, res) => {
  try {
    const { P1_kW, n1_rpm, u_dai, section, engineType, loadType, epsilon } = req.body;

    if (!P1_kW || !n1_rpm || !u_dai) {
      return res.status(400).json({ success: false, message: 'Thiếu trường bắt buộc: P1_kW, n1_rpm, u_dai' });
    }
    if (P1_kW <= 0 || n1_rpm <= 0 || u_dai < 1) {
      return res.status(400).json({ success: false, message: 'P1_kW > 0, n1_rpm > 0, u_dai >= 1' });
    }

    const result = BeltService.calculateBeltTransmission({ P1_kW, n1_rpm, u_dai, section, engineType, loadType, epsilon });

    const statusCode = result.overall_pass ? 200 : 422;
    res.status(statusCode).json({
      success: result.overall_pass,
      message: result.overall_pass
        ? 'Thiết kế bộ truyền đai ĐẠT yêu cầu kỹ thuật'
        : `Bộ truyền đai KHÔNG ĐẠT: ${result.warnings.join(', ')}`,
      result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi Server', error: error.message });
  }
};

// ============================================================
// GEAR CONTROLLERS
// ============================================================

/**
 * GET /api/v1/calculation/gears/materials
 * Lấy danh sách vật liệu bánh răng
 */
exports.getGearMaterials = (req, res) => {
  res.status(200).json({
    success: true,
    materials: GearService.getGearMaterials(),
  });
};

/**
 * POST /api/v1/calculation/gears/calculate
 * Tính toán và kiểm nghiệm bánh răng trụ
 *
 * Body: { mat1Id, mat2Id, T1_Nmm, n1_rpm, u, L_hours, gearType?, bearingPos?, loadProfile? }
 */
exports.calculateGear = async (req, res) => {
  try {
    const {
      mat1Id, mat2Id,
      T1_Nmm, n1_rpm, u, L_hours,
      gearType = 'spur_symmetric',
      bearingPos = 'symmetric',
      loadProfile = null,
    } = req.body;

    // --- Validation ---
    const required = { mat1Id, mat2Id, T1_Nmm, n1_rpm, u, L_hours };
    const missing = Object.entries(required).filter(([, v]) => v === undefined || v === null).map(([k]) => k);
    if (missing.length > 0) {
      return res.status(400).json({ success: false, message: `Thiếu trường bắt buộc: ${missing.join(', ')}` });
    }
    if (T1_Nmm <= 0 || n1_rpm <= 0 || u < 1 || L_hours <= 0) {
      return res.status(400).json({ success: false, message: 'T1_Nmm, n1_rpm, L_hours phải > 0 và u >= 1' });
    }

    const result = GearService.calculateGearFull({
      mat1Id, mat2Id, T1_Nmm, n1_rpm, u, L_hours, gearType, bearingPos, loadProfile,
    });

    const statusCode = result.overall_pass ? 200 : 422;
    res.status(statusCode).json({
      success: result.overall_pass,
      message: result.verdict,
      result,
    });
  } catch (error) {
    if (error.message.includes('không tồn tại')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Lỗi Server', error: error.message });
  }
};
