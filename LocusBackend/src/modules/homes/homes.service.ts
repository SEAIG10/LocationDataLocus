import { prisma } from '../../config/db';
import fs from 'fs';
import path from 'path';

// pump, pipeline, util import는 더 이상 필요 없어서 삭제해도 됩니다.

export const createHome = async (userId: string, name: string, addressLine?: string, imageFile?: any) => {
  
  let imageUrl: string | null = null;

  if (imageFile) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filename = `${Date.now()}_${imageFile.filename}`;
    const savePath = path.join(uploadDir, filename);

    // 🔥 [수정] 스트림(pump) 대신 버퍼(toBuffer)로 저장 -> 파일 깨짐 방지
    const buffer = await imageFile.toBuffer();
    await fs.promises.writeFile(savePath, buffer);
    
    imageUrl = `/uploads/${filename}`;
  }

  const home = await prisma.home.create({
    data: {
      name,
      addressLine,
      imageUrl,
      ownerId: parseInt(userId),
    },
  });

  await prisma.homeMember.create({
    data: {
      homeId: home.id,
      userId: parseInt(userId),
      role: 'OWNER',
    },
  });

  return home;
};

export const getUserHomes = async (userId: string) => {
  const memberships = await prisma.homeMember.findMany({
    where: { userId: parseInt(userId), isActive: true },
    include: {
      home: {
        include: {
          _count: { select: { devices: true } },
        },
      },
    },
  });

  return memberships.map((m) => ({
    id: m.home.id.toString(),
    name: m.home.name,
    addressLine: m.home.addressLine,
    role: m.role,
    deviceCount: m.home._count.devices,
    imageUrl: m.home.imageUrl,
  }));
};

export const getHomeDetail = async (homeId: string, userId: string) => {
    const membership = await prisma.homeMember.findUnique({
        where: {
            homeId_userId: {
                homeId: parseInt(homeId),
                userId: parseInt(userId)
            }
        }
    });

    if (!membership) throw new Error("접근 권한이 없습니다.");

    const home = await prisma.home.findUnique({
        where: { id: parseInt(homeId) },
        include: {
            devices: true,
            roomLabels: true
        }
    });

    return home;
}