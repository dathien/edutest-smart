import React, { useState, useMemo } from 'react';
import { Geometry3DEngine, Plane3DData, Line3DData } from '../engines/Geometry3DEngine';
import { ParameterControls, ParameterPreset } from '../engines/ParameterControls';
import { LabActivity } from '../types';

interface Lab06LinesPlanes3DProps {
  activity: LabActivity;
  params: Record<string, number>;
  onParamChange: (paramId: string, val: number) => void;
  onResetParams: () => void;
  disabled?: boolean;
}

export const Lab06LinesPlanes3D: React.FC<Lab06LinesPlanes3DProps> = ({
  activity,
  params,
  onParamChange,
  onResetParams,
  disabled = false,
}) => {
  const A = params.A ?? 1;
  const B = params.B ?? 2;
  const C = params.C ?? 2;
  const D = params.D ?? -6;

  const x0 = params.x0 ?? 1;
  const y0 = params.y0 ?? 1;
  const z0 = params.z0 ?? 1;

  const u1 = params.u1 ?? 1;
  const u2 = params.u2 ?? 0;
  const u3 = params.u3 ?? 1;

  const [intersectionPoint, setIntersectionPoint] = useState<{ x: number; y: number; z: number } | null>(null);

  // Normal vector length
  const lenN = useMemo(() => Math.hypot(A, B, C), [A, B, C]);
  // Direction vector length
  const lenU = useMemo(() => Math.hypot(u1, u2, u3), [u1, u2, u3]);

  // Dot product n · u
  const dotProd = useMemo(() => A * u1 + B * u2 + C * u3, [A, B, C, u1, u2, u3]);

  // Angle between d and (P): sin(phi) = |dotProd| / (lenN * lenU)
  const angleDeg = useMemo(() => {
    if (lenN < 0.0001 || lenU < 0.0001) return 0;
    const sinPhi = Math.min(1, Math.abs(dotProd) / (lenN * lenU));
    return (Math.asin(sinPhi) * 180) / Math.PI;
  }, [dotProd, lenN, lenU]);

  // Distance from origin to plane: |D| / lenN
  const distOrigin = useMemo(() => {
    return lenN > 0.0001 ? Math.abs(D) / lenN : 0;
  }, [D, lenN]);

  // Distance from M0 to plane: |Ax0 + By0 + Cz0 + D| / lenN
  const distM0 = useMemo(() => {
    return lenN > 0.0001 ? Math.abs(A * x0 + B * y0 + C * z0 + D) / lenN : 0;
  }, [A, B, C, D, x0, y0, z0, lenN]);

  // Relative Position
  const relativePosition = useMemo(() => {
    if (Math.abs(dotProd) < 0.0001) {
      if (distM0 < 0.0001) {
        return 'Đường thẳng (d) nằm trong mặt phẳng (P)';
      }
      return 'Đường thẳng (d) song song với mặt phẳng (P)';
    }
    if (Math.abs(angleDeg - 90) < 0.1) {
      return 'Đường thẳng (d) vuông góc với mặt phẳng (P)';
    }
    return 'Đường thẳng (d) cắt mặt phẳng (P)';
  }, [dotProd, distM0, angleDeg]);

  // Presets
  const presets: ParameterPreset[] = [
    {
      label: '(P): x + 2y + 2z - 6 = 0, d(O, P) = 2',
      description: 'Mẫu SGK chuẩn',
      params: { A: 1, B: 2, C: 2, D: -6, x0: 1, y0: 1, z0: 1, u1: 1, u2: 0, u3: 1 },
    },
    {
      label: 'd vuông góc với (P)',
      description: 'u cùng phương với n = (2, -1, 2)',
      params: { A: 2, B: -1, C: 2, D: -5, x0: 0, y0: 0, z0: 0, u1: 2, u2: -1, u3: 2 },
    },
    {
      label: 'd song song với (P)',
      description: 'u · n = 0 và M0 ∉ (P)',
      params: { A: 1, B: 1, C: 0, D: -4, x0: 0, y0: 0, z0: 2, u1: 1, u2: -1, u3: 1 },
    },
  ];

  const planes3D: Plane3DData[] = useMemo(() => {
    return [
      {
        id: 'plane-P',
        A,
        B,
        C,
        D,
        color: '#0284c7',
        opacity: 0.45,
        size: 10,
        label: '(P)',
      },
    ];
  }, [A, B, C, D]);

  const lines3D: Line3DData[] = useMemo(() => {
    return [
      {
        id: 'line-d',
        x0,
        y0,
        z0,
        u1,
        u2,
        u3,
        color: '#9333ea',
        label: '(d)',
      },
    ];
  }, [x0, y0, z0, u1, u2, u3]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
      {/* 3D Canvas */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-600 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Mặt phẳng (P) & Đường thẳng (d)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-lg border border-cyan-200">
              Góc φ = {angleDeg.toFixed(1)}°
            </span>
          </div>
        </div>

        <Geometry3DEngine
          planes={planes3D}
          lines={lines3D}
          showGrid={true}
          showAxes={true}
          axesSize={7}
          height={460}
          onIntersectionCalculated={setIntersectionPoint}
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

        {/* Analytical Results */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
            KẾT QUẢ KHẢO SÁT HÌNH HỌC 3D
          </h4>

          <div className="space-y-2 text-xs">
            <div className="bg-cyan-50 p-2.5 rounded-xl border border-cyan-200 text-cyan-900 font-medium">
              <span className="text-cyan-600 text-[11px] block font-semibold">Vị trí tương đối:</span>
              <span className="text-sm font-bold">{relativePosition}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">VTPT n của (P)</span>
                <span className="font-bold font-mono text-slate-800 text-sm">
                  ({A}, {B}, {C}) |n|={lenN.toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">VTCP u của (d)</span>
                <span className="font-bold font-mono text-purple-700 text-sm">
                  ({u1}, {u2}, {u3}) |u|={lenU.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Khoảng cách d(O, P)</span>
                <span className="font-bold font-mono text-slate-800 text-sm">
                  {distOrigin.toFixed(3)}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Tọa độ giao điểm I</span>
                <span className="font-bold font-mono text-rose-700 text-sm">
                  {intersectionPoint
                    ? `(${intersectionPoint.x.toFixed(2)}, ${intersectionPoint.y.toFixed(2)}, ${intersectionPoint.z.toFixed(2)})`
                    : 'Không có (Song song)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
