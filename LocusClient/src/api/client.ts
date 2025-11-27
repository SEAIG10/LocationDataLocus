import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: `${API_URL}/api`,
});


// 1. Axios 인스턴스 생성
// 백엔드 주소(4000번 포트)를 기본 URL로 설정합니다.
export const client = axios.create({
  baseURL: `${API_URL}/api`, // Fastify 백엔드 주소
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5초 타임아웃 (네트워크가 너무 느리면 끊음)
});

// 2. 요청 인터셉터 (Request Interceptor)
// API 요청을 보낼 때마다 자동으로 실행됩니다.
client.interceptors.request.use(
  (config) => {
    // 로컬 스토리지에서 토큰을 꺼냅니다.
    const token = localStorage.getItem('accessToken');
    
    // 토큰이 있다면 헤더에 실어서 보냅니다.
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. 응답 인터셉터 (Response Interceptor) - 선택 사항
// 백엔드 응답을 받았을 때 공통적으로 처리할 에러 로직을 넣습니다.
client.interceptors.response.use(
  (response) => {
    // 정상 응답은 그대로 반환
    return response;
  },
  (error) => {
    // 401 Unauthorized 에러 (토큰 만료 등) 발생 시 처리
    if (error.response && error.response.status === 401) {
      console.warn('인증 세션이 만료되었습니다. 로그아웃 처리가 필요할 수 있습니다.');
      // 필요하다면 여기서 강제 로그아웃 로직 추가 가능
      // localStorage.removeItem('accessToken');
      // window.location.href = '/'; 
    }
    return Promise.reject(error);
  }
);