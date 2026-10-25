import React from 'react';
import { MathRenderer } from './MathRenderer';

export interface SignTableProps {
  label?: string; // e.g. "f'(x)" or "x^2 - 4x + 3"
  xPoints?: string[]; // e.g. ["-\\infty", "1", "3", "+\\infty"]
  signs?: string[]; // e.g. ["+", "0", "-", "0", "+"]
  className?: string;
  title?: string;
}

export const SignTableRenderer: React.FC<SignTableProps> = ({
  label = "f'(x)",
  xPoints = ['-\\infty', '-1', '2', '+\\infty'],
  signs = ['+', '0', '-', '0', '+'],
  className = '',
  title,
}) => {
  return (
    <div className={`my-3 inline-block max-w-full bg-white rounded-xl border border-slate-300 shadow-2xs p-3.5 overflow-x-auto select-none ${className}`}>
      {title && (
        <div className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider text-left border-b border-slate-100 pb-1">
          {title}
        </div>
      )}

      <table className="border-collapse border border-slate-400 text-slate-900 bg-white min-w-[380px] w-full text-center text-sm font-sans">
        <tbody>
          {/* Row 1: x variable and boundary points */}
          <tr className="border-b border-slate-400 bg-slate-50/70">
            <td className="w-20 py-2 px-3 font-bold border-r border-slate-400 italic font-serif text-base bg-slate-100/60">
              x
            </td>
            {xPoints.map((pt, idx) => (
              <td key={idx} className="py-2 px-3 font-medium min-w-[65px]">
                <MathRenderer content={`$${pt}$`} inline />
              </td>
            ))}
          </tr>

          {/* Row 2: Expression / Derivative Signs */}
          <tr>
            <td className="w-20 py-2.5 px-3 font-bold border-r border-slate-400 font-serif text-sm bg-slate-100/60 text-indigo-900">
              <MathRenderer content={`$${label}$`} inline />
            </td>
            <td colSpan={xPoints.length} className="py-2.5 px-3">
              <div className="flex items-center justify-around font-bold text-base">
                {signs.map((s, idx) => (
                  <span
                    key={idx}
                    className={`font-mono text-base ${
                      s === '+'
                        ? 'text-emerald-700 font-extrabold'
                        : s === '-'
                        ? 'text-rose-700 font-extrabold'
                        : s === '0'
                        ? 'text-slate-800 font-semibold'
                        : 'text-amber-700 font-black tracking-widest'
                    }`}
                  >
                    {s === '||' ? '║' : s}
                  </span>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="mt-1.5 text-[10px] text-slate-400 italic text-right">
        * Bảng xét dấu chuẩn xác định dấu nhị thức bậc nhất & tam thức bậc hai
      </div>
    </div>
  );
};
