/**
 * RobotTracking.ts
 * WebSocket으로 실시간 로봇 위치를 추적하는 커스텀 훅 + 유틸 함수
 */

import { useState, useEffect, useCallback } from 'react';

interface Position3D {
  x: number;
  y: number;
  z: number;
}

interface LocationUpdateData {
  clientId: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  receivedAt: string;
  position3D: Position3D;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
}

interface LocationUpdateMessage {
  type: 'location_update';
  data: LocationUpdateData;
}

interface WelcomeMessage {
  type: 'welcome';
  clientId: number;
  message: string;
  serverTime: string;
}

type WebSocketMessage = LocationUpdateMessage | WelcomeMessage;

interface UseRobotTrackingOptions {
  serverUrl: string;
  autoConnect?: boolean;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useRobotTracking({
  serverUrl,
  autoConnect = true,
  onError,
  onConnect,
  onDisconnect,
}: UseRobotTrackingOptions) {
  const [robotPosition, setRobotPosition] = useState<[number, number, number] | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (ws?.readyState === WebSocket.OPEN) {
      console.warn('WebSocket already connected');
      return;
    }

    // http/https로 들어와도 알아서 ws/wss로 변환
    let wsUrl = serverUrl;
    if (wsUrl.startsWith('https://')) {
      wsUrl = wsUrl.replace('https://', 'wss://');
    } else if (wsUrl.startsWith('http://')) {
      wsUrl = wsUrl.replace('http://', 'ws://');
    }

    console.log(`🔌 로봇 트래커 연결 시도: ${wsUrl}`);
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('✅ WebSocket 연결 성공');
      setIsConnected(true);

      // 뷰어 클라이언트로 식별
      socket.send(
        JSON.stringify({
          type: 'identify',
          clientType: 'viewer',
        }),
      );

      onConnect?.();
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        if (message.type === 'welcome') {
          console.log(`환영 메시지: ${message.message}`);
        } else if (message.type === 'location_update') {
          const { position3D, accuracy } = message.data;

          // 로봇 위치 업데이트 (Y축은 바닥 위로 살짝 띄우기)
          const pos: [number, number, number] = [position3D.x, 0.1, position3D.z];
          setRobotPosition(pos);
          setAccuracy(accuracy);
          setLastUpdate(new Date());

          console.log('📍 로봇 위치 업데이트:', {
            position: `(${position3D.x.toFixed(3)}, ${position3D.y.toFixed(3)}, ${position3D.z.toFixed(3)})`,
            accuracy: `±${accuracy.toFixed(3)} (단위: 서버/클라이언트 정의)`,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        console.error('메시지 파싱 오류:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('❌ WebSocket 오류:', error);
      onError?.(error);
    };

    socket.onclose = () => {
      console.log('🔌 WebSocket 연결 끊김');
      setIsConnected(false);
      setWs(null);
      onDisconnect?.();
    };

    setWs(socket);
  }, [serverUrl, ws, onConnect, onError, onDisconnect]);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
      console.log('WebSocket 연결 해제');
    }
  }, [ws]);

  // 자동 연결
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      if (ws) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect]); // connect / ws는 일부러 의존성에서 제외 (중복 연결 방지)

  return {
    robotPosition,
    isConnected,
    lastUpdate,
    accuracy,
    connect,
    disconnect,
  };
}

/**
 * Point-in-Polygon
 * 로봇 좌표(x, z)가 주어진 다각형 안에 있는지 판정
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

/**
 * 공통 타입 정의 (필요하면 사용, 아니면 무시해도 됨)
 */
export interface RoomLabel {
  id: string;
  name: string;
  position: [number, number, number]; // 라벨 표시 위치 (중앙)
  corners: [number, number][]; // 4개 코너 [x,z]
}

export interface RobotPosition {
  x: number;
  z: number;
  timestamp: number;
}
