import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isSyncing: boolean;           // Trạng thái đồng bộ ngầm (hiện icon đám mây xoay)
  isBootstrapping: boolean;     // Đang kiểm tra token lúc khởi động app
  login: (userData: User, token: string) => void;
  logout: () => void;
  setSyncing: (val: boolean) => void;
  setBootstrapping: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isSyncing: false,
  isBootstrapping: true,        // Mặc định true khi app mới mở

  // Đăng nhập thành công
  login: (user, token) => set({ user, token, isAuthenticated: true }),

  // Đăng xuất → Xóa sạch
  logout: () => set({ user: null, token: null, isAuthenticated: false }),

  // Cập nhật trạng thái đồng bộ ngầm
  setSyncing: (val) => set({ isSyncing: val }),

  // Cập nhật trạng thái đang bootstrap (kiểm tra token lúc mở app)
  setBootstrapping: (val) => set({ isBootstrapping: val }),
}));
