import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculateGearFull } from '../logic/calc_gear';
import { useProjectState } from '../store/projectState';
import { saveProjectLocal } from '../database/sqlite';
import { runFullSync } from '../services/api_sync';

export default function GearCalculationScreen({ route, navigation }: any) {
  const state = route.params || {};
  const {
    sessionId,
    motorPower = 7.5,
    nDc = 2922,
    uHop = 11.25,
    uNgoai = 2.5,
    inputData = {},
  } = state;

  const {
    saveGearResult,
    finishSession,
    calculateSession,
    operatingData,
    loadData,
    efficiencyData,
    driveItems,
    bearingItems,
    isReadOnly,
  } = useProjectState();
  const [showSaveModal, setShowSaveModal] = useState(false);

  const handleFinish = () => {
    if (isReadOnly) {
      navigation.navigate('Home');
      return;
    }
    if (sessionId) finishSession(sessionId);
    setShowSaveModal(true);
  };

  const handleSave = () => {
    try {
      const fullInputData = {
        operatingData: inputData?.operatingData,
        loadData: inputData?.loadData,
        driveItems: inputData?.item?.driveItem || inputData?.Item?.driveItem,
        bearingItems: inputData?.item?.bearingItem || inputData?.Item?.bearingItem,
        motorModel: state.motorModel,
        motorPower,
        nDc,
        uHop,
        uNgoai,
        rawInputData: {
          calculateSession,
          operatingData,
          loadData,
          efficiencyData,
          driveItems,
          bearingItems,
        },
      };
      const fullResultData = {
        systemTransmission: state.systemTransmission,
        beltResult: state.beltResult,
        gearResult: gearResult?.error ? null : gearResult,
      };
      const projectName = calculateSession?.trim() || `Tính toán - ${state.motorModel || 'Chưa đặt tên'}`;
      saveProjectLocal(
        sessionId,
        projectName,
        fullInputData,
        fullResultData,
        'HOÀN THÀNH',
      );

      // Kích hoạt đồng bộ ngầm ngay lập tức
      runFullSync().catch(err => console.warn('Lỗi trigger sync sau khi lưu:', err));
    } catch (e) {
      console.error('Lỗi lưu bài toán:', e);
    }
    setShowSaveModal(false);
    navigation.navigate('Home');
  };

  const handleSkipSave = () => {
    setShowSaveModal(false);
    navigation.navigate('Home');
  };

  const efficiencyBelt = 0.96;
  const n1_rpm = nDc / Math.max(uNgoai, 1);
  const p1 = motorPower * 0.96 * efficiencyBelt;
  const T1_Nmm = (p1 * 9550 / n1_rpm) * 1000;
  const L_hours = Number(inputData?.operatingData?.serviceLife || 5) * 365 * 8;
  const u = Math.sqrt(Math.max(uHop, 1));

  const gearResult: any = useMemo(() => {
    try {
      return calculateGearFull({
        mat1Id: 'steel_45_normalized',
        mat2Id: 'steel_45_normalized',
        T1_Nmm,
        n1_rpm,
        u,
        L_hours,
      });
    } catch (e: any) {
      return { error: e.message };
    }
  }, [T1_Nmm, n1_rpm, u, L_hours]);

  useEffect(() => {
    if (sessionId && gearResult && !gearResult.error) {
      saveGearResult(sessionId, gearResult);
    }
  }, [sessionId, gearResult]);

  const geom = gearResult?.step3_gearParameters;
  const contact = gearResult?.step4_contactCheck;
  const bending = gearResult?.step5_bendingCheck;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thiết kế Bánh Răng</Text>
      </View>

      <View style={styles.stepper}>
        <View style={styles.stepItem}>
          <View style={styles.stepCircleDone}><Text style={styles.stepTextDone}>✓</Text></View>
          <Text style={styles.stepLabelDone}>Động cơ</Text>
        </View>
        <View style={styles.stepDivider} />
        <View style={styles.stepItem}>
          <View style={styles.stepCircleDone}><Text style={styles.stepTextDone}>✓</Text></View>
          <Text style={styles.stepLabelDone}>Đai</Text>
        </View>
        <View style={styles.stepDivider} />
        <View style={styles.stepItem}>
          <View style={styles.stepCircleActive}><Text style={styles.stepTextActive}>3</Text></View>
          <Text style={styles.stepLabelActive}>Bánh Răng</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {gearResult.error ? (
          <View style={styles.cardError}>
            <Text style={styles.errorTitle}>⚠ Lỗi tính toán</Text>
            <Text style={styles.errorText}>{gearResult.error}</Text>
          </View>
        ) : (
          <>
            {/* Kết luận tổng quan */}
            <View style={[styles.card, gearResult.overall_pass ? styles.cardSuccess : styles.cardWarning]}>
              <Text style={styles.cardTitle}>{gearResult.overall_pass ? '✅ ' : '⚠️ '}{gearResult.verdict}</Text>
              {!gearResult.overall_pass && gearResult.warnings?.map((w: string, i: number) => (
                <Text key={i} style={styles.warnText}>• {w}</Text>
              ))}
            </View>

            {/* Thông số hình học bánh răng */}
            {geom && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Thông số hình học bánh răng</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Khoảng cách trục a_w</Text>
                  <Text style={styles.value}>{gearResult.step2_preliminaryDistance?.aw_rounded} mm</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Mô đun m_n</Text>
                  <Text style={styles.value}>{geom.m_n} mm</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Số răng z₁ / z₂</Text>
                  <Text style={styles.value}>{geom.z1} / {geom.z2}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Tỉ số truyền thực tế u_tt</Text>
                  <Text style={styles.value}>{geom.u_actual?.toFixed(3)} ({geom.u_error_pct}% sai số)</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Đường kính vòng chia d₁ / d₂</Text>
                  <Text style={styles.value}>{geom.d1} / {geom.d2} mm</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Đường kính đỉnh răng dₐ₁ / dₐ₂</Text>
                  <Text style={styles.value}>{geom.da1} / {geom.da2} mm</Text>
                </View>
                <View style={[styles.row, styles.rowLast]}>
                  <Text style={styles.label}>Bề rộng vành răng bw</Text>
                  <Text style={styles.value}>{geom.bw?.toFixed(1)} mm</Text>
                </View>
              </View>
            )}

            {/* Kiểm nghiệm bền */}
            {contact && bending && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Kiểm nghiệm bền</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Ứng suất tiếp xúc σH</Text>
                  <Text style={[styles.value, contact.pass ? styles.pass : styles.fail]}>
                    {contact.sigma_H} MPa {contact.pass ? '≤' : '>'} [{contact.sigma_H_allow}] MPa {contact.pass ? '✓' : '✗'}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Ứng suất uốn σF₁</Text>
                  <Text style={[styles.value, bending.pass1 ? styles.pass : styles.fail]}>
                    {bending.sigma_F1} MPa {bending.pass1 ? '≤' : '>'} [{bending.sigma_F1_allow}] MPa {bending.pass1 ? '✓' : '✗'}
                  </Text>
                </View>
                <View style={[styles.row, styles.rowLast]}>
                  <Text style={styles.label}>Ứng suất uốn σF₂</Text>
                  <Text style={[styles.value, bending.pass2 ? styles.pass : styles.fail]}>
                    {bending.sigma_F2} MPa {bending.pass2 ? '≤' : '>'} [{bending.sigma_F2_allow}] MPa {bending.pass2 ? '✓' : '✗'}
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={handleFinish} style={styles.finishButton}>
          <Text style={styles.finishButtonText}>{isReadOnly ? "Thoát" : "✅ Hoàn tất — Về Trang chủ"}</Text>
        </TouchableOpacity>
      </View>

      {/* Popup xác nhận lưu */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Lưu tính toán?</Text>
            <Text style={styles.modalMessage}>Bạn có muốn lưu bài toán này vào lịch sử không?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={handleSkipSave} style={styles.modalBtnSkip}>
                <Text style={styles.modalBtnSkipText}>Không</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.modalBtnSave}>
                <Text style={styles.modalBtnSaveText}>Lưu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 24, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
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
  stepTextDone: { color: '#fff', fontSize: 14, fontWeight: '700' },
  stepTextActive: { color: '#fff', fontSize: 14, fontWeight: '700' },
  stepLabelDone: { marginLeft: 6, fontSize: 13, fontWeight: '500', color: '#10b981' },
  stepLabelActive: { marginLeft: 6, fontSize: 13, fontWeight: '600', color: '#111827' },
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
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },
  errorTitle: { fontSize: 15, fontWeight: '700', color: '#dc2626', marginBottom: 6 },
  errorText: { color: '#7f1d1d', fontSize: 13 },
  warnText: { color: '#92400e', fontSize: 13, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1f2937', marginBottom: 14 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  rowLast: { borderBottomWidth: 0 },
  label: { fontSize: 13, color: '#4b5563', flex: 1 },
  value: { fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'right', flexShrink: 1 },
  pass: { color: '#059669' },
  fail: { color: '#dc2626' },
  footer: {
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb',
    paddingHorizontal: 24, paddingVertical: 16,
  },
  finishButton: {
    width: '100%', paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center',
  },
  finishButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  // ── Modal popup styles ──
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    width: '82%', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalBtnSkip: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center',
  },
  modalBtnSkipText: { fontSize: 15, fontWeight: '600', color: '#6b7280' },
  modalBtnSave: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    backgroundColor: '#2563eb', alignItems: 'center',
    shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  modalBtnSaveText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
