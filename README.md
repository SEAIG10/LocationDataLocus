🏠 LOCUS (Location Data Service)

LG ThinQ와 함께하는 스마트 홈 케어 플랫폼 > 로봇 청소기의 실시간 위치 추적 및 AI 오염 예측 대시보드


📖 프로젝트 소개 (Project Overview)

LOCUS는 공간 데이터(Spatial Data)를 활용하여 스마트 홈 경험을 혁신하는 웹 애플리케이션입니다.
사용자는 자신의 집을 3D로 시각화하여 관리하고, 로봇 청소기의 실시간 위치를 추적하며, AI가 분석한 오염 예측 정보를 통해 효율적인 청소 계획을 수립할 수 있습니다.

🛠 기술 스택 (Tech Stack)

Frontend (/LocusClient)

Core: React, TypeScript, Vite

Styling: Tailwind CSS

3D Visualization: Three.js, @react-three/fiber, @react-three/drei

State & Routing: React Router DOM, Axios

UI Components: Lucide React (Icons)

Backend (/LocusBackend)

Runtime: Node.js

Framework: Fastify

Database: PostgreSQL

ORM: Prisma

Authentication: JWT (JSON Web Token)

File Handling: @fastify/multipart (Image Upload)

✨ 주요 기능 (Key Features)

1. 🔐 인증 및 사용자 관리 (Authentication)

이메일 기반 회원가입 및 로그인.

JWT 토큰 기반의 보안 인증.

비밀번호 암호화 (Bcrypt).

2. 🏠 홈 관리 (Home Management)

홈 생성: 사진 업로드와 함께 나만의 홈(공간) 생성.

홈 목록: 내가 소유하거나 소속된 홈 리스트 조회 (이미지 썸네일 포함).

홈 삭제: 소유자 권한 확인 후 안전한 삭제 기능.

3. 🗺️ 3D 대시보드 & 라벨링 (3D Dashboard & Labeling)

3D 공간 시각화: Room.glb 모델을 활용한 인터랙티브 3D 뷰어.

화면 보정: 집의 회전, 크기, 센서 방향 등을 실시간으로 조정하고 저장.

구역(Label) 생성: 3D 맵 위를 직접 클릭하여 다각형(Polygon) 구역 지정.

라벨 관리: 생성된 구역 이름 설정 및 삭제 기능.

4. 🤖 로봇 실시간 추적 (Real-time Tracking)

실시간 위치 표시: 로봇 청소기의 좌표를 받아 3D 맵 위에 매핑.

현재 위치 판별: Point-in-Polygon 알고리즘을 통해 로봇이 현재 어느 방(Zone)에 있는지 실시간 계산 및 표시.

상태 모니터링: 연결 상태 및 센서 정확도 표시.

🚀 실행 가이드 (Getting Started)

사전 요구사항 (Prerequisites)

Node.js (v18 이상 권장)

Docker (PostgreSQL 데이터베이스 실행용)

1. 백엔드 설정 (Backend Setup)

# 1. 백엔드 폴더로 이동
cd LocusBackend

# 2. 패키지 설치
npm install

# 3. 데이터베이스 실행 (Docker)
docker-compose up -d

# 4. Prisma 스키마 반영
npx prisma db push
npx prisma generate

# 5. 서버 실행 (Port: 4000)
npm run dev


2. 프론트엔드 설정 (Frontend Setup)

# 1. 프론트엔드 폴더로 이동
cd LocusClient

# 2. 패키지 설치
npm install

# 3. 개발 서버 실행 (Port: 5173)
npm run dev


Note: 모바일 등 외부 기기에서 접속하려면 LocusClient/src/api/client.ts의 baseURL을 본인 PC의 IP 주소(예: http://192.168.x.x:4000/api)로 변경해야 합니다.

📂 폴더 구조 (Directory Structure)

LocationDataLocus/
├── LocusBackend/           # 백엔드 (API Server)
│   ├── prisma/             # DB 스키마 및 설정
│   ├── src/
│   │   ├── modules/        # 기능별 모듈 (Auth, Homes, Labels, Users)
│   │   ├── config/         # 환경 변수 및 DB 설정
│   │   ├── app.ts          # Fastify 앱 설정
│   │   └── server.ts       # 서버 엔트리 포인트
│   └── uploads/            # 업로드된 이미지 저장소
│
└── LocusClient/            # 프론트엔드 (React App)
    ├── public/             # 정적 파일 (3D 모델 Room.glb 등)
    ├── src/
    │   ├── api/            # API 호출 함수 모음
    │   ├── components/     # 재사용 UI 컴포넌트
    │   ├── hooks/          # 커스텀 훅 (로봇 트래킹 등)
    │   ├── pages/          # 페이지 단위 컴포넌트
    │   │   ├── auth/       # 로그인, 회원가입
    │   │   ├── home/       # 홈 목록, 생성
    │   │   ├── plan/       # 3D 대시보드
    │   │   └── label/      # 라벨 리스트
    │   └── App.tsx         # 라우팅 설정


🤝 Contributing

이 프로젝트는 개인 학습 및 포트폴리오 목적으로 개발되었습니다. 이슈나 개선 사항은 Issue 탭에 남겨주세요.

📝 License

This project is licensed under the MIT License.
