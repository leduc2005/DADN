import { api } from './request';

export const searchMotor = async ({ Pct, Nsb }) => {
  try {
    const response = await api.post('/motors/search', { Pct, Nsb });
    return response.data;
  } catch (error) {
    console.error('Error searching motors:', error);
    throw error;
  }
}