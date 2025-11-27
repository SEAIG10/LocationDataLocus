import { FastifyRequest, FastifyReply } from 'fastify';
import { bufferLocationLog, getLatestLocation } from './logs.service';

/**
 * [POST] 위치 데이터 수신 (트래커 -> 백엔드)
 */
export async function createLogHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const body = request.body as any;
    // 저장 로직 호출 (Fire & Forget)
    bufferLocationLog(request.server, body);
    return reply.code(200).send({ status: 'ok', buffered: true });
  } catch (error) {
    console.error('Log Create Error:', error);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}

/**
 * [GET] 최신 위치 데이터 1개 조회 (프론트엔드 폴링용)
 * 🔥 새로 추가된 핸들러
 */
export async function getLatestLogHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const latest = await getLatestLocation();
    
    if (!latest) {
      // 데이터가 아예 없는 경우 빈 객체 반환
      return reply.code(200).send({});
    }

    return reply.code(200).send(latest);
  } catch (error) {
    console.error('Log Get Error:', error);
    return reply.code(500).send({ message: 'Internal Server Error' });
  }
}