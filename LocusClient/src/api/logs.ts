import { client } from './client';
// types.ts에 RobotLocation 타입이 정의되어 있다고 가정
import type { RobotLocation, SensorEvent } from './types';

// --- Types ---
interface GetLocationsParams {
  deviceId: string;
  startTime?: string; 
  endTime?: string;   
  limit?: number;
}

/**
 * 1. [HTTP Polling용] 가장 최신 위치 1개 조회
 * 사용처: useRobotTracking 훅에서 0.5초마다 호출
 */
export const getLatestLogAPI = async () => {
  // 백엔드의 GET /api/log/latest 호출
  const response = await client.get<Partial<RobotLocation>>('/log/latest');
  return response.data;
};

/**
 * 2. 과거 이동 경로 히스토리 조회
 * (추후 구현 예정인 GET /api/log/locations 대응)
 */
export const getRobotLocationsAPI = async (params: GetLocationsParams) => {
  const response = await client.get<RobotLocation[]>('/log/locations', {
    params,
  });
  return response.data;
};

/**
 * 3. 센서/이벤트 로그 조회
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