import React, {
  Suspense,
  useRef,
  useState,
  useEffect,
  useMemo,
} from "react";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  OrthographicCamera,
  Grid,
  useGLTF,
  Line,
  Html,
} from "@react-three/drei";
import * as THREE from "three";

import { Button } from "../../components/ui/button";
import {
  ChevronLeft,
  Play,
  Activity,
  ChevronUp,
  Clock,
  Volume2,
  Camera,
  Settings2,
  Save,
  RotateCcw,
  List,
  TrendingUp,
  X,
  Trash2,
  AlertTriangle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { useRobotTracking } from "../../hooks/useRobotTracking";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { getLabelsAPI, createLabelAPI, deleteLabelAPI } from "../../api/labels";
// 🔥 [추가] 로그 API 임포트
import { getSensorEventsAPI } from "../../api/logs";
import { RoomLabel, SensorEvent } from "../../api/types";

// 🔥 [백엔드 주소]
// 실제 배포 시에는 .env의 VITE_API_URL을 사용하는 것이 좋습니다.
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
/** ====== Type Definitions ====== */

// 타임라인 표시용 인터페이스
export interface TimelineEvent {
  id: string;
  time: string;
  type: "vision" | "audio" | "motion" | "system";
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isHighlighted: boolean;
  label: string;
}

export type RobotPos = [number, number, number] | null;

export interface MapConfig {
  scale: number;
  dataRotateDeg: number;
  modelRotationY: number;
  offsetX: number;
  offsetZ: number;
}

/** ====== Helper: Point in Polygon Algorithm ====== */
function isPointInPolygon(p: {x: number, z: number}, polygon: {x: number, z: number}[]) {
  let isInside = false;
  let minX = polygon[0].x, maxX = polygon[0].x;
  let minZ = polygon[0].z, maxZ = polygon[0].z;

  for (const point of polygon) {
    minX = Math.min(point.x, minX);
    maxX = Math.max(point.x, maxX);
    minZ = Math.min(point.z, minZ);
    maxZ = Math.max(point.z, maxZ);
  }
  if (p.x < minX || p.x > maxX || p.z < minZ || p.z > maxZ) return false;

  let j = polygon.length - 1;
  for (let i = 0; i < polygon.length; i++) {
    if ((polygon[i].z > p.z) !== (polygon[j].z > p.z) &&
        p.x < (polygon[j].x - polygon[i].x) * (p.z - polygon[i].z) / (polygon[j].z - polygon[i].z) + polygon[i].x) {
      isInside = !isInside;
    }
    j = i;
  }
  return isInside;
}

/** ====== 3D Components ====== */

function RoomModel({ onClick }: { onClick?: (e: ThreeEvent<MouseEvent>) => void }) {
  const { scene } = useGLTF("/Room.glb") as any;
  const roomRef = useRef<THREE.Object3D>(null);

  useEffect(() => {
    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    scene.scale.set(0.45, 0.45, 0.45);
    scene.rotation.set(0, 0, 0);
    scene.position.set(0, -1, 0);
  }, [scene]);

  return <primitive ref={roomRef} object={scene} onClick={onClick} />;
}

function Robot({ position }: { position: [number, number, number] }) {
  // 좌표가 유효하지 않으면 렌더링하지 않음 (NaN 에러 방지)
  if (position.some(p => isNaN(p))) return null;

  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.12, 32]} />
        <meshStandardMaterial color="#A50034" metalness={0.7} roughness={0.2} />
      </mesh>
      <pointLight position={[0, 0.3, 0]} intensity={0.8} color="#ff0040" distance={1.5} />
    </group>
  );
}

function PolygonDraft({ points }: { points: [number, number, number][] }) {
  return (
    <group>
      {points.map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color="#A50034" emissive="#A50034" emissiveIntensity={0.5} />
        </mesh>
      ))}
      {points.length > 1 && (
        <Line points={points} color="#A50034" lineWidth={3} dashed={false} />
      )}
      {points.length === 4 && (
        <Line points={[points[3], points[0]]} color="#A50034" lineWidth={3} />
      )}
    </group>
  );
}

