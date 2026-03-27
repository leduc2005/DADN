import axios from 'axios';
import { Platform } from 'react-native';

// iOS Simulator dùng localhost. 
// Máy ảo Android dùng 10.0.2.2 để đại diện cho localhost của máy tính.
export const BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5000/api' 
  : 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
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
