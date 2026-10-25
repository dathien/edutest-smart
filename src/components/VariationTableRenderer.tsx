import React, { useMemo, useState } from 'react';
import { Maximize2, ZoomIn, ZoomOut, RotateCcw, X, Eye } from 'lucide-react';
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
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomScale, setZoomScale] = useState(1.0);
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

  const renderTableContent = (scaleMultiplier: number = 1.0) => (
    <table 
      className="border-collapse border border-slate-400 text-slate-900 bg-white min-w-[420px] w-full text-center text-sm font-sans"
      style={{ transform: scaleMultiplier !== 1.0 ? `scale(${scaleMultiplier})` : undefined, transformOrigin: 'top left' }}
    >
      <tbody>
        {/* Row 1: x variable and landmark points */}
        <tr className="border-b border-slate-400 bg-slate-50/70">
          <td className="w-16 py-2.5 px-3 font-bold border-r border-slate-400 italic font-serif text-base bg-slate-100/60">
            x
          </td>
          {data.xLabels.map((lbl, idx) => (
            <td key={idx} className="py-2.5 px-3 font-medium min-w-[70px]">
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
                    id="arrow-var"
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
                        markerEnd="url(#arrow-var)"
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
  );

  return (
    <>
      <div className={`my-3 block w-full max-w-full bg-white rounded-xl border border-slate-300 shadow-xs p-3 sm:p-4 select-none ${className}`}>
        {/* Header with Title & Zoom Button */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 gap-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider text-left truncate">
            {title || 'Bảng biến thiên'}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsZoomed(true);
              setZoomScale(1.0);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shrink-0"
            title="Phóng to toàn màn hình để xem chi tiết mọi mốc x và giá trị"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Phóng to bảng</span>
          </button>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="sm:hidden flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md mb-2 border border-slate-100">
          <span>👈 Vuốt ngang để xem đủ bảng 👉</span>
          <span className="text-[10px] text-indigo-600 font-semibold">Chạm phóng to ↗</span>
        </div>

        {/* Horizontal scroll container with momentum scrolling */}
        <div className="overflow-x-auto pb-1 max-w-full -webkit-overflow-scrolling-touch">
          {renderTableContent(1.0)}
        </div>

        <div className="mt-2 text-[11px] text-slate-400 italic text-right">
          * Chuẩn hóa SGK Toán THPT GDPT 2018
        </div>
      </div>

      {/* Variation Table Fullscreen Zoom Modal */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate">
                  {title || 'Bảng biến thiên chi tiết (Chế độ phóng to)'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Xem đầy đủ các mốc $x$, dấu đạo hàm $y'$, các mũi tên biến thiên và cực trị
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setZoomScale(prev => Math.max(0.8, prev - 0.15))}
                  className="p-1.5 text-slate-600 hover:bg-white rounded-lg border border-slate-200"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-slate-600 w-12 text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale(prev => Math.min(1.6, prev + 0.15))}
                  className="p-1.5 text-slate-600 hover:bg-white rounded-lg border border-slate-200"
                  title="Phóng to"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomScale(1.0)}
                  className="p-1.5 text-slate-600 hover:bg-white rounded-lg border border-slate-200"
                  title="Đặt lại tỉ lệ 100%"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsZoomed(false)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-rose-50 rounded-lg ml-1"
                  title="Đóng modal"
                >
                  <X className="w-5 h-5 text-rose-500" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Canvas */}
            <div className="p-4 sm:p-6 overflow-auto flex-1 bg-slate-100/50 flex items-center justify-center min-h-[260px]">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm inline-block">
                {renderTableContent(zoomScale)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Vuốt hoặc cuộn để quan sát toàn bộ các khoảng đồng biến / nghịch biến</span>
              <button
                type="button"
                onClick={() => setIsZoomed(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
