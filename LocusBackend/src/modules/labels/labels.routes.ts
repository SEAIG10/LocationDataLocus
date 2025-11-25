import { FastifyInstance } from 'fastify';
import { getLabelsHandler, createLabelHandler, deleteLabelHandler } from './labels.controller';

export async function labelsRoutes(app: FastifyInstance) {
  // 로그인 체크
  app.addHook('onRequest', async (req) => { await req.jwtVerify() });

  // GET /api/homes/:homeId/labels -> 해당 집의 라벨 목록 조회
  app.get('/:homeId/labels', getLabelsHandler);
  
  // POST /api/homes/:homeId/labels -> 라벨 생성
  app.post('/:homeId/labels', createLabelHandler);
  
  // DELETE /api/homes/labels/:labelId -> 라벨 삭제
  // (app.ts에서 prefix가 '/homes'로 설정된 경우, 이 경로는 /api/homes/labels/:id 가 됩니다)
  app.delete('/labels/:labelId', deleteLabelHandler);
}