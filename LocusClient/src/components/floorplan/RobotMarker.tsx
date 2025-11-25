/**
 * RobotMarker.tsx
 * 3D 공간에 로봇 청소기를 표시하는 컴포넌트
 */

import React from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { RoomLabel } from "../../types";


interface RobotMarkerProps {
  position: [number, number, number];
  currentRoom?: string | null;
}

/**
 * 로봇 청소기 3D 마커
 * 사용법: Floorplan3DView.tsx의 Canvas 안에 추가
 */
export function RobotMarker({ position, currentRoom }: RobotMarkerProps) {
  return (
    <group position={position}>
      {/* 로봇 본체 (원형) */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 32]} />
        <meshStandardMaterial 
          color="#2196f3" 
          emissive="#2196f3"
          emissiveIntensity={0.3}
          metalness={0.5}
          roughness={0.5}
        />
      </mesh>

      {/* 로봇 상단 센서 부분 */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 32]} />
        <meshStandardMaterial 
          color="#1976d2" 
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* 방향 표시 화살표 */}
      <mesh position={[0.2, 0.15, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.08, 0.15, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* 이동 경로 표시 (원형 그림자) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial 
          color="#2196f3" 
          transparent 
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* HTML 라벨 */}
      <Html
        position={[0, 0.6, 0]}
        center
        distanceFactor={8}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(33, 150, 243, 0.95)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '14px',
          fontSize: '12px',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>🤖</span>
          {currentRoom ? (
            <span>{currentRoom} 청소중</span>
          ) : (
            <span>이동중</span>
          )}
        </div>
      </Html>
    </group>
  );
}

// ============================================
// 사용 예제
// ============================================

/*

// Floorplan3DView.tsx에 추가:

import { RobotMarker } from './RobotMarker';

interface Floorplan3DViewProps {
  // ... 기존 props
  robotPosition?: [number, number, number] | null;
  robotCurrentRoom?: string | null;
}

const Floorplan3DView: React.FC<Floorplan3DViewProps> = ({ 
  // ... 기존 props
  robotPosition = null,
  robotCurrentRoom = null,
}) => {
  return (
    <Canvas>
      <Suspense fallback={null}>
        <Model />
        
        // 로봇 마커 추가
        {robotPosition && (
          <RobotMarker 
            position={robotPosition} 
            currentRoom={robotCurrentRoom}
          />
        )}
        
        // ... 나머지 컴포넌트
      </Suspense>
    </Canvas>
  );
};

// App.tsx에서 사용:

const [robotPosition, setRobotPosition] = useState<[number, number, number] | null>(null);
const [currentRoom, setCurrentRoom] = useState<RoomLabel | null>(null);

// WebSocket에서 로봇 위치 받기
useEffect(() => {
  const ws = new WebSocket('ws://robot-server.com');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    // 로봇 위치 업데이트 (Y=0.1로 바닥 위에 표시)
    setRobotPosition([data.x, 0.1, data.z]);
    
    // 현재 구역 찾기
    const room = findCurrentRoom({ x: data.x, z: data.z, timestamp: Date.now() }, labels);
    setCurrentRoom(room);
  };
  
  return () => ws.close();
}, [labels]);

<Floorplan3DView
  isEditMode={isEditMode}
  labels={labels}
  robotPosition={robotPosition}
  robotCurrentRoom={currentRoom?.name}
  // ... 다른 props
/>

*/