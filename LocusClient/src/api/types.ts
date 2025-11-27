/**
 * src/api/types.ts
 */

// --- 1. 응답 공통 타입 ---
export interface ApiResponse<T> {
  message?: string;
  data?: T;
}

// --- 2. User & Auth ---
export interface User {
  id: string; 
  email: string;
  name: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  userId: string;
}

// --- 3. Home ---
export interface Home {
  id: string;
  name: string;
  addressLine?: string;
  role: 'OWNER' | 'MEMBER';
  deviceCount?: number;
  imageUrl?: string | null;
  modelUrl?: string | null;
}

// --- 4. Device & Robot ---
export interface Device {
  id: string;
  name: string;
  deviceType: 'ROBOT_VACUUM' | 'AIR_PURIFIER' | 'OTHER';
  status: 'ONLINE' | 'OFFLINE' | 'ERROR';
  modelName?: string;
}

export interface RobotLocation {
  x: number;
  y: number;
  z: number;
  headingDeg: number;
  recordedAt: string;
}

export interface RobotMap {
  id: string;
  version: number;
  width: number;
  height: number;
  mapJson: any;
}

// --- 5. Label & Map Zones ---
export interface RoomLabel {
  id: number; // RoomLabel은 보통 Int 범위라 number 유지 (백엔드도 number로 보냄)
  name: string;
  colorHex?: string;
  points: { x: number; z: number }[];
}

// --- 6. Logs (Pollution & Events) ---

// 🔴 오염도 예측 데이터
export interface PollutionPrediction {
  id: string; // ✅ [수정] 백엔드에서 BigInt -> String 변환해서 보냄
  homeId: number;
  labelId: number | null; // 백엔드에서 Number() 변환해서 보냄
  probability: number; 
  predictionTime: string; 
  label?: {
    name: string;
  };
  status?: 'CLEANING_NEEDED' | 'CLEAN'; // Optional 처리
}

// 🔵 센서/시스템 이벤트 데이터
export interface SensorEvent {
  id: string; // ✅ BigInt -> String
  homeId: number;
  eventTime: string; 
  
  eventType: 'AUDIO' | 'VISION' | 'SYSTEM' | 'USER_ACTION';
  subType?: string; 
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  
  payloadJson?: any; 
  
  label?: {
    name: string;
  };

  snapshotX?: number;
  snapshotY?: number;
  snapshotZ?: number;
}