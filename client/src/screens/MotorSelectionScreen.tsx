import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { calc_motor, calc_system_transmission } from '../logic/calc_motor';
import { searchMotor } from '../services/motor';

interface Motor {
    motorId: string;
    motorType: string;
    ratedPower: number;
    motorSpeed: number;
    syncSpeed: number;
}

interface SystemTransmission {
    uh: number;
    u1: number;
    u2: number;

    Pdc: number;
    P1: number;
    P2: number;
    P3: number;

    ndc: number;
    n1: number;
    n2: number;
    n3: number;

    tdc: number;
    t1: number;
    t2: number;
    t3: number;
}

interface BevelGearParams {
    ck?: number | string;
    kbe?: number | string;
    psiBd2?: number | string;
}

interface RouteDriveItem {
    type?: string;
    efficiencyTransmissionRatio?: number | string;
    quantity?: number | string;
    transmissionRatio?: number | string;
    bevelGearParams?: BevelGearParams;
}

interface MotorSelectionScreenProps {
    navigation: any;
    route?: any;
}

export default function MotorSelectionScreen({ navigation, route }: MotorSelectionScreenProps) {
    const state = route?.params || {};
    const {
        inputData,
    } = state;

    console.log('Received inputData in MotorSelectionScreen:', inputData);

    const operatingData = inputData?.operatingData || {};
    const loadData = inputData?.loadData || {};
    const itemData = inputData?.item || {};
    const driveItem = itemData?.driveItem || [];
    const bearingItem = itemData?.bearingItem || [];

    const driveItemsDataForMotorCalc = Array.isArray(driveItem)
        ? driveItem.map((item: any) => ({
            type: item?.type,
            efficiencyTransmissionRatio: item?.efficiencyTransmissionRatio,
            quantity: item?.quantity,
            transmissionRatio: item?.transmissionRatio,
        }))
        : [];

    const bearingItemsDataForMotorCalc = Array.isArray(bearingItem)
        ? bearingItem.map((item: any) => ({
            type: item?.type,
            efficiencyTransmissionRatio: item?.efficiencyTransmissionRatio,
            quantity: item?.quantity,
            transmissionRatio: item?.transmissionRatio,
        }))
        : [];

    const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);
    const [systemTransmission, setSystemTransmission] = useState<SystemTransmission | null>(null);
    const [motors, setMotors] = useState<Motor[]>([]);
    const [loadingMotors, setLoadingMotors] = useState(false);
    const [motorError, setMotorError] = useState<string | null>(null);

    const toPositiveNumberOrDefault = (value: number | string | undefined, defaultValue: number): number => {
        const num = Number(value);
        return Number.isFinite(num) && num > 0 ? num : defaultValue;
    };

    const formatNumber = (value: number, fractionDigits: number): string => {
        if (!Number.isFinite(value)) return '-';
        return value.toFixed(fractionDigits);
    };

    const { systemEfficiency, Pct, Nsb } = useMemo(
        () => calc_motor({
            power: operatingData?.power,
            speed: operatingData?.speed,
            driveItem: driveItemsDataForMotorCalc,
            bearingItem: bearingItemsDataForMotorCalc,
        }),
        [operatingData?.power, operatingData?.speed, driveItemsDataForMotorCalc, bearingItemsDataForMotorCalc],
    );

    useEffect(() => {
        const loadMotors = async () => {
            if (!Pct || !Nsb) {
                setMotors([]);
                return;
            }

            setLoadingMotors(true);
            setMotorError(null);

            try {
                const response = await searchMotor({ Pct, Nsb });
                setMotors(Array.isArray(response?.items) ? response.items : []);
            } catch (error) {
                setMotorError('Không thể tải danh sách motor.');
                setMotors([]);
            } finally {
                setLoadingMotors(false);
            }
        };

        loadMotors();
    }, [Pct, Nsb]);

    const navigate = (screen: string, params?: any) => {
        if (screen === 'kinematic-results') navigation.navigate('KinematicResults', params);
        else if (screen === 'input') navigation.navigate('Input', params);
        else navigation.navigate(screen.charAt(0).toUpperCase() + screen.slice(1), params);
    };

    const handleSelectMotor = (motor: Motor) => {
        const driveItems = Array.isArray(driveItem) ? (driveItem as RouteDriveItem[]) : [];
        const beltDrive = driveItems.find((item) => item?.type === 'Đai');
        const firstValidDrive = driveItems.find((item) => toPositiveNumberOrDefault(item?.transmissionRatio, 0) > 0);
        const bevelDrive = driveItems.find((item) => item?.type === 'Bánh răng côn');

        const ud = toPositiveNumberOrDefault(
            beltDrive?.transmissionRatio,
            toPositiveNumberOrDefault(firstValidDrive?.transmissionRatio, 1),
        );

        const ndc = toPositiveNumberOrDefault(motor.motorSpeed, 1);
        const nlv = toPositiveNumberOrDefault(operatingData?.speed, 1);
        const ck = toPositiveNumberOrDefault(bevelDrive?.bevelGearParams?.ck, 1);
        const kbe = toPositiveNumberOrDefault(bevelDrive?.bevelGearParams?.kbe, 0.5);
        const psibd2 = toPositiveNumberOrDefault(bevelDrive?.bevelGearParams?.psiBd2, 0.3);
        const p = toPositiveNumberOrDefault(operatingData?.power, 1);

        const result = calc_system_transmission(
            ud,
            ndc,
            nlv,
            ck,
            kbe,
            psibd2,
            driveItemsDataForMotorCalc,
            bearingItemsDataForMotorCalc,
            p,
        );

        if (selectedMotor?.motorId === motor.motorId) {
            setSelectedMotor(null);
            setSystemTransmission(null);
            return;
        }

        setSelectedMotor(motor);
        setSystemTransmission(result);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigate('input')} style={styles.backButton}>
                    <Text style={styles.backButtonText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Motor</Text>
            </View>

            <View style={styles.banner}>
                <View style={styles.bannerRow}>
                    <View style={styles.bannerItem}>
                        <Text style={styles.bannerLabel}>Công suất (P)</Text>
                        <Text style={styles.bannerValue}>{operatingData.power || '-'} kW</Text>
                    </View>
                    <View style={styles.bannerItemRight}>
                        <Text style={styles.bannerLabel}>Số vòng (n)</Text>
                        <Text style={styles.bannerValue}>{operatingData.speed || '-'} vòng/phút</Text>
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
                        <Text style={styles.metaValue}>{systemEfficiency.toFixed(4)}</Text>
                    </View>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>P công tác </Text>
                        <Text style={styles.metaValue}>{Pct.toFixed(3)} kW</Text>
                    </View>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>N đồng bộ </Text>
                        <Text style={styles.metaValue}>{Nsb.toFixed(0)} vòng/phút</Text>
                    </View>
                </View>
            </View>

            <View style={styles.stepper}>
                <View style={styles.stepItem}>
                    <View style={styles.stepCircleActive}>
                        <Text style={styles.stepCircleTextActive}>1</Text>
                    </View>
                    <Text style={styles.stepLabelActive}>Motor</Text>
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
                ) : motorError ? (
                    <Text style={styles.errorText}>{motorError}</Text>
                ) : null}

                <View style={styles.motorList}>
                    {motors.map((motor) => {
                        const isSelected = selectedMotor?.motorId === motor.motorId;

                        return (
                            <TouchableOpacity
                                key={motor.motorId}
                                activeOpacity={0.95}
                                onPress={() => handleSelectMotor(motor)}
                                style={[
                                    styles.motorCard,
                                    isSelected ? styles.motorCardSelected : styles.motorCardDefault,
                                ]}
                            >
                                <View style={styles.motorCardHeader}>
                                    <Text style={styles.motorTitle}>Model: {motor.motorId}</Text>
                                    {/* <Text style={styles.tapHintText}>{isSelected ? 'Đang xem kết quả' : 'Nhấn để xem kết quả'}</Text> */}
                                </View>

                                <View style={styles.specList}>
                                    <View style={styles.specRow}>
                                        <Text style={styles.specLabel}>Loại động cơ:</Text>
                                        <Text style={styles.specValue}>{motor.motorType}</Text>
                                    </View>
                                    <View style={styles.specRow}>
                                        <Text style={styles.specLabel}>Mã động cơ:</Text>
                                        <Text style={styles.specValue}>{motor.motorId}</Text>
                                    </View>
                                    <View style={styles.specRow}>
                                        <Text style={styles.specLabel}>Công suất động cơ kW:</Text>
                                        <Text style={styles.specValue}>{motor.ratedPower}</Text>
                                    </View>
                                    <View style={styles.specRow}>
                                        <Text style={styles.specLabel}>Số vòng/phút:</Text>
                                        <Text style={styles.specValue}>{motor.motorSpeed}</Text>
                                    </View>
                                    <View style={styles.specRow}>
                                        <Text style={styles.specLabel}>Số vòng đồng bộ:</Text>
                                        <Text style={styles.specValue}>{motor.syncSpeed}</Text>
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
                                            <Text style={styles.tableCell}>{formatNumber(toPositiveNumberOrDefault(driveItem?.find((item: any) => item?.type === 'Đai')?.transmissionRatio, 1), 3)}</Text>
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

                                        <TouchableOpacity
                                            onPress={() => {
                                                navigate('kinematic-results', {
                                                    ...state,
                                                    motorModel: selectedMotor?.motorId,
                                                    nDc: selectedMotor?.motorSpeed,
                                                    motorPower: selectedMotor?.ratedPower,
                                                    Pct,
                                                    Nsb,
                                                    systemEfficiency,
                                                    inputData,
                                                    uHop: systemTransmission.uh,
                                                    uNgoai: toPositiveNumberOrDefault(driveItem?.find((item: any) => item?.type === 'Đai')?.transmissionRatio, 1),
                                                    systemTransmission,
                                                });
                                            }}
                                            style={styles.chooseMotorButton}
                                        >
                                            <Text style={styles.chooseMotorButtonText}>Chọn động cơ</Text>
                                        </TouchableOpacity> 
                                    </View>
                                ) : null}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
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
    tapHintText: { fontSize: 12, color: '#2563eb', fontWeight: '600' },
    specList: { gap: 8 },
    specRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    specLabel: { flex: 1, paddingRight: 16, color: '#6b7280', fontSize: 14 },
    specValue: { flex: 1, textAlign: 'right', fontSize: 14, fontWeight: '600', color: '#111827' },
    transmissionBlock: {
        marginTop: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        overflow: 'hidden',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#1f2937',
    },
    tableBodyRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        backgroundColor: '#111827',
    },
    tableCell: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 8,
        fontSize: 13,
        color: '#f9fafb',
        textAlign: 'center',
        borderRightWidth: 1,
        borderRightColor: '#374151',
    },
    tableHeaderCell: {
        fontWeight: '700',
    },
    tableFirstColumn: {
        flex: 1.25,
    },
    chooseMotorButton: {
        width: '100%',
        paddingVertical: 14,
        backgroundColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    chooseMotorButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
