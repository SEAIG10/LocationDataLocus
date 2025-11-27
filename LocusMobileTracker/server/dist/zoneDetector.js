/**
 * 3D 좌표를 방 이름(zone)으로 변환하는 모듈
 * Room.json의 sections 정보를 사용하여 가장 가까운 방을 찾습니다.
 */
import roomData from '../../../LocusClient/src/Room.json' assert { type: 'json' };
/**
 * 3D 좌표에서 가장 가까운 방(zone)을 찾습니다.
 *
 * @param position3D ARKit에서 받은 3D 좌표
 * @returns 방 이름 (예: "kitchen", "bedroom")
 */
export function detectZone(position3D) {
    const { x, y, z } = position3D;
    const sections = roomData.sections;
    if (!sections || sections.length === 0) {
        console.warn('⚠️  Room.json에 sections 정보가 없습니다.');
        return 'unknown';
    }
    let nearestZone = 'unknown';
    let minDistance = Infinity;
    // 각 방의 중심점과의 거리를 계산
    for (const section of sections) {
        const [cx, cy, cz] = section.center;
        // 3D 유클리드 거리 계산
        const distance = Math.sqrt(Math.pow(x - cx, 2) +
            Math.pow(y - cy, 2) +
            Math.pow(z - cz, 2));
        // 가장 가까운 방 찾기
        if (distance < minDistance) {
            minDistance = distance;
            nearestZone = section.label;
        }
    }
    // 거리가 너무 멀면 (5m 이상) unknown 처리
    if (minDistance > 5.0) {
        console.warn(`⚠️  가장 가까운 방(${nearestZone})까지 거리: ${minDistance.toFixed(2)}m (너무 멈)`);
        return 'unknown';
    }
    return nearestZone;
}
/**
 * 사용 가능한 모든 방 목록을 반환합니다.
 */
export function getAvailableZones() {
    const sections = roomData.sections;
    return sections.map(section => section.label);
}
/**
 * 특정 방의 중심 좌표를 반환합니다.
 */
export function getZoneCenter(zoneName) {
    const sections = roomData.sections;
    const section = sections.find(s => s.label === zoneName);
    if (!section) {
        return null;
    }
    const [x, y, z] = section.center;
    return { x, y, z };
}
/**
 * Room.json 정보 요약 출력
 */
export function printRoomInfo() {
    const sections = roomData.sections;
    console.log('\n📍 Room.json 정보:');
    console.log(`  총 ${sections.length}개 방:`);
    sections.forEach(section => {
        const [x, y, z] = section.center;
        console.log(`    - ${section.label}: (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`);
    });
    console.log();
}
//# sourceMappingURL=zoneDetector.js.map