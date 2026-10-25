import React, { useState } from 'react';

export type GeometryModelType =
  | 'pyramid_quad' // S.ABCD
  | 'pyramid_tri' // S.ABC
  | 'prism_tri' // ABC.A'B'C'
  | 'cuboid' // ABCD.A'B'C'D'
  | 'cone' // Nón tròn xoay
  | 'cylinder' // Trụ tròn xoay
  | 'sphere' // Mặt cầu
  | 'triangle_right' // Tam giác vuông
  | 'circle_tangent' // Đường tròn & tiếp tuyến
  | 'oxyz'; // Hệ toạ độ Oxyz

export interface GeometryRendererProps {
  model?: GeometryModelType;
  title?: string;
  allowTeacherCustomization?: boolean;
  className?: string;
}

export const GeometryRenderer: React.FC<GeometryRendererProps> = ({
  model = 'pyramid_quad',
  title,
  allowTeacherCustomization = false,
  className = '',
}) => {
  const [selectedModel, setSelectedModel] = useState<GeometryModelType>(model);
  const [showAltitude, setShowAltitude] = useState(true);
  const [showAngleMarker, setShowAngleMarker] = useState(true);

  const width = 300;
  const height = 240;

  // Render SVG based on selectedModel
  const renderGeometrySvg = () => {
    switch (selectedModel) {
      case 'pyramid_tri': {
        // Chóp tam giác S.ABC
        return (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Base ABC: AC is hidden (dashed) */}
            <line x1="60" y1="180" x2="160" y2="155" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />
            <line x1="160" y1="155" x2="240" y2="185" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="240" y1="185" x2="60" y2="180" stroke="#1e293b" strokeWidth="1.8" />

            {/* Altitude SH (dashed) */}
            {showAltitude && (
              <>
                <line x1="150" y1="35" x2="150" y2="170" stroke="#ef4444" strokeWidth="1.4" strokeDasharray="3,3" />
                <rect x="145" y="165" width="5" height="5" fill="none" stroke="#ef4444" strokeWidth="1" />
                <text x="154" y="178" fontSize="11" fill="#ef4444" fontWeight="600">H</text>
              </>
            )}

            {/* Lateral edges SA, SB, SC */}
            <line x1="150" y1="35" x2="60" y2="180" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="150" y1="35" x2="240" y2="185" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="150" y1="35" x2="160" y2="155" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />

            {/* Labels */}
            <text x="146" y="26" fontSize="12" fill="#0f172a" fontWeight="bold">S</text>
            <text x="44" y="186" fontSize="12" fill="#0f172a" fontWeight="600">A</text>
            <text x="160" y="148" fontSize="12" fill="#0f172a" fontWeight="600">C</text>
            <text x="248" y="190" fontSize="12" fill="#0f172a" fontWeight="600">B</text>
          </svg>
        );
      }

      case 'prism_tri': {
        // Lăng trụ tam giác ABC.A'B'C'
        return (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Top base A'B'C' */}
            <polygon points="60,65 170,45 235,75" fill="none" stroke="#1e293b" strokeWidth="1.8" />
            {/* Bottom base ABC */}
            <line x1="60" y1="185" x2="170" y2="165" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />
            <line x1="170" y1="165" x2="235" y2="195" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="235" y1="195" x2="60" y2="185" stroke="#1e293b" strokeWidth="1.8" />

            {/* Lateral edges AA', BB', CC' */}
            <line x1="60" y1="65" x2="60" y2="185" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="235" y1="75" x2="235" y2="195" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="170" y1="45" x2="170" y2="165" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />

            {/* Labels */}
            <text x="45" y="65" fontSize="11" fill="#0f172a" fontWeight="bold">A'</text>
            <text x="170" y="38" fontSize="11" fill="#0f172a" fontWeight="bold">C'</text>
            <text x="242" y="75" fontSize="11" fill="#0f172a" fontWeight="bold">B'</text>
            <text x="45" y="192" fontSize="11" fill="#0f172a" fontWeight="bold">A</text>
            <text x="170" y="160" fontSize="11" fill="#0f172a" fontWeight="bold">C</text>
            <text x="242" y="202" fontSize="11" fill="#0f172a" fontWeight="bold">B</text>
          </svg>
        );
      }

      case 'cuboid': {
        // Khối hộp chữ nhật ABCD.A'B'C'D'
        return (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Front rectangle ABB'A' */}
            <rect x="55" y="90" width="130" height="95" fill="none" stroke="#1e293b" strokeWidth="1.8" />
            {/* Top base edges */}
            <line x1="55" y1="90" x2="115" y2="45" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="185" y1="90" x2="245" y2="45" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="115" y1="45" x2="245" y2="45" stroke="#1e293b" strokeWidth="1.8" />
            {/* Right edge */}
            <line x1="245" y1="45" x2="245" y2="140" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="185" y1="185" x2="245" y2="140" stroke="#1e293b" strokeWidth="1.8" />
            {/* Hidden edges (dashed) */}
            <line x1="55" y1="185" x2="115" y2="140" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />
            <line x1="115" y1="140" x2="245" y2="140" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />
            <line x1="115" y1="140" x2="115" y2="45" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />

            {/* Labels */}
            <text x="40" y="88" fontSize="11" fill="#0f172a" fontWeight="bold">A'</text>
            <text x="188" y="88" fontSize="11" fill="#0f172a" fontWeight="bold">B'</text>
            <text x="250" y="44" fontSize="11" fill="#0f172a" fontWeight="bold">C'</text>
            <text x="110" y="38" fontSize="11" fill="#0f172a" fontWeight="bold">D'</text>
            <text x="40" y="195" fontSize="11" fill="#0f172a" fontWeight="bold">A</text>
            <text x="188" y="198" fontSize="11" fill="#0f172a" fontWeight="bold">B</text>
            <text x="250" y="145" fontSize="11" fill="#0f172a" fontWeight="bold">C</text>
            <text x="105" y="136" fontSize="11" fill="#0f172a" fontWeight="bold">D</text>
          </svg>
        );
      }

      case 'cone': {
        // Khối nón tròn xoay (đỉnh S, trục SO)
        return (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Outline generator lines SA, SB */}
            <line x1="150" y1="35" x2="65" y2="185" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="150" y1="35" x2="235" y2="185" stroke="#1e293b" strokeWidth="1.8" />

            {/* Base ellipse: back half dashed, front half solid */}
            <path d="M 65,185 A 85,25 0 0,1 235,185" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />
            <path d="M 65,185 A 85,25 0 0,0 235,185" fill="none" stroke="#1e293b" strokeWidth="1.8" />

            {/* Axis SO (dashed) */}
            <line x1="150" y1="35" x2="150" y2="185" stroke="#ef4444" strokeWidth="1.4" strokeDasharray="3,3" />
            {/* Radius OA */}
            <line x1="150" y1="185" x2="235" y2="185" stroke="#2563eb" strokeWidth="1.4" strokeDasharray="3,3" />

            <circle cx="150" cy="185" r="3" fill="#1e293b" />
            <text x="146" y="25" fontSize="12" fill="#0f172a" fontWeight="bold">S</text>
            <text x="144" y="202" fontSize="11" fill="#0f172a" fontWeight="600">O</text>
            <text x="50" y="190" fontSize="11" fill="#0f172a" fontWeight="600">A</text>
            <text x="242" y="190" fontSize="11" fill="#0f172a" fontWeight="600">B</text>
            <text x="185" y="180" fontSize="10" fill="#2563eb" fontWeight="bold">R</text>
            <text x="155" y="115" fontSize="10" fill="#ef4444" fontWeight="bold">h</text>
          </svg>
        );
      }

      case 'cylinder': {
        // Khối trụ tròn xoay
        return (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Top base ellipse (fully visible) */}
            <ellipse cx="150" cy="55" rx="80" ry="22" fill="none" stroke="#1e293b" strokeWidth="1.8" />
            <circle cx="150" cy="55" r="2.5" fill="#1e293b" />
            <text x="154" y="55" fontSize="11" fill="#0f172a" fontWeight="bold">O'</text>

            {/* Lateral sides */}
            <line x1="70" y1="55" x2="70" y2="185" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="230" y1="55" x2="230" y2="185" stroke="#1e293b" strokeWidth="1.8" />

            {/* Bottom base ellipse */}
            <path d="M 70,185 A 80,22 0 0,1 230,185" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />
            <path d="M 70,185 A 80,22 0 0,0 230,185" fill="none" stroke="#1e293b" strokeWidth="1.8" />

            {/* Axis OO' (dashed) */}
            <line x1="150" y1="55" x2="150" y2="185" stroke="#ef4444" strokeWidth="1.4" strokeDasharray="3,3" />
            <circle cx="150" cy="185" r="2.5" fill="#1e293b" />
            <text x="154" y="190" fontSize="11" fill="#0f172a" fontWeight="bold">O</text>
          </svg>
        );
      }

      case 'sphere': {
        // Mặt cầu
        return (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <circle cx="150" cy="120" r="75" fill="none" stroke="#1e293b" strokeWidth="2" />
            {/* Equatorial ellipse */}
            <path d="M 75,120 A 75,22 0 0,1 225,120" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />
            <path d="M 75,120 A 75,22 0 0,0 225,120" fill="none" stroke="#1e293b" strokeWidth="1.8" />

            {/* Radius R */}
            <line x1="150" y1="120" x2="205" y2="67" stroke="#2563eb" strokeWidth="1.6" />
            <circle cx="150" cy="120" r="3" fill="#1e293b" />
            <text x="138" y="120" fontSize="11" fill="#0f172a" fontWeight="bold">O</text>
            <text x="175" y="88" fontSize="11" fill="#2563eb" fontWeight="bold">R</text>
          </svg>
        );
      }

      case 'triangle_right': {
        // Tam giác vuông ABC vuông tại A, đường cao AH
        return (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <polygon points="65,185 65,65 245,185" fill="none" stroke="#1e293b" strokeWidth="2" />
            {/* Right angle marker at A */}
            <rect x="65" y="170" width="15" height="15" fill="none" stroke="#1e293b" strokeWidth="1.4" />

            {/* Altitude AH */}
            {showAltitude && (
              <>
                <line x1="65" y1="185" x2="137" y2="113" stroke="#ef4444" strokeWidth="1.5" />
                <rect x="130" y="115" width="8" height="8" fill="none" stroke="#ef4444" strokeWidth="1.2" transform="rotate(-34 130 115)" />
                <text x="142" y="112" fontSize="11" fill="#ef4444" fontWeight="bold">H</text>
              </>
            )}

            {/* Labels */}
            <text x="46" y="195" fontSize="12" fill="#0f172a" fontWeight="bold">A</text>
            <text x="56" y="55" fontSize="12" fill="#0f172a" fontWeight="bold">B</text>
            <text x="252" y="192" fontSize="12" fill="#0f172a" fontWeight="bold">C</text>
          </svg>
        );
      }

      case 'circle_tangent': {
        // Đường tròn (O) và tiếp tuyến Ax
        return (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <circle cx="150" cy="120" r="65" fill="none" stroke="#1e293b" strokeWidth="2" />
            <circle cx="150" cy="120" r="3" fill="#1e293b" />
            <text x="140" y="115" fontSize="11" fill="#0f172a" fontWeight="bold">O</text>

            {/* Tangent line at A(150, 185) */}
            <line x1="55" y1="185" x2="255" y2="185" stroke="#2563eb" strokeWidth="1.8" />
            <line x1="150" y1="120" x2="150" y2="185" stroke="#ef4444" strokeWidth="1.5" />
            <rect x="140" y="175" width="10" height="10" fill="none" stroke="#1e293b" strokeWidth="1.2" />

            <text x="154" y="180" fontSize="11" fill="#0f172a" fontWeight="bold">A</text>
            <text x="255" y="180" fontSize="11" fill="#2563eb" fontWeight="bold">d</text>
            <text x="155" y="150" fontSize="10" fill="#ef4444" fontWeight="bold">R</text>
          </svg>
        );
      }

      case 'oxyz': {
        // Hệ toạ độ Oxyz không gian chuẩn
        return (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Origin */}
            <text x="118" y="132" fontSize="12" fill="#475569" fontWeight="bold">O</text>

            {/* Oz axis */}
            <line x1="130" y1="125" x2="130" y2="25" stroke="#0f172a" strokeWidth="2" />
            <polygon points="126,25 130,15 134,25" fill="#0f172a" />
            <text x="138" y="28" fontSize="13" fill="#0f172a" fontStyle="italic" fontWeight="bold">z</text>

            {/* Oy axis */}
            <line x1="130" y1="125" x2="265" y2="125" stroke="#0f172a" strokeWidth="2" />
            <polygon points="265,121 275,125 265,129" fill="#0f172a" />
            <text x="272" y="145" fontSize="13" fill="#0f172a" fontStyle="italic" fontWeight="bold">y</text>

            {/* Ox axis (oblique perspective) */}
            <line x1="130" y1="125" x2="40" y2="195" stroke="#0f172a" strokeWidth="2" />
            <polygon points="42,188 32,202 48,196" fill="#0f172a" />
            <text x="22" y="202" fontSize="13" fill="#0f172a" fontStyle="italic" fontWeight="bold">x</text>

            {/* Point M(x, y, z) */}
            <line x1="75" y1="168" x2="175" y2="168" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3,3" />
            <line x1="175" y1="168" x2="230" y2="125" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3,3" />
            <line x1="175" y1="168" x2="175" y2="65" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3,3" />
            <circle cx="175" cy="65" r="4" fill="#4f46e5" stroke="#ffffff" strokeWidth="1.5" />
            <text x="182" y="62" fontSize="11" fill="#4f46e5" fontWeight="bold">M(x; y; z)</text>
          </svg>
        );
      }

      case 'pyramid_quad':
      default: {
        // Chóp tứ giác S.ABCD
        return (
          <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Base ABCD: AD hidden (dashed) */}
            <line x1="55" y1="165" x2="130" y2="135" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />
            <line x1="130" y1="135" x2="245" y2="135" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="245" y1="135" x2="170" y2="195" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="170" y1="195" x2="55" y2="165" stroke="#1e293b" strokeWidth="1.8" />

            {/* Altitude SH (dashed) */}
            {showAltitude && (
              <>
                <line x1="130" y1="35" x2="130" y2="135" stroke="#ef4444" strokeWidth="1.4" strokeDasharray="3,3" />
                <rect x="130" y="130" width="6" height="6" fill="none" stroke="#ef4444" strokeWidth="1" />
              </>
            )}

            {/* Edges from apex S(130, 35) */}
            <line x1="130" y1="35" x2="55" y2="165" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="130" y1="35" x2="170" y2="195" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="130" y1="35" x2="245" y2="135" stroke="#1e293b" strokeWidth="1.8" />
            <line x1="130" y1="35" x2="130" y2="135" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4,4" />

            {/* Vertex Labels */}
            <text x="126" y="24" fontSize="12" fill="#0f172a" fontWeight="bold">S</text>
            <text x="38" y="170" fontSize="12" fill="#0f172a" fontWeight="bold">A</text>
            <text x="170" y="212" fontSize="12" fill="#0f172a" fontWeight="bold">B</text>
            <text x="254" y="140" fontSize="12" fill="#0f172a" fontWeight="bold">C</text>
            <text x="126" y="128" fontSize="12" fill="#0f172a" fontWeight="bold">D</text>
          </svg>
        );
      }
    }
  };

  return (
    <div className={`my-3 inline-block bg-white p-4 rounded-xl border border-slate-300 shadow-sm max-w-full overflow-hidden select-none ${className}`}>
      {/* Title & Teacher Controls Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            {title || 'Hình học chuẩn SGK'}
          </span>
          <span className="text-[11px] text-slate-500">
            Nét đứt cho cạnh khuất, nét liền cho cạnh thấy
          </span>
        </div>

        {/* Teacher Model Switcher */}
        {allowTeacherCustomization && (
          <div className="flex items-center gap-1.5">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as GeometryModelType)}
              className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700"
            >
              <option value="pyramid_quad">Chóp tứ giác S.ABCD</option>
              <option value="pyramid_tri">Chóp tam giác S.ABC</option>
              <option value="prism_tri">Lăng trụ ABC.A'B'C'</option>
              <option value="cuboid">Khối hộp chữ nhật</option>
              <option value="cone">Khối nón tròn xoay</option>
              <option value="cylinder">Khối trụ tròn xoay</option>
              <option value="sphere">Mặt cầu (O; R)</option>
              <option value="triangle_right">Tam giác vuông (đường cao AH)</option>
              <option value="circle_tangent">Đường tròn & tiếp tuyến</option>
              <option value="oxyz">Toạ độ không gian Oxyz</option>
            </select>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="flex justify-center py-1">
        {renderGeometrySvg()}
      </div>

      {/* Teacher Options Footer */}
      {allowTeacherCustomization && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showAltitude}
              onChange={(e) => setShowAltitude(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>Đường cao / Trục</span>
          </label>

          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
            SVG Vector chuẩn tỉ lệ
          </span>
        </div>
      )}
    </div>
  );
};
