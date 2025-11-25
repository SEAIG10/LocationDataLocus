# 🏠 LOCUS (Location Data Service)

LG ThinQ 기반 스마트 홈 케어 플랫폼  
**로봇 청소기 실시간 위치 추적 + AI 오염 예측 + 3D Floorplan**

---

## 📖 프로젝트 소개 (Project Overview)

**LOCUS**는 공간 데이터와 AI를 기반으로 집 안의 구조와 로봇 청소기의 이동을 실시간으로 추적하고,  
3D Floorplan 위에서 시각화하며, 오염 발생 지역을 사전에 예측하는 스마트 홈 서비스입니다.

---

## 🛠 기술 스택 (Tech Stack)

### **Frontend – `/LocusClient`**
- React, TypeScript, Vite  
- Tailwind CSS  
- Three.js / React Three Fiber / Drei  
- Axios  
- React Router  

### **Backend – `/LocusBackend`**
- Node.js (Fastify)  
- PostgreSQL + Prisma ORM  
- JWT Auth  
- File Upload (Multipart)  

### **Mobile Tracker – `/LocusTrackerExpo`**
- React Native / Expo  
- GPS & IMU 기반 위치 전송  
- Axios + Background Task  

---

## ✨ 주요 기능 (Key Features)

### 🔐 인증 시스템
- 이메일 회원가입 / 로그인  
- JWT 기반 인증  
- 비밀번호 해싱 (bcrypt)

### 🏠 홈 관리
- 사진 업로드 + 집 생성  
- 여러 개의 홈을 생성/조회  
- 권한 기반 홈 삭제  

### 🗺️ 3D 대시보드 & 라벨링
- Room.glb 로드 / 실시간 렌더링  
- 다각형(Polygon) 기반 Zone 라벨  
- 라벨 CRUD  
- 회전/크기/보정 UI  

### 🤖 로봇 실시간 추적
- WebSocket 기반 실시간 좌표 수신  
- Point-in-Polygon으로 현재 위치 판별  
- 방 진입/이탈 로그  

---

# 🚀 Getting Started

---

## **1. Backend Setup**

```bash
cd LocusBackend
npm install
docker-compose up -d   # PostgreSQL 실행
npx prisma db push
npx prisma generate
npm run dev   # http://localhost:4000
```

---

## **2. Frontend Setup**

```bash
cd LocusClient
npm install
npm run dev   # http://localhost:5173
```

### 📌 휴대폰 접속 시 주의사항
`src/api/client.ts` 수정:

```ts
baseURL: "http://192.168.x.x:4000/api";
```

---

## **3. Mobile (Expo) Setup**

```bash
cd LocusTrackerExpo
npm install
npx expo start
```

- Expo Go 앱 → QR 코드 스캔
- 위치 정보가 Backend `/tracking` 엔드포인트로 전송됨

---

# 📂 Folder Structure

```
LocationDataLocus
├── LocusBackend/
│   ├── prisma/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── homes/
│   │   │   ├── labels/
│   │   │   └── users/
│   │   ├── config/
│   │   ├── app.ts
│   │   └── server.ts
│   └── uploads/
│
├── LocusClient/
│   ├── public/
│   │   └── Room.glb
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── App.tsx
│
└── LocusTrackerExpo/
    ├── App.js
    ├── screens/
    └── utils/
```

---

# 📊 Data Flow Overview

```mermaid
flowchart LR
    A[Mobile Tracker (Expo)] -->|GPS/IMU Data| B[LocusBackend]
    B -->|Real-time API| C[LocusClient (3D UI)]
    C -->|Label CRUD| B
    B -->|Home/Label DB| D[(PostgreSQL)]
```

---

# 🧠 Future Work

- Matter & Thread 기반 IoT 연동  
- 멀티모달 오염 예측 AI (YOLO + YAMNet + 위치 데이터)  
- App Store / Google Play 리뷰 자동 분석 파이프라인  
- 청소 스케줄 자동 추천 모델  
- 3D SLAM 기반 자동 Floorplan 생성  

---

# 🤝 Contributing
Pull Request & Issue 환영합니다.

---

# 📝 License
MIT License
