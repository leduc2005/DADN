import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Info, AlertTriangle, XCircle } from 'lucide-react-native';
import {
  BearingType,
  DriveType,
  EfficiencyData,
  useProjectState,
} from '../store/projectState';
import {
  validatePhysicalConstraints,
  ValidationErrorType,
} from '../logic/validation';

interface InputScreenProps {
  navigation: any;
}

type InlineNumericField =
  | 'power'
  | 'speed'
  | 'serviceLife'
  | 'workShifts'
  | 'workingDaysPerYear'
  | 'hoursPerShift';

type InlineErrorKey = InlineNumericField | 'loadType' | 'rotationDirection';

const loadTypeOptions = ['Tải tĩnh', 'Tải va đập nhẹ', 'Tải va đập mạnh'];
const rotationDirectionOptions = ['Quay 1 chiều', 'Quay 2 chiều'];
const driveTypeOptions: DriveType[] = [
  'Bánh răng trụ',
  'Bánh răng côn',
  'Trục vít tự hãm',
  'Trục vít không tự hãm',
  'Xích',
  'Bánh ma sát',
  'Đai',
];
const bearingTypeOptions: BearingType[] = ['Ổ lăn', 'Ổ trượt'];
const bearingBrandOptions = ['SKF', 'NTN', 'Không chọn'];
const zOptions: Array<'1' | '2' | '4'> = ['1', '2', '4'];

const INLINE_NUMERIC_CONFIG: Record<
  InlineNumericField,
  {
    label: string;
    allowDecimal: boolean;
    integerOnly?: boolean;
    min: number;
    max: number;
    unit: string;
  }
> = {
  power: {
    label: 'Công suất (P)',
    allowDecimal: true,
    min: 0.1,
    max: 150,
    unit: 'kW',
  },
  speed: {
    label: 'Vòng quay (n)',
    allowDecimal: false,
    integerOnly: true,
    min: 10,
    max: 2500,
    unit: 'v/ph',
  },
  serviceLife: {
    label: 'Thời gian phục vụ (L)',
    allowDecimal: true,
    min: 0.5,
    max: 30,
    unit: 'năm',
  },
  workShifts: {
    label: 'Số ca làm việc',
    allowDecimal: false,
    integerOnly: true,
    min: 1,
    max: 4,
    unit: 'ca',
  },
  workingDaysPerYear: {
    label: 'Số ngày làm việc trong năm',
    allowDecimal: false,
    integerOnly: true,
    min: 100,
    max: 365,
    unit: 'ngày',
  },
  hoursPerShift: {
    label: 'Số giờ làm việc mỗi ca',
    allowDecimal: false,
    integerOnly: true,
    min: 1,
    max: 24,
    unit: 'giờ',
  },
};

const sanitizeNumericInput = (text: string, allowDecimal: boolean) => {
  let cleaned = text.replace(/[^0-9.]/g, '');
  if (!allowDecimal) {
    return cleaned.replace(/\./g, '');
  }
  const [first, ...rest] = cleaned.split('.');
  if (rest.length === 0) return cleaned;
  return `${first}.${rest.join('')}`;
};

const validateInlineNumeric = (field: InlineNumericField, value: string) => {
  const trimmed = value.trim();
  const config = INLINE_NUMERIC_CONFIG[field];

  if (!trimmed) {
    return `${config.label} là bắt buộc.`;
  }

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) {
    return `${config.label} phải là số hợp lệ.`;
  }

  if (numeric <= 0) {
    return `${config.label} phải lớn hơn 0.`;
  }

  if (config.integerOnly && !Number.isInteger(numeric)) {
    return `${config.label} phải là số nguyên.`;
  }

  if (numeric < config.min || numeric > config.max) {
    return `${config.label} phải nằm trong khoảng ${config.min} - ${config.max} ${config.unit}.`;
  }

  return '';
};

const isDriveForcedOpen = (type: DriveType) =>
  type === 'Trục vít không tự hãm' || type === 'Đai';

