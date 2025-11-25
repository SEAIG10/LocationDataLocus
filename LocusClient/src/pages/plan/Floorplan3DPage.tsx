// src/pages/plan/Floorplan3DPage.tsx
import React, { useState } from "react";
import Floorplan3DView from "../../components/floorplan/Floorplan3DView";
import { RoomLabel } from "../../types";
import { useRobotTracking } from "../../hooks/useRobotTracking";

const Floorplan3DPage: React.FC = () => {
  const { robotPosition } = useRobotTracking({
    serverUrl: "https://1942e3ed6782.ngrok-free.app", // 너 서버 주소로 변경
    autoConnect: true,
  });

  const [labels, setLabels] = useState<RoomLabel[]>([]);
  const [clickedCorners, setClickedCorners] = useState<[number, number][]>([]);
  const [selectedLabel, setSelectedLabel] = useState<RoomLabel | null>(null);
  const [robotCurrentRoom, setRobotCurrentRoom] = useState<string | null>(null);

  // TODO: 여기서 isPointInPolygon 써서 robotCurrentRoom 계산하면 됨

  return (
    <div className="page floorplan-3d-page">
      <header className="page-header">
        <h1>3D Floorplan</h1>
        <span className="sub">AI 오염원 예측 대시보드</span>
      </header>

      <main className="page-content">
        <Floorplan3DView
          isEditMode={false}
          labels={labels}
          clickedCorners={clickedCorners}
          onAddLabel={(pos) => {
            console.log("새 라벨 위치", pos);
            // TODO: 라벨 생성 모달 열고 setLabels로 추가
          }}
          onEditLabel={(id) => {
            console.log("라벨 수정", id);
            // TODO: 수정 모달
          }}
          onDeleteLabel={(id) => {
            console.log("라벨 삭제", id);
            // TODO: setLabels로 삭제
          }}
          robotPosition={robotPosition}
          selectedLabel={selectedLabel}
          onSelectLabel={setSelectedLabel}
          robotCurrentRoom={robotCurrentRoom}
        />
      </main>
    </div>
  );
};

export default Floorplan3DPage;
