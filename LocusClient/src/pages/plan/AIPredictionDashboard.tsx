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

// 소켓 클라이언트
import { io, Socket } from "socket.io-client";

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
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useRobotTracking } from "../../hooks/useRobotTracking";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { getLabelsAPI, createLabelAPI, deleteLabelAPI } from "../../api/labels";
import { getSensorEventsAPI, getPollutionPredictionsAPI } from "../../api/logs";
import { RoomLabel, SensorEvent, PollutionPrediction } from "../../api/types";

// 백엔드 주소
const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/** ====== Type Definitions ====== */

export interface TimelineEvent {
  id: string;
  time: string;
  type: "vision" | "audio" | "motion" | "system";
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isHighlighted: boolean;
  label: string;
  details?: {
    fullTime: string;
    zone?: string;
    duration?: number;
    rawPayload?: any;
  };
}

export type RobotPos = [number, number, number] | null;

export interface MapConfig {
  scale: number;
  dataRotateDeg: number;
  modelRotationY: number;
  offsetX: number;
  offsetZ: number;
}

/** ====== Helper Functions ====== */

const mapEventToTimeline = (evt: SensorEvent): TimelineEvent => {
  const payload = evt.payloadJson as any;
  const isCleaning = evt.subType === "CLEANING_COMPLETED";

  return {
    id: evt.id.toString(),
    time: new Date(evt.eventTime).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    icon: isCleaning
      ? Sparkles
      : evt.eventType === "VISION"
      ? Camera
      : evt.eventType === "AUDIO"
      ? Volume2
      : Activity,
    type: evt.eventType.toLowerCase() as any,
    isHighlighted: evt.severity === "CRITICAL",
    label: isCleaning
      ? `${payload?.zone || "구역"} 청소 완료`
      : evt.subType || evt.label?.name || "이벤트 감지",
    details: {
      fullTime: new Date(evt.eventTime).toLocaleString("ko-KR"),
      zone: payload?.zone,
      duration: payload?.duration_seconds,
      rawPayload: payload,
    },
  };
};

function isPointInPolygon(
  p: { x: number; z: number },
  polygon: { x: number; z: number }[]
) {
  let isInside = false;
  let minX = polygon[0].x,
    maxX = polygon[0].x;
  let minZ = polygon[0].z,
    maxZ = polygon[0].z;

  for (const point of polygon) {
    minX = Math.min(point.x, minX);
    maxX = Math.max(point.x, maxX);
    minZ = Math.min(point.z, minZ);
    maxZ = Math.max(point.z, maxZ);
  }
  if (p.x < minX || p.x > maxX || p.z < minZ || p.z > maxZ) return false;

  let j = polygon.length - 1;
  for (let i = 0; i < polygon.length; i++) {
    if (
      (polygon[i].z > p.z) !== (polygon[j].z > p.z) &&
      p.x <
        ((polygon[j].x - polygon[i].x) * (p.z - polygon[i].z)) /
          (polygon[j].z - polygon[i].z) +
          polygon[i].x
    ) {
      isInside = !isInside;
    }
    j = i;
  }
  return isInside;
}

/** ====== 3D Components ====== */

function RoomModel({
  onClick,
}: {
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
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
  if (position.some((p) => isNaN(p))) return null;
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.12, 32]} />
        <meshStandardMaterial
          color="#A50034"
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>
      <pointLight
        position={[0, 0.3, 0]}
        intensity={0.8}
        color="#ff0040"
        distance={1.5}
      />
    </group>
  );
}

