import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProjectState } from '../store/projectState';

export default function KinematicResultsScreen({ route, navigation }: any) {
  const state = route.params || {};
  const {
    sessionId,
    motorModel = '4A112M2Y3',
    nDc = 2922,
    motorPower = 7.5,
    uHop = 11.25,
    uNgoai = 2.5,
    systemTransmission,
  } = state;

  const { saveBeltResult } = useProjectState();

  const efficiencyBelt = 0.96;
  const efficiencyGear = 0.97;
  const efficiencyBearing = 0.99;

  // Ưu tiên dùng systemTransmission từ Motor nếu có, nếu không thì tự tính
  const uGear1 = systemTransmission?.u1 ?? Math.sqrt(Math.max(uHop, 1));
  const uGear2 = systemTransmission?.u2 ?? (uHop / uGear1);

  const shaftData = useMemo(() => [
    {
      title: 'Trục Động cơ',
      power: motorPower * 0.96,
      speed: systemTransmission?.ndc ?? nDc,
      torque: (motorPower * 0.96 * 9550) / (systemTransmission?.ndc ?? nDc),
    },
    {
      title: 'Trục I — Vào hộp giảm tốc',
      ratio: uNgoai,
      tenTiSo: 'u Đai',
      power: systemTransmission?.P1 ?? (motorPower * 0.96 * efficiencyBelt),
      speed: systemTransmission?.n1 ?? (nDc / uNgoai),
      torque: systemTransmission?.t1 ?? ((motorPower * 0.96 * efficiencyBelt * 9550) / (nDc / uNgoai)),
    },
    {
      title: 'Trục II — Trung gian',
      ratio: uGear1,
      tenTiSo: 'u Bánh răng 1',
      power: systemTransmission?.P2 ?? (motorPower * 0.96 * efficiencyBelt * efficiencyGear * efficiencyBearing),
      speed: systemTransmission?.n2 ?? (nDc / (uNgoai * uGear1)),
      torque: systemTransmission?.t2 ?? ((motorPower * 0.96 * efficiencyBelt * efficiencyGear * efficiencyBearing * 9550) / (nDc / (uNgoai * uGear1))),
    },
    {
      title: 'Trục III — Ra hộp giảm tốc',
      ratio: uGear2,
      tenTiSo: 'u Bánh răng 2',
      power: systemTransmission?.P3 ?? (motorPower * 0.96 * efficiencyBelt * Math.pow(efficiencyGear, 2) * Math.pow(efficiencyBearing, 2)),
      speed: systemTransmission?.n3 ?? (nDc / (uNgoai * uHop)),
      torque: systemTransmission?.t3 ?? ((motorPower * 0.96 * efficiencyBelt * Math.pow(efficiencyGear, 2) * Math.pow(efficiencyBearing, 2) * 9550) / (nDc / (uNgoai * uHop))),
    },
  ], [motorPower, nDc, uNgoai, uGear1, uGear2, uHop, systemTransmission]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả Động học</Text>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerLabel}>Động cơ đã chọn:</Text>
        <Text style={styles.bannerValue}>{motorModel}</Text>
      </View>

      <View style={styles.stepper}>
        <View style={styles.stepItem}>
          <View style={styles.stepCircleDone}>
            <Text style={styles.stepCircleTextDone}>✓</Text>
          </View>
          <Text style={styles.stepLabelDone}>Động cơ</Text>
        </View>

        <View style={styles.stepDivider} />

        <View style={styles.stepItem}>
          <View style={styles.stepCircleActive}>
            <Text style={styles.stepCircleTextActive}>2</Text>
          </View>
          <Text style={styles.stepLabelActive}>Đai</Text>
        </View>

        <View style={styles.stepDivider} />

        <View style={styles.stepItem}>
          <View style={styles.stepCircleInactive}>
            <Text style={styles.stepCircleTextInactive}>3</Text>
          </View>
          <Text style={styles.stepLabelInactive}>Bánh Răng</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {shaftData.map((shaft, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardTitle}>{shaft.title}</Text>
            <View style={styles.specs}>
              {shaft.ratio !== undefined && (
                <View style={styles.row}>
                  <Text style={styles.label}>{shaft.tenTiSo ?? 'Tỉ số truyền (u)'}</Text>
                  <Text style={styles.value}>{shaft.ratio.toFixed(3)}</Text>
                </View>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>Công suất P (kW)</Text>
                <Text style={styles.value}>{shaft.power.toFixed(3)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Vòng quay n (v/ph)</Text>
                <Text style={styles.value}>{shaft.speed.toFixed(1)}</Text>
              </View>
              <View style={[styles.row, styles.rowLast]}>
                <Text style={styles.label}>Mô-men xoắn T (N·mm)</Text>
                <Text style={styles.value}>{shaft.torque.toFixed(1)}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('BeltCalculation', state)}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>Tiếp tục — Thiết kế Bộ truyền Đai</Text>
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
    width: 36,
    height: 36,
    marginLeft: -4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  backButtonText: { fontSize: 28, lineHeight: 28, color: '#374151', marginTop: -2 },
  headerTitle: { marginLeft: 8, fontSize: 20, fontWeight: '600', color: '#111827' },
  banner: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerLabel: { fontSize: 14, color: '#1e3a8a', marginRight: 8 },
  bannerValue: { fontSize: 16, fontWeight: '700', color: '#1d4ed8' },
  stepper: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stepCircleDone: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center',
  },
  stepCircleActive: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center', justifyContent: 'center',
  },
  stepCircleInactive: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center',
  },
  stepCircleTextDone: { color: '#fff', fontSize: 14, fontWeight: '700' },
  stepCircleTextActive: { color: '#fff', fontSize: 14, fontWeight: '700' },
  stepCircleTextInactive: { color: '#6b7280', fontSize: 14, fontWeight: '700' },
  stepLabelDone: { marginLeft: 6, fontSize: 13, fontWeight: '500', color: '#10b981' },
  stepLabelActive: { marginLeft: 6, fontSize: 13, fontWeight: '600', color: '#111827' },
  stepLabelInactive: { marginLeft: 6, fontSize: 13, fontWeight: '500', color: '#9ca3af' },
  stepDivider: { flex: 1, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: 6 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1d4ed8', marginBottom: 12 },
  specs: {},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowLast: { borderBottomWidth: 0 },
  label: { fontSize: 13, color: '#4b5563', flex: 1 },
  value: { fontSize: 14, fontWeight: '600', color: '#111827' },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  continueButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
