const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Calculation = require('../models/Calculation');

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

// POST /api/v1/sync/project — Đồng bộ (Upsert) một dự án
router.post('/project', protect, async (req, res) => {
    try {
        const { sessionId, name, status, inputData, resultData, createdAt } = req.body;
        
        // Tìm và cập nhật, nếu chưa có thì tạo mới (Upsert)
        const project = await Calculation.findOneAndUpdate(
            { userId: req.userId, sessionId: sessionId },
            {
                name,
                status,
                inputData,
                resultData,
                createdAt: createdAt || Date.now(),
                updatedAt: Date.now()
            },
            { new: true, upsert: true }
        );

        console.log(`[SYNC] User ${req.userId} upserted project "${name}" (sessionId: ${sessionId})`);
        res.status(200).json({ message: 'Đồng bộ thành công!', sessionId: project.sessionId });
    } catch (error) {
        console.error('Lỗi đồng bộ POST:', error);
        res.status(500).json({ message: 'Lỗi đồng bộ', error: error.message });
    }
});

// DELETE /api/v1/sync/project/:sessionId — Xóa một dự án
router.delete('/project/:sessionId', protect, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const result = await Calculation.findOneAndDelete({ userId: req.userId, sessionId: sessionId });
        
        if (!result) {
            // Nếu không tìm thấy, coi như đã xóa thành công (để client xóa khỏi queue)
            return res.status(404).json({ message: 'Dự án không tồn tại hoặc đã bị xóa.' });
        }

        console.log(`[SYNC] User ${req.userId} deleted project (sessionId: ${sessionId})`);
        res.status(200).json({ message: 'Xóa thành công!' });
    } catch (error) {
        console.error('Lỗi đồng bộ DELETE:', error);
        res.status(500).json({ message: 'Lỗi đồng bộ xóa', error: error.message });
    }
});

module.exports = router;
