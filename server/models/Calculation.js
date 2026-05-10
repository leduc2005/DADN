const mongoose = require('mongoose');

const CalculationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 'ĐANG THỰC HIỆN',
  },
  inputData: {
    type: mongoose.Schema.Types.Mixed, // Lưu toàn bộ JSON linh hoạt
  },
  resultData: {
    type: mongoose.Schema.Types.Mixed, // Lưu toàn bộ JSON linh hoạt
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

CalculationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Calculation', CalculationSchema);
