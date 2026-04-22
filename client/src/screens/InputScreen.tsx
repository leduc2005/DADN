import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { ChevronLeft, Info, AlertTriangle, XCircle } from "lucide-react-native";

interface InputScreenProps {
    navigation: any;
}

type DriveType =
    | "Bánh răng trụ"
    | "Bánh răng côn"
    | "Đai";

type BearingType = "Ổ lăn" | "Ổ trượt";

interface DriveItem {
    id: string;
    type: DriveType;
    quantity: string;
    efficiencyTransmissionRatio: string;
    transmissionRatio?: string;
    isOpen: boolean;
    bevelGearParams?: {
        ck: string;
        kbe: string;
        psiBd2: string;
    };
}

interface BearingItem {
    id: string;
    type: BearingType;
    quantity: string;
    efficiencyTransmissionRatio: string;
    isOpen: boolean;
}

export default function InputScreen({ navigation }: InputScreenProps) {
    const defaultBevelGearParams = {
        ck: "1",
        kbe: "0.3",
        psiBd2: "",
    };

    const [calculateSession, setCalculateSession] = useState("");

    const [operatingData, setOperatingData] = useState({
        power: "",
        speed: "",
        serviceLife: "",
    });

    const [loadType, setLoadType] = useState("");
    const [workShifts, setWorkShifts] = useState("");

    const [driveItems, setDriveItems] = useState<DriveItem[]>([]);
    const [bearingItems, setBearingItems] = useState<BearingItem[]>([]);

    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [errorType, setErrorType] = useState<"empty" | "format" | "threshold">("empty");
    const [errorSuggestion, setErrorSuggestion] = useState("");

    const loadTypeOptions = ["Tải êm", "Tải va đập nhẹ", "Tải va đập vừa", "Tải va đập nặng"];
    const workShiftOptions = ["1 ca", "2 ca", "3 ca"];
    const driveTypeOptions: DriveType[] = ["Bánh răng trụ", "Bánh răng côn",/* "Trục vít tự hãm", "Trục vít không tự hãm", "Xích", "Bánh ma sát",*/ "Đai"];
    const bearingTypeOptions: BearingType[] = ["Ổ lăn", "Ổ trượt"];

    const createId = () => `${Date.now()}-${Math.random()}`;
    const isDriveForcedOpen = (type: DriveType) =>  type === "Đai";
    const requiresTransmissionRatio = (type: DriveType) =>
        type === "Đai" || type === "Bánh răng trụ" || type === "Bánh răng côn";

    const addDriveItem = () => {
        setDriveItems(prev => [
            ...prev,
            {
                id: createId(),
                type: "Bánh răng trụ",
                quantity: "1",
                efficiencyTransmissionRatio: "",
                transmissionRatio: undefined,
                isOpen: false,
            },
        ]);
    };

    const addBearingItem = () => {
        setBearingItems(prev => [
            ...prev,
            {
                id: createId(),
                type: "Ổ lăn",
                quantity: "1",
                efficiencyTransmissionRatio: "",
                isOpen: true,
            },
        ]);
    };

    const updateDriveItem = (id: string, patch: Partial<DriveItem>) => {
        setDriveItems(prev =>
            prev.map(item => {
                if (item.id !== id) return item;
                const nextType = patch.type ?? item.type;
                const forcedOpen = isDriveForcedOpen(nextType);
                const nextTransmissionRatio = requiresTransmissionRatio(nextType)
                    ? patch.transmissionRatio ?? item.transmissionRatio ?? ""
                    : undefined;
                const nextBevelGearParams =
                    nextType === "Bánh răng côn"
                        ? patch.bevelGearParams ?? item.bevelGearParams ?? defaultBevelGearParams
                        : undefined;
                return {
                    ...item,
                    ...patch,
                    type: nextType,
                    isOpen: forcedOpen ? true : patch.isOpen ?? item.isOpen,
                    transmissionRatio: nextTransmissionRatio,
                    bevelGearParams: nextBevelGearParams,
                };
            })
        );
    };

    const updateDriveBevelParam = (id: string, key: "ck" | "kbe" | "psiBd2", value: string) => {
        setDriveItems(prev =>
            prev.map(item => {
                if (item.id !== id || item.type !== "Bánh răng côn") return item;

                return {
                    ...item,
                    bevelGearParams: {
                        ...(item.bevelGearParams ?? defaultBevelGearParams),
                        [key]: value,
                    },
                };
            })
        );
    };

    const updateBearingItem = (id: string, patch: Partial<BearingItem>) => {
        setBearingItems(prev =>
            prev.map(item => {
                if (item.id !== id) return item;
                return {
                    ...item,
                    ...patch,
                    isOpen: true,
                };
            })
        );
    };

    const removeDriveItem = (id: string) => setDriveItems(prev => prev.filter(item => item.id !== id));
    const removeBearingItem = (id: string) => setBearingItems(prev => prev.filter(item => item.id !== id));


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

        const invalidDriveRatio = driveItems.find(item => !item.efficiencyTransmissionRatio || isNaN(Number(item.efficiencyTransmissionRatio)) || Number(item.efficiencyTransmissionRatio) <= 0);
        if (invalidDriveRatio) {
            setErrorType("format");
            setErrorMessage("Hiệu suất truyền không hợp lệ");
            setErrorSuggestion("Vui lòng nhập hiệu suất truyền là số dương cho mỗi bộ truyền động.");
            setShowErrorModal(true);
            return;
        }

        const invalidTransmissionRatio = driveItems.find(
            item =>
                requiresTransmissionRatio(item.type) &&
                (!item.transmissionRatio || isNaN(Number(item.transmissionRatio)) || Number(item.transmissionRatio) <= 0)
        );
        if (invalidTransmissionRatio) {
            setErrorType("format");
            setErrorMessage("Tỉ số truyền không hợp lệ");
            setErrorSuggestion("Vui lòng nhập tỉ số truyền là số dương cho các bộ truyền yêu cầu tỉ số truyền.");
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

        const invalidBearingEfficiency = bearingItems.find(
            item => !item.efficiencyTransmissionRatio || isNaN(Number(item.efficiencyTransmissionRatio)) || Number(item.efficiencyTransmissionRatio) <= 0
        );
        if (invalidBearingEfficiency) {
            setErrorType("format");
            setErrorMessage("Hiệu suất truyền ổ truyền động không hợp lệ");
            setErrorSuggestion("Vui lòng nhập hiệu suất truyền là số dương cho mỗi ổ truyền động.");
            setShowErrorModal(true);
            return;
        }

        const missingBevelParams = driveItems.find(
            item =>
                item.type === "Bánh răng côn" &&
                (!item.bevelGearParams?.ck || !item.bevelGearParams?.kbe || !item.bevelGearParams?.psiBd2)
        );
        if (missingBevelParams) {
            setErrorType("empty");
            setErrorMessage("Thiếu thông số bánh răng côn");
            setErrorSuggestion("Vui lòng nhập đầy đủ Ck, Kbe và ψbd2 cho bộ truyền Bánh răng côn.");
            setShowErrorModal(true);
            return;
        }

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
                item: {
                    driveItem: driveItems,
                    bearingItem: bearingItems,
                },
                calculateSession: calculateSession.trim(),

            },
        });
    };

    const renderInput = (label: string, value: string, setValue: (val: string) => void, placeholder: string) => (
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
        </View>
    );

    const renderSmallInput = (label: string, value: string, setValue: (val: string) => void) => (
        <View style={styles.smallInputWrapper}>
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
                        {renderInput("Công suất (P) - kW", operatingData.power, (val) => setOperatingData({ ...operatingData, power: val }), "Nhập công suất")}
                        {renderInput("Vòng quay (n) - v/ph", operatingData.speed, (val) => setOperatingData({ ...operatingData, speed: val }), "Nhập vòng quay")}
                        {renderInput("Thời gian phục vụ (L) - năm", operatingData.serviceLife, (val) => setOperatingData({ ...operatingData, serviceLife: val }), "Nhập thời gian")}
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Điều kiện tải</Text>

                        <Text style={styles.inputLabel}>Đặc tính tải</Text>
                        <View style={styles.pillsContainer}>
                            {loadTypeOptions.map(option => (
                                <TouchableOpacity key={option} style={[styles.pill, loadType === option && styles.pillActive]} onPress={() => setLoadType(option)}>
                                    <Text style={[styles.pillText, loadType === option && styles.pillTextActive]}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Số ca làm việc</Text>
                        <View style={styles.pillsContainer}>
                            {workShiftOptions.map(option => (
                                <TouchableOpacity key={option} style={[styles.pill, workShifts === option && styles.pillActive]} onPress={() => setWorkShifts(option)}>
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

                        {/* {driveItems.length === 0 ? <Text style={styles.helperText}>Chưa có bộ truyền động nào. Nhấn + Thêm để bắt đầu.</Text> : null} */}

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
                                        {renderSmallInput("Hiệu suất truyền", item.efficiencyTransmissionRatio, val => updateDriveItem(item.id, { efficiencyTransmissionRatio: val }))}
                                        {requiresTransmissionRatio(item.type)
                                            ? renderSmallInput(
                                                "Tỉ số truyền",
                                                item.transmissionRatio ?? "",
                                                val => updateDriveItem(item.id, { transmissionRatio: val })
                                            )
                                            : null}
                                    </View>

                                    <Text style={[styles.inputLabel, { marginTop: 12 }]}>Trạng thái</Text>
                                    <View style={styles.booleanRow}>
                                        <TouchableOpacity
                                            style={[styles.booleanBtn, item.isOpen && styles.booleanBtnActive, forceOpen && styles.booleanBtnDisabled]}
                                            onPress={() => updateDriveItem(item.id, { isOpen: true })}
                                        >
                                            <Text style={[styles.booleanBtnText, item.isOpen && styles.booleanBtnTextActive]}>Hở</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.booleanBtn,
                                                !item.isOpen && styles.booleanBtnActive,
                                                forceOpen && styles.booleanBtnDisabled,
                                            ]}
                                            onPress={() => !forceOpen && updateDriveItem(item.id, { isOpen: false })}
                                        >
                                            <Text style={[styles.booleanBtnText, !item.isOpen && styles.booleanBtnTextActive]}>Không hở</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {forceOpen ? <Text style={styles.helperText}>Mặc định Hở.</Text> : null}


                                    {item.type === "Bánh răng côn" ? (
                                        <>
                                            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Thông số bánh răng côn</Text>
                                            <View style={styles.gridContainer}>
                                                {renderSmallInput(
                                                    "Ck",
                                                    item.bevelGearParams?.ck ?? defaultBevelGearParams.ck,
                                                    val => updateDriveBevelParam(item.id, "ck", val)
                                                )}
                                                {renderSmallInput(
                                                    "Kbe",
                                                    item.bevelGearParams?.kbe ?? defaultBevelGearParams.kbe,
                                                    val => updateDriveBevelParam(item.id, "kbe", val)
                                                )}
                                                {renderSmallInput(
                                                    "ψbd2",
                                                    item.bevelGearParams?.psiBd2 ?? defaultBevelGearParams.psiBd2,
                                                    val => updateDriveBevelParam(item.id, "psiBd2", val)
                                                )}
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

                                <View style={[styles.gridContainer, { marginTop: 12 }]}>
                                    {renderSmallInput("Số lượng", item.quantity, val => updateBearingItem(item.id, { quantity: val }))}
                                    {renderSmallInput(
                                        "Hiệu suất truyền",
                                        item.efficiencyTransmissionRatio,
                                        val => updateBearingItem(item.id, { efficiencyTransmissionRatio: val })
                                    )}
                                </View>

                            </View>
                        ))}
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











