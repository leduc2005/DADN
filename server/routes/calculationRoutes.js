/**
 * calculationRoutes.js - Routes Module 2
 * Ánh xạ URL endpoints tới các Controller function
 */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/calculationController');

// TODO: Thêm middleware xác thực JWT khi tích hợp với Module 1
// const { protect } = require('../middlewares/authMiddleware');

// ============================================================
// MOTOR ROUTES - Giai đoạn 1
// ============================================================

// POST /api/v1/calculation/motors/suggest
// Tính P_ct và gợi ý danh sách động cơ phù hợp
router.post('/motors/suggest', ctrl.suggestMotors);

// POST /api/v1/calculation/motors/select
// Xác nhận chọn động cơ, tính momen và tốc độ trên các trục
router.post('/motors/select', ctrl.selectMotorAndCalculateShafts);

// ============================================================
// BELT ROUTES - Giai đoạn 2
// ============================================================

// GET /api/v1/calculation/belts/sections
// Lấy danh sách loại tiết diện đai có trong hệ thống
router.get('/belts/sections', ctrl.getBeltSections);

// POST /api/v1/calculation/belts/calculate
// Tính toán thiết kế & kiểm nghiệm bộ truyền đai
router.post('/belts/calculate', ctrl.calculateBelt);

// ============================================================
// GEAR ROUTES - Giai đoạn 3
// ============================================================

// GET /api/v1/calculation/gears/materials
// Lấy danh sách vật liệu để người dùng chọn
router.get('/gears/materials', ctrl.getGearMaterials);

// POST /api/v1/calculation/gears/calculate
// Tính toán & kiểm nghiệm bánh răng trụ
router.post('/gears/calculate', ctrl.calculateGear);

module.exports = router;
