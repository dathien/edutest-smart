import React, { useState, useMemo } from 'react';
import { Graph2DEngine, CurveDefinition, Point2D } from '../engines/Graph2DEngine';
import { ParameterControls, ParameterPreset } from '../engines/ParameterControls';
import { LabActivity } from '../types';
import { Waves, TrendingUp } from 'lucide-react';

interface Lab03TrigExpProps {
  activity: LabActivity;
  params: Record<string, number>;
  onParamChange: (paramId: string, val: number) => void;
  onResetParams: () => void;
  disabled?: boolean;
}

export const Lab03TrigExp: React.FC<Lab03TrigExpProps> = ({
  activity,
  params,
  onParamChange,
  onResetParams,
  disabled = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'trig' | 'exp'>('trig');

  // Trig params
  const A = params.A ?? 2;
  const omega = params.omega !== undefined ? (params.omega === 0 ? 0.01 : params.omega) : 1;
  const phi = params.phi ?? 0;
  const C = params.C ?? 0;

  // Exp / Log params
  const baseA = params.baseA !== undefined ? (params.baseA <= 0.05 ? 0.1 : params.baseA) : 2;

  // Presets
  const presets: ParameterPreset[] = activeSubTab === 'trig' ? [
    {
      label: 'y = 2sin(x) (Chu kỳ 2π)',
      description: 'Sóng hình sin cơ bản',
      params: { A: 2, omega: 1, phi: 0, C: 0 },
    },
    {
      label: 'y = 2sin(2x) (Chu kỳ π)',
      description: 'Tần số góc gấp đôi',
      params: { A: 2, omega: 2, phi: 0, C: 0 },
    },
    {
      label: 'y = 3sin(x + π/2) = 3cos(x)',
      description: 'Lệch pha π/2 thành hàm cosin',
      params: { A: 3, omega: 1, phi: 1.57, C: 0 },
    },
  ] : [
    {
      label: 'Cơ số a = 2 (Đồng biến)',
      description: 'y = 2^x và y = log₂(x)',
      params: { baseA: 2 },
    },
    {
      label: 'Cơ số a = e ≈ 2.718 (Tự nhiên)',
      description: 'y = e^x và y = ln(x)',
      params: { baseA: 2.72 },
    },
    {
      label: 'Cơ số a = 0.5 (Nghịch biến)',
      description: '0 < a < 1',
      params: { baseA: 0.5 },
    },
  ];

  // Curves for Trig
  const trigCurves: CurveDefinition[] = useMemo(() => {
    return [
      {
        id: 'sin-curve',
        fn: (x: number) => A * Math.sin(omega * x + phi) + C,
        color: '#2563eb',
        strokeWidth: 3,
        label: `y = ${A}sin(${omega}x + ${phi.toFixed(2)}) + ${C}`,
      },
      {
        id: 'cos-curve',
        fn: (x: number) => A * Math.cos(omega * x + phi) + C,
        color: '#9333ea',
        strokeWidth: 1.8,
        strokeDasharray: '4 4',
        label: `y = ${A}cos(...)`,
      },
    ];
  }, [A, omega, phi, C]);

  // Curves for Exp / Log
  const expCurves: CurveDefinition[] = useMemo(() => {
    return [
      {
        id: 'exp-curve',
        fn: (x: number) => Math.pow(baseA, x),
        color: '#dc2626',
        strokeWidth: 3,
        label: `y = ${baseA}^x`,
        domain: [-5, 4],
      },
      {
        id: 'log-curve',
        fn: (x: number) => {
          if (x <= 0.001) return NaN;
          return Math.log(x) / Math.log(baseA);
        },
        color: '#059669',
        strokeWidth: 3,
        label: `y = log_${baseA}(x)`,
        domain: [0.005, 10],
      },
      {
        id: 'diag-bisector',
        fn: (x: number) => x,
        color: '#94a3b8',
        strokeWidth: 1.5,
        strokeDasharray: '4 4',
        label: 'y = x',
      },
    ];
  }, [baseA]);

  // Points for Trig
  const trigPoints: Point2D[] = useMemo(() => {
    const list: Point2D[] = [];
    const period = (2 * Math.PI) / Math.abs(omega);
    list.push({
      id: 'p0',
      x: 0,
      y: A * Math.sin(phi) + C,
      label: `(0, ${(A * Math.sin(phi) + C).toFixed(2)})`,
      color: '#2563eb',
      radius: 5,
    });
    return list;
  }, [A, omega, phi, C]);

  // Points for Exp
  const expPoints: Point2D[] = useMemo(() => {
    return [
      { id: 'exp-one', x: 0, y: 1, label: 'A(0, 1)', color: '#dc2626', radius: 5 },
      { id: 'exp-base', x: 1, y: baseA, label: `B(1, ${baseA})`, color: '#dc2626', radius: 5 },
      { id: 'log-one', x: 1, y: 0, label: "A'(1, 0)", color: '#059669', radius: 5 },
      { id: 'log-base', x: baseA, y: 1, label: `B'(${baseA}, 1)`, color: '#059669', radius: 5 },
    ];
  }, [baseA]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
      {/* 2D Canvas */}
      <div className="lg:col-span-7 space-y-4">
        {/* Sub-tab Switcher */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveSubTab('trig')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeSubTab === 'trig'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Waves className="w-4 h-4" />
              <span>1. Hàm Lượng Giác</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('exp')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeSubTab === 'exp'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>2. Hàm Mũ & Lôgarit</span>
            </button>
          </div>

          <div className="text-xs font-mono font-bold text-slate-700 pr-2">
            {activeSubTab === 'trig' ? `Chu kỳ T = ${(2 * Math.PI / Math.abs(omega)).toFixed(2)}` : `Cơ số a = ${baseA}`}
          </div>
        </div>

        <Graph2DEngine
          curves={activeSubTab === 'trig' ? trigCurves : expCurves}
          points={activeSubTab === 'trig' ? trigPoints : expPoints}
          initialXRange={activeSubTab === 'trig' ? [-7, 7] : [-4, 6]}
          initialYRange={activeSubTab === 'trig' ? [-5, 5] : [-4, 6]}
          height={430}
        />
      </div>

      {/* Right Controls */}
      <div className="lg:col-span-5 space-y-4">
        <ParameterControls
          parameters={activity.parameters.filter((p) => {
            if (activeSubTab === 'trig') return p.id !== 'baseA';
            return p.id === 'baseA';
          })}
          values={params}
          onChange={onParamChange}
          onReset={onResetParams}
          presets={presets}
          onApplyPreset={(p) => {
            Object.entries(p.params).forEach(([k, v]) => onParamChange(k, v));
          }}
          disabled={disabled}
        />

        {/* Analytical Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
            {activeSubTab === 'trig' ? 'ĐẶC TÍNH SÓNG LƯỢNG GIÁC' : 'TÍNH CHẤT ĐỐI XỨNG MŨ & LOGARIT'}
          </h4>

          {activeSubTab === 'trig' ? (
            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Biên độ dao động</span>
                  <span className="font-bold font-mono text-blue-600 text-sm">A = {A}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-[11px]">Chu kỳ tuần hoàn</span>
                  <span className="font-bold font-mono text-indigo-600 text-sm">
                    T = 2π/ω = {((2 * Math.PI) / Math.abs(omega)).toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-slate-500 text-[11px] italic">
                Đường nét liền xanh là y = A·sin(ωx + φ) + C. Đường nét đứt tím là hàm cosin tương ứng.
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tính đơn điệu:</span>
                  <span className="font-bold text-slate-800">
                    {baseA > 1 ? 'Đồng biến trên TXĐ (a > 1)' : 'Nghịch biến trên TXĐ (0 < a < 1)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tiệm cận của y = aˣ:</span>
                  <span className="font-mono text-rose-600 font-bold">Tiệm cận ngang y = 0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tiệm cận của y = log_a(x):</span>
                  <span className="font-mono text-emerald-600 font-bold">Tiệm cận đứng x = 0</span>
                </div>
              </div>
              <p className="text-slate-500 text-[11px] italic">
                Hai đồ thị luôn đối xứng nhau qua đường phân giác góc phần tư thứ nhất y = x (đường nét đứt xám).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