function ExistingLabels({ 
  labels, 
  onLabelClick,
  selectedLabelId 
}: { 
  labels: RoomLabel[], 
  onLabelClick: (label: RoomLabel) => void,
  selectedLabelId: string | null 
}) {
  return (
    <group>
      {labels.map((label) => {
        if (!label.points || label.points.length === 0) return null;
        
        const points3D = label.points.map(p => [p.x, 0, p.z] as [number, number, number]);
        const closedPoints = [...points3D, points3D[0]];
        const centerX = label.points.reduce((sum, p) => sum + p.x, 0) / label.points.length;
        const centerZ = label.points.reduce((sum, p) => sum + p.z, 0) / label.points.length;
        const isSelected = label.id === selectedLabelId;

        return (
          <group key={label.id}>
            <Line
              points={closedPoints}
              color={isSelected ? "#A50034" : "#4ade80"}
              lineWidth={isSelected ? 3 : 2}
              opacity={0.6}
              transparent
            />
            {!isSelected && (
              <Html position={[centerX, 0.5, centerZ]} center zIndexRange={[100, 0]}>
                <div 
                  onClick={(e) => { e.stopPropagation(); onLabelClick(label); }}
                  className="px-2 py-1 bg-white/90 backdrop-blur-sm border border-green-400 rounded-lg text-[10px] font-bold text-green-700 cursor-pointer shadow-sm whitespace-nowrap hover:scale-110 hover:bg-green-50 transition-all flex items-center gap-1"
                >
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  {label.name}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

function Scene({
  robotPosition,
  mapConfig,
  isCreating,
  onMapClick,
  pendingPoints,
  labels,
  onLabelClick,
  selectedLabelId,
  cameraZoom
}: {
  robotPosition: RobotPos;
  mapConfig: MapConfig;
  isCreating: boolean;
  onMapClick: (e: ThreeEvent<MouseEvent>) => void;
  pendingPoints: [number, number, number][];
  labels: RoomLabel[];
  onLabelClick: (label: RoomLabel) => void;
  selectedLabelId: string | null;
  cameraZoom: number;
}) {
  return (
    <>
      <OrthographicCamera 
        makeDefault 
        position={[0, 20, 0]} 
        zoom={cameraZoom} 
        near={0.1} 
        far={1000} 
        rotation={[-Math.PI / 2, 0, 0]} 
      />
      <OrbitControls 
        enableRotate={true} 
        maxPolarAngle={Math.PI / 2} 
        minZoom={20}
        maxZoom={300} 
        enableDamping={true}
      />

      <color attach="background" args={["#f8f9fa"]} />
      <hemisphereLight intensity={1.2} groundColor="#e0e0e0" color="#ffffff" />
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 10, 2]} intensity={1.0} castShadow />
      <Grid args={[40, 40]} cellSize={1} cellThickness={0.5} cellColor="#e5e5e5" sectionSize={5} sectionThickness={1} sectionColor="#d4d4d4" position={[0, -1.01, 0]} />

      <group rotation={[0, (mapConfig.modelRotationY * Math.PI) / 180, 0]}>
        <RoomModel onClick={isCreating ? onMapClick : undefined} />
        {robotPosition && <Robot position={robotPosition} />}
        <ExistingLabels labels={labels} onLabelClick={onLabelClick} selectedLabelId={selectedLabelId} />
        <PolygonDraft points={pendingPoints} />
      </group>
    </>
  );
}

// --- Main Component ---

export function AIPredictionDashboard({ onBack }: { onBack?: () => void }) {
  const navigate = useNavigate();
  const { homeId } = useParams<{ homeId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const isCreatingLabel = searchParams.get("action") === "create";
  const STORAGE_KEY = `ROBOT_DASHBOARD_CONFIG_${homeId}`;

  const defaultConfig: MapConfig = { modelRotationY: -5, dataRotateDeg: 240, scale: 0.5, offsetX: 0.0, offsetZ: 0.0 };

  const [mapConfig, setMapConfig] = useState<MapConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultConfig;
  });

  const [labels, setLabels] = useState<RoomLabel[]>([]);
  const [pendingPoints, setPendingPoints] = useState<[number, number, number][]>([]);
  const [newLabelName, setNewLabelName] = useState("");
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<RoomLabel | null>(null);
  const [currentZone, setCurrentZone] = useState<string | null>(null);
  const [cameraZoom, setCameraZoom] = useState(50);
  
  // 🔥 [추가] 실제 타임라인 데이터 State
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setCameraZoom(40);
      else if (width < 1024) setCameraZoom(60);
      else setCameraZoom(90);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setMapConfig(JSON.parse(saved));
  }, [homeId]);

  // 라벨 불러오기
  useEffect(() => {
    if (!homeId) return;
    getLabelsAPI(homeId).then(setLabels).catch(console.error);
  }, [homeId]);

  // 🔥 [추가] 이벤트 로그 불러오기 (타임라인용)
  useEffect(() => {
    if (!homeId) return;
    const fetchEvents = async () => {
      try {
        // 실제 API 호출 (아직 데이터가 없다면 빈 배열이 옴)
        const events = await getSensorEventsAPI(homeId);
        
        // 백엔드 데이터(SensorEvent) -> 프론트 데이터(TimelineEvent) 변환
        const mappedEvents: TimelineEvent[] = events.map(evt => ({
          id: evt.id,
          time: new Date(evt.eventTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          type: evt.eventType.toLowerCase() as any, // 'AUDIO' -> 'audio'
          icon: evt.eventType === 'VISION' ? Camera : (evt.eventType === 'AUDIO' ? Volume2 : Activity),
          isHighlighted: evt.severity === 'CRITICAL',
          label: evt.subType || "이벤트 감지"
        }));
        
        setTimelineEvents(mappedEvents);
      } catch (e) {
        console.error("이벤트 로드 실패", e);
      }
    };
    
    fetchEvents();
    const interval = setInterval(fetchEvents, 5000); // 5초마다 갱신
    return () => clearInterval(interval);
  }, [homeId]);

  // 🔥 [트래킹] HTTP Polling 방식 (백엔드 URL 사용)
  const { robotPosition, isConnected: isTrackerConnected, accuracy } = useRobotTracking({
    serverUrl: BACKEND_URL, 
    autoConnect: true,
  });

  // 🔥 [디버깅] 데이터가 잘 들어오는지 콘솔에 출력
  useEffect(() => {
    if (robotPosition) {
      console.log("📍 수신된 로봇 좌표:", robotPosition);
    } else {
      console.log("⏳ 로봇 좌표 대기 중...");
    }
  }, [robotPosition]);

  const calibratedRobotPosition = useMemo((): RobotPos => {
    if (!robotPosition) return null;
    const [rawX, , rawZ] = robotPosition;

    // 🔥 [안전장치] 데이터가 없거나 숫자가 아니면 null 반환 (화면 에러 방지)
    if (typeof rawX !== 'number' || typeof rawZ !== 'number') return null;

    const scaledX = rawX * mapConfig.scale;
    const scaledZ = rawZ * mapConfig.scale;
    const radData = (mapConfig.dataRotateDeg * Math.PI) / 180;
    const dataX = scaledX * Math.cos(radData) - scaledZ * Math.sin(radData);
    const dataZ = scaledX * Math.sin(radData) + scaledZ * Math.cos(radData);
    return [dataX + mapConfig.offsetX, -0.9, dataZ + mapConfig.offsetZ];
  }, [robotPosition, mapConfig]);

  useEffect(() => {
    if (!calibratedRobotPosition || labels.length === 0) {
      setCurrentZone(null);
      return;
    }
    const [rx, , rz] = calibratedRobotPosition;
    const robotPt = { x: rx, z: rz };
    const foundLabel = labels.find(label => {
      if (!label.points || label.points.length < 3) return false;
      return isPointInPolygon(robotPt, label.points);
    });
    setCurrentZone(foundLabel ? foundLabel.name : null);
  }, [calibratedRobotPosition, labels]);

  const handleMapClick = (e: ThreeEvent<MouseEvent>) => {
    if (!isCreatingLabel) return;
    e.stopPropagation();
    if (pendingPoints.length >= 4) return;
    const newPoint: [number, number, number] = [e.point.x, 0, e.point.z];
    const nextPoints = [...pendingPoints, newPoint];
    setPendingPoints(nextPoints);
    if (nextPoints.length === 4) setTimeout(() => setShowNameDialog(true), 200);
  };

  const handleSaveLabel = async () => {
    if (!homeId || pendingPoints.length !== 4 || !newLabelName) return;
    try {
      const pointsData = pendingPoints.map(p => ({ x: p[0], z: p[2] }));
      await createLabelAPI(homeId, newLabelName, pointsData);
      toast.success(`'${newLabelName}' 구역 생성 완료`);
      setPendingPoints([]);
      setNewLabelName("");
      setShowNameDialog(false);
      setSearchParams({}); 
      getLabelsAPI(homeId).then(setLabels);
    } catch (error) {
      toast.error("라벨 생성 실패");
    }
  };

  const handleDeleteLabel = async () => {
    if (!selectedLabel) return;
    if (!confirm(`'${selectedLabel.name}' 구역을 삭제하시겠습니까?`)) return;
    try {
      await deleteLabelAPI(selectedLabel.id);
      toast.success("삭제되었습니다.");
      setLabels(labels.filter(l => l.id !== selectedLabel.id));
      setSelectedLabel(null);
    } catch (error) {
      toast.error("삭제 실패");
    }
  };

  const handleCancelCreate = () => {
    setPendingPoints([]);
    setShowNameDialog(false);
    setSearchParams({});
  };

  const [showConfig, setShowConfig] = useState(false);
  const handleSaveConfig = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapConfig));
    toast.success(`설정 저장 완료`);
  };
  const handleResetConfig = () => {
    if (confirm("설정 초기화?")) {
      setMapConfig(defaultConfig);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const isRobotOnline = calibratedRobotPosition !== null;
  const accuracyText = accuracy ? `±${accuracy.toFixed(3)}` : "±0.000";

  return (
    <div className="relative w-full h-screen bg-gray-50 overflow-hidden">
      
      {isCreatingLabel && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-[#A50034] text-white px-6 py-3 rounded-full shadow-xl flex flex-col items-center animate-in slide-in-from-top-4 w-[90%] max-w-sm text-center">
          <span className="font-bold text-sm">📍 라벨 생성 모드</span>
          <span className="text-xs opacity-90">
            {pendingPoints.length < 4 
              ? `구역의 꼭짓점을 찍어주세요 (${pendingPoints.length}/4)` 
              : "이름을 입력해주세요"}
          </span>
          <button onClick={handleCancelCreate} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full"><X className="w-4 h-4" /></button>
        </div>
      )}

      {showNameDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">새 구역 이름</h3>
            <input 
              autoFocus type="text" placeholder="예: 거실" 
              value={newLabelName} onChange={(e) => setNewLabelName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#A50034] outline-none mb-4 text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={handleCancelCreate} className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200">취소</Button>
              <Button onClick={handleSaveLabel} className="flex-1 bg-[#A50034] hover:bg-[#8b002c]">저장</Button>
            </div>
          </div>
        </div>
      )}

      {selectedLabel && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in px-4" onClick={() => setSelectedLabel(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedLabel(null)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"><X className="w-4 h-4 text-gray-500" /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedLabel.name}</h3>
                <span className="text-xs text-gray-500">Zone ID: {selectedLabel.id}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 mb-4">
              <div className="flex justify-between text-xs"><span className="text-gray-500">오염도 예측</span><span className="font-bold text-green-600">안전 (Low)</span></div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden"><div className="w-[10%] h-full bg-green-500 rounded-full" /></div>
              <p className="text-[10px] text-gray-400 pt-1">최근 업데이트: 방금 전</p>
            </div>
            <Button onClick={handleDeleteLabel} className="w-full bg-red-50 text-red-600 hover:bg-red-100 border-none h-10 text-sm"><Trash2 className="w-4 h-4 mr-2" /> 구역 삭제하기</Button>
          </div>
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate("/homes")} className="flex items-center gap-2 text-foreground/70 hover:text-foreground"><ChevronLeft className="w-5 h-5" /><span className="text-sm">목록</span></button>
          <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-primary animate-pulse" /><h2 className="text-foreground text-sm">AI 오염 예측 (#{homeId})</h2></div>
          <button onClick={() => setShowConfig(!showConfig)} className="p-2 hover:bg-gray-100 rounded-full"><Settings2 className="w-5 h-5 text-gray-500" /></button>
        </div>
      </div>

      {showConfig && !isCreatingLabel && (
        <div className="absolute top-16 right-4 z-40 bg-white/90 backdrop-blur shadow-xl border border-gray-200 p-4 rounded-xl w-64 sm:w-72 text-xs space-y-4 max-w-[calc(100vw-2rem)]">
           <div className="flex justify-between items-center font-bold text-gray-700 pb-2 border-b border-gray-100">
            <span>🔧 화면/센서 보정</span>
            <div className="flex gap-1">
                <button onClick={handleResetConfig} className="p-1 hover:bg-gray-100 rounded"><RotateCcw className="w-3.5 h-3.5" /></button>
                <button onClick={handleSaveConfig} className="p-1 hover:bg-blue-50 rounded text-blue-600"><Save className="w-3.5 h-3.5" /></button>
            </div>
           </div>
           <div className="space-y-1"><label className="flex justify-between font-semibold text-blue-600">회전 <span>{mapConfig.modelRotationY}°</span></label><input type="range" min="-180" max="180" step="5" value={mapConfig.modelRotationY} onChange={(e)=>setMapConfig((p: MapConfig)=>({...p, modelRotationY: Number(e.target.value)}))} className="w-full h-2 bg-gray-200 rounded-lg accent-blue-600"/></div>
           <div className="space-y-1"><label className="flex justify-between font-semibold text-green-600">스케일 <span>{mapConfig.scale}</span></label><input type="range" min="0.1" max="3" step="0.1" value={mapConfig.scale} onChange={(e)=>setMapConfig((p: MapConfig)=>({...p, scale: Number(e.target.value)}))} className="w-full h-2 bg-gray-200 rounded-lg accent-green-600"/></div>
           <div className="space-y-1 pt-2 border-t border-gray-100"><label className="flex justify-between font-semibold text-green-600">센서 방향 <span>{mapConfig.dataRotateDeg}°</span></label><input type="range" min="0" max="360" step="10" value={mapConfig.dataRotateDeg} onChange={(e)=>setMapConfig((p: MapConfig)=>({...p, dataRotateDeg: Number(e.target.value)}))} className="w-full h-2 bg-gray-200 rounded-lg accent-green-600"/></div>
           <div className="space-y-1 pt-2 border-t border-gray-100">
            <div className="flex justify-between mb-1"><span className="text-gray-500">시작 위치 보정</span><span className="text-[9px] text-gray-400">({mapConfig.offsetX.toFixed(1)}, {mapConfig.offsetZ.toFixed(1)})</span></div>
            <div className="flex gap-2">
                <div className="flex-1"><input type="range" min="-10" max="10" step="0.1" value={mapConfig.offsetX} onChange={(e) => setMapConfig((p: MapConfig) => ({ ...p, offsetX: Number(e.target.value) }))} className="w-full h-1 bg-gray-200 rounded cursor-pointer accent-gray-500" /></div>
                <div className="flex-1"><input type="range" min="-10" max="10" step="0.1" value={mapConfig.offsetZ} onChange={(e) => setMapConfig((p: MapConfig) => ({ ...p, offsetZ: Number(e.target.value) }))} className="w-full h-1 bg-gray-200 rounded cursor-pointer accent-gray-500" /></div>
            </div>
          </div>
           <Button onClick={handleSaveConfig} className="w-full mt-2 h-7 text-xs">설정 저장</Button>
        </div>
      )}

      <Canvas shadows className="w-full h-full">
        <Suspense fallback={null}>
          <Scene 
            robotPosition={calibratedRobotPosition} 
            mapConfig={mapConfig} 
            isCreating={isCreatingLabel}
            onMapClick={handleMapClick}
            pendingPoints={pendingPoints}
            labels={labels}
            onLabelClick={(label) => setSelectedLabel(label)}
            selectedLabelId={selectedLabel?.id || null}
            cameraZoom={cameraZoom} 
          />
        </Suspense>
      </Canvas>

      <div className="absolute top-16 left-4 z-20 bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl px-3 py-2">
        <button className="flex items-center gap-2" onClick={() => setTimelineExpanded((v) => !v)}><Clock className="w-4 h-4 text-primary" /><span className="text-foreground text-xs font-medium">타임라인</span><ChevronUp className={`w-3 h-3 transition-transform ${timelineExpanded ? "" : "rotate-180"}`} /></button>
        {timelineExpanded && (
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 max-w-[200px] scrollbar-hide">
                {timelineEvents.length > 0 ? (
                    timelineEvents.map((event) => (<div key={event.id} className="flex-shrink-0 flex flex-col items-center p-2 rounded bg-gray-50 border border-gray-200"><event.icon className="w-3 h-3 text-gray-500" /></div>))
                ) : (
                    <span className="text-[10px] text-gray-400 p-1">이벤트 없음</span>
                )}
            </div>
        )}
      </div>

      <div className={`absolute bottom-0 left-0 right-0 z-20 bg-white/98 backdrop-blur-2xl border-t border-gray-200 rounded-t-3xl shadow-2xl transition-all duration-300 ${sheetExpanded ? "h-[60vh]" : "h-[70px]"}`}>
        <div className="max-w-md mx-auto h-full flex flex-col">
          <button onClick={() => setSheetExpanded((v) => !v)} className="flex flex-col items-center pt-2 pb-1 cursor-pointer w-full">
            <div className="w-12 h-1 rounded-full bg-gray-300 mb-3" />
            <div className="flex items-center justify-between w-full px-6"><div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /><h2 className="text-foreground text-sm font-semibold">AI 오염원 예측 요약</h2></div><ChevronUp className={`w-5 h-5 text-muted-foreground transition-transform ${sheetExpanded ? "" : "rotate-180"}`} /></div>
          </button>
          {sheetExpanded && (
            <div className="px-5 pb-6 pt-3 overflow-y-auto flex-1">
              {timelineEvents.length > 0 ? (
                  <div className="space-y-4">
                      {timelineEvents.map(evt => (
                          <div key={evt.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                              <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                                  <evt.icon className="w-5 h-5 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                  <div className="flex justify-between">
                                      <h4 className="font-bold text-sm text-gray-800">{evt.label}</h4>
                                      <span className="text-xs text-gray-400">{evt.time}</span>
                                  </div>
                                  <p className="text-xs text-gray-500">{evt.type} 감지됨</p>
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 space-y-2">
                    <Activity className="w-8 h-8 opacity-20" />
                    <p className="text-sm">현재 감지된 오염 예측 정보가 없습니다.</p>
                    {labels.length > 0 && <p className="text-xs text-gray-500">등록된 구역: {labels.length}개</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!isCreatingLabel && (
        <div className="absolute bottom-[90px] right-4 z-30 flex flex-col gap-3">
          <Button onClick={() => toast("청소 시작")} className="w-12 h-12 rounded-full bg-gradient-to-r from-[#A50034] to-[#C4003C] shadow-xl flex items-center justify-center p-0"><Play className="w-5 h-5 text-white" /></Button>
          <Button onClick={() => navigate(`/homes/${homeId}/labels`)} className="w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center p-0 border border-gray-200 hover:bg-gray-50 transition-colors"><List className="w-5 h-5 text-gray-800" /></Button>
        </div>
      )}

      <div className="absolute bottom-[90px] left-4 z-20 bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg border border-gray-100 flex items-center gap-2 sm:gap-3 max-w-[200px]">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isRobotOnline ? "bg-green-500 animate-pulse" : "bg-gray-300"}`} />
        <div className="flex flex-col truncate">
           <span className="text-[10px] sm:text-xs font-bold text-gray-800 truncate">{isRobotOnline ? (currentZone ? `${currentZone} 청소 중` : "이동 중") : "연결 대기 중"}</span>
           <span className="text-[8px] sm:text-[9px] text-gray-500 truncate">{isTrackerConnected ? "Connected (HTTP)" : "Offline"} · {accuracyText}</span>
        </div>
      </div>
    </div>
  );
}

export default AIPredictionDashboard;