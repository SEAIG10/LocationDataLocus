import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreVertical, ChevronRight, MapPin, Zap, Home, Wifi, Battery, Trash2 } from "lucide-react";
import { getMyHomesAPI, deleteHomeAPI, HomeData } from "../../api/homes";

interface HomeUIItem extends HomeData {
  status: "active" | "away";
  imageUrl: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [homes, setHomes] = useState<HomeUIItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const bgImages = [
    "https://images.unsplash.com/photo-1600596542815-e3289cab72f9?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=600",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=600",
  ];

  useEffect(() => {
    loadHomes();
  }, []);

  const loadHomes = async () => {
    try {
      setLoading(true);
      const data = await getMyHomesAPI();
      const mappedHomes: HomeUIItem[] = data.map((home, index) => {
        const BACKEND_URL = "http://localhost:4000"; 
        const displayImage = home.imageUrl 
          ? `${BACKEND_URL}${home.imageUrl}` 
          : bgImages[index % bgImages.length];

        return {
          ...home,
          status: "active",
          imageUrl: displayImage,
          deviceCount: home.deviceCount || 0,
          addressLine: home.addressLine || "주소 미설정"
        };
      });
      setHomes(mappedHomes);
    } catch (error) {
      console.error("홈 목록 불러오기 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHome = async (homeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("정말로 이 홈을 삭제하시겠습니까?")) {
      try {
        await deleteHomeAPI(homeId);
        setHomes(homes.filter(h => h.id !== homeId));
        setOpenMenuId(null);
      } catch (error) {
        alert("삭제에 실패했습니다.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#A50034] flex flex-col items-center" onClick={() => setOpenMenuId(null)}>
      
      {/* 상단 헤더 */}
      <div className="w-full max-w-md text-white z-0 relative">
        <div className="px-6 pt-4 pb-2 flex justify-between items-center text-xs opacity-90">
        </div>
        <div className="px-8 mt-4 mb-8">
          <h1 className="text-3xl font-bold tracking-tight">홈 선택</h1>
          <p className="text-sm text-white/80 mt-1.5 font-medium">관리할 홈을 선택하세요</p>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="w-full flex-1 bg-[#F4F6F8] rounded-t-[2.5rem] relative z-10 flex flex-col items-center">
        <div className="w-full max-w-md px-5 pb-10 flex flex-col">
          
          <div className="-mt-7 mb-6 flex justify-center">
            <button 
              onClick={() => navigate("/homes/create")}
              className="w-full bg-[#C4003C] hover:bg-[#b00035] text-white rounded-2xl py-4 shadow-xl shadow-[#A50034]/20 flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" /> 새로운 홈 추가
            </button>
          </div>

          <div className="space-y-5">
            {loading ? (
              <div className="animate-pulse space-y-4"><div className="h-48 bg-gray-200 rounded-3xl"/><div className="h-48 bg-gray-200 rounded-3xl"/></div>
            ) : homes.length === 0 ? (
              <div className="text-center py-10 text-gray-400"><Home className="w-12 h-12 mx-auto mb-2 opacity-20" /><p>등록된 홈이 없습니다.</p></div>
            ) : (
              homes.map((home) => (
                <div
                  key={home.id}
                  onClick={() => navigate(`/homes/${home.id}/dashboard`)}
                  className="group relative h-48 rounded-3xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] transition-all bg-white"
                >
                  {/* 🔥 수정된 부분: url('') 안에 따옴표 추가! */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url('${home.imageUrl}')` }} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90" />

                  {/* 상태 뱃지 */}
                  <div className="absolute top-5 left-5">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold backdrop-blur-xl border border-white/10 bg-green-500/90 text-white">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" /> 활성화
                    </div>
                  </div>

                  {/* 더보기 버튼 */}
                  <div className="absolute top-5 right-5">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === home.id ? null : home.id); }}
                      className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/40 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenuId === home.id && (
                      <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-xl overflow-hidden z-20 animate-in fade-in zoom-in duration-200">
                        <button onClick={(e) => handleDeleteHome(home.id, e)} className="w-full px-4 py-3 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2">
                          <Trash2 className="w-3.5 h-3.5" /> 삭제하기
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 하단 정보 */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-between items-end">
                    <div className="text-white">
                      <h3 className="text-xl font-bold mb-1.5 leading-tight">{home.name}</h3>
                      <div className="flex flex-col gap-1 text-xs text-gray-300 font-medium">
                        <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400" />{home.addressLine}</div>
                        <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-gray-400" />{home.deviceCount}개 기기 연결됨</div>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#A50034] transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-6 bg-white rounded-2xl p-5 flex items-start gap-4 border border-gray-200 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#FFF0F5] flex items-center justify-center flex-shrink-0 text-[#A50034]"><Home className="w-5 h-5" /></div>
            <div><h4 className="text-sm font-bold text-gray-800 mb-1">여러 홈을 관리하세요</h4><p className="text-xs text-gray-500 leading-relaxed">집, 사무실, 별장 등 여러 장소의 스마트 기기를 하나의 앱으로 편리하게 관리할 수 있습니다.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;