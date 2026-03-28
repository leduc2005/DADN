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
  login: (userData: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  // Hành động Đăng nhập thành công -> Lưu cất token và user vào kho
  login: (user, token) => set({ user, token, isAuthenticated: true }),
  
  // Hành động Đăng xuất -> Xóa sạch
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));
