import { FastifyInstance } from 'fastify';
import { createLogHandler, getLatestLogHandler } from './logs.controller';

export default async function logRoutes(fastify: FastifyInstance) {
  
  // 1. [POST] 트래커가 데이터를 쏘는 곳
  // URL: /api/log/record
  fastify.post('/record', createLogHandler);

  // 2. [GET] 프론트엔드가 데이터를 가져가는 곳 (HTTP Polling)
  // URL: /api/log/latest
  fastify.get('/latest', getLatestLogHandler);

}