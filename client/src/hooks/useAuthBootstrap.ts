import { useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../store/authStore';
import { setAuthToken } from '../services/api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/**
 * Giải mã JWT và kiểm tra xem token có còn hạn không.
 * JWT có cấu trúc: header.payload.signature (base64 encoded)
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    const now = Math.floor(Date.now() / 1000); // Đổi sang giây
    return decoded.exp < now;
  } catch {
    return true; // Nếu lỗi decode → coi như hết hạn
  }
}

export async function saveAuthToSecureStore(token: string, user: any) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function clearAuthFromSecureStore() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

/**
 * Custom Hook: Chạy 1 lần khi App khởi động.
 * Kiểm tra SecureStore — nếu có Token còn hạn thì tự đăng nhập,
 * nếu hết hạn thì xóa token và hiện màn Login.
 */
export function useAuthBootstrap() {
  const { login, setBootstrapping } = useAuthStore();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        const userJson = await SecureStore.getItemAsync(USER_KEY);

        if (token && userJson) {
          // ✅ Kiểm tra JWT còn hạn không
          if (isTokenExpired(token)) {
            console.log('Bootstrap: Token hết hạn → Xóa và về Login.');
            await clearAuthFromSecureStore();
          } else {
            const user = JSON.parse(userJson);
            setAuthToken(token);
            login(user, token);
          }
        }
      } catch (error) {
        console.log('Bootstrap: Lỗi đọc token, về Login.');
      } finally {
        setBootstrapping(false);
      }
    };

    bootstrap();
  }, []);
}

