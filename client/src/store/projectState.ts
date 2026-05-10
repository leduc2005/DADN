import { create } from 'zustand';

// ── Kết quả tính toán ──────────────────────────────────────────────────────────
export interface CalculationSession {
  id: string;
  title: string;
  date: string;
  status: 'ĐANG THỰC HIỆN' | 'HOÀN THÀNH';
  motorModel?: string;
  motorPower?: number;
  nDc?: number;
  uHop?: number;
  uNgoai?: number;
  systemTransmission?: any;
  beltResult?: any;
  gearResult?: any;
  rawInputData?: {
    calculateSession: string;
    operatingData: OperatingData;
    loadData: LoadData;
    efficiencyData: EfficiencyData;
    driveItems: DriveItem[];
    bearingItems: BearingItem[];
  };
}

export type DriveType =
  | 'Bánh răng trụ'
  | 'Bánh răng côn'
  | 'Trục vít tự hãm'
  | 'Trục vít không tự hãm'
  | 'Xích'
  | 'Bánh ma sát'
  | 'Đai';

export type BearingType = 'Ổ lăn' | 'Ổ trượt';

export interface DriveItem {
  id: string;
  type: DriveType;
  quantity: string;
  transmissionRatio: string;
  isOpen: boolean;
  z?: '1' | '2' | '4';
}

export interface BearingItem {
  id: string;
  type: BearingType;
  quantity: string;
  isOpen: boolean;
}

export interface OperatingData {
  power: string;
  speed: string;
  serviceLife: string;
}

export interface LoadData {
  loadType: string;
  rotationDirection: string;
  workShifts: string;
  workingDaysPerYear: string;
  hoursPerShift: string;
  bearingBrand: string;
}

export interface EfficiencyData {
  etaBelt: string;
  etaBevelGear: string;
  etaStraightGear: string;
  etaWormSelfLocking: string;
  etaWormNonSelfLocking: string;
  etaChain: string;
  etaFriction: string;
  etaBearing: string;
  etaSlidingBearing: string;
  etaCoupling: string;
  uBelt: string;
  uGearbox: string;
}

interface ProjectInputState {
  calculateSession: string;
  operatingData: OperatingData;
  loadData: LoadData;
  efficiencyData: EfficiencyData;
  driveItems: DriveItem[];
  bearingItems: BearingItem[];
  // Kết quả tính toán của phiên hiện tại
  currentSessionId: string | null;
  isReadOnly: boolean;
  savedSessions: CalculationSession[];
  saveMotorResult: (sessionId: string, data: Partial<CalculationSession>) => void;
  saveBeltResult: (sessionId: string, beltResult: any) => void;
  saveGearResult: (sessionId: string, gearResult: any) => void;
  finishSession: (sessionId: string) => void;
  setCalculateSession: (value: string) => void;
  setOperatingField: (field: keyof OperatingData, value: string) => void;
  setLoadField: (field: keyof LoadData, value: string) => void;
  setEfficiencyField: (field: keyof EfficiencyData, value: string) => void;
  addDriveItem: () => void;
  updateDriveItem: (id: string, patch: Partial<DriveItem>) => void;
  removeDriveItem: (id: string) => void;
  addBearingItem: () => void;
  updateBearingItem: (id: string, patch: Partial<BearingItem>) => void;
  removeBearingItem: (id: string) => void;
  resetInputState: () => void;
  // Module 3: Quản lý lịch sử
  loadSessionFromHistory: (session: CalculationSession) => void;
  removeSession: (sessionId: string) => void;
  setSavedSessions: (sessions: CalculationSession[]) => void;
}

const createId = () => `${Date.now()}-${Math.random()}`;

const isDriveForcedOpen = (type: DriveType) =>
  type === 'Trục vít không tự hãm' || type === 'Đai';

const defaultOperatingData: OperatingData = {
  power: '',
  speed: '',
  serviceLife: '',
};

const defaultLoadData: LoadData = {
  loadType: '',
  rotationDirection: '',
  workShifts: '',
  workingDaysPerYear: '',
  hoursPerShift: '',
  bearingBrand: '',
};

const defaultEfficiencyData: EfficiencyData = {
  etaBelt: '0.96',
  etaBevelGear: '0.97',
  etaStraightGear: '0.98',
  etaWormSelfLocking: '0.7',
  etaWormNonSelfLocking: '0.75',
  etaChain: '0.96',
  etaFriction: '0.9',
  etaBearing: '0.995',
  etaSlidingBearing: '0.97',
  etaCoupling: '0.99',
  uBelt: '4',
  uGearbox: '10',
};

