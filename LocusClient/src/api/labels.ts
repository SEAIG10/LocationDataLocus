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
// DELETE /api/homes/labels/:labelId
export const deleteLabelAPI = async (labelId: string) => {
  // 주의: 백엔드 라우트 설정에 따라 경로가 달라질 수 있습니다.
  // labels.routes.ts에서 app.delete('/labels/:labelId', ...) 로 설정했고
  // app.ts에서 prefix: '/homes' 로 등록했으므로
  // 최종 경로는 /api/homes/labels/:labelId 가 됩니다.
  await client.delete(`/homes/labels/${labelId}`);
};