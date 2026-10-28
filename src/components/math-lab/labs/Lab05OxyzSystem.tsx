import React, { useMemo } from 'react';
import { Geometry3DEngine, Point3DData } from '../engines/Geometry3DEngine';
import { ParameterControls, ParameterPreset } from '../engines/ParameterControls';
import { LabActivity } from '../types';
import { Box, Compass } from 'lucide-react';

interface Lab05OxyzSystemProps {
  activity: LabActivity;
  params: Record<string, number>;
  onParamChange: (paramId: string, val: number) => void;
  onResetParams: () => void;
  disabled?: boolean;
}

export const Lab05OxyzSystem: React.FC<Lab05OxyzSystemProps> = ({
  activity,
  params,
  onParamChange,
  onResetParams,
  disabled = false,
}) => {
  const x = params.x ?? 2;
  const y = params.y ?? 3;
  const z = params.z ?? 4;

  // Length |OM|
  const lengthOM = useMemo(() => {
    return Math.sqrt(x * x + y * y + z * z);
  }, [x, y, z]);

  // Direction cosines
  const cosAlpha = useMemo(() => (lengthOM > 0.001 ? x / lengthOM : 0), [x, lengthOM]);
  const cosBeta = useMemo(() => (lengthOM > 0.001 ? y / lengthOM : 0), [y, lengthOM]);
  const cosGamma = useMemo(() => (lengthOM > 0.001 ? z / lengthOM : 0), [z, lengthOM]);

  // Presets
  const presets: ParameterPreset[] = [
    {
      label: 'Điểm M(2, 3, 4) (|OM| = √29 ≈ 5.39)',
      description: 'Ví dụ bài học SGK Toán 12 chuẩn',
      params: { x: 2, y: 3, z: 4 },
    },
    {
      label: 'Điểm M(3, 4, 0) (Thuộc mặt Oxy)',
      description: 'Cao độ z = 0',
      params: { x: 3, y: 4, z: 0 },
    },
    {
      label: 'Điểm M(0, 0, 5) (Nằm trên trục Oz)',
      description: 'x = 0, y = 0',
      params: { x: 0, y: 0, z: 5 },
    },
    {
      label: 'Điểm M(-3, 2, 4) (Hoành độ âm)',
      description: 'Nằm ở góc phần tám khác',
      params: { x: -3, y: 2, z: 4 },
    },
  ];

  // 3D Point Data
  const points3D: Point3DData[] = useMemo(() => {
    return [
      {
        id: 'point-M',
        x,
        y,
        z,
        label: 'M',
        color: '#6366f1',
        radius: 0.32,
        showProjections: true,
        showVectorOM: true,
      },
    ];
  }, [x, y, z]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
      {/* 3D WebGL Canvas */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Không gian Oxyz & Hộp hình chiếu
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
              M({x}, {y}, {z}) → |OM| = {lengthOM.toFixed(3)}
            </span>
          </div>
        </div>

        <Geometry3DEngine
          points={points3D}
          showGrid={true}
          showAxes={true}
          axesSize={7}
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

        {/* Analytical Projections Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 flex items-center justify-between">
            <span>TỌA ĐỘ CÁC HÌNH CHIẾU VUÔNG GÓC</span>
            <Box className="w-4 h-4 text-slate-400" />
          </h4>

          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                <span className="text-[11px] text-slate-500 block">Lên (Oxy)</span>
                <span className="font-bold font-mono text-indigo-700 text-xs">
                  ({x}, {y}, 0)
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                <span className="text-[11px] text-slate-500 block">Lên (Oxz)</span>
                <span className="font-bold font-mono text-indigo-700 text-xs">
                  ({x}, 0, {z})
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                <span className="text-[11px] text-slate-500 block">Lên (Oyz)</span>
                <span className="font-bold font-mono text-indigo-700 text-xs">
                  (0, {y}, {z})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-rose-50/60 p-2 rounded-xl border border-rose-100 text-center">
                <span className="text-[10px] text-rose-600 block">Lên trục Ox</span>
                <span className="font-bold font-mono text-rose-700 text-xs">({x}, 0, 0)</span>
              </div>
              <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-100 text-center">
                <span className="text-[10px] text-emerald-600 block">Lên trục Oy</span>
                <span className="font-bold font-mono text-emerald-700 text-xs">(0, {y}, 0)</span>
              </div>
              <div className="bg-blue-50/60 p-2 rounded-xl border border-blue-100 text-center">
                <span className="text-[10px] text-blue-600 block">Lên trục Oz</span>
                <span className="font-bold font-mono text-blue-700 text-xs">(0, 0, {z})</span>
              </div>
            </div>

            {/* Vector Magnitude & Cosines */}
            <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-amber-800 font-semibold">Độ dài vectơ OM:</span>
                <span className="font-bold font-mono text-amber-900 text-sm">
                  |OM| = √({x}² + {y}² + {z}²) = {lengthOM.toFixed(3)}
                </span>
              </div>
              <div className="text-[11px] text-amber-700 flex justify-between font-mono">
                <span>cos α = {cosAlpha.toFixed(2)}</span>
                <span>cos β = {cosBeta.toFixed(2)}</span>
                <span>cos γ = {cosGamma.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
