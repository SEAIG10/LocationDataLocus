/**
 * 3D 좌표를 방 이름(zone)으로 변환하는 모듈
 * Room.json의 sections 정보를 사용하여 가장 가까운 방을 찾습니다.
 */
import { Position3D } from './types.js';
/**
 * 3D 좌표에서 가장 가까운 방(zone)을 찾습니다.
 *
 * @param position3D ARKit에서 받은 3D 좌표
 * @returns 방 이름 (예: "kitchen", "bedroom")
 */
export declare function detectZone(position3D: Position3D): string;
/**
 * 사용 가능한 모든 방 목록을 반환합니다.
 */
export declare function getAvailableZones(): string[];
/**
 * 특정 방의 중심 좌표를 반환합니다.
 */
export declare function getZoneCenter(zoneName: string): Position3D | null;
/**
 * Room.json 정보 요약 출력
 */
export declare function printRoomInfo(): void;
//# sourceMappingURL=zoneDetector.d.ts.map