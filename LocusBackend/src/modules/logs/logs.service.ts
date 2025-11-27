import { prisma } from '../../config/db';
import { FastifyInstance } from 'fastify';
import { LocationSource } from '@prisma/client';

const BATCH_SIZE = 50;
const FLUSH_INTERVAL = 5000;

interface PendingLog {
  deviceId: number;
  x: number;
  y: number;
  z: number;
  recordedAt: Date;
  accuracy: number;
  source: LocationSource;
}

// 데이터를 임시로 쌓아두는 메모리 버퍼
let logBuffer: PendingLog[] = [];

/**
 * 1. [저장] 위치 데이터 수신 및 버퍼링 (POST용)
 */
export const bufferLocationLog = async (server: FastifyInstance, data: any) => {
  const record: PendingLog = {
    deviceId: data.clientId ? Number(data.clientId) : 1,
    x: data.position3D?.x || 0,
    y: data.position3D?.y || 0,
    z: data.position3D?.z || 0,
    recordedAt: new Date(data.timestamp || Date.now()),
    accuracy: data.accuracy || 0,
    source: 'MOBILE',
  };

  // (선택사항) 소켓이 연결되어 있다면 소켓으로도 쏴줍니다. (하이브리드 지원)
  if ((server as any).io) {
    (server as any).io.emit('robot_position', record);
  }

  // 메모리 버퍼에 추가
  logBuffer.push(record);

  // 버퍼가 꽉 찼으면 DB에 저장
  if (logBuffer.length >= BATCH_SIZE) {
    await flushLogsToDB();
  }
};

/**
 * 2. [조회] 가장 최신 위치 데이터 1개 반환 (GET용)
 * 🔥 HTTP 폴링을 위해 새로 추가된 핵심 로직
 */
export const getLatestLocation = async () => {
  // 1순위: 아직 DB에 안 들어간 '버퍼'에 있는 데이터가 가장 최신입니다.
  if (logBuffer.length > 0) {
    return logBuffer[logBuffer.length - 1];
  }

  // 2순위: 버퍼가 비어있다면 DB에서 가장 최근 데이터를 가져옵니다.
  const latestFromDB = await prisma.robotLocation.findFirst({
    orderBy: { recordedAt: 'desc' },
    select: { x: true, y: true, z: true, recordedAt: true, id: true } // 필요한 필드만
  });

  return latestFromDB;
};

/**
 * 3. [내부] 버퍼 -> DB 일괄 저장 (Flush)
 */
const flushLogsToDB = async () => {
  if (logBuffer.length === 0) return;

  const chunk = [...logBuffer];
  logBuffer = []; 

  try {
    console.log(`💾 [Batch] 위치 로그 ${chunk.length}개 DB 저장...`);
    
    await prisma.robotLocation.createMany({
      data: chunk.map(log => ({
        deviceId: log.deviceId,
        x: log.x,
        y: log.y,
        z: log.z,
        recordedAt: log.recordedAt,
        source: log.source,
        rawPayloadJson: { accuracy: log.accuracy } 
      })),
      skipDuplicates: true,
    });
  } catch (error) {
    console.error('❌ [Batch] 로그 저장 실패:', error);
  }
};

// 주기적 저장
setInterval(() => {
  if (logBuffer.length > 0) flushLogsToDB();
}, FLUSH_INTERVAL);