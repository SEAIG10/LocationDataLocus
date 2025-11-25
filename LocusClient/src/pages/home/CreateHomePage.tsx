import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Home, Scan, CheckCircle2, Camera, ImagePlus, X } from "lucide-react";
import { createHomeAPI } from "../../api/homes";

const CreateHomePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 🔥 [수정] 중복 제출 방지용 Ref
  const isSubmittingRef = useRef(false);

  const [step, setStep] = useState<"INPUT" | "SCANNING" | "COMPLETE">("INPUT");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(undefined);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (step === "SCANNING") {
      const interval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            // 🔥 [수정] 100%가 되자마자 바로 제출 함수 호출
            handleSubmit(); 
            return 100;
          }
          return prev + 2; 
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleSubmit = async () => {
    // 🔥 [수정] 이미 제출 중이면 함수 즉시 종료 (중복 생성 방지)
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      setLoading(true);
      await createHomeAPI(name, address, selectedImage);
      setStep("COMPLETE");
      setTimeout(() => navigate("/home"), 1500);
    } catch (error) {
      console.error("홈 생성 실패:", error);
      alert("홈 생성 중 오류가 발생했습니다.");
      setStep("INPUT");
      isSubmittingRef.current = false; // 실패 시 다시 제출 가능하도록
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col relative overflow-hidden">
      {/* 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-center text-gray-700 hover:bg-white transition-all">
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* STEP 1: 정보 입력 */}
      {step === "INPUT" && (
        <div className="flex-1 flex flex-col p-8 pt-24 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#A50034]">새로운 홈 시작하기</h1>
            <p className="text-gray-500 mt-2 text-sm">관리할 공간의 사진과 이름을 입력해주세요.</p>
          </div>

          <div className="space-y-6 flex-1">
            {/* 사진 업로드 UI */}
            <div className="flex justify-center mb-2">
              <div 
                className="relative w-full h-48 bg-gray-100 rounded-3xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#A50034] hover:bg-red-50 transition-all overflow-hidden group"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white w-8 h-8" /></div>
                    <button onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }} className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full text-white flex items-center justify-center hover:bg-red-600 transition-colors"><X className="w-4 h-4" /></button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3"><ImagePlus className="w-6 h-6 text-[#A50034]" /></div>
                    <span className="text-sm font-bold text-gray-600">대표 사진 추가하기</span>
                    <span className="text-xs text-gray-400 mt-1">터치하여 앨범에서 선택</span>
                  </>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
              </div>
            </div>

            {/* 입력 필드 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 ml-1">홈 이름 (별명)</label>
              <div className="relative"><Home className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" /><input type="text" placeholder="예: 우리집" value={name} onChange={(e) => setName(e.target.value)} className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white border border-gray-200 focus:border-[#A50034] focus:ring-1 focus:ring-[#A50034] transition-all outline-none" /></div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 ml-1">주소 (선택)</label>
              <div className="relative"><MapPin className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" /><input type="text" placeholder="예: 서울시 강남구" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white border border-gray-200 focus:border-[#A50034] focus:ring-1 focus:ring-[#A50034] transition-all outline-none" /></div>
            </div>
          </div>

          <button onClick={() => { if (!name) return alert("홈 이름을 입력해주세요."); setStep("SCANNING"); }} className="w-full bg-[#A50034] text-white h-14 rounded-2xl font-bold text-lg shadow-lg shadow-[#A50034]/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6">
            다음 <ChevronRightMini />
          </button>
        </div>
      )}

      {/* STEP 2 (SCANNING) */}
      {step === "SCANNING" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#A50034] text-white animate-in fade-in duration-500">
          <div className="relative w-64 h-64 mb-12"><div className="absolute inset-0 border-4 border-white/20 rounded-full animate-[ping_3s_ease-in-out_infinite]" /><div className="absolute inset-4 border-4 border-white/40 rounded-full" /><div className="absolute inset-0 flex items-center justify-center"><Scan className="w-20 h-20 text-white animate-pulse" /></div><div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent w-full h-full animate-[spin_4s_linear_infinite]" /></div>
          <h2 className="text-2xl font-bold mb-2">공간 구조 스캔 중...</h2>
          <div className="w-full max-w-xs bg-black/20 rounded-full h-2 mb-2 overflow-hidden"><div className="bg-white h-full rounded-full transition-all duration-100 ease-out" style={{ width: `${scanProgress}%` }} /></div>
        </div>
      )}

      {/* STEP 3 (COMPLETE) */}
      {step === "COMPLETE" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white animate-in zoom-in duration-300">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600"><CheckCircle2 className="w-12 h-12" /></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">홈 생성 완료!</h2>
        </div>
      )}
    </div>
  );
};
const ChevronRightMini = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>);
export default CreateHomePage;