function PolygonDraft({ points }: { points: [number, number, number][] }) {
  return (
    <group>
      {points.map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial
            color="#A50034"
            emissive="#A50034"
            emissiveIntensity={0.5}
          />
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
  selectedLabelId,
  showText,
  predictions,
}: {
  labels: RoomLabel[];
  onLabelClick: (label: RoomLabel) => void;
  selectedLabelId: number | null;
  showText: boolean;
  predictions: PollutionPrediction[];
}) {
  return (
    <group>
      {labels.map((label) => {
        if (!label.points || label.points.length === 0) return null;

        const points3D = label.points.map(
          (p) => [p.x, 0, p.z] as [number, number, number]
        );
        const closedPoints = [...points3D, points3D[0]];
        const centerX =
          label.points.reduce((sum, p) => sum + p.x, 0) / label.points.length;
        const centerZ =
          label.points.reduce((sum, p) => sum + p.z, 0) / label.points.length;
        const isSelected = label.id === selectedLabelId;

        const pred = predictions.find(
          (p) => String(p.labelId) === String(label.id)
        );
        const probability = pred ? pred.probability : 0;

        let color = "#4ade80";
        let fillColor = "#4ade80";
        let opacity = 0;

        if (probability >= 0.7) {
          color = "#ef4444";
          fillColor = "#ef4444";
          opacity = 0.5;
        } else if (probability >= 0.4) {
          color = "#f97316";
          fillColor = "#f97316";
          opacity = 0.3;
        }

        if (isSelected) {
          color = "#A50034";
          opacity = Math.max(opacity, 0.2);
        }

        const shape = useMemo(() => {
          const s = new THREE.Shape();
          if (label.points.length > 0) {
            s.moveTo(label.points[0].x, label.points[0].z);
            for (let i = 1; i < label.points.length; i++) {
              s.lineTo(label.points[i].x, label.points[i].z);
            }
          }
          return s;
        }, [label.points]);

        return (
          <group key={label.id}>
            <Line
              points={closedPoints}
              color={color}
              lineWidth={isSelected ? 5 : 3}
              opacity={1}
              transparent
              position={[0, 0.05, 0]}
            />

            {probability >= 0.4 && (
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                <shapeGeometry args={[shape]} />
                <meshBasicMaterial
                  color={fillColor}
                  transparent
                  opacity={opacity}
                  side={THREE.DoubleSide}
                  depthTest={false}
                />
              </mesh>
            )}

            {showText && !isSelected && (
              <Html
                position={[centerX, 0.5, centerZ]}
                center
                zIndexRange={[100, 0]}
              >
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onLabelClick(label);
                  }}
                  className={`px-2 py-1 bg-white/95 backdrop-blur-sm border-2 rounded-lg text-[10px] font-bold cursor-pointer shadow-md whitespace-nowrap hover:scale-110 transition-all flex items-center gap-1
                    ${
                      probability >= 0.7
                        ? "border-red-500 text-red-600 animate-pulse bg-red-50"
                        : probability >= 0.4
                        ? "border-orange-400 text-orange-600 bg-orange-50"
                        : "border-green-400 text-green-700"
                    }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      probability >= 0.7 ? "bg-red-500" : "bg-green-500"
                    }`}
                  ></div>
                  {label.name}
                  {probability >= 0.4 && (
                    <span className="text-[9px] font-normal ml-0.5">
                      ({(probability * 100).toFixed(0)}%)
                    </span>
                  )}
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
  cameraZoom,
  isSheetOpen,
  predictions,
}: {
  robotPosition: RobotPos;
  mapConfig: MapConfig;
  isCreating: boolean;
  onMapClick: (e: ThreeEvent<MouseEvent>) => void;
  pendingPoints: [number, number, number][];
  labels: RoomLabel[];
  onLabelClick: (label: RoomLabel) => void;
  selectedLabelId: number | null;
  cameraZoom: number;
  isSheetOpen: boolean;
  predictions: PollutionPrediction[];
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
      <hemisphereLight
        intensity={1.2}
        groundColor="#e0e0e0"
        color="#ffffff"
      />
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 10, 2]} intensity={1.0} castShadow />
      <Grid
        args={[40, 40]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#e5e5e5"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#d4d4d4"
        position={[0, -1.01, 0]}
      />

      <group rotation={[0, (mapConfig.modelRotationY * Math.PI) / 180, 0]}>
        <RoomModel onClick={isCreating ? onMapClick : undefined} />
        {robotPosition && <Robot position={robotPosition} />}

        <ExistingLabels
          labels={labels}
          onLabelClick={onLabelClick}
          selectedLabelId={selectedLabelId}
          showText={!isSheetOpen}
          predictions={predictions}
        />

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

  const defaultConfig: MapConfig = {
    modelRotationY: -5,
    dataRotateDeg: 240,
    scale: 0.5,
    offsetX: 0.0,
    offsetZ: 0.0,
  };

  const [mapConfig, setMapConfig] = useState<MapConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultConfig;
  });

  const [labels, setLabels] = useState<RoomLabel[]>([]);
  const [pendingPoints, setPendingPoints] = useState<
    [number, number, number][]
  >([]);
  const [newLabelName, setNewLabelName] = useState("");
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<RoomLabel | null>(null);
  const [currentZone, setCurrentZone] = useState<string | null>(null);
  const [cameraZoom, setCameraZoom] = useState(50);

  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [predictions, setPredictions] = useState<PollutionPrediction[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(
    null
  );

  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // 🔒 오버레이(모달/시트/설정 등) 열림 여부
  const isOverlayOpen =
    sheetExpanded ||
    showConfig ||
    !!selectedEvent ||
    isCreatingLabel ||
    showNameDialog ||
    !!selectedLabel;

  // 1️⃣ [초기 로드]
  useEffect(() => {
    if (!homeId) return;
    const fetchInitialData = async () => {
      try {
        const labelsData = await getLabelsAPI(homeId);
        setLabels(labelsData);

        const eventsData = await getSensorEventsAPI(homeId);
        setTimelineEvents(eventsData.map(mapEventToTimeline));

        const predData = await getPollutionPredictionsAPI(homeId);
        setPredictions(predData);
      } catch (error) {
        console.error("초기 데이터 로드 실패:", error);
      }
    };
    fetchInitialData();
  }, [homeId]);

  // 2️⃣ [실시간] Socket.IO
  useEffect(() => {
    if (!homeId) return;

    const socket: Socket = io(BACKEND_URL, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("🔌 Socket Connected");
      socket.emit("join_home", homeId);
    });

    socket.on("pollution_update", (newPredictions: PollutionPrediction[]) => {
      console.log("📡 오염 예측 수신:", newPredictions);
      setPredictions((prev) => {
        const updated = [...prev];
        newPredictions.forEach((newItem) => {
          const index = updated.findIndex(
            (p) => String(p.labelId) === String(newItem.labelId)
          );
          if (index !== -1) updated[index] = newItem;
          else updated.push(newItem);
        });
        return updated;
      });
    });

    socket.on("new_event", (newEvent: SensorEvent) => {
      console.log("📡 새 이벤트 수신:", newEvent);
      const timelineItem = mapEventToTimeline(newEvent);
      setTimelineEvents((prev) => [timelineItem, ...prev]);

      if (newEvent.subType === "CLEANING_COMPLETED") {
        toast.success(`🧹 ${timelineItem.details?.zone || "구역"} 청소 완료!`);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [homeId]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) setCameraZoom(40);
      else if (width < 1024) setCameraZoom(60);
      else setCameraZoom(90);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { robotPosition, isConnected: isTrackerConnected, accuracy } =
    useRobotTracking({
      serverUrl: BACKEND_URL,
      autoConnect: true,
    });

  const calibratedRobotPosition = useMemo((): RobotPos => {
    if (!robotPosition) return null;
    const [rawX, , rawZ] = robotPosition;
    if (typeof rawX !== "number" || typeof rawZ !== "number") return null;

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
    const foundLabel = labels.find((label) => {
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
    if (nextPoints.length === 4)
      setTimeout(() => setShowNameDialog(true), 200);
  };

  const handleSaveLabel = async () => {
    if (!homeId || pendingPoints.length !== 4 || !newLabelName) return;
    try {
      const pointsData = pendingPoints.map((p) => ({ x: p[0], z: p[2] }));
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
    if (!homeId) {
      toast.error("Home ID 없음");
      return;
    }
    if (!confirm(`'${selectedLabel.name}' 구역을 삭제하시겠습니까?`)) return;
    try {
      await deleteLabelAPI(homeId, selectedLabel.id);
      toast.success("삭제되었습니다.");
      setLabels(labels.filter((l) => l.id !== selectedLabel.id));
      setSelectedLabel(null);
    } catch (error) {
      console.error(error);
      toast.error("삭제 실패");
    }
  };

  const handleCancelCreate = () => {
    setPendingPoints([]);
    setShowNameDialog(false);
    setSearchParams({});
  };

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

  const isRobotOnline = calibratedRobotPosition !== null;
  const accuracyText = accuracy ? `±${accuracy.toFixed(3)}` : "±0.000";

  return (
    <div className="relative w-full h-screen bg-gray-50 overflow-hidden">
      {/* 라벨 생성 모달 */}
      {isCreatingLabel && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-[#A50034] text-white px-6 py-3 rounded-full shadow-xl flex flex-col items-center animate-in slide-in-from-top-4 w-[90%] max-w-sm text-center">
          <span className="font-bold text-sm">📍 라벨 생성 모드</span>
          <span className="text-xs opacity-90">
            {pendingPoints.length < 4
              ? `구역의 꼭짓점을 찍어주세요 (${pendingPoints.length}/4)`
              : "이름을 입력해주세요"}
          </span>
          <button
            onClick={handleCancelCreate}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 이름 입력 모달 */}
      {showNameDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              새 구역 이름
            </h3>
            <input
              autoFocus
              type="text"
              placeholder="예: 거실"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-[#A50034] outline-none mb-4 text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCancelCreate}
                className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                취소
              </Button>
              <Button
                onClick={handleSaveLabel}
                className="flex-1 bg-[#A50034] hover:bg-[#8b002c]"
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 라벨 선택 모달 */}
      {selectedLabel && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in px-4"
          onClick={() => setSelectedLabel(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedLabel(null)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedLabel.name}
                </h3>
                <span className="text-xs text-gray-500">
                  Zone ID: {selectedLabel.id}
                </span>
              </div>
            </div>
            <Button
              onClick={handleDeleteLabel}
              className="w-full bg-red-50 text-red-600 hover:bg-red-100 border-none h-10 text-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" /> 구역 삭제하기
            </Button>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate("/homes")}
            className="flex items-center gap-2 text-foreground/70 hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">목록</span>
          </button>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary animate-pulse" />
            <h2 className="text-foreground text-sm">AI 오염 예측 (#{homeId})</h2>
          </div>
          {/* 설정 버튼 */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Settings2 className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* 설정 패널 */}
      {showConfig && !isCreatingLabel && (
        <div className="absolute top-16 right-4 z-40 bg-white/90 backdrop-blur shadow-xl border border-gray-200 p-4 rounded-xl w-64 sm:w-72 text-xs space-y-4 max-w-[calc(100vw-2rem)]">
          <div className="flex justify-between items-center font-bold text-gray-700 pb-2 border-b border-gray-100">
            <span>🔧 화면/센서 보정</span>
            <div className="flex gap-1">
              <button
                onClick={handleResetConfig}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleSaveConfig}
                className="p-1 hover:bg-blue-50 rounded text-blue-600"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 집 회전 (Map) */}
          <div className="space-y-1">
            <label className="flex justify-between font-semibold text-blue-600">
              집 회전 (Map) <span>{mapConfig.modelRotationY}°</span>
            </label>
            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              value={mapConfig.modelRotationY}
              onChange={(e) =>
                setMapConfig((p: MapConfig) => ({
                  ...p,
                  modelRotationY: Number(e.target.value),
                }))
              }
              className="w-full h-2 bg-gray-200 rounded-lg accent-blue-600"
            />
          </div>

          {/* 센서 방향 (Dir) */}
          <div className="space-y-1">
            <label className="flex justify-between font-semibold text-green-600">
              센서 방향 (Dir) <span>{mapConfig.dataRotateDeg}°</span>
            </label>
            <input
              type="range"
              min="0"
              max="360"
              step="10"
              value={mapConfig.dataRotateDeg}
              onChange={(e) =>
                setMapConfig((p: MapConfig) => ({
                  ...p,
                  dataRotateDeg: Number(e.target.value),
                }))
              }
              className="w-full h-2 bg-gray-200 rounded-lg accent-green-600"
            />
          </div>

          {/* 이동 비율 (Scale) */}
          <div className="space-y-1">
            <label className="flex justify-between font-semibold text-green-600">
              이동 비율 (Scale) <span>{mapConfig.scale.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.01"
              value={mapConfig.scale}
              onChange={(e) =>
                setMapConfig((p: MapConfig) => ({
                  ...p,
                  scale: Number(e.target.value),
                }))
              }
              className="w-full h-2 bg-gray-200 rounded-lg accent-green-600"
            />
          </div>

          {/* 시작 위치 보정 (Offset) */}
          <div className="space-y-1 pt-2 border-t border-gray-100">
            <div className="flex justify-between mb-1">
              <span className="text-gray-500">시작 위치 보정</span>
              <span className="text-[9px] text-gray-400">
                ({mapConfig.offsetX.toFixed(1)}, {mapConfig.offsetZ.toFixed(1)})
              </span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 flex flex-col">
                <span className="text-[9px] text-gray-400 mb-1">X 이동</span>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={mapConfig.offsetX}
                  onChange={(e) =>
                    setMapConfig((p: MapConfig) => ({
                      ...p,
                      offsetX: Number(e.target.value),
                    }))
                  }
                  className="w-full h-1 bg-gray-200 rounded cursor-pointer accent-gray-500"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <span className="text-[9px] text-gray-400 mb-1">Z 이동</span>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={mapConfig.offsetZ}
                  onChange={(e) =>
                    setMapConfig((p: MapConfig) => ({
                      ...p,
                      offsetZ: Number(e.target.value),
                    }))
                  }
                  className="w-full h-1 bg-gray-200 rounded cursor-pointer accent-gray-500"
                />
              </div>
            </div>
          </div>
          <Button onClick={handleSaveConfig} className="w-full mt-2 h-7 text-xs">
            설정 저장
          </Button>
        </div>
      )}

      {/* 3D 캔버스 */}
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
            isSheetOpen={isOverlayOpen} // 🔥 오버레이 열리면 라벨 텍스트 숨김
            predictions={predictions}
          />
        </Suspense>
      </Canvas>

      {/* 좌측 상단 타임라인 */}
      <div className="absolute top-16 left-4 z-20 flex flex-col items-start gap-2">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-xl px-3 py-2 transition-all">
          <button
            className="flex items-center gap-2"
            onClick={() => setTimelineExpanded((v) => !v)}
          >
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-foreground text-xs font-medium">
              청소/이벤트 기록
            </span>
            <ChevronUp
              className={`w-3 h-3 transition-transform ${
                timelineExpanded ? "" : "rotate-180"
              }`}
            />
          </button>
          {timelineExpanded && !isOverlayOpen && (
            <div className="mt-3 flex flex-col gap-2 max-h-[200px] overflow-y-auto w-[200px] scrollbar-thin">
              {timelineEvents.length > 0 ? (
                timelineEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 transition-colors text-left group border border-transparent hover:border-blue-100"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        event.type === "system"
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <event.icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-xs font-bold text-gray-700 truncate group-hover:text-blue-700">
                        {event.label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {event.time}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <span className="text-[10px] text-gray-400 p-2 text-center">
                  기록 없음
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 이벤트 상세 팝업 */}
      {selectedEvent && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-in fade-in"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-[320px] relative border border-gray-100 transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mb-3">
                <selectedEvent.icon className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                {selectedEvent.label}
              </h3>
              <p className="text-xs text-gray-500">
                {selectedEvent.details?.fullTime}
              </p>
            </div>
            {selectedEvent.details?.duration ? (
              <div className="space-y-3">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-medium">
                    청소 구역
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    {selectedEvent.details.zone}
                  </span>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-medium">
                    소요 시간
                  </span>
                  <span className="text-sm font-bold text-gray-800">
                    {Math.floor(selectedEvent.details.duration / 60)}분{" "}
                    {selectedEvent.details.duration % 60}초
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-center mt-4 text-xs text-green-600 bg-green-50 py-2 rounded-lg">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>성공적으로 완료됨</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[100px] flex items-center justify-center text-xs text-gray-400">
                추가 상세 정보가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 하단 오염 예측 시트 */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 bg-white/98 backdrop-blur-2xl border-t border-gray-200 rounded-t-3xl shadow-2xl transition-all duration-300 ${
          sheetExpanded ? "h-[60vh]" : "h-[70px]"
        }`}
      >
        <div className="max-w-md mx-auto h-full flex flex-col">
          <button
            onClick={() => setSheetExpanded((v) => !v)}
            className="flex flex-col items-center pt-2 pb-1 cursor-pointer w-full"
          >
            <div className="w-12 h-1 rounded-full bg-gray-300 mb-3" />
            <div className="flex items-center justify-between w-full px-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="text-foreground text-sm font-semibold">
                  AI 오염원 예측 요약
                </h2>
              </div>
              <ChevronUp
                className={`w-5 h-5 text-muted-foreground transition-transform ${
                  sheetExpanded ? "" : "rotate-180"
                }`}
              />
            </div>
          </button>
          {sheetExpanded && (
            <div className="px-5 pb-6 pt-3 overflow-y-auto flex-1">
              {predictions.length > 0 ? (
                <div className="space-y-4">
                  {predictions.map((pred) => (
                    <div
                      key={pred.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div
                        className={`w-10 h-10 rounded-full border flex items-center justify-center ${
                          pred.probability > 0.7
                            ? "bg-red-50 border-red-200 text-red-600"
                            : "bg-green-50 border-green-200 text-green-600"
                        }`}
                      >
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-sm text-gray-800">
                            {pred.label?.name || "알 수 없는 구역"}
                          </h4>
                          <span className="text-xs text-gray-400">
                            {new Date(
                              pred.predictionTime
                            ).toLocaleTimeString("ko-KR")}
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pred.probability > 0.7
                                ? "bg-red-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${pred.probability * 100}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-right mt-1 font-medium text-gray-600">
                          오염 확률 {(pred.probability * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-400 space-y-2">
                  <Activity className="w-8 h-8 opacity-20" />
                  <p className="text-sm">현재 오염 예측 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!isCreatingLabel && (
        <div className="absolute bottom-[90px] right-4 z-30 flex flex-col gap-3">
          <Button
            onClick={() => toast("청소 시작")}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-[#A50034] to-[#C4003C] shadow-xl flex items-center justify-center p-0"
          >
            <Play className="w-5 h-5 text-white" />
          </Button>
          <Button
            onClick={() => navigate(`/homes/${homeId}/labels`)}
            className="w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center p-0 border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <List className="w-5 h-5 text-gray-800" />
          </Button>
        </div>
      )}

      <div className="absolute bottom-[90px] left-4 z-20 bg-white/90 backdrop-blur-md rounded-full px-3 py-1.5 shadow-lg border border-gray-100 flex items-center gap-2 sm:gap-3 max-w-[200px]">
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            isRobotOnline ? "bg-green-500 animate-pulse" : "bg-gray-300"
          }`}
        />
        <div className="flex flex-col truncate">
          <span className="text-[10px] sm:text-xs font-bold text-gray-800 truncate">
            {isRobotOnline
              ? currentZone
                ? `${currentZone} 청소 중`
                : "이동 중"
              : "연결 대기 중"}
          </span>
          <span className="text-[8px] sm:text-[9px] text-gray-500 truncate">
            {isTrackerConnected ? "Connected (HTTP)" : "Offline"} ·{" "}
            {accuracyText}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AIPredictionDashboard;
