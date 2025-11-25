import { client } from './client';
import type { LoginResponse, RegisterResponse, User } from './types';

// 1. 로그인 API
// 이메일과 비밀번호를 받아 토큰과 유저 정보를 반환합니다.
export const loginAPI = async (email: string, password: string) => {
  // POST /api/auth/login
  const response = await client.post<LoginResponse>('/auth/login', { 
    email, 
    password 
  });
  return response.data;
};

// 2. 회원가입 API
// 이메일, 비밀번호, 이름을 받아 유저를 생성합니다.
export const registerAPI = async (email: string, password: string, name: string) => {
  // POST /api/auth/register
  const response = await client.post<RegisterResponse>('/auth/register', { 
    email, 
    password, 
    name 
  });
  return response.data;
};

// 3. 내 정보 조회 API (선택 사항)
// 새로고침 시 토큰이 유효한지 확인하거나, 최신 유저 정보를 받아올 때 사용합니다.
export const getMeAPI = async () => {
  // GET /api/auth/me
  const response = await client.get<User>('/auth/me');
  return response.data;
};