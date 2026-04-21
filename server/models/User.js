const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vui lòng nhập họ tên'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Vui lòng nhập email'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Vui lòng nhập mật khẩu']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Lưu OTP quên mật khẩu tạm thời (hết hạn sau 10 phút)
    resetCode: {
        type: String,
        default: null
    },
    resetCodeExpiry: {
        type: Date,
        default: null
    }

});

module.exports = mongoose.model('User', UserSchema);
