// src/components/LabelEditor.tsx
import React, { useState } from "react";
import { Button } from "./ui/button";

interface LabelEditorProps {
  onClose: () => void;
  onSave: (label: { name: string; color?: string }) => void;
  onSelectPosition: (
    cb: (coords: { x: number; y: number; z: number }) => void,
  ) => void;
}

export const LabelEditor: React.FC<LabelEditorProps> = ({
  onClose,
  onSave,
  onSelectPosition,
}) => {
  const [name, setName] = useState("");

  const handleSelectPosition = () => {
    // 실제로는 여기서 onSelectPosition에 콜백 넘겨서, Scene에서 좌표 찍으면 돌아옴
    onSelectPosition((coords) => {
      console.log("선택된 좌표:", coords);
    });
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl">
        <h2 className="mb-3 text-base font-semibold">라벨 생성</h2>
        <div className="mb-3">
          <label className="mb-1 block text-xs text-gray-600">
            라벨 이름
          </label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 주방 식탁"
          />
        </div>

        <div className="mb-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleSelectPosition}
          >
            3D 구조도에서 위치 선택
          </Button>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </div>
      </div>
    </div>
  );
};
