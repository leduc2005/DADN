/**
 * testModule2.js - Bộ 10 Test Cases cho Module 2 (Hệ hệ thống chuyển động cơ khí)
 *
 * Chạy bằng lệnh (từ thư mục server/):
 *   node testModule2.js
 *
 * Bao phủ các thông số:
 * - Động cơ điện / Động cơ đốt trong
 * - Tải tĩnh tĩnh / Va đập nhẹ / Va đập nặng
 * - HGT Trụ 1 cấp / 2 cấp, HGT Côn - Trụ
 * - Vật liệu thép (thường hóa, tôi cải thiện) / Gang xám
 * - Tuổi thọ ngắn / dài
 */

const path = require('path');
process.chdir(path.resolve(__dirname));

const MotorService = require('./services/MotorService');
const BeltService  = require('./services/BeltService');
const GearService  = require('./services/GearService');

// ============================================================
// UTILITIES PRINT
// ============================================================
const C = { reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m' };
const ok   = (msg) => console.log(`${C.green}  ✅ ${msg}${C.reset}`);
const fail = (msg) => console.log(`${C.red}  ❌ ${msg}${C.reset}`);
const info = (msg) => console.log(`${C.cyan}  ℹ  ${msg}${C.reset}`);
const warn = (msg) => console.log(`${C.yellow}  ⚠️  ${msg}${C.reset}`);
const header = (msg) => console.log(`\n${C.bold}${C.yellow}============================================================\n${msg}\n============================================================${C.reset}`);

/**
 * Hàm hỗ trợ chạy 1 test case toàn diện từ Động Cơ -> Đai -> Bánh răng
 */
function runTestCase(testId, name, mockData) {
  header(`TEST ${testId}: ${name}`);
  
  try {
    // ----------------------------------------------------
    // Bước 1: Tính công suất và chọn động cơ sơ bộ
    // ----------------------------------------------------
    const { Pt, n_iv, L_hours, systemConfig, ratios, beltOverrides, gearOverrides } = mockData;
    console.log(`[ĐẦU VÀO] Pt = ${Pt} kW | n_iv = ${n_iv} v/ph | Thể loại: ${systemConfig.gearboxType}`);
    
    const powerResult = MotorService.calculateRequiredPower(Pt, systemConfig);
    const speedResult = MotorService.calculateSynchronousSpeed(n_iv, ratios);
    const Pct = powerResult.Pct;
    const n_sb = speedResult.n_sb;

    const motors = MotorService.suggestMotors(Pct, n_sb);
    if (!motors.length) throw new Error(`Không tìm được động cơ cho Pct=${Pct} kW, n_sb=${n_sb} v/ph`);
    const selectedMotor = motors[0]; // Cứ lấy động cơ đầu tiên thỏa mãn
    
    ok(`Chọn động cơ: ${selectedMotor.model} (${selectedMotor.power} kW, ${selectedMotor.speed} v/ph) | Cần thiết: Pct=${Pct} kW`);

    // ----------------------------------------------------
    // Bước 2: Động lực học các trục
    // ----------------------------------------------------
    const u_belt = ratios[0] || 1;
    const u_stage1 = ratios[1] || 1;
    const u_stage2 = ratios[2] || 1;

    const shaftsResult = MotorService.calculateShaftDynamics({
      Pt,
      n_dc: selectedMotor.speed,
      u_belt,
      u_stage1,
      u_stage2,
      transmissionType: systemConfig.transmissionType,
      gearboxType: systemConfig.gearboxType,
    });
    
    const shafts = shaftsResult.shafts;
    const T1 = shafts.shaft1 ? shafts.shaft1.T : 0;
    const T2 = shafts.shaft2 ? shafts.shaft2.T : 0;
    
    info(`Momen trục 1 (vào HGT): ${T1} N.mm | Tốc độ: ${shafts.shaft1.n} v/ph`);
    if (u_stage2 > 1) {
       info(`Momen trục 2 (vào cấp 2): ${T2} N.mm | Tốc độ: ${shafts.shaft2.n} v/ph`);    
    }

    // ----------------------------------------------------
    // Bước 3: Tính toán Đai
    // ----------------------------------------------------
    if (systemConfig.transmissionType.startsWith('belt')) {
      const beltResult = BeltService.calculateBeltTransmission({
        P1_kW: selectedMotor.power,
        n1_rpm: selectedMotor.speed,
        u_dai: u_belt,
        ...beltOverrides, // override engineType, loadType
      });
      
      const { section, diameters, belts, forces, overall_pass: belt_pass } = beltResult;
      const tStatus = belt_pass ? ok : warn;
      tStatus(`Bộ Đai [${belt_pass ? 'PASS' : 'FAIL'}]: Tiết diện ${section}, d1=${diameters.d1}mm, d2=${diameters.d2}mm, Số đai z=${belts.z}, Vận tốc=${forces.v_dai}m/s`);
    }

    // ----------------------------------------------------
    // Bước 4: Tính toán Bánh răng (Cấp 1 hoặc Cấp 2 tùy ý, ta test cấp có tải trọng lớn/tùy chỉnh)
    // Để cho phong phú, ta lấy T và n tương ứng với cấp gearOverrides yêu cầu
    // ----------------------------------------------------
    let gearT = u_stage2 > 1 ? T2 : T1;
    let gearN = u_stage2 > 1 ? shafts.shaft2.n : shafts.shaft1.n;
    let gearU = u_stage2 > 1 ? u_stage2 : u_stage1;

    // Trong một số trường hợp test cấp 1, ghi đè
    if (gearOverrides.testStage === 1) {
       gearT = T1;
       gearN = shafts.shaft1.n;
       gearU = u_stage1;
    }

    const gearResult = GearService.calculateGearFull({
      mat1Id: gearOverrides.mat1Id || 'steel_45_tempered',
      mat2Id: gearOverrides.mat2Id || 'steel_45_normalized',
      T1_Nmm: gearT,
      n1_rpm: gearN,
      u: gearU,
      L_hours: L_hours,
      gearType: gearOverrides.gearType || 'spur_symmetric',
      bearingPos: gearOverrides.bearingPos || 'symmetric',
    });

    const { step2_preliminaryDistance, step3_gearParameters, step4_contactCheck, overall_pass: gear_pass, warnings } = gearResult;
    const gStatus = gear_pass ? ok : warn;
    gStatus(`Bánh Răng [${gear_pass ? 'PASS' : 'FAIL'}]: Tải vào = ${gearT.toFixed(0)} N.mm, aw=${step2_preliminaryDistance.aw_rounded} mm, bw=${step3_gearParameters.bw} mm, m=${step3_gearParameters.m_n}`);
    info(`Tiếp xúc (σH=${step4_contactCheck.sigma_H} ≤ [σH]=${step4_contactCheck.sigma_H_allow} MPa)`);

    if (!gear_pass) {
       warnings.forEach(w => console.log(`      └─ ${w}`));
    }

  } catch (err) {
    fail(`Ngoại lệ xảy ra: ${err.message}`);
  }
}

// ============================================================
// DANH SÁCH 10 TEST CASES
// ============================================================

// TC 1: Bài toán tiêu chuẩn Sách Giáo Khoa (Máy Trộn)
runTestCase(1, 'Máy Trộn SGK (Đai thang + HGT Côn Trụ 2 cấp, Thép 45)', {
  Pt: 5.5, n_iv: 70, L_hours: 9 * 300 * 2 * 8,
  systemConfig: { transmissionType: 'belt_vee', gearboxType: 'gear_bevel', numGearStages: 2, numBearingPairs: 4, hasCoupling: true },
  ratios: [2.5, 4.5, 3.71], // Đai, Côn, Trụ
  beltOverrides: { engineType: 'electric', loadType: 'light_shock' },
  gearOverrides: { testStage: 2, mat1Id: 'steel_45_tempered', mat2Id: 'steel_45_normalized' }
});

// TC 2: Máy Bơm Công Nghiệp (Động Cơ Đốt Trong Single, Tải Tĩnh, HGT 1 cấp răng nghiêng)
runTestCase(2, 'Bơm Công Nghiệp (ĐC Đốt Trong 1 xy lanh + Đai thang + Trụ răng nghiêng 1 cấp)', {
  Pt: 4.0, n_iv: 120, L_hours: 5 * 300 * 1 * 8,
  systemConfig: { transmissionType: 'belt_vee', gearboxType: 'gear_helical', numGearStages: 1, numBearingPairs: 2, hasCoupling: false },
  ratios: [3.0, 4.0], // Đai, Trụ
  beltOverrides: { engineType: 'combustion_single', loadType: 'smooth' },
  gearOverrides: { testStage: 1, gearType: 'helical_symmetric', mat1Id: 'steel_40X_tempered', mat2Id: 'steel_45_tempered' }
});

// TC 3: Tời Nâng Va Đập Nặng (Gắn liền động cơ mỏ, Gang xám)
runTestCase(3, 'Tời Nâng Va Đập (Động cơ điện, Đai thang, Trụ 2 cấp, Bánh răng Gang Xám SCh20)', {
  Pt: 3.5, n_iv: 45, L_hours: 3 * 200 * 1 * 4, // Tuổi thọ rất thấp
  systemConfig: { transmissionType: 'belt_vee', gearboxType: 'gear_spur', numGearStages: 2, numBearingPairs: 4, hasCoupling: true },
  ratios: [2.5, 4.0, 3.0], 
  beltOverrides: { engineType: 'electric', loadType: 'heavy_shock' },
  gearOverrides: { testStage: 2, mat1Id: 'cast_iron_SCh20', mat2Id: 'cast_iron_SCh20' }
});

// TC 4: Máy Nghiền Đá Lớn (Động cơ đa xi lanh, công suất lớn, thép hợp kim cao)
runTestCase(4, 'Máy Nghiền (ĐC Đốt Trong Đa Xi Lanh, Va Đập Nặng, Thép Cứng)', {
  Pt: 22.0, n_iv: 100, L_hours: 10 * 300 * 3 * 8, // Tuổi thọ cao, chạy liên tục
  systemConfig: { transmissionType: 'belt_vee', gearboxType: 'gear_spur', numGearStages: 2, numBearingPairs: 4, hasCoupling: true },
  ratios: [3.0, 3.5, 3.5], 
  beltOverrides: { engineType: 'combustion_multi', loadType: 'heavy_shock' },
  gearOverrides: { testStage: 2, mat1Id: 'steel_40X_surf_hardened', mat2Id: 'steel_40X_tempered' } 
});

// TC 5: Cầu Trục Nhỏ (Va đập vừa, công suất nhỏ)
runTestCase(5, 'Cầu Trục (Thép thường hóa giá rẻ)', {
  Pt: 1.5, n_iv: 80, L_hours: 5 * 250 * 1 * 6,
  systemConfig: { transmissionType: 'belt_vee', gearboxType: 'gear_bevel', numGearStages: 1, numBearingPairs: 2, hasCoupling: true },
  ratios: [2.0, 4.0], 
  beltOverrides: { engineType: 'electric', loadType: 'light_shock' },
  gearOverrides: { testStage: 1, mat1Id: 'steel_45_normalized', mat2Id: 'steel_45_normalized', gearType: 'spur_symmetric' }
});

// TC 6: Băng Tải Cao Tốc (Tốc độ công tác lớn, tải êm)
runTestCase(6, 'Băng Tải Cao Tốc (P tải nhỏ, Tốc độ cao 400v/ph)', {
  Pt: 2.5, n_iv: 400, L_hours: 10 * 300 * 2 * 8,
  systemConfig: { transmissionType: 'belt_vee', gearboxType: 'gear_helical', numGearStages: 1, numBearingPairs: 2, hasCoupling: true },
  ratios: [2.0, 3.5], 
  beltOverrides: { engineType: 'electric', loadType: 'smooth' },
  gearOverrides: { testStage: 1, gearType: 'helical_symmetric', mat1Id: 'steel_40X_tempered', mat2Id: 'steel_45_tempered' }
});

// TC 7: Máy Đánh Bóng (Công suất rất bé nhưng quay rất chậm)
runTestCase(7, 'Máy Đánh Bóng Chậm (Công suất cực nhỏ 0.55kW, HGT 2 cấp trụ)', {
  Pt: 0.55, n_iv: 30, L_hours: 3 * 200 * 1 * 8,
  systemConfig: { transmissionType: 'belt_vee', gearboxType: 'gear_spur', numGearStages: 2, numBearingPairs: 4, hasCoupling: false },
  ratios: [2.0, 5.0, 4.0], 
  beltOverrides: { engineType: 'electric', loadType: 'smooth' },
  // Trục công xôn (cantilever) sẽ tạo Momen uốn làm tỷ số chịu tải thấp hơn
  gearOverrides: { testStage: 2, bearingPos: 'cantilever', mat1Id: 'steel_45_tempered', mat2Id: 'steel_45_normalized' }
});

// TC 8: Quạt Công Nghiệp Cỡ Khổng Lồ
runTestCase(8, 'Quạt Gió Khổng Lồ (Pt = 35kW, Bánh răng hợp kim tôi cứng)', {
  Pt: 35.0, n_iv: 150, L_hours: 8 * 300 * 3 * 8,
  systemConfig: { transmissionType: 'belt_vee', gearboxType: 'gear_helical', numGearStages: 2, numBearingPairs: 4, hasCoupling: true },
  ratios: [2.5, 4.0, 2.5], 
  beltOverrides: { engineType: 'electric', loadType: 'smooth' },
  gearOverrides: { testStage: 1, gearType: 'helical_asymmetric', mat1Id: 'steel_40X_surf_hardened', mat2Id: 'steel_40X_tempered' }
});

// TC 9: Máy Đùn Nhựa (Chế độ tải va đập cực lớn, Bánh răng đúc)
runTestCase(9, 'Máy Đùn Nhựa (Va đập mạnh, Thép Đúc)', {
  Pt: 11.0, n_iv: 60, L_hours: 15 * 300 * 3 * 8,
  systemConfig: { transmissionType: 'belt_vee', gearboxType: 'gear_spur', numGearStages: 2, numBearingPairs: 4, hasCoupling: true },
  ratios: [3.0, 4.0, 3.5], 
  beltOverrides: { engineType: 'electric', loadType: 'heavy_shock' },
  gearOverrides: { testStage: 2, mat1Id: 'steel_45_case_hardened', mat2Id: 'steel_45_case_hardened' }
});

// TC 10: Máy Kéo Nông Nghiệp Khắc Nghiệt (ĐC Đốt Trong 1 xilanh, Va Đập Nặng)
runTestCase(10, 'Tời Nông Nghiệp (ĐC 1 xy lanh, Va đập mạnh, Thép 45 tôi thường)', {
  Pt: 5.0, n_iv: 50, L_hours: 5 * 100 * 1 * 5, // Dùng theo mùa
  systemConfig: { transmissionType: 'belt_vee', gearboxType: 'gear_bevel', numGearStages: 2, numBearingPairs: 4, hasCoupling: false },
  ratios: [2.5, 5.0, 4.0], 
  beltOverrides: { engineType: 'combustion_single', loadType: 'heavy_shock' },
  gearOverrides: { testStage: 2, mat1Id: 'steel_45_tempered', mat2Id: 'steel_45_normalized' }
});

console.log(`\n${C.bold}${C.cyan}============================================================\n  HOÀN THÀNH KIỂM THỬ MODULE 2 (10 TEST CASES)\n============================================================${C.reset}\n`);
