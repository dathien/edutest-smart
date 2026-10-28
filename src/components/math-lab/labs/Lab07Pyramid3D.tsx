import React, { useMemo } from 'react';
import { Geometry3DEngine, PolyhedronData } from '../engines/Geometry3DEngine';
import { ParameterControls, ParameterPreset } from '../engines/ParameterControls';
import { LabActivity } from '../types';
import { Pyramid, Box } from 'lucide-react';

interface Lab07Pyramid3DProps {
  activity: LabActivity;
  params: Record<string, number>;
  onParamChange: (paramId: string, val: number) => void;
  onResetParams: () => void;
  disabled?: boolean;
}

export const Lab07Pyramid3D: React.FC<Lab07Pyramid3DProps> = ({
  activity,
  params,
  onParamChange,
  onResetParams,
  disabled = false,
}) => {
  const height = params.height ?? 4;
  const baseWidth = params.baseWidth ?? 4;
  const baseDepth = params.baseDepth ?? 3;
  const apexShiftX = params.apexShiftX ?? 0;

  // Base Vertices centered around Oxy origin
  const halfW = baseWidth / 2;
  const halfD = baseDepth / 2;

  // S.ABCD base: A(-w/2, -d/2), B(w/2, -d/2), C(w/2, d/2), D(-w/2, d/2)
  const baseVertices: [number, number, number][] = useMemo(() => {
    return [
      [-halfW, -halfD, 0],
      [halfW, -halfD, 0],
      [halfW, halfD, 0],
      [-halfW, halfD, 0],
    ];
  }, [halfW, halfD]);

  // Apex S: (apexShiftX, 0, height)
  const apex: [number, number, number] = useMemo(() => {
    return [apexShiftX, 0, height];
  }, [apexShiftX, height]);

  // Altitude foot H
  const altitudeFoot: [number, number, number] = useMemo(() => {
    return [apexShiftX, 0, 0];
  }, [apexShiftX]);

  // Base Area
  const baseArea = baseWidth * baseDepth;

  // Volume: V = 1/3 * S * h
  const volume = (1 / 3) * baseArea * height;

  // Polyhedron data for 3D engine
  const polyhedron: PolyhedronData = useMemo(() => {
    return {
      type: 'pyramid',
      apex,
      baseVertices,
      color: '#6366f1',
      showAltitude: true,
      altitudeFoot,
    };
  }, [apex, baseVertices, altitudeFoot]);

  // Presets
  const presets: ParameterPreset[] = [
    {
      label: 'Chóp chữ nhật: a = 4, b = 3, h = 4 (V = 16)',
      description: 'Ví dụ SGK cơ bản',
      params: { height: 4, baseWidth: 4, baseDepth: 3, apexShiftX: 0 },
    },
    {
      label: 'Chóp đều đáy vuông: a = 4, b = 4, h = 5',
      description: 'Chóp tứ giác đều S.ABCD',
      params: { height: 5, baseWidth: 4, baseDepth: 4, apexShiftX: 0 },
    },
    {
      label: 'Chóp xiên: Đỉnh lệch Δx = 2',
      description: 'Chân đường cao H không trùng tâm đáy',
      params: { height: 4, baseWidth: 4, baseDepth: 3, apexShiftX: 2 },
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
      {/* 3D Canvas */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Pyramid className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Khối chóp S.ABCD trong không gian
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
              V = {volume.toFixed(2)} đvtt
            </span>
          </div>
        </div>

        <Geometry3DEngine
          polyhedron={polyhedron}
          showGrid={true}
          showAxes={true}
          axesSize={6}
          height={460}
        />
      </div>

      {/* Right Controls */}
      <div className="lg:col-span-5 space-y-4">
        <ParameterControls
          parameters={activity.parameters}
          values={params}
          onChange={onParamChange}
          onReset={onResetParams}
          presets={presets}
          onApplyPreset={(p) => {
            Object.entries(p.params).forEach(([k, v]) => onParamChange(k, v));
          }}
          disabled={disabled}
        />

        {/* Calculations Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
            THÔNG SỐ HÌNH HỌC VÀ THỂ TÍCH
          </h4>

          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Diện tích đáy S_đáy</span>
                <span className="font-bold font-mono text-slate-800 text-sm">
                  {baseArea.toFixed(2)} ({baseWidth} × {baseDepth})
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Chiều cao h = SH</span>
                <span className="font-bold font-mono text-rose-600 text-sm">
                  h = {height.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-indigo-600 font-semibold block text-[11px]">Thể tích khối chóp:</span>
                <span className="text-[11px] text-slate-600">V = 1/3 · S_đáy · h</span>
              </div>
              <span className="font-bold font-mono text-indigo-900 text-lg">
                {volume.toFixed(2)}
              </span>
            </div>

            <p className="text-slate-500 text-[11px] italic pt-1">
              Đường nét đứt màu đỏ SH là đường cao hạ từ đỉnh S vuông góc với mặt phẳng đáy (ABCD).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
