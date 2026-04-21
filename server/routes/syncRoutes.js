const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware kiểm tra JWT
const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Không có token xác thực!' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch {
        return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
};

// POST /api/sync/project — Nhận 1 dự án từ client và lưu lịch sử
router.post('/project', protect, async (req, res) => {
    try {
        const { localId, name, inputData, createdAt } = req.body;
        // Hiện tại lưu vào log — sau này có thể lưu vào MongoDB
        // khi Calculation model đã sẵn sàng (Module 2 backend)
        console.log(`[SYNC] User ${req.userId} synced project "${name}" (localId: ${localId})`);
        res.status(200).json({ message: 'Đồng bộ thành công!', localId });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi đồng bộ', error: error.message });
    }
});

module.exports = router;
