import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Check } from "lucide-react";
import { registerAPI } from "../../api/auth"; // 방금 만든 API 함수 import

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // 1. 입력값 상태 관리
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 약관 동의 상태
  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
    marketing: false,
  });

  const handleAllCheck = () => {
    const newValue = !agreements.all;
    setAgreements({
      all: newValue,
      terms: newValue,
      privacy: newValue,
      marketing: newValue,
    });
  };

  const handleCheck = (key: keyof typeof agreements) => {
    const newAgreements = { ...agreements, [key]: !agreements[key] };
    const allChecked =
      newAgreements.terms && newAgreements.privacy && newAgreements.marketing;
    setAgreements({ ...newAgreements, all: allChecked });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 2. 유효성 검사
    if (!name || !email || !password) {
      alert("모든 필수 정보를 입력해주세요.");
      return;
    }
    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!agreements.terms || !agreements.privacy) {
      alert("필수 약관(이용약관, 개인정보 처리방침)에 동의해주세요.");
      return;
    }

    try {
      setLoading(true);
      
      // 3. 백엔드 API 호출
      await registerAPI(email, password, name);
      
      alert("회원가입이 완료되었습니다! 로그인해주세요.");
      navigate("/"); // 로그인 화면으로 이동

    } catch (error: any) {
      console.error("회원가입 에러:", error);
      const errorMessage = error.response?.data?.message || "회원가입 중 오류가 발생했습니다.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F8] p-4">
      <div className="w-full max-w-[400px] flex flex-col items-center">
        
        {/* 헤더 */}
        <div className="w-full bg-[#A50034] rounded-t-3xl p-8 pb-12 text-center text-white relative shadow-lg">
          <div className="flex justify-between items-center mb-1">
             <span className="text-xs font-medium opacity-80">9:41</span>
             <div className="flex gap-1.5 opacity-80">
                <div className="w-3 h-3 bg-white rounded-full opacity-60"></div>
                <div className="w-3 h-3 bg-white rounded-full opacity-60"></div>
             </div>
          </div>
          <h1 className="text-4xl font-bold mt-4 tracking-tight">LOCUS</h1>
          <p className="text-xs opacity-80 mt-2 font-medium">LG ThinQ와 함께하는</p>
          <p className="text-lg font-bold mt-1">회원가입</p>
        </div>

        {/* 메인 폼 */}
        <div className="w-full bg-white rounded-3xl shadow-xl -mt-6 p-8 relative z-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 ml-1">이름</label>
              <input
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#A50034] transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 ml-1">이메일</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#A50034] transition-all placeholder:text-gray-400"
                />
                <button type="button" className="bg-[#545F71] hover:bg-[#404b5c] text-white text-xs font-medium px-4 rounded-xl transition-colors whitespace-nowrap">
                  중복확인
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 ml-1">비밀번호</label>
              <input
                type="password"
                placeholder="8자리 이상 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#A50034] transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 ml-1">비밀번호 확인</label>
              <input
                type="password"
                placeholder="비밀번호 재입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:border-[#A50034] transition-all placeholder:text-gray-400"
              />
            </div>

            {/* 약관 동의 */}
            <div className="pt-4 pb-2">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer pb-2 border-b border-gray-200">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${agreements.all ? 'bg-[#A50034] border-[#A50034]' : 'bg-white border-gray-300'}`}>
                    {agreements.all && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={agreements.all} onChange={handleAllCheck} />
                  <span className="text-sm font-bold text-gray-800">전체 동의</span>
                </label>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${agreements.terms ? 'bg-[#A50034] border-[#A50034]' : 'bg-white border-gray-300'}`}>
                        {agreements.terms && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={agreements.terms} onChange={() => handleCheck('terms')} />
                      <span className="text-xs text-gray-600">이용약관 동의<span className="text-[#A50034]">(필수)</span></span>
                    </label>
                    <button type="button" className="text-[10px] text-gray-400 underline">보기</button>
                  </div>

                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${agreements.privacy ? 'bg-[#A50034] border-[#A50034]' : 'bg-white border-gray-300'}`}>
                        {agreements.privacy && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={agreements.privacy} onChange={() => handleCheck('privacy')} />
                      <span className="text-xs text-gray-600">개인정보 처리방침 동의<span className="text-[#A50034]">(필수)</span></span>
                    </label>
                    <button type="button" className="text-[10px] text-gray-400 underline">보기</button>
                  </div>

                  <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${agreements.marketing ? 'bg-[#A50034] border-[#A50034]' : 'bg-white border-gray-300'}`}>
                        {agreements.marketing && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <input type="checkbox" className="hidden" checked={agreements.marketing} onChange={() => handleCheck('marketing')} />
                      <span className="text-xs text-gray-600">마케팅 정보 수신 동의(선택)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-[#A50034] hover:bg-[#8B002C] text-white font-bold text-sm shadow-lg shadow-[#A50034]/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "가입 처리 중..." : "다음"}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
             이미 계정이 있으신가요?{" "}
             <button onClick={() => navigate("/")} className="text-[#A50034] font-bold hover:underline ml-1">
               로그인
             </button>
          </div>
          
          <div className="mt-8 text-center text-[10px] text-gray-300 font-medium">
             Powered by LG Electronics
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;