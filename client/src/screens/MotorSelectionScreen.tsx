import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calc_system_transmission, DriveCalcItem, BearingCalcItem, SystemTransmissionResult } from '../logic/calc_motor';
import { runMotorSelectionAndDynamics } from '../logic/validation';
import { searchMotor } from '../services/motor';
import { useProjectState } from '../store/projectState';

interface MotorSelectionScreenProps {
  navigation: any;
  route?: any;
}

interface ScreenMotor {
  id: string;
  model: string;
  power: number;
  speed: number;
  syncSpeed?: number;
  motorType?: string;
  torqueRatio: number;
}

const toPositiveNumber = (value: number | string | undefined, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
};

const formatNumber = (value: number, fractionDigits: number) =>
  Number.isFinite(value) ? value.toFixed(fractionDigits) : '-';

const normalizeMotor = (motor: any, index: number): ScreenMotor => ({
  id: String(motor.motorId ?? motor.model ?? index),
  model: motor.motorId ?? motor.model ?? `Motor-${index + 1}`,
  power: Number(motor.ratedPower ?? motor.power ?? 0),
  speed: Number(motor.motorSpeed ?? motor.speed ?? 0),
  syncSpeed: Number(motor.syncSpeed ?? 0) || undefined,
  motorType: motor.motorType,
  torqueRatio: Number(motor.overloadRatio ?? motor.Tmm_Tdn ?? motor.torqueRatio ?? 2.2),
});

