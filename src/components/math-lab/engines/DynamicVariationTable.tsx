import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface VariationPoint {
  xLabel: string;
  xValue?: number;
  derivSignBefore?: '+' | '-' | '0';
  derivAt?: '0' | '|' | '||';
  derivSignAfter?: '+' | '-' | '0';
  yVal?: string | number;
  yPosition?: 'top' | 'middle' | 'bottom';
}

export interface DynamicVariationTableProps {
  title?: string;
  points: {
    x: string;
    deriv: string; // e.g. "0", "+", "-", "||"
    yVal: string;
    yPos: 'high' | 'mid' | 'low';
    arrowDirection?: 'up' | 'down';
  }[];
}

export const DynamicVariationTable: React.FC<DynamicVariationTableProps> = ({
  title = 'BẢNG BIẾN THIÊN ĐỘNG',
  points,
}) => {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Title */}
      <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {title}
        </span>
        <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
          Cập nhật tức thời
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center select-none min-w-[380px]">
          <tbody>
            {/* ROW 1: x */}
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <td className="w-14 py-2 font-serif italic text-slate-700 font-bold border-r border-slate-200 bg-slate-100/70 text-sm">
                x
              </td>
              {points.map((pt, idx) => (
                <td
                  key={`x-${idx}`}
                  className="py-2 px-2 text-xs font-semibold font-mono text-slate-800"
                >
                  {pt.x}
                </td>
              ))}
            </tr>

            {/* ROW 2: y' (Derivative) */}
            <tr className="border-b border-slate-200">
              <td className="w-14 py-2 font-serif italic text-slate-700 font-bold border-r border-slate-200 bg-slate-100/70 text-sm">
                y'
              </td>
              {points.map((pt, idx) => (
                <td
                  key={`deriv-${idx}`}
                  className="py-2 px-2 text-sm font-bold font-mono"
                >
                  {pt.deriv === '+' ? (
                    <span className="text-emerald-600 font-bold">+</span>
                  ) : pt.deriv === '-' ? (
                    <span className="text-rose-600 font-bold">-</span>
                  ) : pt.deriv === '0' ? (
                    <span className="text-indigo-600 font-bold">0</span>
                  ) : (
                    <span className="text-slate-500 font-normal">{pt.deriv}</span>
                  )}
                </td>
              ))}
            </tr>

            {/* ROW 3: y (Function behavior & arrows) */}
            <tr className="h-20 bg-white">
              <td className="w-14 py-2 font-serif italic text-slate-700 font-bold border-r border-slate-200 bg-slate-100/70 text-sm">
                y
              </td>
              {points.map((pt, idx) => (
                <td key={`y-${idx}`} className="py-2 px-1 relative h-20 align-top">
                  <div className="w-full h-full flex flex-col justify-between items-center py-1">
                    {/* Position: high */}
                    {pt.yPos === 'high' && (
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-indigo-700 font-mono bg-indigo-50/80 px-1.5 py-0.5 rounded">
                          {pt.yVal}
                        </span>
                        {pt.arrowDirection === 'down' && (
                          <ArrowDownRight className="w-4 h-4 text-rose-500 mt-2 animate-bounce" />
                        )}
                      </div>
                    )}

                    {/* Position: mid */}
                    {pt.yPos === 'mid' && (
                      <div className="my-auto flex flex-col items-center">
                        <span className="text-xs font-semibold text-slate-700 font-mono">
                          {pt.yVal}
                        </span>
                        {pt.arrowDirection === 'up' && (
                          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        )}
                        {pt.arrowDirection === 'down' && (
                          <ArrowDownRight className="w-4 h-4 text-rose-500" />
                        )}
                      </div>
                    )}

                    {/* Position: low */}
                    {pt.yPos === 'low' && (
                      <div className="mt-auto flex flex-col items-center">
                        {pt.arrowDirection === 'up' && (
                          <ArrowUpRight className="w-4 h-4 text-emerald-500 mb-2 animate-bounce" />
                        )}
                        <span className="text-xs font-bold text-indigo-700 font-mono bg-indigo-50/80 px-1.5 py-0.5 rounded">
                          {pt.yVal}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
