import axios from 'axios';
import { Platform } from 'react-native';

// CẤU HÌNH IP KHI TEST:
// 1. Khi dùng Simulator/Emulator: Để nguyên 'localhost' hoặc '10.0.2.2'.
// 2. Khi dùng ĐIỆN THOẠI THẬT (Expo Go): Thay 'localhost' bằng địa chỉ IP máy tính của bạn (vd: 192.168.1.x).
//    Gõ lệnh 'ipconfig' (Windows) để lấy địa chỉ IPv4.

const LOCAL_IP = '192.168.123.10'; // <--- Thay IP của bạn vào đây khi test trên điện thoại

export const BASE_URL = Platform.OS === 'android' && LOCAL_IP === '192.168.123.10'
  ? 'http://10.0.2.2:5000/api'
  : `http://${LOCAL_IP}:5000/api`;


export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000, // 8 giây timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Hàm gán Token tự động vào mọi request sau khi đăng nhập thành công
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};
