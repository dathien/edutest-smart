import React from 'react';

interface GeometryDiagramProps {
  type?: 'geometry' | 'function_curve' | 'variation_table' | 'coordinate_system' | 'custom_svg';
  data?: string;
  title?: string;
  className?: string;
}

export const GeometryDiagram: React.FC<GeometryDiagramProps> = ({
  type = 'geometry',
  data = 'pyramid',
  title,
  className = '',
}) => {
  if (type === 'variation_table') {
    return (
      <div className={`my-4 overflow-x-auto p-4 bg-white rounded-lg border border-slate-200 shadow-xs max-w-xl ${className}`}>
        {title && <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">{title}</div>}
        <table className="w-full text-center text-sm border-collapse border border-slate-300">
          <tbody>
            <tr className="border-b border-slate-300 bg-slate-50">
              <td className="w-16 py-2 px-3 font-semibold border-r border-slate-300 italic">x</td>
              <td className="py-2 px-3">$-\infty$</td>
              <td className="py-2 px-3">$-1$</td>
              <td className="py-2 px-3">$1$</td>
              <td className="py-2 px-3">$+\infty$</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="py-2 px-3 font-semibold border-r border-slate-300 italic">y'</td>
              <td className="py-2 px-3 text-emerald-600 font-bold">+</td>
              <td className="py-2 px-3 font-bold">0</td>
              <td className="py-2 px-3 text-rose-600 font-bold">-</td>
              <td className="py-2 px-3 font-bold">0</td>
              <td className="py-2 px-3 text-emerald-600 font-bold">+</td>
            </tr>
            <tr className="bg-slate-50/50">
              <td className="py-6 px-3 font-semibold border-r border-slate-300 italic">y</td>
              <td colSpan={5} className="py-2 px-4">
                <div className="flex items-center justify-between text-xs text-slate-700 h-16">
                  <div className="self-end">$-\infty$</div>
                  <div className="text-slate-400">↗</div>
                  <div className="self-start font-semibold text-indigo-700">2 <span className="text-[10px] block text-slate-400 font-normal">(CĐ)</span></div>
                  <div className="text-slate-400">↘</div>
                  <div className="self-end font-semibold text-rose-700">-2 <span className="text-[10px] block text-slate-400 font-normal">(CT)</span></div>
                  <div className="text-slate-400">↗</div>
                  <div className="self-start">$+\infty$</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (type === 'function_curve') {
    // Cubic graph y = x^3 - 3x
    return (
      <div className={`my-3 inline-block bg-white p-3 rounded-lg border border-slate-200 shadow-xs ${className}`}>
        {title && <div className="text-xs font-medium text-slate-600 mb-1">{title}</div>}
        <svg width="260" height="180" viewBox="0 0 260 180" className="mx-auto select-none">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="260" height="180" fill="url(#grid)" />
          
          {/* Axes */}
          <line x1="20" y1="90" x2="245" y2="90" stroke="#64748b" strokeWidth="1.5" />
          <polygon points="245,87 253,90 245,93" fill="#64748b" />
          <text x="245" y="105" fontSize="12" fill="#475569" fontStyle="italic">x</text>

          <line x1="130" y1="170" x2="130" y2="15" stroke="#64748b" strokeWidth="1.5" />
          <polygon points="127,15 130,7 133,15" fill="#64748b" />
          <text x="140" y="18" fontSize="12" fill="#475569" fontStyle="italic">y</text>
          <text x="118" y="104" fontSize="11" fill="#64748b">O</text>

          {/* Curve y = x^3 - 3x (scaled) */}
          <path
            d="M 45,165 C 75,160 85,45 100,50 C 115,55 120,85 130,90 C 140,95 145,125 160,130 C 175,135 185,20 215,15"
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Critical points & dashed lines */}
          <line x1="100" y1="50" x2="100" y2="90" stroke="#94a3b8" strokeDasharray="3,3" />
          <line x1="100" y1="50" x2="130" y2="50" stroke="#94a3b8" strokeDasharray="3,3" />
          <circle cx="100" cy="50" r="3.5" fill="#4338ca" />
          <text x="92" y="104" fontSize="10" fill="#64748b">-1</text>
          <text x="135" y="54" fontSize="10" fill="#64748b">2</text>

          <line x1="160" y1="130" x2="160" y2="90" stroke="#94a3b8" strokeDasharray="3,3" />
          <line x1="160" y1="130" x2="130" y2="130" stroke="#94a3b8" strokeDasharray="3,3" />
          <circle cx="160" cy="130" r="3.5" fill="#4338ca" />
          <text x="156" y="85" fontSize="10" fill="#64748b">1</text>
          <text x="135" y="134" fontSize="10" fill="#64748b">-2</text>
        </svg>
      </div>
    );
  }

  if (type === 'coordinate_system') {
    // 3D Oxyz coordinate frame
    return (
      <div className={`my-3 inline-block bg-white p-3 rounded-lg border border-slate-200 shadow-xs ${className}`}>
        {title && <div className="text-xs font-medium text-slate-600 mb-1">{title}</div>}
        <svg width="240" height="180" viewBox="0 0 240 180" className="mx-auto select-none">
          {/* Origin */}
          <text x="100" y="115" fontSize="11" fill="#475569">O</text>
          {/* Oz axis */}
          <line x1="110" y1="105" x2="110" y2="18" stroke="#1e293b" strokeWidth="1.5" />
          <polygon points="107,18 110,10 113,18" fill="#1e293b" />
          <text x="118" y="20" fontSize="12" fill="#1e293b" fontStyle="italic">z</text>

          {/* Oy axis */}
          <line x1="110" y1="105" x2="225" y2="105" stroke="#1e293b" strokeWidth="1.5" />
          <polygon points="225,102 233,105 225,108" fill="#1e293b" />
          <text x="228" y="122" fontSize="12" fill="#1e293b" fontStyle="italic">y</text>

          {/* Ox axis (projected forward-left) */}
          <line x1="110" y1="105" x2="30" y2="165" stroke="#1e293b" strokeWidth="1.5" />
          <polygon points="32,160 25,168 36,166" fill="#1e293b" />
          <text x="18" y="165" fontSize="12" fill="#1e293b" fontStyle="italic">x</text>

          {/* Point M(x, y, z) */}
          <line x1="60" y1="142" x2="140" y2="142" stroke="#94a3b8" strokeDasharray="3,3" />
          <line x1="140" y1="142" x2="190" y2="105" stroke="#94a3b8" strokeDasharray="3,3" />
          <line x1="140" y1="142" x2="140" y2="60" stroke="#94a3b8" strokeDasharray="3,3" />
          <circle cx="140" cy="60" r="4" fill="#6366f1" />
          <text x="148" y="58" fontSize="11" fill="#4338ca" fontWeight="bold">M(a; b; c)</text>
        </svg>
      </div>
    );
  }

  // Default: Spatial Geometry Pyramid S.ABCD
  return (
    <div className={`my-3 inline-block bg-white p-3 rounded-lg border border-slate-200 shadow-xs ${className}`}>
      {title && <div className="text-xs font-medium text-slate-600 mb-1">{title}</div>}
      <svg width="240" height="190" viewBox="0 0 240 190" className="mx-auto select-none">
        {/* Base ABCD */}
        {/* AB hidden (dashed) */}
        <line x1="50" y1="145" x2="115" y2="120" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />
        {/* BC */}
        <line x1="115" y1="120" x2="205" y2="120" stroke="#334155" strokeWidth="1.5" />
        {/* CD */}
        <line x1="205" y1="120" x2="140" y2="165" stroke="#334155" strokeWidth="1.5" />
        {/* DA */}
        <line x1="140" y1="165" x2="50" y2="145" stroke="#334155" strokeWidth="1.5" />

        {/* Altitude SH (dashed) if H is center or A is base */}
        <line x1="115" y1="25" x2="115" y2="120" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3,3" />

        {/* Edges from apex S(115, 25) */}
        <line x1="115" y1="25" x2="50" y2="145" stroke="#334155" strokeWidth="1.5" />
        <line x1="115" y1="25" x2="140" y2="165" stroke="#334155" strokeWidth="1.5" />
        <line x1="115" y1="25" x2="205" y2="120" stroke="#334155" strokeWidth="1.5" />

        {/* Vertex Labels */}
        <text x="110" y="18" fontSize="12" fill="#1e293b" fontWeight="bold">S</text>
        <text x="35" y="152" fontSize="12" fill="#1e293b">A</text>
        <text x="112" y="115" fontSize="12" fill="#1e293b">B</text>
        <text x="212" y="123" fontSize="12" fill="#1e293b">C</text>
        <text x="140" y="180" fontSize="12" fill="#1e293b">D</text>
      </svg>
    </div>
  );
};
