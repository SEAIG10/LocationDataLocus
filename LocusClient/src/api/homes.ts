import { client } from './client';
import type { Home } from './types'; // types.ts의 Home 인터페이스 사용

// 타입 재정의 (필요하다면 유지, 아니면 위 Home을 바로 써도 됩니다)
export type HomeData = Home;

// 내 홈 목록 조회
export const getMyHomesAPI = async () => {
  const response = await client.get<Home[]>('/homes');
  return response.data;
};

// 홈 삭제
export const deleteHomeAPI = async (homeId: string) => {
  await client.delete(`/homes/${homeId}`);
};

// 특정 홈 상세 조회
export const getHomeDetailAPI = async (homeId: string) => {
  const response = await client.get<Home>(`/homes/${homeId}`);
  return response.data;
};

// 🔥 새 홈 생성 (이미지 업로드 지원을 위해 FormData 사용)
export const createHomeAPI = async (name: string, addressLine: string, imageFile?: File, modelFile?: File) => {
  const formData = new FormData();
  
  // 텍스트 데이터 추가
  formData.append('name', name);
  if (addressLine) {
    formData.append('addressLine', addressLine);
  }
  
  // 이미지 파일 추가 (파일이 있을 때만)
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  if (modelFile) {
    formData.append('model', modelFile);
  }

  // Content-Type: multipart/form-data 헤더 설정
  const response = await client.post<Home>('/homes', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};