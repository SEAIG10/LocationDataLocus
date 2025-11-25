import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Plus, Trash2, Tag } from "lucide-react";
import { Button } from "../../components/ui/button";
import { getLabelsAPI, deleteLabelAPI } from "../../api/labels";
import { RoomLabel } from "../../api/types";

const LabelListPage: React.FC = () => {
  const navigate = useNavigate();
  const { homeId } = useParams<{ homeId: string }>(); 
  
  const [labels, setLabels] = useState<RoomLabel[]>([]);
  const [loading, setLoading] = useState(true);

  const getColor = (name: string) => {
    if (name.includes("거실")) return "bg-blue-500";
    if (name.includes("주방")) return "bg-orange-500";
    if (name.includes("침실")) return "bg-purple-500";
    if (name.includes("욕실") || name.includes("화장실")) return "bg-emerald-500";
    return "bg-gray-500";
  };

  useEffect(() => {
    if (homeId) loadLabels();
  }, [homeId]);

  const loadLabels = async () => {
    if (!homeId) return;
    try {
      setLoading(true);
      const data = await getLabelsAPI(homeId);
      setLabels(data);
    } catch (error) {
      console.error("라벨 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 [수정] 생성 버튼 클릭 시 대시보드로 이동 (좌표를 찍기 위해)
  const handleGoToCreate = () => {
    if (!homeId) return;
    // action=create 파라미터를 붙여서 이동
    navigate(`/homes/${homeId}/dashboard?action=create`);
  };

  const handleDeleteLabel = async (labelId: string) => {
    if (!confirm("이 라벨을 삭제하시겠습니까?")) return;
    try {
      await deleteLabelAPI(labelId);
      setLabels(labels.filter(l => l.id !== labelId));
    } catch (error) {
      alert("삭제 실패");
    }
  };

  const formatPoints = (points: { x: number; z: number }[]) => {
    if (!points || points.length === 0) return "(좌표 없음)";
    const center = points[0];
    return `(${center.x.toFixed(1)}, 1.5, ${center.z.toFixed(1)})`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-10 px-4">
      <div className="w-full max-w-md mb-6 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-gray-900"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          뒤로
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#A50034]" />
            <h2 className="font-bold text-gray-800">라벨 관리</h2>
          </div>
        </div>

        <div className="p-4 bg-gray-50/50">
          <Button 
            onClick={handleGoToCreate} // 🔥 변경된 핸들러 연결
            className="w-full bg-[#A50034] hover:bg-[#8b002c] text-white rounded-lg py-6 shadow-md flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />구조도에서 새 라벨 추가
          </Button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-xs text-gray-400 font-medium mb-2">
            등록된 구역 목록 ({labels.length})
          </p>
          
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm animate-pulse">데이터 불러오는 중...</div>
          ) : labels.length === 0 ? (
            <div className="text-center py-10 text-gray-300 text-sm">
              등록된 라벨이 없습니다.<br/>위 버튼을 눌러 맵에서 추가해보세요.
            </div>
          ) : (
            labels.map((label) => {
              const colorClass = getColor(label.name);
              return (
                <div key={label.id} className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-[#A50034]/30 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${colorClass} shadow-sm`} />
                      <div>
                        <h3 className="font-bold text-gray-800">{label.name}</h3>
                        <span className="text-xs text-gray-400 font-mono">{formatPoints(label.points)}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteLabel(label.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
                     <div className="flex gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${colorClass}`}></div>
                        <div className={`w-1.5 h-1.5 rounded-full ${colorClass} opacity-60`}></div>
                        <div className={`w-1.5 h-1.5 rounded-full ${colorClass} opacity-30`}></div>
                     </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default LabelListPage;