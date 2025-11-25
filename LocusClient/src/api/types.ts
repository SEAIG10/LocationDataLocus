// --- 응답 공통 타입 ---
export interface ApiResponse<T> {
  message?: string;
  data?: T;
}

// --- User & Auth ---
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

// --- Home ---
export interface Home {
  id: string;
  name: string;
  addressLine?: string;
  role: 'OWNER' | 'MEMBER';
  deviceCount?: number;
  imageUrl?: string | null; // 🔥 추가됨: 이미지 URL 필드
}

// --- Device & Robot ---
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

// --- Label & Prediction ---
export interface RoomLabel {
  id: string;
  name: string;
  colorHex?: string;
  points: { x: number; z: number }[];
}

export interface PollutionPrediction {
  labelId: string;
  labelName: string;
  probability: number;
  status: 'CLEANING_NEEDED' | 'CLEAN';
}