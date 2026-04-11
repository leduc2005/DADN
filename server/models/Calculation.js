/**
 * Calculation.js - Mongoose Model cho kết quả tính toán Module 2
 * Lưu trữ toàn bộ snapshot kết quả cho mỗi phiên tính toán của 1 user
 */

const mongoose = require('mongoose');

// ============================================================
// SUB-SCHEMAS (nhúng vào document chính)
// ============================================================

const ShaftDataSchema = new mongoose.Schema({
  n: Number,  // Tốc độ quay [v/ph]
  P: Number,  // Công suất [kW]
  T: Number,  // Momen xoắn [N.mm]
  label: String,
}, { _id: false });

const MotorResultSchema = new mongoose.Schema({
  selectedMotorModel: String, // Ký hiệu động cơ được chọn
  Pct: Number,                // Công suất cần thiết [kW]
  eta_total: Number,          // Hiệu suất tổng
  n_sb: Number,               // Số vòng quay sơ bộ [v/ph]
  u_total: Number,            // Tỉ số truyền tổng
  u_belt: Number,
  u_stage1: Number,
  u_stage2: Number,
  shafts: {
    motor: ShaftDataSchema,
    shaft1: ShaftDataSchema,
    shaft2: ShaftDataSchema,
    shaft3: ShaftDataSchema,
  },
}, { _id: false });

const BeltResultSchema = new mongoose.Schema({
  section: String,    // Loại đai: O, A, B, C, D
  d1: Number,         // Đường kính bánh dẫn [mm]
  d2: Number,         // Đường kính bánh bị dẫn [mm]
  L: Number,          // Chiều dài đai tiêu chuẩn [mm]
  a: Number,          // Khoảng cách trục thực tế [mm]
  alpha1_deg: Number, // Góc ôm [độ]
  z: Number,          // Số đai
  Ft: Number,         // Lực vòng [N]
  Fr: Number,         // Lực hướng tâm [N]
  overall_pass: Boolean,
  warnings: [String],
}, { _id: false });

const GearResultSchema = new mongoose.Schema({
  mat1Id: String,
  mat2Id: String,
  m_n: Number,          // Module tiêu chuẩn [mm]
  z1: Number,           // Số răng bánh dẫn
  z2: Number,           // Số răng bánh bị dẫn
  aw: Number,           // Khoảng cách trục [mm]
  bw: Number,           // Chiều rộng vành răng [mm]
  d1: Number,           // Đường kính vòng chia [mm]
  d2: Number,
  sigma_H: Number,      // Ứng suất tiếp xúc tính được [MPa]
  sigmaH_allow: Number, // Ứng suất tiếp xúc cho phép [MPa]
  sigma_F1: Number,
  sigma_F2: Number,
  sigmaF1_allow: Number,
  sigmaF2_allow: Number,
  overall_pass: Boolean,
  warnings: [String],
}, { _id: false });

// ============================================================
// SCHEMA CHÍNH
// ============================================================

const CalculationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  projectName: {
    type: String,
    required: [true, 'Tên bài toán không được để trống'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'failed'],
    default: 'in_progress',
  },
  // Dữ liệu đầu vào (từ Module 1)
  inputData: {
    Pt: Number,        // Công suất công tác [kW]
    n_iv: Number,      // Tốc độ trục công tác [v/ph]
    L_hours: Number,   // Tuổi thọ [giờ]
    loadType: String,  // 'smooth' | 'light_shock' | 'heavy_shock'
  },
  // Kết quả từng giai đoạn
  motorResult: MotorResultSchema,
  beltResult:  BeltResultSchema,
  gearResult:  GearResultSchema,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Cập nhật updatedAt trước mỗi lần save
CalculationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Calculation', CalculationSchema);
