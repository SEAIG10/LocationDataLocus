import { client } from './client';
import { RoomLabel } from './types';

// 목록 조회
// GET /api/homes/:homeId/labels
export const getLabelsAPI = async (homeId: string) => {
  const response = await client.get<RoomLabel[]>(`/homes/${homeId}/labels`);
  return response.data;
};

// 생성
// POST /api/homes/:homeId/labels
export const createLabelAPI = async (homeId: string, name: string, points: {x:number, z:number}[]) => {
  const response = await client.post(`/homes/${homeId}/labels`, { name, points });
  return response.data;
};

// 삭제
// DELETE /api/homes/:homeId/labels/:labelId
export const deleteLabelAPI = async (homeId: string, labelId: string) => {
  await client.delete(`/homes/${homeId}/labels/${labelId}`);
};