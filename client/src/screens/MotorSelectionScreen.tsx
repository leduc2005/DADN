import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Motor {
    id: number;
    model: string;
    power: number;
    speed: number;
    torqueRatio: number;
}

interface MotorSelectionScreenProps {
    navigation: any;
    route?: any;
}

export default function MotorSelectionScreen({ navigation, route }: MotorSelectionScreenProps) {
    const state = route?.params || {};
    console.log('MotorSelectionScreen received state:', state);
    const {
        inputData,
    } = state;

    const operatingData = inputData?.operatingData || {};
    const loadData = inputData?.loadData || {};
    const itemData = inputData?.Item || {};
    const driveItem = itemData?.driveItem || [];
    const bearingItem = itemData?.bearingItem || [];

    const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null);

    const { systemEta, Pct, Ndb } = useMemo(() => {
        const inputPower = Number(operatingData?.power);
        const inputSpeed = Number(operatingData?.speed);

        const etaProduct = Array.isArray(driveItem) && driveItem.length > 0
            ? driveItem.reduce((acc: number, item: any) => {
                const eta = Number(item?.eta);
                return eta > 0 ? acc * eta : acc;
            }, 1)
            : 1;

        const ratioProduct = Array.isArray(driveItem) && driveItem.length > 0
            ? driveItem.reduce((acc: number, item: any) => {
                const ratio = Number(item?.transmissionRatio);
                return ratio > 0 ? acc * ratio : acc;
            }, 1)
            : 1;

        const calculatedPct = inputPower > 0 && etaProduct > 0 ? inputPower / etaProduct : 0;
        const calculatedNdb = inputSpeed > 0 ? inputSpeed * ratioProduct : 0;

        return {
            systemEta: etaProduct,
            Pct: calculatedPct,
            Ndb: calculatedNdb,
        };
    }, [operatingData?.power, operatingData?.speed, driveItem]);


    const motors: Motor[] = [
        { id: 1, model: '4A112M2Y3', power: 7.5, speed: 2922, torqueRatio: 2.2 },
        { id: 2, model: '4A132S4Y3', power: 7.5, speed: 1440, torqueRatio: 1.8 },
        { id: 3, model: '4A100L2Y3', power: 5.5, speed: 2880, torqueRatio: 2.5 },
        { id: 4, model: '4A132M4Y3', power: 11, speed: 1460, torqueRatio: 1.5 },
    ];

    const navigate = (screen: string, params?: any) => {
        if (screen === 'kinematic-results') navigation.navigate('KinematicResults', params);
        else if (screen === 'input') navigation.navigate('Input', params);
        else navigation.navigate(screen.charAt(0).toUpperCase() + screen.slice(1), params);
    };

    const handleSelectMotor = (motor: Motor) => {
        setSelectedMotor(motor);
        console.log('Selected motor:', motor);
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
                        <Text style={styles.metaLabel}>P công tác </Text>
                        <Text style={styles.metaValue}>{Pct.toFixed(3)} kW</Text>
                    </View>
                    <View style={styles.metaCell}>
                        <Text style={styles.metaLabel}>N đồng bộ </Text>
                        <Text style={styles.metaValue}>{Ndb.toFixed(2)} rpm</Text>
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
                                        style={[
                                            styles.selectButton,
                                            isSelected ? styles.selectButtonSelected : styles.selectButtonDefault,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.selectButtonText,
                                                isSelected ? styles.selectButtonTextSelected : styles.selectButtonTextDefault,
                                            ]}
                                        >
                                            {isSelected ? 'Selected' : 'Select'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.specList}>
                                    <View style={styles.specRow}>
                                        <Text style={styles.specLabel}>Power:</Text>
                                        <Text style={styles.specValue}>{motor.power} kW</Text>
                                    </View>
                                    <View style={styles.specRow}>
                                        <Text style={styles.specLabel}>Speed:</Text>
                                        <Text style={styles.specValue}>{motor.speed} rpm</Text>
                                    </View>
                                    <View style={styles.specRow}>
                                        <Text style={styles.specLabel}>Torque Ratio:</Text>
                                        <Text style={styles.specValue}>{motor.torqueRatio}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {selectedMotor ? (
                <View style={styles.footer}>
                    <TouchableOpacity
                        onPress={() => {
                            navigate('kinematic-results', {
                                ...state,
                                motorModel: selectedMotor.model,
                                nDc: selectedMotor.speed,
                                motorPower: selectedMotor.power,
                                Pct,
                                Ndb,
                                systemEta,
                                inputData,
                                uHop: 11.25,
                                uNgoai: 2.5,
                            });
                        }}
                        style={styles.continueButton}
                    >
                        <Text style={styles.continueButtonText}>Continue to Kinematic Results</Text>
                    </TouchableOpacity>
                </View>
            ) : null}
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
    specValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
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
