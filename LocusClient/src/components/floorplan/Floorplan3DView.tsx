// src/components/floorplan/Floorplan3DView.tsx
import React, { Suspense, useMemo } from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { RoomLabel } from "../../types";

interface Floorplan3DViewProps {
  isEditMode: boolean;
  labels: RoomLabel[];
  clickedCorners: [number, number][]; // [x, z]
  onAddLabel: (position: [number, number, number]) => void;
  onEditLabel: (id: string) => void;
  onDeleteLabel: (id: string) => void;
  robotPosition: [number, number, number] | null;
  selectedLabel?: RoomLabel | null;
  onSelectLabel?: (label: RoomLabel | null) => void;
  robotCurrentRoom: string | null;
}

/** Room.glb 로드 + 편집 모드에서 클릭 시 라벨 추가 */
interface ModelProps {
  isEditMode: boolean;
  onAddLabel: (position: [number, number, number]) => void;
}

const Model: React.FC<ModelProps> = ({ isEditMode, onAddLabel }) => {
  const { scene } = useGLTF("/Room.glb") as any;

  // 재질은 건들지 말고 그림자만 켜기
  scene.traverse((child: THREE.Object3D) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });

  scene.scale.set(0.45, 0.45, 0.45);
  scene.rotation.set(1, 0, 0);
  scene.position.set(0, 0, 0);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isEditMode) return;
    e.stopPropagation();
    const p = e.point;
    onAddLabel([p.x, p.y, p.z]);
  };

  return <primitive object={scene} onClick={handleClick} />;
};

/** 방 면적 폴리곤 메쉬 */
interface PolygonMeshProps {
  corners: [number, number][];
  isEditMode: boolean;
}

const PolygonMesh: React.FC<PolygonMeshProps> = ({ corners, isEditMode }) => {
  const shape = useMemo(() => {
    if (corners.length < 3) return null;
    const s = new THREE.Shape();
    const [firstX, firstZ] = corners[0];
    s.moveTo(firstX, firstZ);
    for (let i = 1; i < corners.length; i++) {
      const [x, z] = corners[i];
      s.lineTo(x, z);
    }
    s.lineTo(firstX, firstZ);
    return s;
  }, [corners]);

  if (!shape) return null;

  return (
    <mesh position={[0, 0.01, 0]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial
        color={isEditMode ? "#7c5dfa" : "#3b4d6b"}
        transparent
        opacity={isEditMode ? 0.18 : 0.12}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

/** 모서리 마커 */
interface CornerMarkerProps {
  position: [number, number]; // [x, z]
  index: number;
}

const CornerMarker: React.FC<CornerMarkerProps> = ({ position, index }) => {
  const [x, z] = position;
  return (
    <group position={[x, 0.05, z]}>
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#ff3b30" />
      </mesh>
      <Html center>
        <div
          style={{
            fontSize: 10,
            padding: "2px 6px",
            borderRadius: 12,
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
          }}
        >
          {index + 1}
        </div>
      </Html>
    </group>
  );
};

/** 클릭 중인 방의 미리보기 라인 */
const PreviewLines: React.FC<{ corners: [number, number][] }> = ({
  corners,
}) => {
  if (corners.length < 2) return null;

  const points: [number, number, number][] = corners.map(([x, z]) => [
    x,
    0.02,
    z,
  ]);

  return (
    <Line
      points={points}
      color="#7c5dfa"
      lineWidth={2}
      dashed={false}
    />
  );
};

/** 라벨(텍스트 + 삭제 버튼) */
interface LabelProps {
  label: RoomLabel;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isEditMode: boolean;
  isSelected: boolean;
  onSelectLabel?: (label: RoomLabel | null) => void;
}

const Label: React.FC<LabelProps> = ({
  label,
  onEdit,
  onDelete,
  isEditMode,
  isSelected,
  onSelectLabel,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (onSelectLabel) {
      // 이미 선택되어 있으면 다시 클릭 시 해제
      onSelectLabel(isSelected ? null : label);
    } else {
      // 선택 핸들러 없으면 그냥 편집 진입
      onEdit(label.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(label.id);
  };

  return (
    <Html position={label.position} center>
      <div
        className="room-label"
        onClick={handleClick}
        style={{
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          className="label-content"
          style={{
            padding: "4px 8px",
            borderRadius: 12,
            background: isSelected
              ? "rgba(124,93,250,0.9)"
              : "rgba(0,0,0,0.65)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span className="label-text" style={{ fontSize: 11 }}>
            {label.name}
          </span>
          {isEditMode && (
            <button
              className="label-delete-btn"
              onClick={handleDelete}
              style={{
                border: "none",
                background: "transparent",
                color: "#ffd5d5",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>
    </Html>
  );
};

/** 로봇 위치 표시 */
interface RobotMarkerProps {
  position: [number, number, number];
  currentRoom: string | null;
}

const RobotMarker: React.FC<RobotMarkerProps> = ({
  position,
  currentRoom,
}) => {
  return (
    <group>
      <mesh position={position} castShadow>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#4dabff" />
      </mesh>
      <Html position={[position[0], position[1] + 0.4, position[2]]} center>
        <div
          style={{
            fontSize: 8,
            padding: "4px 8px",
            borderRadius: 12,
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
          }}
        >
          {currentRoom ?? "로봇"}
        </div>
      </Html>
    </group>
  );
};

/** 메인 3D 뷰 */
const Floorplan3DView: React.FC<Floorplan3DViewProps> = ({
  isEditMode,
  labels,
  clickedCorners,
  onAddLabel,
  onEditLabel,
  onDeleteLabel,
  robotPosition,
  selectedLabel,
  onSelectLabel,
  robotCurrentRoom,
}) => {
  return (
    <Canvas shadows camera={{ position: [0, 5, 8], fov: 45 }}>
      {/* 배경 & 조명 */}
      <color attach="background" args={["#f5f5f7"]} />

      <ambientLight intensity={0.9} />

      <directionalLight
        position={[5, 10, 5]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      <directionalLight position={[-4, 6, -3]} intensity={1.0} />

      <Suspense fallback={null}>
        {/* Room.glb */}
        <Model isEditMode={isEditMode} onAddLabel={onAddLabel} />

        {/* 폴리곤 영역 */}
        {labels.map((label) => (
          <PolygonMesh
            key={`polygon-${label.id}`}
            corners={label.corners}
            isEditMode={isEditMode}
          />
        ))}

        {/* 코너 마커 */}
        {clickedCorners.map((corner, index) => (
          <CornerMarker
            key={`corner-${index}`}
            position={corner}
            index={index}
          />
        ))}

        {/* 임시 라인 */}
        {clickedCorners.length > 1 && (
          <PreviewLines corners={clickedCorners} />
        )}

        {/* 라벨 */}
        {labels.map((label) => (
          <Label
            key={label.id}
            label={label}
            onEdit={onEditLabel}
            onDelete={onDeleteLabel}
            isEditMode={isEditMode}
            isSelected={selectedLabel?.id === label.id}
            onSelectLabel={onSelectLabel}
          />
        ))}

        {/* 로봇 위치 */}
        {robotPosition && (
          <RobotMarker
            position={robotPosition}
            currentRoom={robotCurrentRoom}
          />
        )}
      </Suspense>

      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={3}
        maxDistance={15}
      />
    </Canvas>
  );
};

export default Floorplan3DView;
