import { prisma } from '../../config/db';

export const createLabel = async (homeId: string, name: string, points: any[]) => {
  
  // 1. 라벨 메타데이터 생성
  const label = await prisma.roomLabel.create({
    data: {
      homeId: parseInt(homeId),
      name,
      labelType: 'ROOM',
      // robotMapId는 스키마에서 Optional로 수정했으므로 생략 가능 (null로 들어감)
    }
  });

  // 2. 좌표 점 저장 (핵심!)
  if (points && points.length > 0) {
    // Promise.all로 병렬 처리하여 속도 향상
    await Promise.all(points.map((p, index) => 
      prisma.roomLabelPolygonPoint.create({
        data: {
          labelId: label.id, // 방금 만든 라벨 ID 연결
          orderIndex: index, // 순서 저장
          x: parseFloat(p.x), // 좌표값 (문자열일 경우 대비해 parseFloat)
          z: parseFloat(p.z)
        }
      })
    ));
  }

  return label;
};

export const getHomeLabels = async (homeId: string) => {
  const labels = await prisma.roomLabel.findMany({
    where: { homeId: parseInt(homeId) },
    include: { 
      points: {
        orderBy: { orderIndex: 'asc' } // 점들을 순서대로 가져오기
      } 
    }
  });
  
  return labels.map(label => ({
    ...label,
    id: label.id.toString(),
    homeId: label.homeId.toString(),
  }));
};

export const deleteLabel = async (labelId: string) => {
  return await prisma.roomLabel.delete({
    where: { id: parseInt(labelId) }
  });
};