require('dotenv').config();
const mongoose = require('mongoose');
const authController = require('./controllers/authController');

const runTest = async () => {
  try {
    // 1. Kết nối MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 [Antigravity AI] Đã kết nối Database thành công!');

    // 2. Giả lập người dùng bấm nút đăng ký
    const req = {
      body: {
        name: "Antigravity User 🚀",
        email: "test_antigravity_" + Date.now() + "@gmail.com",
        password: "supersecret_password"
      }
    };
    
    // 3. Giả lập hệ thống trả lời
    const res = {
      status: (code) => ({
        json: (data) => console.log(`\n🎉 KẾT QUẢ TỪ API BACKEND (Status ${code}):\n`, JSON.stringify(data, null, 2))
      })
    };

    console.log('⏳ Đang bắn dữ liệu người dùng ảo vào API Đăng ký...\n');
    
    // 4. Chạy trực tiếp hàm Đăng ký
    await authController.register(req, res);
    
    // 5. Ngắt luồng
    await mongoose.connection.close();
    console.log('\n🛑 [Antigravity AI] Đã lưu thông tin xong. Bạn có thể mở Compass xem kết quả nghen!');
  } catch (error) {
    console.error('Lỗi chạy test:', error);
  }
};

runTest();
