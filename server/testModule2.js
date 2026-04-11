/**
 * testModule2.js - Mock Data Test Script cho Module 2
 *
 * Chạy bằng lệnh (từ thư mục server/):
 *   node testModule2.js
 *
 * BÀI TOÁN MẪU (từ Sách thuyết minh tham khảo - Lê Quang Phú Vinh):
 *   - Công suất thùng trộn: P = 5.5 kW
 *   - Tốc độ trục công tác: n = 70 v/ph
 *   - Thời gian phục vụ: L = 9 năm (300 ngày/năm, 2 ca/ngày, 8h/ca = 43200 giờ)
 *   - Hệ thống: Đai thang + HGT 2 cấp (côn-trụ)
 *
 * KẾT QUẢ MONG ĐỢI (đối chiếu với thuyết minh):
 *   - Pct ≈ 6.211 kW (thuyết minh = 6.211 kW ✓)
 *   - n_sb ≈ 2800 v/ph -> chọn động cơ 4A112M2Y3: 7.5kW, 2922 v/ph ✓
 *   - Momen T1 ≈ 47981 N.mm  ✓
 *   - Đai: d1=140mm, d2=355mm, L=2500mm, z (số đai) ≈ 3..4
 */

// Thêm đường dẫn root để dùng require đúng module
const path = require('path');
process.chdir(path.resolve(__dirname));

const MotorService = require('./services/MotorService');
const BeltService  = require('./services/BeltService');
const GearService  = require('./services/GearService');

