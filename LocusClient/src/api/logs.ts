/**
 * src/api/logs.ts
 */
import { client } from './client';
// ✅ types.ts에서 정의한 인터페이스 사용
import type { RobotLocation, SensorEvent, PollutionPrediction } from './types';

// --- Types ---
interface GetLocationsParams {
  deviceId: string;
  startTime?: string; 
  endTime?: string;   
  limit?: number;
}

/**
 * 1. [HTTP Polling용] 가장 최신 위치 1개 조회
 * 사용처: 로봇 위치 초기값 로드
 */
export const getLatestLogAPI = async () => {
  const response = await client.get<Partial<RobotLocation>>('/log/latest');
  return response.data;
};

/**
 * 2. 과거 이동 경로 히스토리 조회
 */
export const getRobotLocationsAPI = async (params: GetLocationsParams) => {
  const response = await client.get<RobotLocation[]>('/log/locations', {
    params,
  });
  return response.data;
};

/**
 * 3. 센서/이벤트 로그 조회 (타임라인용)
 * 백엔드의 getEventsHandler 호출
 */
export const getSensorEventsAPI = async (homeId: string, limit = 50) => {
  const response = await client.get<SensorEvent[]>('/log/events', {
    params: { homeId, limit },
  });
  return response.data;
};

/**
 * 4. (테스트용) 로그 수동 생성
 */
export const createLogAPI = async (data: {
  position3D: { x: number; y: number; z: number };
  accuracy?: number;
  timestamp?: string;
}) => {
  const response = await client.post('/log/record', data);
  return response.data;
};

/**
 * 5. 오염 예측 로그 조회 (하단 패널용)
 * 백엔드의 getPredictionsHandler 호출
 */
export const getPollutionPredictionsAPI = async (homeId: string) => {
  const response = await client.get<PollutionPrediction[]>('/log/predictions', {
    params: { homeId },
  });
  return response.data;
};