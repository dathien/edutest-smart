import React, { useState, useMemo } from 'react';
import { MathRenderer } from './MathRenderer';

export type FunctionType =
  | 'cubic' // y = ax^3 + bx^2 + cx + d
  | 'quadratic' // y = ax^2 + bx + c
  | 'linear' // y = ax + b
  | 'rational' // y = (ax + b)/(cx + d)
  | 'exponential' // y = a^x
  | 'logarithm' // y = log_a(x)
  | 'sine'; // y = sin(x)

export interface FunctionGraphProps {
  type?: FunctionType;
  title?: string;
  expressionText?: string;
  allowAdjust?: boolean;
  className?: string;
}

export const FunctionGraphRenderer: React.FC<FunctionGraphProps> = ({
  type = 'cubic',
  title,
  expressionText,
  allowAdjust = false,
  className = '',
}) => {
  const [selectedType, setSelectedType] = useState<FunctionType>(type);
  const [curveColor, setCurveColor] = useState('#4f46e5');
  const [showGrid, setShowGrid] = useState(true);
  const [showCriticalPoints, setShowCriticalPoints] = useState(true);
  const [showAsymptotes, setShowAsymptotes] = useState(true);

  // Graph coordinate frame parameters
  const width = 360;
  const height = 280;
  const originX = width / 2; // (0, 0) is at center
  const originY = height / 2;
  const scale = 32; // 32 pixels = 1 math unit

  // Coordinate transforms
  const toSvgX = (x: number) => originX + x * scale;
  const toSvgY = (y: number) => originY - y * scale;

  // Compute graph properties according to function type
  const graphData = useMemo(() => {
    switch (selectedType) {
      case 'linear': {
        // y = 2x - 1
        const f = (x: number) => 2 * x - 1;
        const xMin = -4;
        const xMax = 4;
        const d = `M ${toSvgX(xMin)} ${toSvgY(f(xMin))} L ${toSvgX(xMax)} ${toSvgY(f(xMax))}`;
        return {
          expr: 'y = 2x - 1',
          paths: [d],
          asymptotes: [],
          criticalPoints: [
            { x: 0, y: -1, label: '(0; -1)' },
            { x: 0.5, y: 0, label: '(0.5; 0)' },
          ],
        };
      }

      case 'quadratic': {
        // y = x^2 - 2x - 1
        const f = (x: number) => x * x - 2 * x - 1;
        const pts: string[] = [];
        for (let x = -3.2; x <= 5.2; x += 0.05) {
          const y = f(x);
          if (y >= -5 && y <= 5.5) {
            pts.push(`${toSvgX(x)},${toSvgY(y)}`);
          }
        }
        return {
          expr: 'y = x^2 - 2x - 1',
          paths: [pts.length ? `M ${pts.join(' L ')}` : ''],
          asymptotes: [],
          criticalPoints: [
            { x: 1, y: -2, label: 'Đỉnh I(1; -2)' },
            { x: 0, y: -1, label: '(0; -1)' },
          ],
        };
      }

      case 'rational': {
        // y = (2x - 1)/(x + 1) -> Vertical Asymptote x = -1, Horizontal Asymptote y = 2
        const asymptoteX = -1;
        const asymptoteY = 2;
        const f = (x: number) => (2 * x - 1) / (x + 1);

        // Branch 1: x < -1
        const pts1: string[] = [];
        for (let x = -5.5; x <= asymptoteX - 0.12; x += 0.05) {
          const y = f(x);
          if (y >= -6 && y <= 6) {
            pts1.push(`${toSvgX(x)},${toSvgY(y)}`);
          }
        }

        // Branch 2: x > -1
        const pts2: string[] = [];
        for (let x = asymptoteX + 0.12; x <= 5.5; x += 0.05) {
          const y = f(x);
          if (y >= -6 && y <= 6) {
            pts2.push(`${toSvgX(x)},${toSvgY(y)}`);
          }
        }

        return {
          expr: 'y = \\frac{2x - 1}{x + 1}',
          paths: [
            pts1.length ? `M ${pts1.join(' L ')}` : '',
            pts2.length ? `M ${pts2.join(' L ')}` : '',
          ].filter(Boolean),
          asymptotes: [
            { type: 'vertical' as const, val: asymptoteX, label: 'x = -1' },
            { type: 'horizontal' as const, val: asymptoteY, label: 'y = 2' },
          ],
          criticalPoints: [
            { x: 0, y: -1, label: '(0; -1)' },
            { x: 0.5, y: 0, label: '(0.5; 0)' },
          ],
        };
      }

      case 'exponential': {
        // y = 2^x
        const f = (x: number) => Math.pow(2, x);
        const pts: string[] = [];
        for (let x = -5; x <= 2.8; x += 0.05) {
          const y = f(x);
          pts.push(`${toSvgX(x)},${toSvgY(y)}`);
        }
        return {
          expr: 'y = 2^x',
          paths: [pts.length ? `M ${pts.join(' L ')}` : ''],
          asymptotes: [{ type: 'horizontal' as const, val: 0, label: 'y = 0' }],
          criticalPoints: [{ x: 0, y: 1, label: '(0; 1)' }],
        };
      }

      case 'logarithm': {
        // y = log2(x)
        const f = (x: number) => Math.log2(x);
        const pts: string[] = [];
        for (let x = 0.08; x <= 5.5; x += 0.05) {
          const y = f(x);
          if (y >= -5 && y <= 5) {
            pts.push(`${toSvgX(x)},${toSvgY(y)}`);
          }
        }
        return {
          expr: 'y = \\log_2(x)',
          paths: [pts.length ? `M ${pts.join(' L ')}` : ''],
          asymptotes: [{ type: 'vertical' as const, val: 0, label: 'x = 0' }],
          criticalPoints: [{ x: 1, y: 0, label: '(1; 0)' }],
        };
      }

      case 'sine': {
        // y = 2 * sin(x)
        const f = (x: number) => 2 * Math.sin(x);
        const pts: string[] = [];
        for (let x = -5.5; x <= 5.5; x += 0.05) {
          const y = f(x);
          pts.push(`${toSvgX(x)},${toSvgY(y)}`);
        }
        return {
          expr: 'y = 2\\sin(x)',
          paths: [pts.length ? `M ${pts.join(' L ')}` : ''],
          asymptotes: [],
          criticalPoints: [
            { x: 0, y: 0, label: '(0; 0)' },
            { x: Math.PI / 2, y: 2, label: '(\\pi/2; 2)' },
            { x: -Math.PI / 2, y: -2, label: '(-\\pi/2; -2)' },
          ],
        };
      }

      case 'cubic':
      default: {
        // y = x^3 - 3x (CĐ (-1, 2), CT (1, -2))
        const f = (x: number) => x * x * x - 3 * x;
        const pts: string[] = [];
        for (let x = -2.6; x <= 2.6; x += 0.04) {
          const y = f(x);
          if (y >= -4.5 && y <= 4.5) {
            pts.push(`${toSvgX(x)},${toSvgY(y)}`);
          }
        }
        return {
          expr: 'y = x^3 - 3x',
          paths: [pts.length ? `M ${pts.join(' L ')}` : ''],
          asymptotes: [],
          criticalPoints: [
            { x: -1, y: 2, label: 'CĐ (-1; 2)' },
            { x: 1, y: -2, label: 'CT (1; -2)' },
            { x: 0, y: 0, label: 'O(0; 0)' },
          ],
        };
      }
    }
  }, [selectedType]);

  const ticks = [-4, -3, -2, -1, 1, 2, 3, 4];

  return (
    <div className={`my-3 inline-block bg-white p-4 rounded-xl border border-slate-300 shadow-sm max-w-full overflow-hidden select-none ${className}`}>
      {/* Title & Formula */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            {title || 'Đồ thị hàm số chuẩn'}
          </span>
          <div className="text-sm font-semibold text-indigo-700 mt-0.5">
            <MathRenderer content={`$${expressionText || graphData.expr}$`} inline />
          </div>
        </div>

        {/* Adjust controls toggle */}
        {allowAdjust && (
          <div className="flex items-center gap-1.5">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as FunctionType)}
              className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
            >
              <option value="cubic">Bậc ba: y = x³ - 3x</option>
              <option value="quadratic">Bậc hai: Parabol</option>
              <option value="rational">Phân thức hữu tỉ</option>
              <option value="linear">Bậc nhất: y = 2x - 1</option>
              <option value="exponential">Mũ: y = 2^x</option>
              <option value="logarithm">Logarit: y = log₂x</option>
              <option value="sine">Lượng giác: y = 2sin(x)</option>
            </select>
          </div>
        )}
      </div>

      {/* SVG Coordinate Space */}
      <div className="flex justify-center w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[360px] h-auto bg-white border border-slate-100 rounded-lg"
        >
          {/* Grid lines */}
          {showGrid && (
            <g stroke="#f1f5f9" strokeWidth="1">
              {ticks.map((t) => (
                <React.Fragment key={t}>
                  <line x1={toSvgX(t)} y1={0} x2={toSvgX(t)} y2={height} />
                  <line x1={0} y1={toSvgY(t)} x2={width} y2={toSvgY(t)} />
                </React.Fragment>
              ))}
            </g>
          )}

          {/* Coordinate Axes */}
          {/* Ox Axis */}
          <line x1={15} y1={originY} x2={width - 15} y2={originY} stroke="#334155" strokeWidth="1.8" />
          <polygon
            points={`${width - 15},${originY - 4} ${width - 5},${originY} ${width - 15},${originY + 4}`}
            fill="#334155"
          />
          <text x={width - 18} y={originY + 18} fontSize="13" fontStyle="italic" fill="#1e293b" fontWeight="bold">
            x
          </text>

          {/* Oy Axis */}
          <line x1={originX} y1={height - 15} x2={originX} y2={15} stroke="#334155" strokeWidth="1.8" />
          <polygon
            points={`${originX - 4},15 ${originX},5 ${originX + 4},15`}
            fill="#334155"
          />
          <text x={originX + 10} y={18} fontSize="13" fontStyle="italic" fill="#1e293b" fontWeight="bold">
            y
          </text>

          {/* Origin O */}
          <text x={originX - 14} y={originY + 15} fontSize="12" fill="#475569" fontWeight="bold">
            O
          </text>

          {/* Axis Ticks */}
          {ticks.map((t) => {
            const sx = toSvgX(t);
            const sy = toSvgY(t);
            return (
              <React.Fragment key={t}>
                {/* Ox tick */}
                <line x1={sx} y1={originY - 3} x2={sx} y2={originY + 3} stroke="#64748b" strokeWidth="1.2" />
                <text x={sx - 4} y={originY + 15} fontSize="10" fill="#64748b">
                  {t}
                </text>

                {/* Oy tick */}
                <line x1={originX - 3} y1={sy} x2={originX + 3} y2={sy} stroke="#64748b" strokeWidth="1.2" />
                <text x={originX - 18} y={sy + 3} fontSize="10" fill="#64748b">
                  {t}
                </text>
              </React.Fragment>
            );
          })}

          {/* Asymptotes (if any, e.g. rational fraction) */}
          {showAsymptotes &&
            graphData.asymptotes.map((asym, idx) => {
              if (asym.type === 'vertical') {
                const vx = toSvgX(asym.val);
                return (
                  <g key={idx}>
                    <line x1={vx} y1={0} x2={vx} y2={height} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,4" />
                    <text x={vx + 4} y={35} fontSize="10" fill="#dc2626" fontWeight="bold">
                      {asym.label}
                    </text>
                  </g>
                );
              } else {
                const hy = toSvgY(asym.val);
                return (
                  <g key={idx}>
                    <line x1={0} y1={hy} x2={width} y2={hy} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4,4" />
                    <text x={25} y={hy - 6} fontSize="10" fill="#dc2626" fontWeight="bold">
                      {asym.label}
                    </text>
                  </g>
                );
              }
            })}

          {/* Curve Paths */}
          {graphData.paths.map((p, idx) => (
            <path
              key={idx}
              d={p}
              fill="none"
              stroke={curveColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {/* Critical points & dashed projections */}
          {showCriticalPoints &&
            graphData.criticalPoints.map((pt, idx) => {
              const cx = toSvgX(pt.x);
              const cy = toSvgY(pt.y);
              return (
                <g key={idx}>
                  {/* Dashed projections to axes */}
                  {Math.abs(pt.x) > 0.05 && (
                    <line x1={cx} y1={cy} x2={cx} y2={originY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                  )}
                  {Math.abs(pt.y) > 0.05 && (
                    <line x1={cx} y1={cy} x2={originX} y2={cy} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                  )}

                  <circle cx={cx} cy={cy} r="3.5" fill="#1e1b4b" stroke="#ffffff" strokeWidth="1.5" />
                  <text x={cx + 6} y={cy - 6} fontSize="10" fill="#1e293b" fontWeight="600">
                    {pt.label}
                  </text>
                </g>
              );
            })}
        </svg>
      </div>

      {/* Teacher Controls Toolbar if allowAdjust is enabled */}
      {allowAdjust && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Lưới tọa độ</span>
            </label>

            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showCriticalPoints}
                onChange={(e) => setShowCriticalPoints(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Điểm cực trị</span>
            </label>

            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showAsymptotes}
                onChange={(e) => setShowAsymptotes(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Tiệm cận</span>
            </label>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Màu nét:</span>
            {['#4f46e5', '#059669', '#dc2626', '#2563eb'].map((c) => (
              <button
                key={c}
                onClick={() => setCurveColor(c)}
                className={`w-4 h-4 rounded-full border border-white shadow-2xs transition-transform ${
                  curveColor === c ? 'scale-125 ring-2 ring-indigo-400' : 'opacity-70'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
