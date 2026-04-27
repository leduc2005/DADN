import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { ChevronLeft, Info, AlertTriangle, XCircle } from "lucide-react-native";
import { runMotorSuggestion } from "../logic/validation";
import { BearingType, DriveType, useProjectState } from "../store/projectState";

interface InputScreenProps {
    navigation: any;
}

export default function InputScreen({ navigation }: InputScreenProps) {
    const {
        calculateSession,
        operatingData,
        loadData,
        efficiencyData,
        driveItems,
        bearingItems,
        setCalculateSession,
        setOperatingField,
        setLoadField,
        setEfficiencyField,
        addDriveItem,
        updateDriveItem,
        removeDriveItem,
        addBearingItem,
        updateBearingItem,
        removeBearingItem,
    } = useProjectState();

    const loadType = loadData.loadType;
    const workShifts = loadData.workShifts;

    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [errorType, setErrorType] = useState<"empty" | "format" | "threshold">("empty");
    const [errorSuggestion, setErrorSuggestion] = useState("");

    const loadTypeOptions = ["Tải êm", "Tải va đập nhẹ", "Tải va đập vừa", "Tải va đập nặng"];
    const workShiftOptions = ["1 ca", "2 ca", "3 ca"];
    const driveTypeOptions: DriveType[] = ["Bánh răng trụ", "Bánh răng côn", "Trục vít tự hãm", "Trục vít không tự hãm", "Xích", "Bánh ma sát", "Đai"];
    const bearingTypeOptions: BearingType[] = ["Ổ lăn", "Ổ trượt"];
    const zOptions: Array<"1" | "2" | "4"> = ["1", "2", "4"];

    const isDriveForcedOpen = (type: DriveType) => type === "Trục vít không tự hãm" || type === "Đai";

    const getDriveEta = (type: DriveType) => {
        switch (type) {
            case "Đai":
                return efficiencyData.etaBelt;
            case "Bánh răng côn":
                return efficiencyData.etaBevelGear;
            case "Bánh răng trụ":
                return efficiencyData.etaStraightGear;
            case "Trục vít tự hãm":
                return efficiencyData.etaWormSelfLocking;
            case "Trục vít không tự hãm":
                return efficiencyData.etaWormNonSelfLocking;
            case "Xích":
                return efficiencyData.etaChain;
            case "Bánh ma sát":
                return efficiencyData.etaFriction;
            default:
                return "";
        }
    };

    const getBearingEta = (type: BearingType) => {
        switch (type) {
            case "Ổ lăn":
                return efficiencyData.etaBearing;
            case "Ổ trượt":
                return efficiencyData.etaSlidingBearing;
            default:
                return "";
        }
    };

    const validateAndCalculate = () => {
        if (!operatingData.power || !operatingData.speed || !operatingData.serviceLife) {
            setErrorType("empty");
            setErrorMessage("Thiếu dữ liệu bắt buộc");
            setErrorSuggestion("Vui lòng nhập đầy đủ Công suất (P), Vòng quay (n) và Thời gian phục vụ (L)");
            setShowErrorModal(true);
            return;
        }

        if (!loadType || !workShifts) {
            setErrorType("empty");
            setErrorMessage("Thiếu dữ liệu bắt buộc");
            setErrorSuggestion("Vui lòng chọn đặc tính tải và số ca làm việc");
            setShowErrorModal(true);
            return;
        }

        const power = parseFloat(operatingData.power);
        const speed = parseFloat(operatingData.speed);
        const serviceLife = parseFloat(operatingData.serviceLife);

        if (isNaN(power) || isNaN(speed) || isNaN(serviceLife)) {
            setErrorType("format");
            setErrorMessage("Sai kiểu dữ liệu");
            setErrorSuggestion("Công suất, Vòng quay và Thời gian phục vụ phải là số hợp lệ");
            setShowErrorModal(true);
            return;
        }

        if (power <= 0 || power > 500) {
            setErrorType("threshold");
            setErrorMessage("Dữ liệu phi thực tế");
            setErrorSuggestion("Công suất phải nằm trong khoảng 0.1 - 500 kW. Đối với hệ thống công nghiệp nhỏ, công suất thường từ 0.5 - 50 kW.");
            setShowErrorModal(true);
            return;
        }

        if (speed <= 0 || speed > 10000) {
            setErrorType("threshold");
            setErrorMessage("Dữ liệu phi thực tế");
            setErrorSuggestion("Vòng quay phải nằm trong khoảng 10 - 10000 rpm. Động cơ điện thường có vòng quay 750, 1000, 1500, hoặc 3000 rpm.");
            setShowErrorModal(true);
            return;
        }

        if (serviceLife <= 0 || serviceLife > 50) {
            setErrorType("threshold");
            setErrorMessage("Dữ liệu phi thực tế");
            setErrorSuggestion("Thời gian phục vụ thường từ 1 - 25 năm cho máy công nghiệp thông thường.");
            setShowErrorModal(true);
            return;
        }

        if (driveItems.length === 0) {
            setErrorType("empty");
            setErrorMessage("Thiếu dữ liệu bộ truyền động");
            setErrorSuggestion("Vui lòng thêm ít nhất 1 bộ truyền động bằng nút +.");
            setShowErrorModal(true);
            return;
        }

        if (bearingItems.length === 0) {
            setErrorType("empty");
            setErrorMessage("Thiếu dữ liệu ổ truyền động");
            setErrorSuggestion("Vui lòng thêm ít nhất 1 ổ truyền động bằng nút +.");
            setShowErrorModal(true);
            return;
        }

        const invalidDriveQty = driveItems.find(item => !item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0);
        if (invalidDriveQty) {
            setErrorType("format");
            setErrorMessage("Số lượng bộ truyền động không hợp lệ");
            setErrorSuggestion("Số lượng của mỗi bộ truyền động phải là số dương.");
            setShowErrorModal(true);
            return;
        }

        const invalidDriveRatio = driveItems.find(item => !item.transmissionRatio || isNaN(Number(item.transmissionRatio)) || Number(item.transmissionRatio) <= 0);
        if (invalidDriveRatio) {
            setErrorType("format");
            setErrorMessage("Tỉ số truyền không hợp lệ");
            setErrorSuggestion("Vui lòng nhập tỉ số truyền là số dương cho mỗi bộ truyền động.");
            setShowErrorModal(true);
            return;
        }

        const invalidBearingQty = bearingItems.find(item => !item.quantity || isNaN(Number(item.quantity)) || Number(item.quantity) <= 0);
        if (invalidBearingQty) {
            setErrorType("format");
            setErrorMessage("Số lượng ổ truyền động không hợp lệ");
            setErrorSuggestion("Số lượng của mỗi ổ truyền động phải là số dương.");
            setShowErrorModal(true);
            return;
        }

        const missingZ = driveItems.find(item => item.type === "Trục vít không tự hãm" && !item.z);
        if (missingZ) {
            setErrorType("empty");
            setErrorMessage("Thiếu thông số z");
            setErrorSuggestion("Với Trục vít không tự hãm, vui lòng chọn z = 1, 2 hoặc 4.");
            setShowErrorModal(true);
            return;
        }

        const driveItemsWithEfficiency = driveItems.map(item => ({
            ...item,
            eta: getDriveEta(item.type),
            efficiencyTransmissionRatio: getDriveEta(item.type),
        }));

        const bearingItemsWithEfficiency = bearingItems.map(item => ({
            ...item,
            eta: getBearingEta(item.type),
            efficiencyTransmissionRatio: getBearingEta(item.type),
        }));

        const normalizedItems = {
            driveItem: driveItemsWithEfficiency,
            bearingItem: bearingItemsWithEfficiency,
        };

        const { Pct, n_sb, motors, ratios } = runMotorSuggestion({
            operatingData,
            loadData: { loadType, workShifts },
            efficiencyData,
            driveItems: driveItemsWithEfficiency,
            bearingItems: bearingItemsWithEfficiency,
        });

        navigation.navigate("MotorSelection", {
            inputData: {
                name: calculateSession.trim(),
                operatingData: {
                    power: operatingData.power,
                    speed: operatingData.speed,
                    serviceLife: operatingData.serviceLife,
                },
                loadData: {
                    loadType,
                    workShifts,
                },
                item: normalizedItems,
                Item: normalizedItems,
                calculateSession: calculateSession.trim(),
                transmissionData: {
                    uBelt: efficiencyData.uBelt,
                    uGearBox: efficiencyData.uGearbox,
                },
            },
            calculatedPower: Pct,
            requiredSpeed: n_sb,
            motors,
            ratios,
        });
    };

    const renderInput = (label: string, value: string, setValue: (val: string) => void, placeholder: string, helperText?: string) => (
        <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>{label}</Text>
            <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={value}
                onChangeText={setValue}
                placeholder={placeholder}
                placeholderTextColor="#9ca3af"
            />
            {helperText ? <Text style={styles.inputHelperText}>{helperText}</Text> : null}
        </View>
    );

    const renderSmallInput = (label: string, value: string, setValue: (val: string) => void, key?: string) => (
        <View key={key} style={styles.smallInputWrapper}>
            <Text style={styles.smallInputLabel}>{label}</Text>
            <TextInput
                style={styles.smallTextInput}
                keyboardType="numeric"
                value={value}
                onChangeText={setValue}
            />
        </View>
    );

    const selectedDriveTypes = new Set(driveItems.map(item => item.type));
    const selectedBearingTypes = new Set(bearingItems.map(item => item.type));

    const etaConfigs: Array<{ label: string; key: keyof typeof efficiencyData }> = [
        ...(selectedDriveTypes.has("Đai") ? [{ label: "η Đai", key: "etaBelt" as const }] : []),
        ...(selectedDriveTypes.has("Bánh răng côn") ? [{ label: "η BR Côn", key: "etaBevelGear" as const }] : []),
        ...(selectedDriveTypes.has("Bánh răng trụ") ? [{ label: "η BR Trụ", key: "etaStraightGear" as const }] : []),
        ...(selectedDriveTypes.has("Trục vít tự hãm") ? [{ label: "η TV tự hãm", key: "etaWormSelfLocking" as const }] : []),
        ...(selectedDriveTypes.has("Trục vít không tự hãm") ? [{ label: "η TV không tự hãm", key: "etaWormNonSelfLocking" as const }] : []),
        ...(selectedDriveTypes.has("Xích") ? [{ label: "η Xích", key: "etaChain" as const }] : []),
        ...(selectedDriveTypes.has("Bánh ma sát") ? [{ label: "η Bánh ma sát", key: "etaFriction" as const }] : []),
        ...(selectedBearingTypes.has("Ổ lăn") ? [{ label: "η Ổ lăn", key: "etaBearing" as const }] : []),
        ...(selectedBearingTypes.has("Ổ trượt") ? [{ label: "η Ổ trượt", key: "etaSlidingBearing" as const }] : []),
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.backButton}>
                    <ChevronLeft size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thông số đầu vào</Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView 
                    style={styles.scrollView} 
                    contentContainerStyle={styles.scrollContent} 
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                >
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Phiên tính toán</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textInput}
                                value={calculateSession}
                                onChangeText={setCalculateSession}
                                placeholder="Nhập tên"
                                placeholderTextColor="#9ca3af"
                                maxLength={30}
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Thông số gốc</Text>
                        {renderInput("Công suất (P) - kW", operatingData.power, (val) => setOperatingField("power", val), "Nhập công suất", "Giới hạn: 0.1 - 500 kW")}
                        {renderInput("Vòng quay (n) - v/ph", operatingData.speed, (val) => setOperatingField("speed", val), "Nhập vòng quay", "Giới hạn: 10 - 10000 rpm")}
                        {renderInput("Thời gian phục vụ (L) - năm", operatingData.serviceLife, (val) => setOperatingField("serviceLife", val), "Nhập thời gian", "Giới hạn: 1 - 50 năm")}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Điều kiện tải</Text>

                        <Text style={styles.inputLabel}>Đặc tính tải</Text>
                        <View style={styles.pillsContainer}>
                            {loadTypeOptions.map(option => (
                                <TouchableOpacity key={option} style={[styles.pill, loadType === option && styles.pillActive]} onPress={() => setLoadField("loadType", option)}>
                                    <Text style={[styles.pillText, loadType === option && styles.pillTextActive]}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Số ca làm việc</Text>
                        <View style={styles.pillsContainer}>
                            {workShiftOptions.map(option => (
                                <TouchableOpacity key={option} style={[styles.pill, workShifts === option && styles.pillActive]} onPress={() => setLoadField("workShifts", option)}>
                                    <Text style={[styles.pillText, workShifts === option && styles.pillTextActive]}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Bộ truyền động</Text>
                            <TouchableOpacity style={styles.addBtn} onPress={addDriveItem}>
                                <Text style={styles.addBtnText}>+ Thêm</Text>
                            </TouchableOpacity>
                        </View>

                        {driveItems.length === 0 ? <Text style={styles.helperText}>Chưa có bộ truyền động nào. Nhấn + Thêm để bắt đầu.</Text> : null}

                        {driveItems.map((item, idx) => {
                            const forceOpen = isDriveForcedOpen(item.type);
                            return (
                                <View key={item.id} style={styles.dynamicItemCard}>
                                    <View style={styles.dynamicItemHeader}>
                                        <Text style={styles.dynamicItemTitle}>Bộ truyền động #{idx + 1}</Text>
                                        <TouchableOpacity onPress={() => removeDriveItem(item.id)}>
                                            <Text style={styles.removeText}>Xóa</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.inputLabel}>Loại bộ truyền động</Text>
                                    <View style={styles.pillsContainer}>
                                        {driveTypeOptions.map(option => (
                                            <TouchableOpacity
                                                key={`${item.id}-${option}`}
                                                style={[styles.pill, item.type === option && styles.pillActive]}
                                                onPress={() => updateDriveItem(item.id, { type: option })}
                                            >
                                                <Text style={[styles.pillText, item.type === option && styles.pillTextActive]}>{option}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <View style={[styles.gridContainer, { marginTop: 12 }]}>
                                        {renderSmallInput("Số lượng", item.quantity, val => updateDriveItem(item.id, { quantity: val }))}
                                        {renderSmallInput("Tỉ số truyền", item.transmissionRatio, val => updateDriveItem(item.id, { transmissionRatio: val }))}
                                    </View>

                                    <Text style={[styles.inputLabel, { marginTop: 12 }]}>Trạng thái</Text>
                                    <View style={styles.booleanRow}>
                                        <TouchableOpacity
                                            style={[styles.booleanBtn, item.isOpen && styles.booleanBtnActive, forceOpen && styles.booleanBtnDisabled]}
                                            onPress={() => updateDriveItem(item.id, { isOpen: true })}
                                        >
                                            <Text style={[styles.booleanBtnText, item.isOpen && styles.booleanBtnTextActive]}>Hở (true)</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.booleanBtn,
                                                !item.isOpen && styles.booleanBtnActive,
                                                forceOpen && styles.booleanBtnDisabled,
                                            ]}
                                            onPress={() => !forceOpen && updateDriveItem(item.id, { isOpen: false })}
                                        >
                                            <Text style={[styles.booleanBtnText, !item.isOpen && styles.booleanBtnTextActive]}>Không hở (false)</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {forceOpen ? <Text style={styles.helperText}>Loại này bắt buộc là "Hở".</Text> : null}

                                    {item.type === "Trục vít không tự hãm" ? (
                                        <>
                                            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Chọn z</Text>
                                            <View style={styles.pillsContainer}>
                                                {zOptions.map(z => (
                                                    <TouchableOpacity
                                                        key={`${item.id}-z-${z}`}
                                                        style={[styles.pill, item.z === z && styles.pillActive]}
                                                        onPress={() => updateDriveItem(item.id, { z })}
                                                    >
                                                        <Text style={[styles.pillText, item.z === z && styles.pillTextActive]}>{z}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </>
                                    ) : null}
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Ổ truyền động</Text>
                            <TouchableOpacity style={styles.addBtn} onPress={addBearingItem}>
                                <Text style={styles.addBtnText}>+ Thêm</Text>
                            </TouchableOpacity>
                        </View>

                        {bearingItems.length === 0 ? <Text style={styles.helperText}>Chưa có ổ truyền động nào. Nhấn + Thêm để bắt đầu.</Text> : null}

                        {bearingItems.map((item, idx) => (
                            <View key={item.id} style={styles.dynamicItemCard}>
                                <View style={styles.dynamicItemHeader}>
                                    <Text style={styles.dynamicItemTitle}>Ổ truyền động #{idx + 1}</Text>
                                    <TouchableOpacity onPress={() => removeBearingItem(item.id)}>
                                        <Text style={styles.removeText}>Xóa</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.inputLabel}>Loại ổ</Text>
                                <View style={styles.pillsContainer}>
                                    {bearingTypeOptions.map(option => (
                                        <TouchableOpacity
                                            key={`${item.id}-${option}`}
                                            style={[styles.pill, item.type === option && styles.pillActive]}
                                            onPress={() => updateBearingItem(item.id, { type: option })}
                                        >
                                            <Text style={[styles.pillText, item.type === option && styles.pillTextActive]}>{option}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={{ marginTop: 12 }}>
                                    {renderSmallInput("Số lượng", item.quantity, val => updateBearingItem(item.id, { quantity: val }))}
                                </View>

                                <Text style={[styles.helperText, { marginTop: 6 }]}>Mặc định: Hở (true)</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Cấu hình Sơ đồ động</Text>
                        <View style={styles.gridContainer}>
                            {etaConfigs.map(config =>
                                renderSmallInput(config.label, efficiencyData[config.key], val => setEfficiencyField(config.key, val), config.key)
                            )}
                        </View>
                        <View style={[styles.gridContainer, { marginTop: 16 }]}>
                            {renderSmallInput("u Đai", efficiencyData.uBelt, val => setEfficiencyField("uBelt", val))}
                            {renderSmallInput("u HGT", efficiencyData.uGearbox, val => setEfficiencyField("uGearbox", val))}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.submitButton} onPress={validateAndCalculate}>
                    <Text style={styles.submitButtonText}>Calculate Requirement</Text>
                </TouchableOpacity>
            </View>

            <Modal visible={showErrorModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[styles.iconCircle, errorType === 'empty' ? { backgroundColor: '#fef3c7' } : errorType === 'format' ? { backgroundColor: '#ffedd5' } : { backgroundColor: '#fee2e2' }]}>
                            {errorType === 'empty' ? <Info size={32} color="#d97706" /> : errorType === 'format' ? <XCircle size={32} color="#ea580c" /> : <AlertTriangle size={32} color="#dc2626" />}
                        </View>
                        <Text style={styles.modalTitle}>{errorMessage}</Text>
                        {errorSuggestion ? (
                            <View style={styles.suggestionBox}>
                                <Text style={styles.suggestionTitle}>💡 Gợi ý hệ thống:</Text>
                                <Text style={styles.suggestionText}>{errorSuggestion}</Text>
                            </View>
                        ) : null}
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.btnCancel} onPress={() => setShowErrorModal(false)}>
                                <Text style={styles.btnCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.btnConfirm} onPress={() => setShowErrorModal(false)}>
                                <Text style={styles.btnConfirmText}>Edit Data</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb', height: '100%' },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', zIndex: 10 },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginLeft: 8 },
    scrollView: { flex: 1, width: '100%' },
    scrollContent: { padding: 20, flexGrow: 1, paddingBottom: 40 },
    section: { backgroundColor: '#fff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 24 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
    addBtn: { backgroundColor: '#e0e7ff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
    addBtnText: { color: '#3730a3', fontWeight: '700' },
    helperText: { fontSize: 12, color: '#6b7280' },
    dynamicItemCard: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 12, marginBottom: 12, backgroundColor: '#fafafa' },
    dynamicItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    dynamicItemTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
    removeText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
    inputWrapper: { marginBottom: 16 },
    inputLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
    textInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 14, fontSize: 16, color: '#111827' },
    inputHelperText: { fontSize: 12, color: '#6b7280', marginTop: 6 },
    smallInputWrapper: { width: '48%', marginBottom: 12 },
    smallInputLabel: { fontSize: 12, fontWeight: '500', color: '#6b7280', marginBottom: 6 },
    smallTextInput: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 14, color: '#111827' },
    gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', backgroundColor: '#fff' },
    pillActive: { backgroundColor: '#EFF6FF', borderColor: '#3b82f6' },
    pillText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
    pillTextActive: { color: '#1d4ed8', fontWeight: '600' },
    booleanRow: { flexDirection: 'row', gap: 8 },
    booleanBtn: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
    booleanBtnActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
    booleanBtnDisabled: { opacity: 0.75 },
    booleanBtnText: { color: '#4b5563', fontWeight: '500', fontSize: 12 },
    booleanBtnTextActive: { color: '#1d4ed8', fontWeight: '700' },
    footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
    submitButton: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center' },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, alignItems: 'center' },
    iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 16, textAlign: 'center' },
    suggestionBox: { backgroundColor: '#eff6ff', borderRadius: 8, padding: 12, width: '100%', marginBottom: 20, borderWidth: 1, borderColor: '#bfdbfe' },
    suggestionTitle: { fontSize: 12, fontWeight: '700', color: '#1e3a8a', marginBottom: 4 },
    suggestionText: { fontSize: 13, color: '#1d4ed8', lineHeight: 20 },
    modalActions: { flexDirection: 'row', width: '100%', gap: 12 },
    btnCancel: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
    btnCancelText: { color: '#374151', fontWeight: '600', fontSize: 15 },
    btnConfirm: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#2563eb', alignItems: 'center' },
    btnConfirmText: { color: '#fff', fontWeight: '600', fontSize: 15 }
});
