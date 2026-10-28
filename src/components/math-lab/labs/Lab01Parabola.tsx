import React, { useState, useMemo } from 'react';
import { Graph2DEngine, CurveDefinition, Point2D } from '../engines/Graph2DEngine';
import { ParameterControls, ParameterPreset } from '../engines/ParameterControls';
import { DynamicVariationTable } from '../engines/DynamicVariationTable';
import { LabActivity, LabParameter } from '../types';
import { MathRenderer } from '../../MathRenderer';
import { CheckCircle2, HelpCircle, Sparkles } from 'lucide-react';

interface Lab01ParabolaProps {
  activity: LabActivity;
  params: Record<string, number>;
  onParamChange: (paramId: string, val: number) => void;
  onResetParams: () => void;
  disabled?: boolean;
}

export const Lab01Parabola: React.FC<Lab01ParabolaProps> = ({
  activity,
  params,
  onParamChange,
  onResetParams,
  disabled = false,
}) => {
  const a = params.a !== undefined ? (params.a === 0 ? 0.01 : params.a) : 1;
  const b = params.b ?? -2;
  const c = params.c ?? -5;

  // Analytical calculations
  const delta = useMemo(() => b * b - 4 * a * c, [a, b, c]);
  const xVertex = useMemo(() => -b / (2 * a), [a, b]);
  const yVertex = useMemo(() => -delta / (4 * a), [delta, a]);

  // Roots with Ox
  const roots = useMemo(() => {
    if (delta < 0) return [];
    if (Math.abs(delta) < 0.0001) return [xVertex];
    const r1 = (-b - Math.sqrt(delta)) / (2 * a);
    const r2 = (-b + Math.sqrt(delta)) / (2 * a);
    return [Math.min(r1, r2), Math.max(r1, r2)];
  }, [delta, b, a, xVertex]);

  // Presets
  const presets: ParameterPreset[] = [
    {
      label: 'y = x² - 2x - 5 (Đỉnh I(1, -6))',
      description: 'Ví dụ bài học SGK chuẩn',
      params: { a: 1, b: -2, c: -5 },
    },
    {
      label: 'y = -x² + 4x (Cực đại tại x=2)',
      description: 'Parabol có bề lõm quay xuống dưới',
      params: { a: -1, b: 4, c: 0 },
    },
    {
      label: 'y = 2x² - 4x + 2 (Tiếp xúc Ox tại x=1)',
      description: 'Nghiệm kép Δ = 0',
      params: { a: 2, b: -4, c: 2 },
    },
  ];

  // Curve definition
  const curves: CurveDefinition[] = useMemo(() => {
    return [
      {
        id: 'parabola-main',
        fn: (x: number) => a * x * x + b * x + c,
        color: '#4f46e5',
        strokeWidth: 3,
        label: `y = ${a}x² + ${b}x + ${c}`,
      },
      // Axis of symmetry vertical guide (modeled with short line or points)
    ];
  }, [a, b, c]);

  // Points of interest
  const points: Point2D[] = useMemo(() => {
    const list: Point2D[] = [
      {
        id: 'vertex-I',
        x: Math.round(xVertex * 100) / 100,
        y: Math.round(yVertex * 100) / 100,
        label: `I(${xVertex.toFixed(2)}, ${yVertex.toFixed(2)})`,
        color: '#dc2626',
        radius: 6,
      },
      {
        id: 'intercept-y',
        x: 0,
        y: c,
        label: `C(0, ${c})`,
        color: '#0891b2',
        radius: 5,
      },
    ];

    roots.forEach((r, idx) => {
      list.push({
        id: `root-${idx}`,
        x: Math.round(r * 100) / 100,
        y: 0,
        label: `x_${idx + 1}(${r.toFixed(2)}, 0)`,
        color: '#059669',
        radius: 5,
      });
    });

    return list;
  }, [xVertex, yVertex, c, roots]);

  // 5 Symmetric Table Values
  const valueTable = useMemo(() => {
    const step = 1;
    const xVals = [xVertex - 2 * step, xVertex - step, xVertex, xVertex + step, xVertex + 2 * step];
    return xVals.map((x) => ({
      x: Math.round(x * 10) / 10,
      y: Math.round((a * x * x + b * x + c) * 100) / 100,
      isVertex: Math.abs(x - xVertex) < 0.05,
    }));
  }, [xVertex, a, b, c]);

  // Dynamic Variation Table data
  const variationPoints = useMemo(() => {
    if (a > 0) {
      // Parabola quay lên
      return [
        { x: '-∞', deriv: '-', yVal: '+∞', yPos: 'high' as const, arrowDirection: 'down' as const },
        {
          x: xVertex.toFixed(2),
          deriv: '0',
          yVal: yVertex.toFixed(2),
          yPos: 'low' as const,
          arrowDirection: 'up' as const,
        },
        { x: '+∞', deriv: '+', yVal: '+∞', yPos: 'high' as const },
      ];
    } else {
      // Parabola quay xuống
      return [
        { x: '-∞', deriv: '+', yVal: '-∞', yPos: 'low' as const, arrowDirection: 'up' as const },
        {
          x: xVertex.toFixed(2),
          deriv: '0',
          yVal: yVertex.toFixed(2),
          yPos: 'high' as const,
          arrowDirection: 'down' as const,
        },
        { x: '+∞', deriv: '-', yVal: '-∞', yPos: 'low' as const },
      ];
    }
  }, [a, xVertex, yVertex]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
      {/* Left 7 Cols: 2D Graph Engine */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Đồ thị hàm số bậc hai
            </span>
          </div>
          <div className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
            y = {a !== 1 ? a : ''}x² {b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`}x {c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`}
          </div>
        </div>

        <Graph2DEngine
          curves={curves}
          points={points}
          initialXRange={[-6, 6]}
          initialYRange={[-8, 6]}
          height={430}
        />

        {/* Dynamic Variation Table */}
        <DynamicVariationTable
          title={`BẢNG BIẾN THIÊN HÀM BẬC HAI (a = ${a} ${a > 0 ? '> 0' : '< 0'})`}
          points={variationPoints}
        />
      </div>

      {/* Right 5 Cols: Parameters, Analytical Badges, Value Table, Tasks */}
      <div className="lg:col-span-5 space-y-4">
        {/* Parameter Sliders */}
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

        {/* Analytical Properties Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
            ĐẶC TRƯNG HÌNH HỌC VÀ ĐẠI SỐ
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Tọa độ đỉnh I</span>
              <span className="font-bold font-mono text-rose-600 text-sm">
                I({xVertex.toFixed(2)}, {yVertex.toFixed(2)})
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Trục đối xứng</span>
              <span className="font-bold font-mono text-indigo-600 text-sm">
                x = {xVertex.toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Biệt thức Δ</span>
              <span className="font-bold font-mono text-slate-800 text-sm">
                Δ = {delta.toFixed(2)} {delta > 0 ? '(2 nghiệm)' : delta === 0 ? '(Nghiệm kép)' : '(Vô nghiệm)'}
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Bề lõm Parabol</span>
              <span className="font-bold text-slate-800 text-sm">
                {a > 0 ? 'Quay lên trên ∪' : 'Quay xuống dưới ∩'}
              </span>
            </div>
          </div>
        </div>

        {/* 5 Points Value Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            BẢNG 5 ĐIỂM ĐỐI XỨNG
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs font-mono">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200">
                  <th className="py-1.5 px-2 font-serif italic text-slate-700">x</th>
                  {valueTable.map((row, i) => (
                    <th key={i} className={`py-1.5 px-2 ${row.isVertex ? 'text-rose-600 font-bold bg-rose-50' : 'text-slate-700'}`}>
                      {row.x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1.5 px-2 font-serif italic text-slate-700 font-bold border-r border-slate-200 bg-slate-50">y</td>
                  {valueTable.map((row, i) => (
                    <td key={i} className={`py-1.5 px-2 ${row.isVertex ? 'text-rose-600 font-bold bg-rose-50' : 'text-slate-800'}`}>
                      {row.y}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