export default function MotorSelectionScreen({ navigation, route }: MotorSelectionScreenProps) {
  const state = route?.params || {};
  const {
    inputData,
    calculatedPower = 0,
    requiredSpeed = 0,
    motors: stateMotors = [],
    ratios = [],
  } = state;

  const operatingData = inputData?.operatingData || {};
  const loadData = inputData?.loadData || {};
  const itemData = inputData?.item || inputData?.Item || {};
  const driveItem = Array.isArray(itemData?.driveItem) ? itemData.driveItem : [];
  const bearingItem = Array.isArray(itemData?.bearingItem) ? itemData.bearingItem : [];

  const normalizedFallbackMotors = useMemo(
    () => stateMotors.map(normalizeMotor),
    [stateMotors],
  );

  const [selectedMotor, setSelectedMotor] = useState<ScreenMotor | null>(null);
  const [systemTransmission, setSystemTransmission] = useState<SystemTransmissionResult | null>(null);
  const [motors, setMotors] = useState<ScreenMotor[]>(normalizedFallbackMotors);
  const [loadingMotors, setLoadingMotors] = useState(false);
  const [motorError, setMotorError] = useState<string | null>(null);

  const { saveMotorResult, isReadOnly, savedSessions, currentSessionId } = useProjectState();

  // Tìm kiếm motor đã được chọn trong lịch sử
  const savedSession = savedSessions.find(s => s.id === currentSessionId);
  const savedMotorModel = savedSession?.motorModel;

  useEffect(() => {
    let cancelled = false;

    const loadMotors = async () => {
      // Cho phép lấy API bình thường để hiển thị các lựa chọn đề xuất

      if (!(calculatedPower > 0 && requiredSpeed > 0)) {
        setMotors(normalizedFallbackMotors);
        return;
      }

      setLoadingMotors(true);
      setMotorError(null);

      try {
        const response = await searchMotor({ Pct: calculatedPower, Nsb: requiredSpeed });
        if (cancelled) return;

        const apiMotors = Array.isArray(response.items)
          ? response.items.map(normalizeMotor)
          : [];

        let finalMotors = apiMotors.length > 0 ? apiMotors : [...normalizedFallbackMotors];

        if (isReadOnly && savedSession) {
          const historicalMotor: ScreenMotor = {
            id: 'historical-' + (savedSession.motorModel || 'unknown'),
            model: savedSession.motorModel || 'Không rõ',
            power: savedSession.motorPower || 0,
            speed: savedSession.nDc || 0,
            motorType: 'Dữ liệu Lịch sử',
            torqueRatio: 2.2,
          };
          if (!finalMotors.find(m => m.model === historicalMotor.model)) {
            finalMotors = [historicalMotor, ...finalMotors];
          }
        }

        setMotors(finalMotors);
      } catch (error) {
        if (cancelled) return;
        setMotorError('Không thể tải danh sách motor từ server. Đang dùng dữ liệu hiện có.');
        let fallback = [...normalizedFallbackMotors];
        if (isReadOnly && savedSession) {
          const historicalMotor: ScreenMotor = {
            id: 'historical-' + (savedSession.motorModel || 'unknown'),
            model: savedSession.motorModel || 'Không rõ',
            power: savedSession.motorPower || 0,
            speed: savedSession.nDc || 0,
            motorType: 'Dữ liệu Lịch sử',
            torqueRatio: 2.2,
          };
          if (!fallback.find(m => m.model === historicalMotor.model)) {
            fallback = [historicalMotor, ...fallback];
          }
        }
        setMotors(fallback);
      } finally {
        if (!cancelled) {
          setLoadingMotors(false);
        }
      }
    };

    loadMotors();

    return () => {
      cancelled = true;
    };
  }, [calculatedPower, normalizedFallbackMotors, requiredSpeed, isReadOnly]);

  useEffect(() => {
    console.log('[MotorSelectionScreen] isReadOnly:', isReadOnly, 'savedSession:', !!savedSession, 'sessionId:', currentSessionId);
    if (isReadOnly && savedSession) {
      // Dựng lại motor từ lịch sử (bỏ qua việc có tìm thấy trong API hay không)
      if (!selectedMotor) {
        console.log('[MotorSelectionScreen] Reconstructing motor:', savedSession.motorModel);
        const historicalMotor: ScreenMotor = {
          id: 'historical-' + (savedSession.motorModel || 'unknown'),
          model: savedSession.motorModel || 'Không rõ',
          power: savedSession.motorPower || 0,
          speed: savedSession.nDc || 0,
          motorType: 'Dữ liệu Lịch sử',
          torqueRatio: 2.2,
        };
        setSelectedMotor(historicalMotor);
        
        // Không cần đẩy vào setMotors ở đây nữa vì loadMotors đã xử lý
      }

      // Khôi phục kết quả truyền động để hiện nút "Tiếp tục"
      if (!systemTransmission && savedSession.systemTransmission) {
        setSystemTransmission(savedSession.systemTransmission);
      }
    }
  }, [isReadOnly, savedSession, selectedMotor, systemTransmission]);

  const systemEta = Array.isArray(driveItem) && driveItem.length > 0
    ? driveItem.reduce((accumulator: number, item: any) => {
        const eta = Number(item?.efficiencyTransmissionRatio ?? item?.eta);
        return eta > 0 ? accumulator * eta : accumulator;
      }, 1)
    : 1;

  const navigate = (screen: string, params?: any) => {
    if (screen === 'kinematic-results') navigation.navigate('KinematicResults', params);
    else if (screen === 'input') navigation.navigate('Input', params);
    else navigation.navigate(screen.charAt(0).toUpperCase() + screen.slice(1), params);
  };

  const handleSelectMotor = (motor: ScreenMotor) => {
    if (selectedMotor?.id === motor.id) {
      setSelectedMotor(null);
      setSystemTransmission(null);
      return;
    }

    const normalizedDriveItems: DriveCalcItem[] = driveItem.map((item: any) => ({
      ...item,
      efficiencyTransmissionRatio: item?.efficiencyTransmissionRatio ?? item?.eta,
    }));

    const normalizedBearingItems: BearingCalcItem[] = bearingItem.map((item: any) => ({
      ...item,
      efficiencyTransmissionRatio: item?.efficiencyTransmissionRatio ?? item?.eta,
    }));

    const beltDrive = normalizedDriveItems.find((item) => item.type === 'Đai');
    const firstValidDrive = normalizedDriveItems.find(
      (item) => toPositiveNumber(item.transmissionRatio, 0) > 0,
    );

    const ud = toPositiveNumber(
      beltDrive?.transmissionRatio,
      toPositiveNumber(firstValidDrive?.transmissionRatio, toPositiveNumber(ratios[0], 1)),
    );

    const bevelDrive = driveItem.find((item: any) => item?.type === 'Bánh răng côn');
    const ck = toPositiveNumber(bevelDrive?.bevelGearParams?.ck, 1);
    const kbe = toPositiveNumber(bevelDrive?.bevelGearParams?.kbe, 0.5);
    const psibd2 = toPositiveNumber(bevelDrive?.bevelGearParams?.psiBd2, 0.3);

    const transmission = calc_system_transmission(
      ud,
      motor.speed,
      operatingData?.speed,
      ck,
      kbe,
      psibd2,
      normalizedDriveItems,
      normalizedBearingItems,
      operatingData?.power,
    );

    setSelectedMotor(motor);
    setSystemTransmission(transmission);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigate('input')} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn Động Cơ</Text>
      </View>

      <View style={styles.banner}>
        <View style={styles.bannerRow}>
          <View style={styles.bannerItem}>
            <Text style={styles.bannerLabel}>Công suất (P)</Text>
            <Text style={styles.bannerValue}>{operatingData.power || '-'} kW</Text>
          </View>
          <View style={styles.bannerItemRight}>
            <Text style={styles.bannerLabel}>Số vòng (n)</Text>
            <Text style={styles.bannerValue}>{operatingData.speed || '-'} rpm</Text>
          </View>
        </View>

        {(operatingData.serviceLife || loadData.loadType || loadData.workShifts) ? (
          <View style={styles.bannerMetaRow}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Thời gian phục vụ</Text>
              <Text style={styles.metaValue}>{operatingData.serviceLife ?? '-'} years</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Loại tải</Text>
              <Text style={styles.metaValue}>{loadData.loadType ?? '-'}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Ca làm việc</Text>
              <Text style={styles.metaValue}>{loadData.workShifts ?? '-'}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.bannerMetaRow}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>η hệ</Text>
            <Text style={styles.metaValue}>{systemEta.toFixed(4)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>P công tác</Text>
            <Text style={styles.metaValue}>{calculatedPower.toFixed(3)} kW</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>N đồng bộ</Text>
            <Text style={styles.metaValue}>{requiredSpeed.toFixed(2)} rpm</Text>
          </View>
        </View>
      </View>

      <View style={styles.stepper}>
        <View style={styles.stepItem}>
          <View style={styles.stepCircleActive}>
            <Text style={styles.stepCircleTextActive}>1</Text>
          </View>
          <Text style={styles.stepLabelActive}>Động cơ</Text>
        </View>

        <View style={styles.stepDivider} />

        <View style={styles.stepItem}>
          <View style={styles.stepCircleInactive}>
            <Text style={styles.stepCircleTextInactive}>2</Text>
          </View>
          <Text style={styles.stepLabelInactive}>Belt</Text>
        </View>

        <View style={styles.stepDivider} />

        <View style={styles.stepItem}>
          <View style={styles.stepCircleInactive}>
            <Text style={styles.stepCircleTextInactive}>3</Text>
          </View>
          <Text style={styles.stepLabelInactive}>Gear</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
        {loadingMotors ? (
          <Text style={styles.statusText}>Đang tải danh sách motor...</Text>
        ) : null}
        {motorError ? (
          <Text style={styles.errorText}>{motorError}</Text>
        ) : null}

        <View style={styles.motorList}>
          {motors.map((motor) => {
            const isSelected = selectedMotor?.id === motor.id;

            return (
              <View
                key={motor.id}
                style={[
                  styles.motorCard,
                  isSelected ? styles.motorCardSelected : styles.motorCardDefault,
                ]}
              >
                <View style={styles.motorCardHeader}>
                  <Text style={styles.motorTitle}>Model: {motor.model}</Text>
                  <TouchableOpacity
                    onPress={() => handleSelectMotor(motor)}
                    disabled={isReadOnly}
                    style={[
                      styles.selectButton,
                      isSelected ? styles.selectButtonSelected : styles.selectButtonDefault,
                      isReadOnly && styles.selectButtonDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        isSelected ? styles.selectButtonTextSelected : styles.selectButtonTextDefault,
                      ]}
                    >
                      {isSelected ? 'Đã chọn' : 'Chọn'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.specList}>
                  {motor.motorType ? (
                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>Type:</Text>
                      <Text style={styles.specValue}>{motor.motorType}</Text>
                    </View>
                  ) : null}
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Power:</Text>
                    <Text style={styles.specValue}>{motor.power} kW</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Speed:</Text>
                    <Text style={styles.specValue}>{motor.speed} rpm</Text>
                  </View>
                  {motor.syncSpeed ? (
                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>Sync Speed:</Text>
                      <Text style={styles.specValue}>{motor.syncSpeed} rpm</Text>
                    </View>
                  ) : null}
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Torque Ratio:</Text>
                    <Text style={styles.specValue}>{motor.torqueRatio}</Text>
                  </View>
                </View>

                {isSelected && systemTransmission ? (
                  <View style={styles.transmissionBlock}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, styles.tableFirstColumn]}>Thông số</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell]}>Động cơ</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell]}>I</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell]}>II</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell]}>III</Text>
                    </View>

                    <View style={styles.tableBodyRow}>
                      <Text style={[styles.tableCell, styles.tableFirstColumn]}>Công suất P (kW)</Text>
                      <Text style={styles.tableCell}>{formatNumber(systemTransmission.Pdc, 3)}</Text>
                      <Text style={styles.tableCell}>{formatNumber(systemTransmission.P1, 3)}</Text>
                      <Text style={styles.tableCell}>{formatNumber(systemTransmission.P2, 3)}</Text>
                      <Text style={styles.tableCell}>{formatNumber(systemTransmission.P3, 3)}</Text>
                    </View>

                    <View style={styles.tableBodyRow}>
                      <Text style={[styles.tableCell, styles.tableFirstColumn]}>Tỉ số truyền u</Text>
                      <Text style={styles.tableCell}>-</Text>
                      <Text style={styles.tableCell}>{formatNumber(toPositiveNumber(driveItem.find((item: any) => item?.type === 'Đai')?.transmissionRatio, 1), 3)}</Text>
                      <Text style={styles.tableCell}>{formatNumber(systemTransmission.u1, 3)}</Text>
                      <Text style={styles.tableCell}>{formatNumber(systemTransmission.u2, 4)}</Text>
                    </View>

                    <View style={styles.tableBodyRow}>
                      <Text style={[styles.tableCell, styles.tableFirstColumn]}>Số vòng quay n</Text>
                      <Text style={styles.tableCell}>{formatNumber(systemTransmission.ndc, 0)}</Text>
                      <Text style={styles.tableCell}>{formatNumber(systemTransmission.n1, 1)}</Text>
                      <Text style={styles.tableCell}>{formatNumber(systemTransmission.n2, 1)}</Text>
                      <Text style={styles.tableCell}>{formatNumber(systemTransmission.n3, 1)}</Text>
                    </View>

                    <View style={styles.tableBodyRow}>
                      <Text style={[styles.tableCell, styles.tableFirstColumn]}>Moment xoắn T</Text>
                      <Text style={styles.tableCell}>{formatNumber(systemTransmission.tdc, 3)}</Text>
                      <Text style={styles.tableCell}>{formatNumber(systemTransmission.t1, 3)}</Text>
                      <Text style={styles.tableCell}>{formatNumber(systemTransmission.t2, 3)}</Text>
                      <Text style={styles.tableCell}>{formatNumber(systemTransmission.t3, 3)}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {selectedMotor ? (
        <View style={styles.footer}>
          <TouchableOpacity
                  onPress={() => {
              const [u_belt, u_stage1, u_stage2] = ratios;
              const Pt = Number(operatingData?.power);
              const dynamicResults = runMotorSelectionAndDynamics(
                selectedMotor!,
                Pt,
                toPositiveNumber(u_belt, 2.5),
                toPositiveNumber(u_stage1, 3),
                toPositiveNumber(u_stage2, 1),
              );

              const sessionId = `session-${Date.now()}`;
              const uNgoaiVal = systemTransmission
                ? toPositiveNumber(driveItem.find((item: any) => item?.type === 'Đai')?.transmissionRatio, toPositiveNumber(u_belt, 2.5))
                : toPositiveNumber(u_belt, 2.5);
              const uHopVal = systemTransmission?.uh ?? toPositiveNumber(u_stage1, 3) * toPositiveNumber(u_stage2, 1);

              saveMotorResult(sessionId, {
                title: `Tính toán - ${selectedMotor!.model}`,
                motorModel: selectedMotor!.model,
                motorPower: selectedMotor!.power,
                nDc: selectedMotor!.speed,
                uHop: uHopVal,
                uNgoai: uNgoaiVal,
                systemTransmission: systemTransmission ?? undefined,
              });

              navigate('kinematic-results', {
                ...state,
                sessionId,
                motorModel: selectedMotor!.model,
                nDc: selectedMotor!.speed,
                motorPower: selectedMotor!.power,
                Pct: calculatedPower,
                Ndb: requiredSpeed,
                systemEta,
                inputData,
                dynamicResults,
                systemTransmission,
                uHop: uHopVal,
                uNgoai: uNgoaiVal,
              });
            }}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Tiếp tục — Xem Kết quả Động học</Text>
          </TouchableOpacity>
        </View>
      ) : null}
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
  },
  bannerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bannerItem: { flex: 1 },
  bannerItemRight: { alignItems: 'flex-end' },
  bannerLabel: { fontSize: 12, color: '#1d4ed8', marginBottom: 4 },
  bannerValue: { fontSize: 16, fontWeight: '700', color: '#1e3a8a' },
  bannerMetaRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#bfdbfe', flexDirection: 'row' },
  metaCell: { flex: 1 },
  metaLabel: { fontSize: 12, color: '#2563eb', marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: '600', color: '#1e3a8a' },
  stepper: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  stepCircleActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleInactive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleTextActive: { color: '#fff', fontSize: 14, fontWeight: '700' },
  stepCircleTextInactive: { color: '#6b7280', fontSize: 14, fontWeight: '700' },
  stepLabelActive: { marginLeft: 8, fontSize: 14, fontWeight: '500', color: '#111827' },
  stepLabelInactive: { marginLeft: 8, fontSize: 14, fontWeight: '500', color: '#9ca3af' },
  stepDivider: { flex: 1, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: 8 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 24 },
  statusText: { marginBottom: 12, fontSize: 14, color: '#2563eb', fontWeight: '600' },
  errorText: { marginBottom: 12, fontSize: 14, color: '#dc2626', fontWeight: '600' },
  motorList: { gap: 12 },
  motorCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
  },
  motorCardDefault: { borderColor: '#e5e7eb' },
  motorCardSelected: {
    borderColor: '#2563eb',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  motorCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  motorTitle: { flex: 1, paddingRight: 12, fontSize: 16, fontWeight: '700', color: '#111827' },
  selectButton: {
    minWidth: 88,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButtonDefault: { backgroundColor: '#eff6ff' },
  selectButtonSelected: { backgroundColor: '#2563eb' },
  selectButtonText: { fontSize: 14, fontWeight: '600' },
  selectButtonTextDefault: { color: '#2563eb' },
  selectButtonTextSelected: { color: '#fff' },
  specList: { gap: 8 },
  specRow: { flexDirection: 'row', alignItems: 'center' },
  specLabel: { width: 110, color: '#6b7280', fontSize: 14 },
  specValue: { fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'right', flexShrink: 1 },
  selectButtonDisabled: { opacity: 0.5 },
  transmissionBlock: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
  },
  tableBodyRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#bfdbfe',
    backgroundColor: '#fff',
  },
  tableCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 13,
    color: '#111827',
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#bfdbfe',
  },
  tableHeaderCell: {
    fontWeight: '700',
  },
  tableFirstColumn: {
    flex: 1.25,
  },
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
