/**
 * GPS 좌표를 3D 공간 좌표로 변환하는 유틸리티
 * + 칼만 필터로 노이즈 제거
 */
export interface GPSCoordinate {
    latitude: number;
    longitude: number;
}
export interface Position3D {
    x: number;
    y: number;
    z: number;
}
/**
 * GPS 좌표를 3D 좌표로 변환 (기본 - 필터 없음)
 *
 * @param gps GPS 좌표 (위도, 경도)
 * @returns 3D 좌표 (x, y, z) in meters
 */
export declare function gpsTo3D(gps: GPSCoordinate): Position3D;
/**
 * GPS 좌표를 3D 좌표로 변환 + 칼만 필터 적용 ⭐
 *
 * @param gps GPS 좌표
 * @param accuracy GPS 정확도 (미터) - 선택적
 * @returns 필터링된 3D 좌표
 */
export declare function gpsTo3DSmooth(gps: GPSCoordinate, accuracy?: number): Position3D;
/**
 * GPS 좌표를 3D 좌표로 변환 + Moving Average 필터 ⭐
 *
 * @param gps GPS 좌표
 * @returns 평균화된 3D 좌표
 */
export declare function gpsTo3DAverage(gps: GPSCoordinate): Position3D;
/**
 * 칼만 필터 + Moving Average 병합 (최고 품질) ⭐⭐⭐
 *
 * @param gps GPS 좌표
 * @param accuracy GPS 정확도 (미터)
 * @returns 이중 필터링된 3D 좌표
 */
export declare function gpsTo3DHybrid(gps: GPSCoordinate, accuracy?: number): Position3D;
/**
 * 3D 좌표를 GPS 좌표로 역변환 (디버깅용)
 */
export declare function position3DToGPS(position: Position3D): GPSCoordinate;
/**
 * 기준점 업데이트
 */
export declare function updateReferencePoint(newReference: GPSCoordinate): void;
/**
 * 현재 기준점 조회
 */
export declare function getReferencePoint(): GPSCoordinate;
/**
 * 모든 필터 초기화
 */
export declare function resetFilters(): void;
/**
 * 두 GPS 좌표 간의 거리 계산 (미터)
 * Haversine formula 사용
 */
export declare function calculateDistance(coord1: GPSCoordinate, coord2: GPSCoordinate): number;
/**
 * GPS 정확도 평가
 */
export declare function evaluateAccuracy(accuracy: number): 'excellent' | 'good' | 'fair' | 'poor';
//# sourceMappingURL=coordinateConverter.d.ts.map