import React, { useMemo } from 'react';
import { Graph2DEngine, RegionPolygon, CurveDefinition, Point2D } from '../engines/Graph2DEngine';
import { ParameterControls, ParameterPreset } from '../engines/ParameterControls';
import { LabActivity } from '../types';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Lab04InequalitiesProps {
  activity: LabActivity;
  params: Record<string, number>;
  onParamChange: (paramId: string, val: number) => void;
  onResetParams: () => void;
  disabled?: boolean;
}

export const Lab04Inequalities: React.FC<Lab04InequalitiesProps> = ({
  activity,
  params,
  onParamChange,
  onResetParams,
  disabled = false,
}) => {
  const d = params.d ?? 2;
  const e = params.e !== undefined ? (params.e === 0 ? 0.01 : params.e) : 3;
  const levelC = params.levelC ?? 10;
  const testX = params.testX ?? 2;
  const testY = params.testY ?? 2;

  // Feasible Region Polygon Vertices:
  // System:
  // (1) x >= 0
  // (2) y >= 0
  // (3) x + y <= 4
  // (4) 2x + y <= 6
  // Vertices:
  // O(0, 0)
  // A(3, 0) [intersection of 2x + y = 6 with y = 0]
  // B(2, 2) [intersection of x + y = 4 and 2x + y = 6: x = 2, y = 2]
  // C(0, 4) [intersection of x + y = 4 with x = 0]
  const polygonVertices: [number, number][] = useMemo(() => {
    return [
      [0, 0],
      [3, 0],
      [2, 2],
      [0, 4],
    ];
  }, []);

  // Membership test for point M
  const isInside = useMemo(() => {
    const c1 = testX >= -0.01;
    const c2 = testY >= -0.01;
    const c3 = testX + testY <= 4.01;
    const c4 = 2 * testX + testY <= 6.01;
    return c1 && c2 && c3 && c4;
  }, [testX, testY]);

  // Objective function value at M
  const fValueM = useMemo(() => {
    return d * testX + e * testY;
  }, [d, e, testX, testY]);

  // Objective function at vertices
  const vertexValues = useMemo(() => {
    const names = ['O(0, 0)', 'A(3, 0)', 'B(2, 2)', 'C(0, 4)'];
    return polygonVertices.map((pt, idx) => {
      const val = d * pt[0] + e * pt[1];
      return {
        name: names[idx],
        x: pt[0],
        y: pt[1],
        fVal: val,
      };
    });
  }, [polygonVertices, d, e]);

  const maxVal = Math.max(...vertexValues.map((v) => v.fVal));
  const minVal = Math.min(...vertexValues.map((v) => v.fVal));

  // Presets
  const presets: ParameterPreset[] = [
    {
      label: 'F(x,y) = 2x + 3y (Max = 12 tại C(0,4))',
      description: 'Bài toán kinh tế mẫu',
      params: { d: 2, e: 3, levelC: 12, testX: 2, testY: 2 },
    },
    {
      label: 'F(x,y) = 3x + 2y (Max = 10 tại B(2,2))',
      description: 'Cực đại đạt tại đỉnh B',
      params: { d: 3, e: 2, levelC: 10, testX: 2, testY: 2 },
    },
    {
      label: 'F(x,y) = 4x + y (Max = 12 tại A(3,0))',
      description: 'Cực đại đạt tại đỉnh A',
      params: { d: 4, e: 1, levelC: 12, testX: 3, testY: 0 },
    },
  ];

  // Shaded polygon
  const polygons: RegionPolygon[] = useMemo(() => {
    return [
      {
        id: 'feasible-region',
        points: polygonVertices,
        color: '#10b981',
        fillOpacity: 0.35,
        label: 'Miền nghiệm',
      },
    ];
  }, [polygonVertices]);

  // Curves (boundary lines and objective level line)
  const curves: CurveDefinition[] = useMemo(() => {
    return [
      {
        id: 'line-d1',
        fn: (x: number) => 4 - x,
        color: '#3b82f6',
        strokeWidth: 2,
        label: 'x + y = 4',
      },
      {
        id: 'line-d2',
        fn: (x: number) => 6 - 2 * x,
        color: '#8b5cf6',
        strokeWidth: 2,
        label: '2x + y = 6',
      },
      // Objective Level Line: d*x + e*y = levelC => y = (levelC - d*x)/e
      {
        id: 'level-line-f',
        fn: (x: number) => (levelC - d * x) / e,
        color: '#f59e0b',
        strokeWidth: 2.5,
        strokeDasharray: '5 3',
        label: `F = ${levelC}`,
      },
    ];
  }, [d, e, levelC]);

  // Points
  const points: Point2D[] = useMemo(() => {
    const list: Point2D[] = [
      { id: 'v-O', x: 0, y: 0, label: 'O(0,0)', color: '#1e293b', radius: 4 },
      { id: 'v-A', x: 3, y: 0, label: 'A(3,0)', color: '#1e293b', radius: 4 },
      { id: 'v-B', x: 2, y: 2, label: 'B(2,2)', color: '#1e293b', radius: 4 },
      { id: 'v-C', x: 0, y: 4, label: 'C(0,4)', color: '#1e293b', radius: 4 },
      {
        id: 'test-point-M',
        x: testX,
        y: testY,
        label: `M(${testX.toFixed(1)}, ${testY.toFixed(1)})`,
        color: isInside ? '#059669' : '#dc2626',
        radius: 6.5,
        draggable: true,
        onDrag: (nx, ny) => {
          onParamChange('testX', nx);
          onParamChange('testY', ny);
        },
      },
    ];
    return list;
  }, [testX, testY, isInside, onParamChange]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
      {/* 2D Canvas */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Miền nghiệm đa giác OABC
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border ${
                isInside
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {isInside ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  M ∈ Miền nghiệm
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  M ∉ Miền nghiệm
                </>
              )}
            </span>
          </div>
        </div>

        <Graph2DEngine
          curves={curves}
          points={points}
          polygons={polygons}
          initialXRange={[-1, 6]}
          initialYRange={[-1, 6]}
          height={430}
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

        {/* Linear Programming Optimization Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              QUY HOẠCH TUYẾN TÍNH F(x, y) = {d}x + {e}y
            </h4>
            <span className="text-[11px] font-mono text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-bold">
              Đường mức C = {levelC}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-1.5 px-2 text-left">Đỉnh đa giác</th>
                  <th className="py-1.5 px-2">Tọa độ (x, y)</th>
                  <th className="py-1.5 px-2">Giá trị F(x, y)</th>
                  <th className="py-1.5 px-2">Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {vertexValues.map((v, i) => {
                  const isMax = Math.abs(v.fVal - maxVal) < 0.001;
                  const isMin = Math.abs(v.fVal - minVal) < 0.001;
                  return (
                    <tr
                      key={i}
                      className={`border-b border-slate-100 ${
                        isMax ? 'bg-amber-50/70 font-bold' : isMin ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="py-1.5 px-2 text-left font-mono font-bold text-slate-700">{v.name}</td>
                      <td className="py-1.5 px-2 font-mono text-slate-600">({v.x}, {v.y})</td>
                      <td className="py-1.5 px-2 font-mono font-bold text-indigo-700">{v.fVal}</td>
                      <td className="py-1.5 px-2">
                        {isMax && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">F_max</span>}
                        {isMin && <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">F_min</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs text-slate-600">
            <span className="font-semibold text-slate-800 block mb-0.5">Điểm thử di động M({testX.toFixed(1)}, {testY.toFixed(1)}):</span>
            F(M) = {d}({testX.toFixed(1)}) + {e}({testY.toFixed(1)}) = <span className="font-bold text-indigo-700 font-mono text-sm">{fValueM.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
