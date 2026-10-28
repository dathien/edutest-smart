import React, { useMemo } from 'react';
import { Graph2DEngine, CurveDefinition, Point2D } from '../engines/Graph2DEngine';
import { ParameterControls, ParameterPreset } from '../engines/ParameterControls';
import { DynamicVariationTable } from '../engines/DynamicVariationTable';
import { LabActivity } from '../types';

interface Lab02CubicProps {
  activity: LabActivity;
  params: Record<string, number>;
  onParamChange: (paramId: string, val: number) => void;
  onResetParams: () => void;
  disabled?: boolean;
}

export const Lab02Cubic: React.FC<Lab02CubicProps> = ({
  activity,
  params,
  onParamChange,
  onResetParams,
  disabled = false,
}) => {
  const a = params.a !== undefined ? (params.a === 0 ? 0.01 : params.a) : 1;
  const b = params.b ?? 0;
  const c = params.c ?? -3;
  const d = params.d ?? 1;
  const x0 = params.x0 ?? 0;

  // Cubic function and derivative
  const f = (x: number) => a * x * x * x + b * x * x + c * x + d;
  const fPrime = (x: number) => 3 * a * x * x + 2 * b * x + c;

  // Tangent at x0
  const y0 = f(x0);
  const slopeK = fPrime(x0);

  // Delta' of derivative y' = 3ax^2 + 2bx + c: Delta' = b^2 - 3ac
  const deltaPrime = useMemo(() => b * b - 3 * a * c, [a, b, c]);

  // Inflection point U
  const xInflection = useMemo(() => -b / (3 * a), [a, b]);
  const yInflection = useMemo(() => f(xInflection), [xInflection, a, b, c, d]);

  // Critical points
  const criticalPoints = useMemo(() => {
    if (deltaPrime <= 0) return [];
    const sqrtD = Math.sqrt(deltaPrime);
    const r1 = (-b - sqrtD) / (3 * a);
    const r2 = (-b + sqrtD) / (3 * a);
    const minX = Math.min(r1, r2);
    const maxX = Math.max(r1, r2);
    return [
      { x: minX, y: f(minX) },
      { x: maxX, y: f(maxX) },
    ];
  }, [deltaPrime, a, b, c, d]);

  // Presets
  const presets: ParameterPreset[] = [
    {
      label: 'y = x³ - 3x + 1 (Cực trị (-1, 3) & (1, -1))',
      description: 'Hàm số chuẩn đề thi SGK Toán 12',
      params: { a: 1, b: 0, c: -3, d: 1, x0: 0 },
    },
    {
      label: 'y = -x³ + 3x² - 1 (Đổi chiều biến thiên)',
      description: 'a < 0, 2 cực trị',
      params: { a: -1, b: 3, c: 0, d: -1, x0: 1 },
    },
    {
      label: 'y = x³ + 3x (Luôn đồng biến trên R)',
      description: 'Δ\' < 0 không có cực trị',
      params: { a: 1, b: 0, c: 3, d: 0, x0: 0 },
    },
  ];

  // Curve definition
  const curves: CurveDefinition[] = useMemo(() => {
    return [
      {
        id: 'cubic-main',
        fn: f,
        color: '#7c3aed',
        strokeWidth: 3.2,
        label: `y = ${a}x³ + ${b}x² + ${c}x + ${d}`,
      },
      {
        id: 'deriv-guide',
        fn: fPrime,
        color: '#06b6d4',
        strokeWidth: 1.5,
        strokeDasharray: '4 4',
        label: "y'",
      },
    ];
  }, [a, b, c, d]);

  // Points of interest
  const points: Point2D[] = useMemo(() => {
    const list: Point2D[] = [];

    // Tangent point M
    list.push({
      id: 'tangent-pt',
      x: x0,
      y: y0,
      label: `M(${x0.toFixed(2)}, ${y0.toFixed(2)})`,
      color: '#f59e0b',
      radius: 6.5,
      draggable: true,
      onDrag: (newX) => {
        onParamChange('x0', newX);
      },
    });

    // Inflection point U
    list.push({
      id: 'inflection-U',
      x: Math.round(xInflection * 100) / 100,
      y: Math.round(yInflection * 100) / 100,
      label: `U(${xInflection.toFixed(2)}, ${yInflection.toFixed(2)})`,
      color: '#0284c7',
      radius: 5,
    });

    // Critical Points A, B
    if (criticalPoints.length === 2) {
      const isFirstMax = a > 0;
      list.push({
        id: 'crit-1',
        x: Math.round(criticalPoints[0].x * 100) / 100,
        y: Math.round(criticalPoints[0].y * 100) / 100,
        label: `${isFirstMax ? 'CĐ' : 'CT'}(${criticalPoints[0].x.toFixed(2)}, ${criticalPoints[0].y.toFixed(2)})`,
        color: '#e11d48',
        radius: 5.5,
      });
      list.push({
        id: 'crit-2',
        x: Math.round(criticalPoints[1].x * 100) / 100,
        y: Math.round(criticalPoints[1].y * 100) / 100,
        label: `${isFirstMax ? 'CT' : 'CĐ'}(${criticalPoints[1].x.toFixed(2)}, ${criticalPoints[1].y.toFixed(2)})`,
        color: '#e11d48',
        radius: 5.5,
      });
    }

    return list;
  }, [x0, y0, xInflection, yInflection, criticalPoints, a, onParamChange]);

  // Tangent Line
  const tangentLine = useMemo(() => {
    return {
      x0,
      y0,
      slope: slopeK,
      color: '#f59e0b',
      label: `k = ${slopeK.toFixed(2)}`,
    };
  }, [x0, y0, slopeK]);

  // Dynamic Variation Table for Cubic
  const variationPoints = useMemo(() => {
    if (criticalPoints.length === 2) {
      const p1 = criticalPoints[0];
      const p2 = criticalPoints[1];

      if (a > 0) {
        // a > 0: + -> 0 -> - -> 0 -> +
        return [
          { x: '-∞', deriv: '+', yVal: '-∞', yPos: 'low' as const, arrowDirection: 'up' as const },
          { x: p1.x.toFixed(2), deriv: '0', yVal: p1.y.toFixed(2), yPos: 'high' as const, arrowDirection: 'down' as const },
          { x: p2.x.toFixed(2), deriv: '0', yVal: p2.y.toFixed(2), yPos: 'low' as const, arrowDirection: 'up' as const },
          { x: '+∞', deriv: '+', yVal: '+∞', yPos: 'high' as const },
        ];
      } else {
        // a < 0: - -> 0 -> + -> 0 -> -
        return [
          { x: '-∞', deriv: '-', yVal: '+∞', yPos: 'high' as const, arrowDirection: 'down' as const },
          { x: p1.x.toFixed(2), deriv: '0', yVal: p1.y.toFixed(2), yPos: 'low' as const, arrowDirection: 'up' as const },
          { x: p2.x.toFixed(2), deriv: '0', yVal: p2.y.toFixed(2), yPos: 'high' as const, arrowDirection: 'down' as const },
          { x: '+∞', deriv: '-', yVal: '-∞', yPos: 'low' as const },
        ];
      }
    } else {
      // Monotonic (No critical points)
      if (a > 0) {
        return [
          { x: '-∞', deriv: '+', yVal: '-∞', yPos: 'low' as const, arrowDirection: 'up' as const },
          { x: '0', deriv: '+', yVal: f(0).toFixed(2), yPos: 'mid' as const, arrowDirection: 'up' as const },
          { x: '+∞', deriv: '+', yVal: '+∞', yPos: 'high' as const },
        ];
      } else {
        return [
          { x: '-∞', deriv: '-', yVal: '+∞', yPos: 'high' as const, arrowDirection: 'down' as const },
          { x: '0', deriv: '-', yVal: f(0).toFixed(2), yPos: 'mid' as const, arrowDirection: 'down' as const },
          { x: '+∞', deriv: '-', yVal: '-∞', yPos: 'low' as const },
        ];
      }
    }
  }, [criticalPoints, a, f]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
      {/* 2D Canvas */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Đồ thị bậc ba & Tiếp tuyến
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              Tiếp tuyến tại x₀={x0.toFixed(1)}: k = {slopeK.toFixed(2)}
            </span>
          </div>
        </div>

        <Graph2DEngine
          curves={curves}
          points={points}
          tangentLine={tangentLine}
          initialXRange={[-5, 5]}
          initialYRange={[-6, 6]}
          height={430}
        />

        {/* Dynamic Variation Table */}
        <DynamicVariationTable
          title={`BẢNG BIẾN THIÊN HÀM BẬC BA (Δ' = ${deltaPrime.toFixed(2)})`}
          points={variationPoints}
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

        {/* Analytical Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
            PHÂN TÍCH ĐẠO HÀM VÀ TIẾP TUYẾN
          </h4>

          <div className="space-y-2 text-xs">
            <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100 text-purple-900 font-mono">
              <span className="text-purple-600 text-[11px] block">Đạo hàm y'</span>
              y' = {3 * a}x² {2 * b >= 0 ? `+ ${2 * b}` : `- ${Math.abs(2 * b)}`}x {c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Biệt thức Δ' của y'</span>
                <span className="font-bold font-mono text-slate-800 text-sm">
                  {deltaPrime.toFixed(2)} {deltaPrime > 0 ? '(2 cực trị)' : '(0 cực trị)'}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Tâm đối xứng (Điểm uốn)</span>
                <span className="font-bold font-mono text-cyan-700 text-sm">
                  U({xInflection.toFixed(2)}, {yInflection.toFixed(2)})
                </span>
              </div>
            </div>

            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900 font-mono text-xs">
              <span className="text-amber-700 text-[11px] block font-sans font-medium">Phương trình tiếp tuyến tại M</span>
              y = {slopeK.toFixed(2)}(x {x0 >= 0 ? `- ${x0.toFixed(2)}` : `+ ${Math.abs(x0).toFixed(2)}`}) {y0 >= 0 ? `+ ${y0.toFixed(2)}` : `- ${Math.abs(y0).toFixed(2)}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