// ANSI colors cho output
const C = { reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m' };
const ok   = (msg) => console.log(`${C.green}  ✅ ${msg}${C.reset}`);
const fail = (msg) => console.log(`${C.red}  ❌ ${msg}${C.reset}`);
const info = (msg) => console.log(`${C.cyan}  ℹ  ${msg}${C.reset}`);
const header = (msg) => console.log(`\n${C.bold}${C.yellow}${'='.repeat(60)}\n  ${msg}\n${'='.repeat(60)}${C.reset}`);

// ============================================================
// MOCK INPUT DATA
// ============================================================
const MOCK = {
  Pt: 5.5,          // [kW] công suất công tác
  n_iv: 70,         // [v/ph] tốc độ trục thùng trộn
  L_years: 9,
  days_per_year: 300,
  shifts_per_day: 2,
  hours_per_shift: 8,
  get L_hours() { return this.L_years * this.days_per_year * this.shifts_per_day * this.hours_per_shift; },

  systemConfig: {
    transmissionType: 'belt_vee',   // Đai thang
    gearboxType: 'gear_bevel',      // HGT cấp nhanh: bánh răng côn
    numGearStages: 2,
    numBearingPairs: 4,             // Ổ cả hệ
    hasCoupling: true,
  },
  ratios: [2.5, 4.5, 3.71], // [u_dai, u_con, u_tru] (ước tính ban đầu)
};

// ============================================================
// TEST 1: TÍNH CÔNG SUẤT CẦN THIẾT & ĐỀ XUẤT ĐỘNG CƠ
// ============================================================
header('TEST 1: ĐỘNG CƠ - Tính Pct và Gợi ý Động cơ');

const powerResult = MotorService.calculateRequiredPower(MOCK.Pt, MOCK.systemConfig);
console.log('\n  [Input]  Pt =', MOCK.Pt, 'kW | n_iv =', MOCK.n_iv, 'v/ph');
console.log('  [Tính]   η_total =', powerResult.eta_total);
console.log('           - η_belt =', powerResult.etaBreakdown.eta_belt);
console.log('           - η_gear_total =', powerResult.etaBreakdown.eta_gear_total);
console.log('           - η_bearing =', powerResult.etaBreakdown.eta_bearing);
console.log('           - η_coupling =', powerResult.etaBreakdown.eta_coupling);
info(`Pct = ${powerResult.Pct} kW (Sách TM mong đợi: ~6.211 kW)`);
Math.abs(powerResult.Pct - 6.211) < 0.3 ? ok('Pct trong phạm vi sai số cho phép') : fail('Pct lệch quá mức');

const speedResult = MotorService.calculateSynchronousSpeed(MOCK.n_iv, MOCK.ratios);
info(`n_sb = ${speedResult.n_sb} v/ph (Sách TM mong đợi: ~2800 v/ph)`);
Math.abs(speedResult.n_sb - 2800) < 300 ? ok('n_sb trong phạm vi hợp lý') : fail('n_sb lệch quá mức');

const motors = MotorService.suggestMotors(powerResult.Pct, speedResult.n_sb);
console.log(`\n  [Đề xuất ${motors.length} động cơ]:`);
motors.forEach((m, i) => console.log(`    ${i + 1}. ${m.model}: ${m.power}kW, ${m.speed}v/ph`));
motors.length > 0 ? ok(`Tìm được ${motors.length} động cơ phù hợp`) : fail('Không tìm được động cơ!');

// ============================================================
// TEST 2: TÍNH MOMEN XOẮN TRÊN CÁC TRỤC (sau khi chọn động cơ)
// ============================================================
header('TEST 2: ĐỘNG CƠ - Momen xoắn & Tốc độ quay trên các trục');

// Chọn động cơ: 4A112M2Y3 - 7.5kW, 2922 v/ph (theo thuyết minh)
const SELECTED_MOTOR = { model: '4A112M2Y3', power: 7.5, speed: 2922 };
const shaftsResult = MotorService.calculateShaftDynamics({
  Pt: MOCK.Pt,
  n_dc: SELECTED_MOTOR.speed,
  u_belt: 2.5,
  u_stage1: 4.5,
  u_stage2: 3.71,
  transmissionType: 'belt_vee',
  gearboxType: 'gear_bevel',
});

console.log('\n  Động cơ đã chọn:', SELECTED_MOTOR.model, `(${SELECTED_MOTOR.power}kW, ${SELECTED_MOTOR.speed}v/ph)`);
console.log('\n  +--------------+----------+----------+----------------+');
console.log('  | Trục         | n [v/ph] | P [kW]   | T [N.mm]       |');
console.log('  +--------------+----------+----------+----------------+');
Object.values(shaftsResult.shafts).forEach(s => {
  console.log(`  | ${s.label.padEnd(12)} | ${String(s.n).padEnd(8)} | ${String(s.P).padEnd(8)} | ${String(s.T).padEnd(14)} |`);
});
console.log('  +--------------+----------+----------+----------------+');

const T1 = shaftsResult.shafts.shaft1.T;
info(`T1 = ${T1} N.mm (Sách TM mong đợi: ~47981 N.mm)`);
Math.abs(T1 - 47981) < 5000 ? ok('Momen T1 trong phạm vi hợp lý') : fail(`T1 lệch: ${T1} vs 47981`);

// ============================================================
// TEST 3: TÍNH TOÁN BỘ TRUYỀN ĐAI
// ============================================================
header('TEST 3: BỘ TRUYỀN ĐAI THANG - Thiết kế & Kiểm nghiệm');

const beltResult = BeltService.calculateBeltTransmission({
  P1_kW: SELECTED_MOTOR.power, // Công suất động cơ (trục dẫn đai)
  n1_rpm: SELECTED_MOTOR.speed,
  u_dai: 2.5,
  section: 'B',               // Tiết diện Б/B theo thuyết minh
  engineType: 'electric',
  loadType: 'light_shock',
  epsilon: 0.02,
});

console.log('\n  [Input]  P1 =', SELECTED_MOTOR.power, 'kW | n1 =', SELECTED_MOTOR.speed, 'v/ph | u_dai = 2.5');
console.log('\n  [Kết quả Đai]:');
console.log('    Tiết diện đai:', beltResult.section);
console.log('    d1 =', beltResult.diameters.d1, 'mm (Sách TM mong đợi: 140 mm)');
console.log('    d2 =', beltResult.diameters.d2, 'mm (Sách TM mong đợi: 355 mm)');
console.log('    Chiều dài L =', beltResult.belt.L, 'mm (Sách TM mong đợi: 2500 mm)');
console.log('    Khoảng cách trục a =', beltResult.belt.a, 'mm');
console.log('    Góc ôm α1 =', beltResult.angles.alpha1_deg, '° (cần ≥ 120°)');
console.log('    Số đai z =', beltResult.belts.z);
console.log('    Vận tốc đai v =', beltResult.forces.v_dai, 'm/s (cần ≤ 25 m/s)');
console.log('    Tần số uốn =', (beltResult.forces.v_dai * 1000 / beltResult.belt.L).toFixed(3), 'l/s (cần ≤ 10)');

console.log('\n  [Kiểm nghiệm]:');
Object.entries(beltResult.checks).forEach(([k, v]) => {
  v ? ok(`${k}: PASS`) : fail(`${k}: FAIL`);
});
beltResult.overall_pass ? ok('Bộ truyền đai ĐẠT toàn bộ điều kiện') : fail('Bộ truyền đai KHÔNG ĐẠT');

// ============================================================
// TEST 4: TÍNH TOÁN BÁNH RĂNG
// ============================================================
header('TEST 4: BÁNH RĂNG TRỤ - Ứng suất cho phép & Kiểm nghiệm bền');

// Tính cho cấp chậm (bánh răng trụ) của HGT 2 cấp côn-trụ
const T_shaft2 = shaftsResult.shafts.shaft2.T;   // Momen xoắn trục vào cấp chậm
const n_shaft2 = shaftsResult.shafts.shaft2.n;

const gearResult = GearService.calculateGearFull({
  mat1Id: 'steel_45_tempered',  // Bánh dẫn: Thép 45 tôi cải thiện HB230
  mat2Id: 'steel_45_normalized', // Bánh bị dẫn: Thép 45 thường hóa HB200
  T1_Nmm: T_shaft2,
  n1_rpm: n_shaft2,
  u: 3.71,
  L_hours: MOCK.L_hours,
  gearType: 'spur_symmetric',
  bearingPos: 'symmetric',
});

const { step1_allowableStress: sAS, step2_preliminaryDistance: sPD,
        step3_gearParameters: sGP, step4_contactCheck: sCC, step5_bendingCheck: sBC } = gearResult;

console.log('\n  [Input]  T1 =', T_shaft2.toFixed(0), 'N.mm | n1 =', n_shaft2, 'v/ph | u = 3.71');
console.log('           L = ', MOCK.L_hours, 'giờ');

console.log('\n  [Ứng suất cho phép]:');
info(`[σH] = ${sAS.sigmaH_allow} MPa | [σF1] = ${sAS.sigmaF1_allow} MPa | [σF2] = ${sAS.sigmaF2_allow} MPa`);
console.log('    KHL1 =', sAS.gear1.KHL, '| KHL2 =', sAS.gear2.KHL);

console.log('\n  [Thông số ăn khớp]:');
info(`aw (sơ bộ) = ${sPD.aw} mm → aw (làm tròn) = ${sPD.aw_rounded} mm`);
info(`Module m = ${sGP.m_n} mm | z1 = ${sGP.z1} | z2 = ${sGP.z2} | bw = ${sGP.bw} mm`);
info(`d1 = ${sGP.d1} mm | d2 = ${sGP.d2} mm | aw_actual = ${sGP.aw_actual} mm`);
info(`da1 = ${sGP.da1} mm | df1 = ${sGP.df1} mm`);

console.log('\n  [Kiểm nghiệm độ bền tiếp xúc]:');
info(`σH = ${sCC.sigma_H} MPa ≤ [σH] = ${sCC.sigma_H_allow} MPa`);
sCC.pass ? ok(`Độ bền tiếp xúc ĐẠT (biên an toàn: ${sCC.margin_pct}%)`) : fail(`Độ bền tiếp xúc KHÔNG ĐẠT`);

console.log('\n  [Kiểm nghiệm độ bền uốn]:');
info(`σF1 = ${sBC.sigma_F1} MPa ≤ [σF1] = ${sBC.sigma_F1_allow} MPa`);
sBC.pass1 ? ok(`Uốn bánh 1 ĐẠT (biên: ${sBC.margin1_pct}%)`) : fail(`Uốn bánh 1 KHÔNG ĐẠT`);
info(`σF2 = ${sBC.sigma_F2} MPa ≤ [σF2] = ${sBC.sigma_F2_allow} MPa`);
sBC.pass2 ? ok(`Uốn bánh 2 ĐẠT (biên: ${sBC.margin2_pct}%)`) : fail(`Uốn bánh 2 KHÔNG ĐẠT`);

console.log(`\n  ${C.bold}KẾT LUẬN BÁNH RĂNG: ${gearResult.overall_pass ? C.green + '✅ ĐẠT' : C.red + '❌ KHÔNG ĐẠT'}${C.reset}`);
if (gearResult.warnings.length) gearResult.warnings.forEach(w => fail(w));

// ============================================================
// TEST 5: TRƯỜNG HỢP ĐẶC BIỆT - Vật liệu yếu → Kiểm tra báo lỗi
// ============================================================
header('TEST 5: EDGE CASE - Vật liệu yếu (Gang xám) → KHÔNG ĐẠT');

// Test 5: Kiểm tra rằng gang xám có [σH] thấp hơn thép (kiểm tra dữ liệu catalogue)
const steelAllowable  = GearService.calculateAllowableStress('steel_45_tempered', 'steel_45_tempered', n_shaft2, 3.71, MOCK.L_hours);
const gangXamAllowable = GearService.calculateAllowableStress('cast_iron_SCh20', 'cast_iron_SCh20', n_shaft2, 3.71, MOCK.L_hours);
console.log(`  [Thép điệu chỉnh] [σH] = ${steelAllowable.sigmaH_allow} MPa`);
console.log(`  [Gang xám SCh20] [σH] = ${gangXamAllowable.sigmaH_allow} MPa`);
gangXamAllowable.sigmaH_allow < steelAllowable.sigmaH_allow
  ? ok(`[σH] gang xám (${gangXamAllowable.sigmaH_allow} MPa) nhỏ hơn thép (${steelAllowable.sigmaH_allow} MPa) - Catalogue đúng`)
  : fail('Lỗi catalogue: [σH] gang xám phải nhỏ hơn thép tuổi cải thiện!');
// Kiểm tra Gang xám thực sự không đạt ở tải cực lớn (T*30)
const extremeTest = GearService.calculateGearFull({
  mat1Id: 'cast_iron_SCh20', mat2Id: 'cast_iron_SCh20',
  T1_Nmm: T_shaft2 * 30, n1_rpm: n_shaft2, u: 3.71, L_hours: MOCK.L_hours,
});
extremeTest.overall_pass
  ? fail('Gang xám tải cực cao không được pass!')
  : ok(`Gang xám tải T*30 = KHÔNG ĐẠT: ${extremeTest.verdict}`);

console.log(`\n${C.bold}${C.cyan}${'='.repeat(60)}\n  HOÀN THÀNH KIỂM THỬ MODULE 2\n${'='.repeat(60)}${C.reset}\n`);
