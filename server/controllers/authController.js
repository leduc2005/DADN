const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. API: Đăng Ký (Register)
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Kiểm tra xem email đã tồn tại chưa
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Email này đã được sử dụng!' });
        }

        // Mã hóa mật khẩu bằng bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user mới
        const user = await User.create({ 
            name, 
            email, 
            password: hashedPassword 
        });
        
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
        
        // Tìm User theo email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Sai thẻ email hoặc mật khẩu!' });
        }

        // So sánh mật khẩu nhập vào và mật khẩu đã mã hóa trong DB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Sai thẻ email hoặc mật khẩu!' });
        }
        
        // Tạo JWT Token có thời hạn 30 ngày
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        
        res.status(200).json({ 
            message: 'Đăng nhập thành công', 
            token, // Gửi thẻ token về lại cho Frontend (Mobile)
            user: { id: user._id, name: user.name, email: user.email } 
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi Server Backend', error: error.message });
    }
};

// 3. API: Quên mật khẩu (Gửi mã OTP)
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if(!user) {
            return res.status(404).json({ message: "Không tìm thấy tài khoản với email này!" });
        }
        
        // TODO: Ở đồ án thực tế, chỗ này sẽ dùng Nodemailer để gửi code 6 số vào email thật.
        // Tạm thời ta giả lập hệ thống đã sinh ra mã "123456" và báo thành công.
        
        res.status(200).json({ message: "Mã xác nhận (OTP) đã được gửi đến email của bạn!", tempCode: "123456" });
    } catch(error) {
        res.status(500).json({ message: 'Lỗi Server Backend', error: error.message });
    }
};

// 4. API: Đặt lại mật khẩu mới
exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });
        
        if(!user) return res.status(404).json({ message: "Người dùng không tồn tại!" });

        // Cập nhật và mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: "Đổi mật khẩu thành công! Giờ hãy đăng nhập lại." });
    } catch(error) {
         res.status(500).json({ message: 'Lỗi Server Backend', error: error.message });
    }
};