const getDriveEta = (type: DriveType, efficiencyData: EfficiencyData) => {
  switch (type) {
    case 'Đai':
      return efficiencyData.etaBelt;
    case 'Bánh răng côn':
      return efficiencyData.etaBevelGear;
    case 'Bánh răng trụ':
      return efficiencyData.etaStraightGear;
    case 'Trục vít tự hãm':
      return efficiencyData.etaWormSelfLocking;
    case 'Trục vít không tự hãm':
      return efficiencyData.etaWormNonSelfLocking;
    case 'Xích':
      return efficiencyData.etaChain;
    case 'Bánh ma sát':
      return efficiencyData.etaFriction;
    default:
      return '';
  }
};

const getBearingEta = (type: BearingType, efficiencyData: EfficiencyData) => {
  switch (type) {
    case 'Ổ lăn':
      return efficiencyData.etaBearing;
    case 'Ổ trượt':
      return efficiencyData.etaSlidingBearing;
    default:
      return '';
  }
};

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

  const [inlineErrors, setInlineErrors] = useState<
    Partial<Record<InlineErrorKey, string>>
  >({});

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorType, setErrorType] = useState<ValidationErrorType>('empty');
  const [errorSuggestion, setErrorSuggestion] = useState('');

  const setInlineError = (field: InlineErrorKey, message: string) => {
    setInlineErrors((prev) => ({ ...prev, [field]: message }));
  };

  const updateNumericField = (field: InlineNumericField, text: string) => {
    const config = INLINE_NUMERIC_CONFIG[field];
    const cleaned = sanitizeNumericInput(text, config.allowDecimal);

    switch (field) {
      case 'power':
      case 'speed':
      case 'serviceLife':
        setOperatingField(field, cleaned);
        break;
      case 'workShifts':
      case 'workingDaysPerYear':
      case 'hoursPerShift':
        setLoadField(field, cleaned);
        break;
      default:
        break;
    }

    setInlineError(field, validateInlineNumeric(field, cleaned));
  };

  const getInlineValue = (field: InlineNumericField) => {
    switch (field) {
      case 'power':
      case 'speed':
      case 'serviceLife':
        return operatingData[field];
      case 'workShifts':
      case 'workingDaysPerYear':
      case 'hoursPerShift':
        return loadData[field];
      default:
        return '';
    }
  };

  const validateInlineBeforeSubmit = () => {
    const nextErrors: Partial<Record<InlineErrorKey, string>> = {};

    (Object.keys(INLINE_NUMERIC_CONFIG) as InlineNumericField[]).forEach((field) => {
      const message = validateInlineNumeric(field, getInlineValue(field));
      if (message) {
        nextErrors[field] = message;
      }
    });

    if (!loadData.loadType) {
      nextErrors.loadType = 'Vui lòng chọn đặc tính tải.';
    }

    if (!loadData.rotationDirection) {
      nextErrors.rotationDirection = 'Vui lòng chọn chiều quay.';
    }

    setInlineErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateAndCalculate = () => {
    if (!validateInlineBeforeSubmit()) {
      return;
    }

    const physicalResult = validatePhysicalConstraints({
      operatingData,
      loadData,
      driveItems,
      bearingItems,
      efficiencyData,
    });

    if (!physicalResult.isValid) {
      setErrorType(physicalResult.errorType ?? 'threshold');
      setErrorMessage(physicalResult.message ?? 'Dữ liệu chưa hợp lệ');
      setErrorSuggestion(
        physicalResult.suggestion ??
        'Vui lòng kiểm tra lại dữ liệu trước khi tính toán.',
      );
      setShowErrorModal(true);
      return;
    }

    const driveItemsWithEfficiency = driveItems.map((item) => ({
      ...item,
      eta: getDriveEta(item.type, efficiencyData),
    }));

    const bearingItemsWithEfficiency = bearingItems.map((item) => ({
      ...item,
      eta: getBearingEta(item.type, efficiencyData),
    }));

    navigation.navigate('MotorSelection', {
      inputData: {
        name: calculateSession.trim(),
        operatingData: {
          power: operatingData.power,
          speed: operatingData.speed,
          serviceLife: operatingData.serviceLife,
        },
        loadData: {
          loadType: loadData.loadType,
          workShifts: loadData.workShifts,
          rotationDirection: loadData.rotationDirection,
          workingDaysPerYear: loadData.workingDaysPerYear,
          hoursPerShift: loadData.hoursPerShift,
          bearingBrand: loadData.bearingBrand,
        },
        Item: {
          driveItem: driveItemsWithEfficiency,
          bearingItem: bearingItemsWithEfficiency,
        },
        calculateSession: calculateSession.trim(),
        transmissionData: {
          uBelt: efficiencyData.uBelt,
          uGearBox: efficiencyData.uGearbox,
        },
      },
    });
  };

  const renderInput = (
    label: string,
    value: string,
    setValue: (val: string) => void,
    placeholder: string,
    options?: {
      error?: string;
      onBlur?: () => void;
    },
  ) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, options?.error ? styles.inputError : undefined]}
        keyboardType="numeric"
        value={value}
        onChangeText={setValue}
        onBlur={options?.onBlur}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
      />
      {options?.error ? <Text style={styles.inlineErrorText}>{options.error}</Text> : null}
    </View>
  );

  const renderSmallInput = (
    label: string,
    value: string,
    setValue: (val: string) => void,
    options?: {
      error?: string;
      placeholder?: string;
      onBlur?: () => void;
      fullWidth?: boolean;
    },
  ) => (
    <View
      style={[
        styles.smallInputWrapper,
        options?.fullWidth ? styles.smallInputWrapperFull : undefined,
      ]}
    >
      <Text style={styles.smallInputLabel}>{label}</Text>
      <TextInput
        style={[
          styles.smallTextInput,
          options?.error ? styles.inputError : undefined,
        ]}
        keyboardType="numeric"
        value={value}
        onChangeText={setValue}
        onBlur={options?.onBlur}
        placeholder={options?.placeholder}
        placeholderTextColor="#9ca3af"
      />
      {options?.error ? <Text style={styles.inlineErrorText}>{options.error}</Text> : null}
    </View>
  );

  const renderDropdownInput = (
    label: string,
    value: string,
    placeholder: string,
    options: Array<{ label: string; value: string }>,
    dropdownKey: string,
    onSelect: (selectedValue: string) => void,
    config?: {
      error?: string;
    },
  ) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.textInput,
          styles.dropdownTrigger,
          config?.error ? styles.inputError : undefined,
        ]}
        onPress={() => setActiveDropdown(dropdownKey)}
      >
        <Text style={value ? styles.dropdownValueText : styles.dropdownPlaceholderText}>
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownChevron}>▼</Text>
      </TouchableOpacity>
      {config?.error ? <Text style={styles.inlineErrorText}>{config.error}</Text> : null}

      <Modal
        transparent
        animationType="fade"
        visible={activeDropdown === dropdownKey}
        onRequestClose={() => setActiveDropdown(null)}
      >
        <TouchableOpacity
          style={styles.dropdownModalOverlay}
          activeOpacity={1}
          onPress={() => setActiveDropdown(null)}
        >
          <TouchableWithoutFeedback>
            <View style={styles.dropdownModalContent}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={`${dropdownKey}-${option.value}`}
                  style={[
                    styles.dropdownOption,
                    index < options.length - 1
                      ? styles.dropdownOptionBorder
                      : undefined,
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    setActiveDropdown(null);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const selectedDriveTypes = new Set(driveItems.map((item) => item.type));
  const selectedBearingTypes = new Set(bearingItems.map((item) => item.type));

  const etaConfigs: Array<{ label: string; key: keyof EfficiencyData }> = [
    ...(selectedDriveTypes.has('Đai')
      ? [{ label: 'η Đai', key: 'etaBelt' as const }]
      : []),
    ...(selectedDriveTypes.has('Bánh răng côn')
      ? [{ label: 'η BR Côn', key: 'etaBevelGear' as const }]
      : []),
    ...(selectedDriveTypes.has('Bánh răng trụ')
      ? [{ label: 'η BR Trụ', key: 'etaStraightGear' as const }]
      : []),
    ...(selectedDriveTypes.has('Trục vít tự hãm')
      ? [{ label: 'η TV tự hãm', key: 'etaWormSelfLocking' as const }]
      : []),
    ...(selectedDriveTypes.has('Trục vít không tự hãm')
      ? [{ label: 'η TV không tự hãm', key: 'etaWormNonSelfLocking' as const }]
      : []),
    ...(selectedDriveTypes.has('Xích')
      ? [{ label: 'η Xích', key: 'etaChain' as const }]
      : []),
    ...(selectedDriveTypes.has('Bánh ma sát')
      ? [{ label: 'η Bánh ma sát', key: 'etaFriction' as const }]
      : []),
    ...(selectedBearingTypes.has('Ổ lăn')
      ? [{ label: 'η Ổ lăn', key: 'etaBearing' as const }]
      : []),
    ...(selectedBearingTypes.has('Ổ trượt')
      ? [{ label: 'η Ổ trượt', key: 'etaSlidingBearing' as const }]
      : []),
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('HomeScreen')}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông số đầu vào</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
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
            {renderInput(
              'Công suất (P) - kW',
              operatingData.power,
              (val) => updateNumericField('power', val),
              'Nhập công suất',
              {
                error: inlineErrors.power,
                onBlur: () =>
                  setInlineError(
                    'power',
                    validateInlineNumeric('power', operatingData.power),
                  ),
              },
            )}
            {renderInput(
              'Vòng quay (n) - v/ph',
              operatingData.speed,
              (val) => updateNumericField('speed', val),
              'Nhập vòng quay',
              {
                error: inlineErrors.speed,
                onBlur: () =>
                  setInlineError(
                    'speed',
                    validateInlineNumeric('speed', operatingData.speed),
                  ),
              },
            )}
            {renderInput(
              'Thời gian phục vụ (L) - năm',
              operatingData.serviceLife,
              (val) => updateNumericField('serviceLife', val),
              'Nhập thời gian',
              {
                error: inlineErrors.serviceLife,
                onBlur: () =>
                  setInlineError(
                    'serviceLife',
                    validateInlineNumeric('serviceLife', operatingData.serviceLife),
                  ),
              },
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Điều kiện tải</Text>
            {renderDropdownInput(
              'Đặc tính tải',
              loadData.loadType,
              'Chọn đặc tính tải',
              loadTypeOptions.map((option) => ({ label: option, value: option })),
              'loadType',
              (selectedValue) => {
                setLoadField('loadType', selectedValue);
                setInlineError('loadType', '');
              },
              { error: inlineErrors.loadType },
            )}

            {renderDropdownInput(
              'Chiều quay',
              loadData.rotationDirection,
              'Chọn chiều quay',
              rotationDirectionOptions.map((option) => ({
                label: option,
                value: option,
              })),
              'rotationDirection',
              (selectedValue) => {
                setLoadField('rotationDirection', selectedValue);
                setInlineError('rotationDirection', '');
              },
              { error: inlineErrors.rotationDirection },
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chế độ làm việc</Text>
            <View style={styles.gridContainer}>
              {renderSmallInput(
                'Ngày làm việc / năm',
                loadData.workingDaysPerYear,
                (val) => updateNumericField('workingDaysPerYear', val),
                {
                  placeholder: 'Nhập số ngày',
                  error: inlineErrors.workingDaysPerYear,
                  onBlur: () =>
                    setInlineError(
                      'workingDaysPerYear',
                      validateInlineNumeric(
                        'workingDaysPerYear',
                        loadData.workingDaysPerYear,
                      ),
                    ),
                },
              )}
              {renderSmallInput(
                'Số ca làm việc / ngày',
                loadData.workShifts,
                (val) => updateNumericField('workShifts', val),
                {
                  placeholder: 'Nhập số ca',
                  error: inlineErrors.workShifts,
                  onBlur: () =>
                    setInlineError(
                      'workShifts',
                      validateInlineNumeric('workShifts', loadData.workShifts),
                    ),
                },
              )}
            </View>
            <View style={{ marginTop: 8 }}>
              {renderSmallInput(
                'Số giờ làm việc / ca',
                loadData.hoursPerShift,
                (val) => updateNumericField('hoursPerShift', val),
                {
                  placeholder: 'Nhập số giờ',
                  error: inlineErrors.hoursPerShift,
                  fullWidth: true,
                  onBlur: () =>
                    setInlineError(
                      'hoursPerShift',
                      validateInlineNumeric('hoursPerShift', loadData.hoursPerShift),
                    ),
                },
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ràng buộc thiết kế</Text>
            {renderDropdownInput(
              'Hãng ổ lăn (tùy chọn)',
              loadData.bearingBrand,
              'Chọn hãng ổ lăn',
              bearingBrandOptions.map((option) => ({ label: option, value: option })),
              'bearingBrand',
              (selectedValue) => setLoadField('bearingBrand', selectedValue),
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Bộ truyền động</Text>
              <TouchableOpacity style={styles.addBtn} onPress={addDriveItem}>
                <Text style={styles.addBtnText}>+ Thêm</Text>
              </TouchableOpacity>
            </View>

            {driveItems.length === 0 ? (
              <Text style={styles.helperText}>
                Chưa có bộ truyền động nào. Nhấn + Thêm để bắt đầu.
              </Text>
            ) : null}

            {driveItems.map((item, idx) => {
              const forceOpen = isDriveForcedOpen(item.type);
              const statusOptions = forceOpen
                ? [{ label: 'Hở (true)', value: 'true' }]
                : [
                  { label: 'Hở (true)', value: 'true' },
                  { label: 'Không hở (false)', value: 'false' },
                ];
              return (
                <View key={item.id} style={styles.dynamicItemCard}>
                  <View style={styles.dynamicItemHeader}>
                    <Text style={styles.dynamicItemTitle}>
                      Bộ truyền động #{idx + 1}
                    </Text>
                    <TouchableOpacity onPress={() => removeDriveItem(item.id)}>
                      <Text style={styles.removeText}>Xóa</Text>
                    </TouchableOpacity>
                  </View>

                  {renderDropdownInput(
                    'Loại bộ truyền động',
                    item.type,
                    'Chọn loại bộ truyền động',
                    driveTypeOptions.map((option) => ({ label: option, value: option })),
                    `drive-type-${item.id}`,
                    (selectedValue) =>
                      updateDriveItem(item.id, { type: selectedValue as DriveType }),
                  )}

                  <View style={[styles.gridContainer, { marginTop: 12 }]}>
                    {renderSmallInput('Số lượng', item.quantity, (val) =>
                      updateDriveItem(item.id, {
                        quantity: sanitizeNumericInput(val, false),
                      }),
                    )}
                    {renderSmallInput('Tỉ số truyền', item.transmissionRatio, (val) =>
                      updateDriveItem(item.id, {
                        transmissionRatio: sanitizeNumericInput(val, true),
                      }),
                    )}
                  </View>

                  {renderDropdownInput(
                    'Trạng thái',
                    item.isOpen ? 'Hở (true)' : 'Không hở (false)',
                    'Chọn trạng thái',
                    statusOptions,
                    `drive-state-${item.id}`,
                    (selectedValue) =>
                      updateDriveItem(item.id, { isOpen: selectedValue === 'true' }),
                  )}
                  {forceOpen ? (
                    <Text style={styles.helperText}>Loại này bắt buộc là "Hở".</Text>
                  ) : null}

                  {item.type === 'Trục vít không tự hãm' ? (
                    renderDropdownInput(
                      'Chọn z',
                      item.z ?? '',
                      'Chọn z',
                      zOptions.map((z) => ({ label: z, value: z })),
                      `drive-z-${item.id}`,
                      (selectedValue) =>
                        updateDriveItem(item.id, {
                          z: selectedValue as '1' | '2' | '4',
                        }),
                    )
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

            {bearingItems.length === 0 ? (
              <Text style={styles.helperText}>
                Chưa có ổ truyền động nào. Nhấn + Thêm để bắt đầu.
              </Text>
            ) : null}

            {bearingItems.map((item, idx) => (
              <View key={item.id} style={styles.dynamicItemCard}>
                <View style={styles.dynamicItemHeader}>
                  <Text style={styles.dynamicItemTitle}>Ổ truyền động #{idx + 1}</Text>
                  <TouchableOpacity onPress={() => removeBearingItem(item.id)}>
                    <Text style={styles.removeText}>Xóa</Text>
                  </TouchableOpacity>
                </View>

                {renderDropdownInput(
                  'Loại ổ',
                  item.type,
                  'Chọn loại ổ',
                  bearingTypeOptions.map((option) => ({
                    label: option,
                    value: option,
                  })),
                  `bearing-type-${item.id}`,
                  (selectedValue) =>
                    updateBearingItem(item.id, { type: selectedValue as BearingType }),
                )}

                <View style={{ marginTop: 12 }}>
                  {renderSmallInput('Số lượng', item.quantity, (val) =>
                    updateBearingItem(item.id, {
                      quantity: sanitizeNumericInput(val, false),
                    }),
                  )}
                </View>

                <Text style={[styles.helperText, { marginTop: 6 }]}>Mặc định: Hở (true)</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cấu hình Sơ đồ động</Text>
            <View style={styles.gridContainer}>
              {etaConfigs.map((config) =>
                renderSmallInput(
                  config.label,
                  efficiencyData[config.key],
                  (val) =>
                    setEfficiencyField(config.key, sanitizeNumericInput(val, true)),
                ),
              )}
            </View>
            <View style={[styles.gridContainer, { marginTop: 16 }]}>
              {renderSmallInput('u Đai', efficiencyData.uBelt, (val) =>
                setEfficiencyField('uBelt', sanitizeNumericInput(val, true)),
              )}
              {renderSmallInput('u HGT', efficiencyData.uGearbox, (val) =>
                setEfficiencyField('uGearbox', sanitizeNumericInput(val, true)),
              )}
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
            <View
              style={[
                styles.iconCircle,
                errorType === 'empty'
                  ? { backgroundColor: '#fef3c7' }
                  : errorType === 'format'
                    ? { backgroundColor: '#ffedd5' }
                    : { backgroundColor: '#fee2e2' },
              ]}
            >
              {errorType === 'empty' ? (
                <Info size={32} color="#d97706" />
              ) : errorType === 'format' ? (
                <XCircle size={32} color="#ea580c" />
              ) : (
                <AlertTriangle size={32} color="#dc2626" />
              )}
            </View>
            <Text style={styles.modalTitle}>{errorMessage}</Text>
            {errorSuggestion ? (
              <View style={styles.suggestionBox}>
                <Text style={styles.suggestionTitle}>Gợi ý hệ thống:</Text>
                <Text style={styles.suggestionText}>{errorSuggestion}</Text>
              </View>
            ) : null}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnConfirm}
                onPress={() => setShowErrorModal(false)}
              >
                <Text style={styles.btnConfirmText}>Edit Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', height: '100%' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    zIndex: 10,
  },
  backButton: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginLeft: 8 },
  scrollView: { flex: 1, width: '100%' },
  scrollContent: { padding: 20, flexGrow: 1, paddingBottom: 40 },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  addBtn: {
    backgroundColor: '#e0e7ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addBtnText: { color: '#3730a3', fontWeight: '700' },
  helperText: { fontSize: 12, color: '#6b7280' },
  dynamicItemCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  dynamicItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dynamicItemTitle: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  removeText: { color: '#dc2626', fontSize: 13, fontWeight: '600' },
  inputWrapper: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#111827',
  },
  smallInputWrapper: { width: '48%', marginBottom: 12 },
  smallInputWrapperFull: { width: '100%' },
  smallInputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 6,
  },
  smallTextInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#111827',
  },
  inputError: {
    borderColor: '#dc2626',
  },
  inlineErrorText: {
    marginTop: 6,
    fontSize: 12,
    color: '#dc2626',
    lineHeight: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  dropdownValueText: {
    fontSize: 16,
    color: '#111827',
    flexShrink: 1,
  },
  dropdownPlaceholderText: {
    fontSize: 16,
    color: '#9ca3af',
    flexShrink: 1,
  },
  dropdownChevron: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 12,
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  dropdownModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dropdownOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dropdownOptionText: {
    fontSize: 15,
    color: '#111827',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestionBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  suggestionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  suggestionText: { fontSize: 13, color: '#1d4ed8', lineHeight: 20 },
  modalActions: { flexDirection: 'row', width: '100%', gap: 12 },
  btnCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  btnCancelText: { color: '#374151', fontWeight: '600', fontSize: 15 },
  btnConfirm: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  btnConfirmText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
