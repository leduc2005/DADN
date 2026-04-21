import { Platform } from 'react-native';
import { api } from './request';


// Hàm gán Token tự động vào mọi request sau khi đăng nhập thành công
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};
