// src/App.tsx
import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import CreateHomePage from "./pages/home/CreateHomePage";
import { AIPredictionDashboard } from "./pages/plan/AIPredictionDashboard";
import LabelListPage from "./pages/label/LabelListPage"; 
import RegisterPage from "./pages/auth/RegisterPage";
import LoginPage from "./pages/auth/LoginPage";


const PlanPageWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <AIPredictionDashboard onBack={() => navigate(-1)} />;
};

const App: React.FC = () => {
  return (
    <Routes>
      
        {/* 1. 인증 관련 */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* 2. 홈(Home) 관련 */}
        <Route path="/homes" element={<HomePage />} />
        <Route path="/homes/create" element={<CreateHomePage />} />

        {/* 3. 대시보드 (Dashboard) - 🔥 이 경로가 핵심입니다! */}
        <Route path="/homes/:homeId/dashboard" element={<AIPredictionDashboard />} />

        {/* 4. 라벨 관리 (Label) */}
        <Route path="/homes/:homeId/labels" element={<LabelListPage />} />

    </Routes>
  );
};

export default App;