export const useProjectState = create<ProjectInputState>((set) => ({
  calculateSession: '',
  operatingData: defaultOperatingData,
  loadData: defaultLoadData,
  efficiencyData: defaultEfficiencyData,
  driveItems: [],
  bearingItems: [],
  currentSessionId: null,
  isReadOnly: false,
  savedSessions: [],

  saveMotorResult: (sessionId, data) =>
    set((state) => {
      const exists = state.savedSessions.find((s) => s.id === sessionId);
      const now = new Date();
      const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      if (exists) {
        return {
          currentSessionId: sessionId,
          savedSessions: state.savedSessions.map((s) =>
            s.id === sessionId ? { ...s, ...data } : s
          ),
        };
      }
      return {
        currentSessionId: sessionId,
        savedSessions: [
          {
            id: sessionId,
            title: data.title ?? `Phiên tính toán ${state.savedSessions.length + 1}`,
            date: dateStr,
            status: 'ĐANG THỰC HIỆN',
            ...data,
          },
          ...state.savedSessions,
        ],
      };
    }),

  saveBeltResult: (sessionId, beltResult) =>
    set((state) => ({
      savedSessions: state.savedSessions.map((s) =>
        s.id === sessionId ? { ...s, beltResult } : s
      ),
    })),

  saveGearResult: (sessionId, gearResult) =>
    set((state) => ({
      savedSessions: state.savedSessions.map((s) =>
        s.id === sessionId ? { ...s, gearResult } : s
      ),
    })),

  finishSession: (sessionId) =>
    set((state) => ({
      savedSessions: state.savedSessions.map((s) =>
        s.id === sessionId ? { ...s, status: 'HOÀN THÀNH' } : s
      ),
    })),

  setCalculateSession: (value) => set({ calculateSession: value }),

  setOperatingField: (field, value) =>
    set((state) => ({
      operatingData: {
        ...state.operatingData,
        [field]: value,
      },
    })),

  setLoadField: (field, value) =>
    set((state) => ({
      loadData: {
        ...state.loadData,
        [field]: value,
      },
    })),

  setEfficiencyField: (field, value) =>
    set((state) => ({
      efficiencyData: {
        ...state.efficiencyData,
        [field]: value,
      },
    })),

  addDriveItem: () =>
    set((state) => ({
      driveItems: [
        ...state.driveItems,
        {
          id: createId(),
          type: 'Bánh răng trụ',
          quantity: '1',
          transmissionRatio: '',
          isOpen: false,
        },
      ],
    })),

  updateDriveItem: (id, patch) =>
    set((state) => ({
      driveItems: state.driveItems.map((item) => {
        if (item.id !== id) return item;

        const nextType = patch.type ?? item.type;
        const forcedOpen = isDriveForcedOpen(nextType);

        return {
          ...item,
          ...patch,
          type: nextType,
          isOpen: forcedOpen ? true : patch.isOpen ?? item.isOpen,
          z: nextType === 'Trục vít không tự hãm' ? patch.z ?? item.z : undefined,
        };
      }),
    })),

  removeDriveItem: (id) =>
    set((state) => ({
      driveItems: state.driveItems.filter((item) => item.id !== id),
    })),

  addBearingItem: () =>
    set((state) => ({
      bearingItems: [
        ...state.bearingItems,
        {
          id: createId(),
          type: 'Ổ lăn',
          quantity: '1',
          isOpen: true,
        },
      ],
    })),

  updateBearingItem: (id, patch) =>
    set((state) => ({
      bearingItems: state.bearingItems.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          ...patch,
          isOpen: true,
        };
      }),
    })),

  removeBearingItem: (id) =>
    set((state) => ({
      bearingItems: state.bearingItems.filter((item) => item.id !== id),
    })),

  resetInputState: () =>
    set({
      calculateSession: '',
      operatingData: defaultOperatingData,
      loadData: defaultLoadData,
      efficiencyData: defaultEfficiencyData,
      driveItems: [],
      bearingItems: [],
      currentSessionId: null,
      isReadOnly: false,
    }),

  // ── Module 3: Quản lý lịch sử ──────────────────────────────────────────────

  /**
   * Nạp dữ liệu từ lịch sử vào Store để xem lại / chỉnh sửa.
   * Được gọi khi người dùng nhấn vào Card trên HomeScreen.
   */
  loadSessionFromHistory: (session) =>
    set((state) => {
      if (session.rawInputData) {
        return {
          currentSessionId: session.id,
          isReadOnly: true,
          calculateSession: session.rawInputData.calculateSession || session.title || '',
          operatingData: session.rawInputData.operatingData || defaultOperatingData,
          loadData: session.rawInputData.loadData || defaultLoadData,
          efficiencyData: session.rawInputData.efficiencyData || defaultEfficiencyData,
          driveItems: session.rawInputData.driveItems || [],
          bearingItems: session.rawInputData.bearingItems || [],
        };
      }
      // Fallback cho dữ liệu cũ không có rawInputData
      return {
        currentSessionId: session.id,
        isReadOnly: true,
        calculateSession: session.title || '',
        operatingData: {
          power: session.motorPower?.toString() || '',
          speed: session.nDc?.toString() || '',
          serviceLife: '',
        },
      };
    }),

  /**
   * Xóa một session khỏi mảng savedSessions trong Zustand.
   */
  removeSession: (sessionId) =>
    set((state) => ({
      savedSessions: state.savedSessions.filter((s) => s.id !== sessionId),
    })),

  /**
   * Thay thế toàn bộ savedSessions (dùng khi load từ SQLite lúc App khởi động).
   */
  setSavedSessions: (sessions) => set({ savedSessions: sessions }),
}));
