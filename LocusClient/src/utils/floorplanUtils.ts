// -------- 1. RoomPlan 원본 타입들 --------
export interface RoomWall {
  dimensions?: number[]; // [length, height, thickness]
  transform?: number[]; // 4x4 column-major matrix
  identifier?: string;
  [key: string]: any;
}

export interface RoomObject {
  dimensions?: number[]; // [width, height, length]
  transform?: number[];
  identifier?: string;
  category?: Record<string, unknown> | string;
  [key: string]: any;
}

export interface RoomOpening {
  dimensions?: number[]; // [width, height, depth]
  transform?: number[];
  identifier?: string;
  category?: Record<string, unknown> | string; // "door", "window" 등
  [key: string]: any;
}

export interface RoomFloor {
  dimensions?: number[];
  transform?: number[];
  polygonCorners?: number[][]; // [x, y, z][]
  identifier?: string;
  [key: string]: any;
}

export interface RoomData {
  walls?: RoomWall[];
  objects?: RoomObject[];
  openings?: RoomOpening[]; // door / window 등
  floors?: RoomFloor[]; // 바닥
  sections?: any[];
  [key: string]: any;
}

// -------- 2. 2D로 변환된 타입들 --------
export interface Wall2D {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface ObjectCorner2D {
  x: number;
  y: number;
}

export interface Object2D {
  id: string;
  corners: ObjectCorner2D[];
  category?: Record<string, unknown> | string;
}

export interface ViewTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

// -------- 3. 유틸리티 함수들 --------

// ---------- 공통: 4x4 transform 적용 (column-major) ----------
export function applyTransform(
  m: number[],
  p: [number, number, number]
): { x: number; y: number; z: number } {
  const [x, y, z] = p;

  if (!m || m.length < 16) {
    return { x, y, z };
  }

  const xw = m[0] * x + m[4] * y + m[8] * z + m[12];
  const yw = m[1] * x + m[5] * y + m[9] * z + m[13];
  const zw = m[2] * x + m[6] * y + m[10] * z + m[14];

  return { x: xw, y: yw, z: zw };
}

// ---------- 벽 2D 선분 추출 ----------
export function make2DWalls(roomData: RoomData | null | undefined): Wall2D[] {
  const walls = roomData?.walls ?? [];
  if (!walls.length) return [];

  return walls.map((wall, idx): Wall2D => {
    const dims = wall.dimensions ?? [0, 0, 0];
    const length = dims[0] ?? 0;

    const t = wall.transform;
    if (!t || t.length < 16 || !length) {
      return {
        id: wall.identifier ?? `wall-${idx}`,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
      };
    }

    const half = length / 2;
    const p0 = applyTransform(t, [-half, 0, 0]);
    const p1 = applyTransform(t, [half, 0, 0]);

    return {
      id: wall.identifier ?? `wall-${idx}`,
      x1: p0.x,
      y1: p0.z,
      x2: p1.x,
      y2: p1.z,
    };
  });
}

// ---------- 가구/오브젝트 2D 사각형 추출 ----------
export function make2DObjects(roomData: RoomData | null | undefined): Object2D[] {
  const objects = roomData?.objects ?? [];
  if (!objects.length) return [];

  return objects.map((obj, idx): Object2D => {
    const dims = obj.dimensions ?? [0, 0, 0];
    const width = dims[0] ?? 0;
    const length = dims[2] ?? 0; // [width, height, length]

    const t = obj.transform;
    if (!t || t.length < 16 || !width || !length) {
      return {
        id: obj.identifier ?? `obj-${idx}`,
        corners: [],
        category: obj.category,
      };
    }

    const hx = width / 2;
    const hz = length / 2;

    const localCorners: [number, number, number][] = [
      [-hx, 0, -hz],
      [hx, 0, -hz],
      [hx, 0, hz],
      [-hx, 0, hz],
    ];

    const corners: ObjectCorner2D[] = localCorners.map((c) => {
      const w = applyTransform(t, c);
      return { x: w.x, y: w.z };
    });

    return {
      id: obj.identifier ?? `obj-${idx}`,
      corners,
      category: obj.category,
    };
  });
}

// ---------- 문/창문 2D 사각형 추출 ----------
export function make2DOpenings(roomData: RoomData | null | undefined): Object2D[] {
  const openings = roomData?.openings ?? [];
  if (!openings.length) return [];

  return openings.map((op, idx): Object2D => {
    const dims = op.dimensions ?? [0, 0, 0];
    const width = dims[0] ?? 0;
    const depth = dims[2] ?? 0.08; // [width, height, depth], depth가 0일 수 있으므로 fallback

    const t = op.transform;
    if (!t || t.length < 16 || !width || !depth) {
      return {
        id: op.identifier ?? `op-${idx}`,
        corners: [],
        category: op.category,
      };
    }

    const hx = width / 2;
    const hz = depth / 2;

    const localCorners: [number, number, number][] = [
      [-hx, 0, -hz],
      [hx, 0, -hz],
      [hx, 0, hz],
      [-hx, 0, hz],
    ];

    const corners: ObjectCorner2D[] = localCorners.map((c) => {
      const w = applyTransform(t, c);
      return { x: w.x, y: w.z };
    });

    return {
      id: op.identifier ?? `op-${idx}`,
      corners,
      category: op.category,
    };
  });
}

// ---------- 스케일/좌표 변환 (모든 요소 고려) ----------
export function computeTransform(
  walls: Wall2D[],
  objects: Object2D[],
  openings: Object2D[],
  width: number,
  height: number,
  padding = 16
): ViewTransform {
  const wallXs = walls.flatMap((w) => [w.x1, w.x2]);
  const wallYs = walls.flatMap((w) => [w.y1, w.y2]);
  const objXs = objects.flatMap((o) => o.corners.map((c) => c.x));
  const objYs = objects.flatMap((o) => o.corners.map((c) => c.y));
  const openingXs = openings.flatMap((o) => o.corners.map((c) => c.x));
  const openingYs = openings.flatMap((o) => o.corners.map((c) => c.y));

  const xs = [...wallXs, ...objXs, ...openingXs];
  const ys = [...wallYs, ...objYs, ...openingYs];

  if (!xs.length || !ys.length) {
    return { scale: 1, offsetX: width / 2, offsetY: height / 2 };
  }

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const worldWidth = maxX - minX || 1;
  const worldHeight = maxY - minY || 1;

  const sx = (width - 2 * padding) / worldWidth;
  const sy = (height - 2 * padding) / worldHeight;
  const scale = Math.min(sx, sy);

  const offsetX = padding - minX * scale;
  const offsetY = padding + maxY * scale;

  return { scale, offsetX, offsetY };
}

// ---------- 뷰포트 좌표 변환 ----------
export function toViewPoint(
  x: number,
  y: number,
  transform: ViewTransform
): { vx: number; vy: number } {
  const { scale, offsetX, offsetY } = transform;
  const vx = x * scale + offsetX;
  const vy = -y * scale + offsetY;
  return { vx, vy };
}

// -------- SVG 좌표 → 월드 좌표 역변환 (라벨 클릭용) --------
export function fromViewPoint(
  vx: number,
  vy: number,
  transform: ViewTransform
): { x: number; y: number } {
  const { scale, offsetX, offsetY } = transform;
  const x = (vx - offsetX) / scale;
  const y = -(vy - offsetY) / scale;
  return { x, y };
}

// -------- Room.json 원본에서 RoomData 추출 --------
export function fromRoomJson(raw: any): RoomData {
  // RoomPlan 포맷이 보통 { rooms: [ ... ] } 꼴이라 첫 번째 방을 기본으로 사용
  const room = raw?.rooms?.[0] ?? raw;

  return {
    walls: room.walls ?? [],
    objects: room.objects ?? [],
    openings: room.openings ?? [],
    floors: room.floors ?? [],
    sections: room.sections ?? [],
  };
}