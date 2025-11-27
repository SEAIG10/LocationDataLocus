import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface UseRobotTrackingOptions {
  serverUrl: string;
  autoConnect?: boolean;
  onError?: (error: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

/**
 * HTTP Polling 방식의 로봇 위치 추적 훅
 * 0.5초마다 백엔드에 "지금 어디야?"라고 물어봅니다.
 */
export function useRobotTracking({
  serverUrl,
  autoConnect = true,
  onError,
  onConnect,
  onDisconnect,
}: UseRobotTrackingOptions) {
  const [robotPosition, setRobotPosition] = useState<[number, number, number] | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [accuracy, setAccuracy] = useState<number>(0);
  
  // 🔥 [수정] NodeJS.Timeout 대신 ReturnType<typeof setInterval> 사용 (타입 에러 해결)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 연결 (폴링 시작)
  const connect = () => {
    if (intervalRef.current) return; // 이미 실행 중이면 패스

    console.log(`📡 [HTTP Polling] 로봇 추적 시작: ${serverUrl}`);
    onConnect?.();
    setIsConnected(true);

    const fetchLocation = async () => {
      try {
        // 백엔드의 GET /api/log/latest 엔드포인트 호출
        const response = await axios.get(`${serverUrl}/api/log/latest`);
        const data = response.data;

        // 데이터가 비어있지 않다면 업데이트
        if (data && typeof data.x === 'number') {
          // 좌표 업데이트 (x, y, z)
          setRobotPosition([data.x, data.y, data.z]);
          
          // 정확도 업데이트 (없으면 0)
          // 백엔드에서 rawPayloadJson.accuracy 등으로 보내주는지 확인 필요
          // 여기선 편의상 rawPayloadJson이 있으면 파싱 시도
          let acc = 0;
          if (data.rawPayloadJson && data.rawPayloadJson.accuracy) {
            acc = data.rawPayloadJson.accuracy;
          }
          setAccuracy(acc);
        }
      } catch (error) {
        console.error('❌ 위치 조회 실패:', error);
        onError?.(error);
        // 에러가 나도 멈추지 않고 계속 시도 (네트워크 일시적 문제 대비)
      }
    };

    // 1. 즉시 실행
    fetchLocation();

    // 2. 0.5초마다 반복 실행 (Polling)
    intervalRef.current = setInterval(fetchLocation, 500);
  };

  // 연결 해제 (폴링 중지)
  const disconnect = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
    console.log('🔌 [HTTP Polling] 로봇 추적 중지');
    onDisconnect?.();
  };

  // 자동 시작/종료 처리
  useEffect(() => {
    if (autoConnect && serverUrl) {
      connect();
    }

    // 컴포넌트가 사라질 때 정리(Cleanup)
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl, autoConnect]);

  return {
    robotPosition,
    isConnected,
    accuracy,
    connect,
    disconnect,
  };
}

/**
 * Point-in-Polygon 유틸 함수 (기존 유지)
 */
export function isPointInPolygon(
  x: number,
  z: number,
  polygon: [number, number][],
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const zi = polygon[i][1];
    const xj = polygon[j][0];
    const zj = polygon[j][1];

    const intersect =
      zi > z !== zj > z &&
      x < ((xj - xi) * (z - zi)) / (zj - zi) + xi;

    if (intersect) inside = !inside;
  }
  return inside;
}