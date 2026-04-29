import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculateBeltTransmission } from '../logic/calc_belt';
import { useProjectState } from '../store/projectState';

export default function BeltCalculationScreen({ route, navigation }: any) {
  const state = route.params || {};
  const {
    sessionId,
    motorPower = 7.5,
    nDc = 2922,
    uNgoai = 2.5,
  } = state;

  const P1_kW = motorPower * 0.96;
  const n1_rpm = nDc;
  const u_dai = uNgoai;

  const { saveBeltResult } = useProjectState();

  const beltResult: any = useMemo(() => {
    try {
      return calculateBeltTransmission({ P1_kW, n1_rpm, u_dai });
    } catch (e: any) {
      return { error: e.message };
    }
  }, [P1_kW, n1_rpm, u_dai]);

  useEffect(() => {
    if (sessionId && beltResult && !beltResult.error) {
      saveBeltResult(sessionId, beltResult);
    }
  }, [sessionId, beltResult]);

  const checks: Array<{ key: string; label: string; pass: boolean }> = beltResult?.checks
    ? [
      { key: 'speed_pass', label: 'Vận tốc đai ≤ 25 m/s', pass: beltResult.checks.speed_pass },
      { key: 'wrap_angle_pass', label: 'Góc ôm α₁ ≥ 120°', pass: beltResult.checks.wrap_angle_pass },
      { key: 'bending_freq_pass', label: 'Tần số uốn ≤ 10 Hz', pass: beltResult.checks.bending_freq_pass },
      { key: 'ratio_error_pass', label: 'Sai số tỉ số truyền ≤ 4%', pass: beltResult.checks.ratio_error_pass },
    ]
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thiết kế Bộ truyền Đai</Text>
      </View>

      <View style={styles.stepper}>
        <View style={styles.stepItem}>
          <View style={styles.stepCircleDone}><Text style={styles.stepTextDone}>✓</Text></View>
          <Text style={styles.stepLabelDone}>Động cơ</Text>
        </View>
        <View style={styles.stepDivider} />
        <View style={styles.stepItem}>
          <View style={styles.stepCircleActive}><Text style={styles.stepTextActive}>2</Text></View>
          <Text style={styles.stepLabelActive}>Đai</Text>
        </View>
        <View style={styles.stepDivider} />
        <View style={styles.stepItem}>
          <View style={styles.stepCircleInactive}><Text style={styles.stepTextInactive}>3</Text></View>
          <Text style={styles.stepLabelInactive}>Bánh Răng</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {beltResult.error ? (
          <View style={styles.cardError}>
            <Text style={styles.errorTitle}>⚠ Lỗi tính toán</Text>
            <Text style={styles.errorText}>{beltResult.error}</Text>
          </View>
        ) : (
          <>
            {/* Kết quả tổng quan */}
            <View style={[styles.card, beltResult.overall_pass ? styles.cardSuccess : styles.cardWarning]}>
              <Text style={styles.cardTitle}>
                {beltResult.overall_pass ? '✅ Bộ truyền đai ĐẠT yêu cầu' : '⚠️ Bộ truyền đai CẦN điều chỉnh'}
              </Text>
              {checks.map((c) => (
                <View key={c.key} style={styles.checkRow}>
                  <Text style={c.pass ? styles.checkPass : styles.checkFail}>
                    {c.pass ? '✓' : '✗'} {c.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Thông số thiết kế */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Thông số thiết kế đai</Text>

              <View style={styles.row}>
                <Text style={styles.label}>Tiết diện đai</Text>
                <Text style={styles.value}>{beltResult.section}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Đường kính bánh dẫn d₁</Text>
                <Text style={styles.value}>{beltResult.diameters?.d1} mm</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Đường kính bánh bị dẫn d₂</Text>
                <Text style={styles.value}>{beltResult.diameters?.d2} mm</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Vận tốc đai v</Text>
                <Text style={styles.value}>{beltResult.forces?.v_dai} m/s</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Khoảng cách trục sơ bộ a_sb</Text>
                <Text style={styles.value}>{beltResult.belt?.a_sb} mm</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Chiều dài đai tiêu chuẩn L</Text>
                <Text style={styles.value}>{beltResult.belt?.L} mm</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Khoảng cách trục thực tế a</Text>
                <Text style={styles.value}>{beltResult.belt?.a} mm</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Góc ôm bánh nhỏ α₁</Text>
                <Text style={styles.value}>{beltResult.angles?.alpha1_deg}°</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Số dây đai z</Text>
                <Text style={styles.value}>{beltResult.belts?.z}</Text>
              </View>
            </View>

            {/* Lực tác dụng */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Lực tác dụng</Text>
              <View style={styles.row}>
                <Text style={styles.label}>Lực vòng Fₜ</Text>
                <Text style={styles.value}>{beltResult.forces?.Ft} N</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Lực căng ban đầu F₀</Text>
                <Text style={styles.value}>{beltResult.forces?.F0} N</Text>
              </View>
              <View style={[styles.row, styles.rowLast]}>
                <Text style={styles.label}>Lực tác dụng lên trục Fᵣ</Text>
                <Text style={styles.value}>{beltResult.forces?.Fr} N</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('GearCalculation', state)}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>Tiếp tục — Thiết kế Bánh Răng</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    width: 36, height: 36, marginLeft: -4,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  backButtonText: { fontSize: 28, lineHeight: 28, color: '#374151', marginTop: -2 },
  headerTitle: { marginLeft: 8, fontSize: 20, fontWeight: '600', color: '#111827' },
  stepper: {
    backgroundColor: '#fff',
    paddingHorizontal: 24, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    flexDirection: 'row', alignItems: 'center',
  },
  stepItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stepCircleDone: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  stepCircleInactive: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  stepTextDone: { color: '#fff', fontSize: 14, fontWeight: '700' },
  stepTextActive: { color: '#fff', fontSize: 14, fontWeight: '700' },
  stepTextInactive: { color: '#6b7280', fontSize: 14, fontWeight: '700' },
  stepLabelDone: { marginLeft: 6, fontSize: 13, fontWeight: '500', color: '#10b981' },
  stepLabelActive: { marginLeft: 6, fontSize: 13, fontWeight: '600', color: '#111827' },
  stepLabelInactive: { marginLeft: 6, fontSize: 13, color: '#9ca3af' },
  stepDivider: { flex: 1, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: 6 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  cardError: { backgroundColor: '#fef2f2', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#fecaca' },
  cardSuccess: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
  cardWarning: { borderColor: '#f59e0b', backgroundColor: '#fffbeb' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  errorTitle: { fontSize: 15, fontWeight: '700', color: '#dc2626', marginBottom: 6 },
  errorText: { color: '#7f1d1d', fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 14 },
  checkRow: { marginTop: 4 },
  checkPass: { fontSize: 13, color: '#059669', fontWeight: '500' },
  checkFail: { fontSize: 13, color: '#d97706', fontWeight: '500' },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  rowLast: { borderBottomWidth: 0 },
  label: { fontSize: 13, color: '#4b5563', flex: 1 },
  value: { fontSize: 14, fontWeight: '600', color: '#111827' },
  footer: {
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb',
    paddingHorizontal: 24, paddingVertical: 16,
  },
  continueButton: {
    width: '100%', paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center',
  },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
