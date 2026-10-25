import React, { useMemo } from 'react';
import { MathRenderer } from './MathRenderer';

export interface VariationTableProps {
  preset?: 'cubic_standard' | 'cubic_inverted' | 'quartic' | 'rational_fraction' | 'quadratic';
  title?: string;
  customData?: {
    xLabels: string[];
    yPrimeSigns: string[]; // e.g. ["+", "0", "-", "0", "+"]
    hasDoubleBarAt?: number[]; // index of column with double bar (||)
    yPoints: {
      val: string;
      position: 'top' | 'bottom' | 'middle';
      note?: string; // e.g. "(CĐ)", "(CT)"
    }[];
    trends: ('up' | 'down')[];
  };
  className?: string;
}

export const VariationTableRenderer: React.FC<VariationTableProps> = ({
  preset = 'cubic_standard',
  title,
  customData,
  className = '',
}) => {
  // Determine table data based on preset or custom data
  const data = useMemo(() => {
    if (customData) {
      return customData;
    }

    switch (preset) {
      case 'cubic_inverted':
        // y = -x^3 + 3x^2 (critical points at x = 0 and x = 2)
        return {
          xLabels: ['-\\infty', '0', '2', '+\\infty'],
          yPrimeSigns: ['-', '0', '+', '0', '-'],
          hasDoubleBarAt: [],
          yPoints: [
            { val: '+\\infty', position: 'top' as const },
            { val: '0', position: 'bottom' as const, note: 'CT' },
            { val: '4', position: 'top' as const, note: 'CĐ' },
            { val: '-\\infty', position: 'bottom' as const },
          ],
          trends: ['down', 'up', 'down'] as ('up' | 'down')[],
        };

      case 'rational_fraction':
        // y = (2x + 1)/(x - 1) (vertical asymptote at x = 1)
        return {
          xLabels: ['-\\infty', '1', '+\\infty'],
          yPrimeSigns: ['-', '||', '-'],
          hasDoubleBarAt: [1],
          yPoints: [
            { val: '2', position: 'top' as const },
            { val: '-\\infty', position: 'bottom' as const },
            { val: '+\\infty', position: 'top' as const },
            { val: '2', position: 'bottom' as const },
          ],
          trends: ['down', 'down'] as ('up' | 'down')[],
        };

      case 'quartic':
        // y = x^4 - 2x^2 (critical points at x = -1, 0, 1)
        return {
          xLabels: ['-\\infty', '-1', '0', '1', '+\\infty'],
          yPrimeSigns: ['-', '0', '+', '0', '-', '0', '+'],
          hasDoubleBarAt: [],
          yPoints: [
            { val: '+\\infty', position: 'top' as const },
            { val: '-1', position: 'bottom' as const, note: 'CT' },
            { val: '0', position: 'top' as const, note: 'CĐ' },
            { val: '-1', position: 'bottom' as const, note: 'CT' },
            { val: '+\\infty', position: 'top' as const },
          ],
          trends: ['down', 'up', 'down', 'up'] as ('up' | 'down')[],
        };

      case 'quadratic':
        // y = x^2 - 4x + 3 (vertex at x = 2)
        return {
          xLabels: ['-\\infty', '2', '+\\infty'],
          yPrimeSigns: ['-', '0', '+'],
          hasDoubleBarAt: [],
          yPoints: [
            { val: '+\\infty', position: 'top' as const },
            { val: '-1', position: 'bottom' as const, note: 'CT' },
            { val: '+\\infty', position: 'top' as const },
          ],
          trends: ['down', 'up'] as ('up' | 'down')[],
        };

      case 'cubic_standard':
      default:
        // y = x^3 - 3x (f'(x) = 3(x+1)(x-1), critical points at x = -1, 1)
        return {
          xLabels: ['-\\infty', '-1', '1', '+\\infty'],
          yPrimeSigns: ['+', '0', '-', '0', '+'],
          hasDoubleBarAt: [],
          yPoints: [
            { val: '-\\infty', position: 'bottom' as const },
            { val: '2', position: 'top' as const, note: 'CĐ' },
            { val: '-2', position: 'bottom' as const, note: 'CT' },
            { val: '+\\infty', position: 'top' as const },
          ],
          trends: ['up', 'down', 'up'] as ('up' | 'down')[],
        };
    }
  }, [preset, customData]);

  const numLandmarks = data.xLabels.length;

  return (
    <div className={`my-4 inline-block max-w-full bg-white rounded-xl border border-slate-300 shadow-sm p-4 overflow-x-auto select-none ${className}`}>
      {title && (
        <div className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider text-left border-b border-slate-100 pb-1">
          {title}
        </div>
      )}

      <table className="border-collapse border border-slate-400 text-slate-900 bg-white min-w-[440px] w-full text-center text-sm font-sans">
        <tbody>
          {/* Row 1: x variable and landmark points */}
          <tr className="border-b border-slate-400 bg-slate-50/70">
            <td className="w-16 py-2.5 px-3 font-bold border-r border-slate-400 italic font-serif text-base bg-slate-100/60">
              x
            </td>
            {data.xLabels.map((lbl, idx) => (
              <td key={idx} className="py-2.5 px-3 font-medium min-w-[75px]">
                <MathRenderer content={`$${lbl}$`} inline />
              </td>
            ))}
          </tr>

          {/* Row 2: y' (derivative signs) */}
          <tr className="border-b border-slate-400">
            <td className="w-16 py-2.5 px-3 font-bold border-r border-slate-400 italic font-serif text-base bg-slate-100/60">
              y'
            </td>
            <td colSpan={numLandmarks} className="py-2.5 px-4">
              <div className="flex items-center justify-around font-bold text-sm">
                {data.yPrimeSigns.map((sign, idx) => (
                  <span
                    key={idx}
                    className={`font-mono text-base ${
                      sign === '+'
                        ? 'text-slate-900'
                        : sign === '-'
                        ? 'text-slate-900'
                        : sign === '0'
                        ? 'text-slate-800'
                        : 'text-rose-600 font-bold tracking-widest'
                    }`}
                  >
                    {sign === '||' ? '║' : sign}
                  </span>
                ))}
              </div>
            </td>
          </tr>

          {/* Row 3: y (variation curve with SVG vector arrows and values) */}
          <tr>
            <td className="w-16 py-6 px-3 font-bold border-r border-slate-400 italic font-serif text-base bg-slate-100/60 align-middle">
              y
            </td>
            <td colSpan={numLandmarks} className="py-3 px-2 relative bg-white">
              {/* Dynamic SVG Canvas for arrows and landmark values */}
              <div className="h-28 relative flex items-center justify-between px-3">
                {/* SVG Connecting Arrows */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 9 5 L 0 9 z" fill="#1e293b" />
                    </marker>
                  </defs>

                  {/* Render SVG vector lines between consecutive points */}
                  {data.trends.map((trend, idx) => {
                    const totalSegments = data.trends.length;
                    const segmentWidthPercent = 100 / totalSegments;
                    
                    const x1 = `${idx * segmentWidthPercent + segmentWidthPercent * 0.18}%`;
                    const x2 = `${(idx + 1) * segmentWidthPercent - segmentWidthPercent * 0.18}%`;

                    const y1 = trend === 'up' ? '78%' : '24%';
                    const y2 = trend === 'up' ? '24%' : '78%';

                    return (
                      <g key={idx}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#1e293b"
                          strokeWidth="2"
                          markerEnd="url(#arrow)"
                          strokeLinecap="round"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Values and extreme notes positioned at top/bottom */}
                {data.yPoints.map((pt, idx) => {
                  const isTop = pt.position === 'top';
                  return (
                    <div
                      key={idx}
                      className={`relative z-10 flex flex-col items-center ${
                        isTop ? 'self-start mt-1' : 'self-end mb-1'
                      }`}
                    >
                      {/* Mathematical value via KaTeX */}
                      <span className="font-semibold text-slate-900 bg-white px-1.5 rounded text-sm shadow-2xs border border-slate-200/60">
                        <MathRenderer content={`$${pt.val}$`} inline />
                      </span>

                      {/* Extreme indicator label if applicable (CĐ, CT) */}
                      {pt.note && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                            pt.note === 'CĐ'
                              ? 'text-indigo-700 bg-indigo-50 border border-indigo-200'
                              : 'text-amber-700 bg-amber-50 border border-amber-200'
                          }`}
                        >
                          {pt.note}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-2 text-[11px] text-slate-500 italic text-right">
        * Bảng biến thiên chuẩn hóa theo sách giáo khoa Toán THPT
      </div>
    </div>
  );
};
