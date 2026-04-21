const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// ─── Cấu hình Nodemailer dùng Gmail App Password ───────────────────────────
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ─── Helper: Tạo OTP 6 chữ số ngẫu nhiên ──────────────────────────────────
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. API: Đăng Ký (Register)
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email này đã được sử dụng!' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({ name, email, password: hashedPassword });
        res.status(201).json({
            message: 'Đăng ký tài khoản thành công!',
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi Server Backend!', error: error.message });
    }
};

// 2. API: Đăng Nhập (Login)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Sai email hoặc mật khẩu!' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Sai email hoặc mật khẩu!' });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(200).json({
            message: 'Đăng nhập thành công',
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi Server Backend', error: error.message });
    }
};

// 3. API: Quên mật khẩu — Tạo OTP thật và gửi email
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này!' });
        }

        // Tạo OTP 6 số + thời hạn 10 phút
        const otp = generateOTP();
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

        // Lưu OTP vào DB
        user.resetCode = otp;
        user.resetCodeExpiry = expiry;
        await user.save();

        // Gửi email thật qua Nodemailer
        await transporter.sendMail({
            from: `"DADN Mixer System" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Mã xác nhận đặt lại mật khẩu',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #1976D2;">Đặt lại mật khẩu</h2>
                    <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản DADN.</p>
                    <p>Mã xác nhận của bạn là:</p>
                    <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px;
                                color: #1976D2; text-align: center; padding: 16px;
                                background: #eff6ff; border-radius: 8px; margin: 16px 0;">
                        ${otp}
                    </div>
                    <p style="color: #64748b; font-size: 14px;">
                        Mã có hiệu lực trong <strong>10 phút</strong>.<br>
                        Nếu bạn không yêu cầu, hãy bỏ qua email này.
                    </p>
                </div>
            `,
        });

        res.status(200).json({ message: 'Mã xác nhận đã được gửi đến email của bạn!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi gửi email!', error: error.message });
    }
};

// 4. API: Xác minh OTP — Kiểm tra với DB (không hardcode)
exports.verifyCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });

        // Kiểm tra OTP có khớp không
        if (user.resetCode !== code) {
            return res.status(400).json({ message: 'Mã OTP không đúng!' });
        }

        // Kiểm tra OTP có còn hạn không
        if (!user.resetCodeExpiry || user.resetCodeExpiry < new Date()) {
            return res.status(400).json({ message: 'Mã OTP đã hết hạn! Vui lòng yêu cầu mã mới.' });
        }

        res.status(200).json({ message: 'Xác minh thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi Server Backend', error: error.message });
    }
};

// 5. API: Đặt lại mật khẩu mới
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại!' });

        // Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Xóa OTP sau khi dùng xong
        user.resetCode = null;
        user.resetCodeExpiry = null;
        await user.save();

        res.status(200).json({ message: 'Đổi mật khẩu thành công! Hãy đăng nhập lại.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi Server Backend', error: error.message });
    }
};
