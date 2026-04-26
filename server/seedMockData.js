const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Calculation = require('./models/Calculation');

const seedData = async () => {
    try {
        const URI = process.env.MONGO_URI;
        if (!URI) {
            console.error('Lỗi: Không tìm thấy MONGO_URI trong .env');
            process.exit(1);
        }

        console.log('Đang kết nối tới Database...');
        await mongoose.connect(URI);
        console.log('✅ Kết nối thành công!');

        // 1. Xóa toàn bộ dữ liệu hiện tại (Users & Calculations)
        console.log('Đang xóa dữ liệu cũ...');
        await User.deleteMany({});
        await Calculation.deleteMany({});
        console.log('✅ Đã xóa sạch dữ liệu.');

        // 2. Tạo Mock User
        const mockUser = new User({
            name: 'Sinh Viên DADN',
            email: 'sv@hcmut.edu.vn',
            password: 'password123' // Trong thực tế sẽ được hash qua mongoose pre save nếu có, nhưng hiện model User.js chưa có middleware pre-save. Do đó tạm hash ở đây luôn.
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        mockUser.password = await bcrypt.hash(mockUser.password, salt);

        const savedUser = await mockUser.save();
        console.log(`✅ Khởi tạo Mock User thành công: ${savedUser.email}`);

        // 3. Tạo Mock Calculation (Phiên tính toán)
        const mockCalc = new Calculation({
            userId: savedUser._id,
            projectName: 'Đồ án Chi tiết máy Lớp A',
            status: 'completed',
            inputData: {
                Pt: 6.5,
                n_iv: 450,
                L_hours: 24000,
                loadType: 'smooth'
            },
            motorResult: {
                selectedMotorModel: '4A132S4Y3',
                Pct: 7.2,
                eta_total: 0.9,
                n_sb: 1450,
                u_total: 3.2,
                u_belt: 2.5,
                u_stage1: 3.0,
                u_stage2: 1.0,
                shafts: {
                    motor: { n: 1440, P: 7.2, T: 47750, label: 'Trục động cơ' },
                    shaft1: { n: 576, P: 6.9, T: 114300, label: 'Trục I' },
                    shaft2: { n: 192, P: 6.6, T: 328200, label: 'Trục II' }
                }
            },
            beltResult: {
                section: 'B',
                d1: 140,
                d2: 350,
                L: 2000,
                a: 540,
                alpha1_deg: 157,
                z: 3,
                Ft: 1800,
                Fr: 3200,
                overall_pass: true,
                warnings: []
            },
            gearResult: {
                mat1Id: 'steel_45_tempered',
                mat2Id: 'steel_45_normalized',
                m_n: 2.5,
                z1: 25,
                z2: 75,
                aw: 125,
                bw: 50,
                d1: 62.5,
                d2: 187.5,
                sigma_H: 420,
                sigmaH_allow: 450,
                sigma_F1: 180,
                sigma_F2: 170,
                sigmaF1_allow: 210,
                sigmaF2_allow: 200,
                overall_pass: true,
                warnings: []
            }
        });

        await mockCalc.save();
        console.log(`✅ Khởi tạo Mock Data tính toán thành công: ${mockCalc.projectName}`);

        console.log('\\n🎉 HOÀN TẤT SEED DATA! Bạn có thể dùng Account sv@hcmut.edu.vn / password123 để demo.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi:', err);
        process.exit(1);
    }
};

seedData();
