import { api } from './api';

export interface SearchMotorPayload {
  Pct: number;
  Nsb: number;
  Tmm_over_T?: number;
}

export interface MotorSearchItem {
  motorId: string;
  motorType: string;
  ratedPower: number;
  motorSpeed: number;
  syncSpeed: number;
  efficiency: number;
  powerFactor: number;
  overloadRatio: number;
  shaftDiameter: number;
  model: string;
  power: number;
  speed: number;
  Tmm_Tdn: number;
}

export interface MotorSearchResponse {
  success: boolean;
  items: MotorSearchItem[];
  total: number;
}

export async function searchMotor(payload: SearchMotorPayload): Promise<MotorSearchResponse> {
  const response = await api.post<MotorSearchResponse>('/motors/search', payload);
  return response.data;
}
