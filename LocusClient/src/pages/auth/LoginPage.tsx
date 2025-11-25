import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
// 방금 만든 API 함수들을 import 합니다. 경로가 맞는지 확인해주세요.
import { loginAPI } from "../../api/auth";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  // 입력값과 로딩 상태 관리
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      
      // 1. 백엔드(Port 4000)로 로그인 요청
      const data = await loginAPI(email, password);
      
      console.log("로그인 성공:", data);

      // 2. 받은 토큰을 로컬 스토리지에 저장 (중요!)
      localStorage.setItem("accessToken", data.token);
      
      // 편의를 위해 유저 정보도 저장
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // 3. 홈 화면으로 이동
      navigate("/homes");

    } catch (error: any) {
      console.error("로그인 실패:", error);
      // 백엔드에서 보낸 에러 메시지가 있다면 띄워줍니다.
      const msg = error.response?.data?.message || "로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8] p-4">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#A50034] tracking-tight">LOCUS</h1>
          <p className="text-xs text-gray-400 mt-2 font-medium tracking-wide">
            LG ThinQ와 함께하는 스마트 경험
          </p>
        </div>

        {/* 폼 영역 */}
        <div className="w-full bg-white rounded-2xl shadow-xl border border-white/50 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 ml-1">이메일</label>
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#A50034] transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 ml-1">비밀번호</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#A50034] transition-all"
              />
            </div>

            <Button 
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#A50034] hover:bg-[#8B002C] text-white font-bold text-sm shadow-lg shadow-[#A50034]/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </form>

          {/* 간편 로그인 등 나머지 UI 유지 */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-gray-400 font-medium">또는 간편 로그인</span></div>
          </div>

          <div className="space-y-3">
            <button className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
               Google로 계속하기
            </button>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          계정이 없으신가요? <button className="text-[#A50034] font-bold hover:underline" onClick={() => navigate("/register")}>회원가입</button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;