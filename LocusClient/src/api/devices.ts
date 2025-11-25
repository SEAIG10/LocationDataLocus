import { client } from './client';

// 로봇 맵 데이터 조회 (JSON)
export const getRobotMapAPI = async (deviceId: number) => {
  const response = await client.get(`/devices/${deviceId}/map`);
  return response.data;
};

// 로봇 실시간 위치 조회 (Polling용)
export const getRobotLocationAPI = async (deviceId: number) => {
  const response = await client.get(`/devices/${deviceId}/location`);
  return response.data;
  // Return Type: { x: number, y: number, z: number, heading: number }
};