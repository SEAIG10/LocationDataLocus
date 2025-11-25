import { FastifyReply, FastifyRequest } from 'fastify';
import * as homesService from './homes.service';
import { prisma } from '../../config/db'; // 🔥 추가됨: prisma 인스턴스 import

// 집 생성 핸들러
export async function createHomeHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const parts = request.body as any;
    const user = request.user as { id: string };

    const name = parts.name?.value || parts.name; 
    const addressLine = parts.addressLine?.value || parts.addressLine;
    const imageFile = parts.image;

    if (!name) {
        return reply.code(400).send({ message: "홈 이름은 필수입니다." });
    }

    const home = await homesService.createHome(user.id, name, addressLine, imageFile);
    
    return reply.code(201).send(home);
  } catch (e: any) {
    console.error(e);
    return reply.code(400).send({ message: e.message });
  }
}

// 내 집 목록 조회 핸들러
export async function getMyHomesHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const user = request.user as { id: string };
    const homes = await homesService.getUserHomes(user.id);
    return reply.code(200).send(homes);
  } catch (e: any) {
    return reply.code(400).send({ message: e.message });
  }
}

// 집 상세 조회 핸들러
export async function getHomeDetailHandler(
    request: FastifyRequest<{ Params: { id: string }}>,
    reply: FastifyReply
) {
    try {
        const user = request.user as { id: string };
        const homeId = request.params.id;
        const home = await homesService.getHomeDetail(homeId, user.id);
        return reply.code(200).send(home);
    } catch (e: any) {
        return reply.code(403).send({ message: e.message });
    }
}

// 🔥 홈 삭제 핸들러 (권한 체크 포함)
export async function deleteHomeHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params;
    const user = request.user as { id: string };

    // 1. 소유권 확인 (내가 주인인가?)
    const home = await prisma.home.findFirst({
      where: {
        id: parseInt(id),
        ownerId: parseInt(user.id)
      }
    });

    if (!home) {
      return reply.code(403).send({ message: "삭제 권한이 없거나 존재하지 않는 홈입니다." });
    }

    // 2. 삭제 수행
    await prisma.home.delete({
      where: { id: parseInt(id) }
    });

    return reply.code(200).send({ message: "성공적으로 삭제되었습니다." });
  } catch (e: any) {
    console.error(e);
    return reply.code(500).send({ message: "홈 삭제 중 오류가 발생했습니다." });
  }
}