import React from 'react';
import { LabSimulationType } from './types';

interface LabVisualPreviewProps {
  simulationType: LabSimulationType;
  className?: string;
  height?: number;
}

export const LabVisualPreview: React.FC<LabVisualPreviewProps> = ({
  simulationType,
  className = '',
  height = 130,
}) => {
  switch (simulationType) {
    case 'parabola_2d':
      // Parabola y = 0.5(x-3)^2 - 1.5 in viewport [0, 160] x [0, 100]
      // Origin at (80, 75). Scale: 12px / unit
      // Vertex I(1, -2) -> SVG (80 + 1*12, 75 - (-2)*12) = (92, 99)
      return (
        <svg
          viewBox="0 0 200 120"
          className={`w-full overflow-hidden select-none ${className}`}
          style={{ height }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Subtle Grid */}
          <defs>
            <pattern id="grid-parabola" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="200" height="120" fill="url(#grid-parabola)" rx="12" />

          {/* Coordinate Axes */}
          <line x1="15" y1="80" x2="185" y2="80" stroke="#94a3b8" strokeWidth="1.2" />
          <polygon points="185,80 178,77 178,83" fill="#94a3b8" />
          <text x="187" y="83" fill="#64748b" fontSize="9" fontStyle="italic">x</text>

          <line x1="80" y1="110" x2="80" y2="10" stroke="#94a3b8" strokeWidth="1.2" />
          <polygon points="80,10 77,17 83,17" fill="#94a3b8" />
          <text x="83" y="14" fill="#64748b" fontSize="9" fontStyle="italic">y</text>
          <text x="73" y="90" fill="#94a3b8" fontSize="8" fontStyle="italic">O</text>

          {/* Axis of Symmetry x = 1 (at x=96) */}
          <line x1="100" y1="15" x2="100" y2="110" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" />
          <text x="103" y="24" fill="#94a3b8" fontSize="8" fontStyle="italic">x = 1</text>

          {/* Parabola curve: y = 0.045*(x - 100)^2 + 96 */}
          {/* x from 40 to 160 */}
          <path
            d="M 38 18 Q 100 135 162 18"
            fill="none"
            stroke="#4f46e5"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Vertex I(1, -2) at SVG (100, 96) */}
          <line x1="80" y1="96" x2="100" y2="96" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="100" cy="96" r="3.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
          <text x="105" y="99" fill="#e11d48" fontSize="9" fontWeight="bold">I(1,-2)</text>

          {/* Roots with Ox */}
          <circle cx="62" cy="80" r="2.5" fill="#059669" />
          <circle cx="138" cy="80" r="2.5" fill="#059669" />
        </svg>
      );

    case 'cubic_function_2d':
      // Cubic y = x^3 - 3x: Extrema at (-1, 2) and (1, -2). Tangent at (0,0)
      return (
        <svg
          viewBox="0 0 200 120"
          className={`w-full overflow-hidden select-none ${className}`}
          style={{ height }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="grid-cubic" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#f1f5f9" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="200" height="120" fill="url(#grid-cubic)" rx="12" />

          {/* Axes */}
          <line x1="15" y1="60" x2="185" y2="60" stroke="#94a3b8" strokeWidth="1.2" />
          <polygon points="185,60 178,57 178,63" fill="#94a3b8" />
          <text x="187" y="63" fill="#64748b" fontSize="9" fontStyle="italic">x</text>

          <line x1="100" y1="110" x2="100" y2="10" stroke="#94a3b8" strokeWidth="1.2" />
          <polygon points="100,10 97,17 103,17" fill="#94a3b8" />
          <text x="103" y="14" fill="#64748b" fontSize="9" fontStyle="italic">y</text>
          <text x="91" y="70" fill="#94a3b8" fontSize="8" fontStyle="italic">O</text>

          {/* Tangent line at (0, 0) */}
          <line x1="60" y1="105" x2="140" y2="15" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="135" y="24" fill="#d97706" fontSize="8" fontWeight="bold">y = kx</text>

          {/* Cubic curve */}
          <path
            d="M 40 110 C 65 15, 75 25, 100 60 C 125 95, 135 105, 160 10"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Critical Point Max (-1, 2) at (72, 32) */}
          <circle cx="72" cy="32" r="3.2" fill="#e11d48" stroke="#ffffff" strokeWidth="1.5" />
          <text x="56" y="27" fill="#be123c" fontSize="8" fontWeight="bold">CĐ</text>

          {/* Critical Point Min (1, -2) at (128, 88) */}
          <circle cx="128" cy="88" r="3.2" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
          <text x="133" y="93" fill="#0369a1" fontSize="8" fontWeight="bold">CT</text>

          {/* Inflection / Tangent point M(0, 0) */}
          <circle cx="100" cy="60" r="3" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
        </svg>
      );

    case 'trig_exponential_2d':
      // Unit circle + Sine wave + Exponential curve
      return (
        <svg
          viewBox="0 0 200 120"
          className={`w-full overflow-hidden select-none ${className}`}
          style={{ height }}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width="200" height="120" fill="#f8fafc" rx="12" />

          {/* Left: Unit Circle */}
          <circle cx="48" cy="60" r="28" fill="none" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="14" y1="60" x2="82" y2="60" stroke="#94a3b8" strokeWidth="1" />
          <line x1="48" y1="94" x2="48" y2="26" stroke="#94a3b8" strokeWidth="1" />
          <line x1="48" y1="60" x2="70" y2="42" stroke="#d97706" strokeWidth="1.8" />
          <circle cx="70" cy="42" r="3" fill="#d97706" />
          <text x="52" y="55" fill="#d97706" fontSize="8" fontStyle="italic">α</text>

          {/* Connector dashed line from circle to wave */}
          <line x1="70" y1="42" x2="116" y2="42" stroke="#93c5fd" strokeWidth="1" strokeDasharray="2 2" />

          {/* Right: Wave axes */}
          <line x1="90" y1="60" x2="190" y2="60" stroke="#94a3b8" strokeWidth="1" />
          <line x1="100" y1="105" x2="100" y2="15" stroke="#94a3b8" strokeWidth="1" />

          {/* Sine Wave */}
          <path
            d="M 100 60 Q 115 25, 130 60 T 160 60 T 190 60"
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.2"
          />
          <circle cx="116" cy="42" r="3" fill="#2563eb" />

          {/* Exponential curve */}
          <path
            d="M 102 98 Q 130 92, 145 60 T 170 18"
            fill="none"
            stroke="#e11d48"
            strokeWidth="1.8"
            strokeDasharray="4 2"
          />
          <text x="172" y="24" fill="#e11d48" fontSize="8" fontWeight="bold">aˣ</text>
        </svg>
      );

    case 'linear_inequalities_2d':
      // Feasible region polygon OABC
      return (
        <svg
          viewBox="0 0 200 120"
          className={`w-full overflow-hidden select-none ${className}`}
          style={{ height }}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width="200" height="120" fill="#f8fafc" rx="12" />

          {/* Axes */}
          <line x1="25" y1="95" x2="185" y2="95" stroke="#94a3b8" strokeWidth="1.2" />
          <polygon points="185,95 178,92 178,98" fill="#94a3b8" />
          <line x1="45" y1="110" x2="45" y2="15" stroke="#94a3b8" strokeWidth="1.2" />
          <polygon points="45,15 42,22 48,22" fill="#94a3b8" />
          <text x="35" y="103" fill="#94a3b8" fontSize="8">O</text>

          {/* Shaded Feasible Polygon: O(45, 95) -> A(120, 95) -> B(100, 60) -> C(45, 40) */}
          <polygon
            points="45,95 125,95 105,55 45,40"
            fill="#10b981"
            fillOpacity="0.35"
            stroke="#059669"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Boundary lines */}
          <line x1="30" y1="35" x2="165" y2="105" stroke="#3b82f6" strokeWidth="1.5" />
          <line x1="35" y1="20" x2="135" y2="105" stroke="#8b5cf6" strokeWidth="1.5" />

          {/* Objective level line F = C */}
          <line x1="60" y1="108" x2="145" y2="40" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 2" />

          {/* Vertices */}
          <circle cx="45" cy="95" r="2.5" fill="#1e293b" />
          <circle cx="125" cy="95" r="2.5" fill="#1e293b" />
          <text x="126" y="92" fill="#1e293b" fontSize="8" fontWeight="bold">A</text>
          <circle cx="105" cy="55" r="3" fill="#059669" stroke="#ffffff" strokeWidth="1" />
          <text x="110" y="55" fill="#047857" fontSize="8" fontWeight="bold">B(max)</text>
          <circle cx="45" cy="40" r="2.5" fill="#1e293b" />
          <text x="35" y="38" fill="#1e293b" fontSize="8" fontWeight="bold">C</text>

          {/* Test point M inside */}
          <circle cx="75" cy="70" r="3" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
          <text x="80" y="73" fill="#065f46" fontSize="8" fontWeight="bold">M ∈ D</text>
        </svg>
      );

    case 'coordinate_system_3d':
      // Isometric 3D axes Oxyz + Point M(x, y, z) + Box projection frame
      return (
        <svg
          viewBox="0 0 200 120"
          className={`w-full overflow-hidden select-none ${className}`}
          style={{ height }}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width="200" height="120" fill="#f8fafc" rx="12" />

          {/* 3D Origin O at (90, 75) */}
          {/* Ox (Red) -> pointing down-left: (90, 75) to (35, 105) */}
          <line x1="90" y1="75" x2="35" y2="105" stroke="#ef4444" strokeWidth="1.6" />
          <polygon points="35,105 44,103 40,97" fill="#ef4444" />
          <text x="25" y="112" fill="#ef4444" fontSize="9" fontWeight="bold">x</text>

          {/* Oy (Green) -> pointing right: (90, 75) to (175, 75) */}
          <line x1="90" y1="75" x2="175" y2="75" stroke="#10b981" strokeWidth="1.6" />
          <polygon points="175,75 168,72 168,78" fill="#10b981" />
          <text x="178" y="78" fill="#10b981" fontSize="9" fontWeight="bold">y</text>

          {/* Oz (Blue) -> pointing straight up: (90, 75) to (90, 15) */}
          <line x1="90" y1="75" x2="90" y2="15" stroke="#3b82f6" strokeWidth="1.6" />
          <polygon points="90,15 87,22 93,22" fill="#3b82f6" />
          <text x="94" y="16" fill="#3b82f6" fontSize="9" fontWeight="bold">z</text>
          <text x="81" y="83" fill="#64748b" fontSize="8" fontStyle="italic">O</text>

          {/* 3D Projection Box for M(2, 3, 4) */}
          {/* M position: (90 - 25 + 45, 75 + 15 - 45) = (110, 45) */}
          <line x1="90" y1="75" x2="60" y2="92" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="60" y1="92" x2="115" y2="92" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="115" y1="92" x2="145" y2="75" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />

          {/* Vertical pillars */}
          <line x1="115" y1="92" x2="115" y2="40" stroke="#6366f1" strokeWidth="1.2" strokeDasharray="2 2" />
          <line x1="60" y1="92" x2="60" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="90" y1="75" x2="90" y2="23" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="145" y1="75" x2="145" y2="23" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />

          {/* Top face */}
          <line x1="60" y1="40" x2="90" y2="23" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="90" y1="23" x2="145" y2="23" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="60" y1="40" x2="115" y2="40" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="115" y1="40" x2="145" y2="23" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />

          {/* Vector OM */}
          <line x1="90" y1="75" x2="115" y2="40" stroke="#f59e0b" strokeWidth="2.2" />
          <polygon points="115,40 109,47 114,48" fill="#f59e0b" />

          {/* Point M */}
          <circle cx="115" cy="40" r="3.5" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
          <text x="120" y="38" fill="#4338ca" fontSize="9" fontWeight="bold">M(x,y,z)</text>
          <circle cx="115" cy="92" r="2.2" fill="#475569" />
          <text x="117" y="101" fill="#64748b" fontSize="7">M_xy</text>
        </svg>
      );

    case 'lines_planes_3d':
      // Plane (P) translucent + Line (d) penetrating at intersection point I
      return (
        <svg
          viewBox="0 0 200 120"
          className={`w-full overflow-hidden select-none ${className}`}
          style={{ height }}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width="200" height="120" fill="#f8fafc" rx="12" />

          {/* Plane (P) parallelogram */}
          <polygon
            points="40,85 140,85 170,45 70,45"
            fill="#0284c7"
            fillOpacity="0.25"
            stroke="#0284c7"
            strokeWidth="1.8"
          />
          <text x="50" y="80" fill="#0369a1" fontSize="9" fontWeight="bold">(P)</text>

          {/* Normal vector n */}
          <line x1="105" y1="65" x2="105" y2="25" stroke="#ef4444" strokeWidth="1.8" />
          <polygon points="105,25 102,32 108,32" fill="#ef4444" />
          <text x="110" y="30" fill="#dc2626" fontSize="9" fontWeight="bold">n</text>

          {/* Line (d) top part */}
          <line x1="75" y1="15" x2="105" y2="65" stroke="#9333ea" strokeWidth="2.2" />
          {/* Line (d) hidden/penetrated part */}
          <line x1="105" y1="65" x2="115" y2="82" stroke="#9333ea" strokeWidth="1.5" strokeDasharray="3 2" />
          {/* Line (d) bottom emerge */}
          <line x1="115" y1="82" x2="135" y2="115" stroke="#9333ea" strokeWidth="2.2" />
          <text x="68" y="20" fill="#7e22ce" fontSize="9" fontWeight="bold">(d)</text>

          {/* Intersection Point I */}
          <circle cx="105" cy="65" r="3.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
          <text x="111" y="68" fill="#e11d48" fontSize="8" fontWeight="bold">I(giao điểm)</text>

          {/* Angle arc */}
          <path d="M 98 53 A 12 12 0 0 1 105 53" fill="none" stroke="#d97706" strokeWidth="1.2" />
          <text x="96" y="47" fill="#b45309" fontSize="8" fontStyle="italic">φ</text>
        </svg>
      );

    case 'pyramid_polyhedra_3d':
      // Pyramid S.ABCD with altitude SH
      return (
        <svg
          viewBox="0 0 200 120"
          className={`w-full overflow-hidden select-none ${className}`}
          style={{ height }}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width="200" height="120" fill="#f8fafc" rx="12" />

          {/* Apex S: (100, 20) */}
          {/* Base A(45, 80), B(85, 105), C(160, 95), D(120, 70) */}
          {/* Foot H(100, 85) */}

          {/* Hidden base edges: AD, CD */}
          <line x1="45" y1="80" x2="120" y2="70" stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="3 3" />
          <line x1="120" y1="70" x2="160" y2="95" stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="3 3" />

          {/* Hidden lateral edge: SD */}
          <line x1="100" y1="20" x2="120" y2="70" stroke="#94a3b8" strokeWidth="1.4" strokeDasharray="3 3" />

          {/* Altitude SH (red dashed) */}
          <line x1="100" y1="20" x2="100" y2="85" stroke="#dc2626" strokeWidth="1.6" strokeDasharray="3 2" />
          <circle cx="100" cy="85" r="2" fill="#dc2626" />
          <text x="103" y="88" fill="#dc2626" fontSize="7" fontWeight="bold">H</text>

          {/* Base translucent fill */}
          <polygon points="45,80 85,105 160,95 120,70" fill="#6366f1" fillOpacity="0.15" />

          {/* Visible base edges: AB, BC */}
          <line x1="45" y1="80" x2="85" y2="105" stroke="#334155" strokeWidth="1.8" />
          <line x1="85" y1="105" x2="160" y2="95" stroke="#334155" strokeWidth="1.8" />

          {/* Visible lateral edges: SA, SB, SC */}
          <line x1="100" y1="20" x2="45" y2="80" stroke="#334155" strokeWidth="1.8" />
          <line x1="100" y1="20" x2="85" y2="105" stroke="#334155" strokeWidth="1.8" />
          <line x1="100" y1="20" x2="160" y2="95" stroke="#334155" strokeWidth="1.8" />

          {/* Vertices */}
          <circle cx="100" cy="20" r="3.5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
          <text x="96" y="14" fill="#dc2626" fontSize="9" fontWeight="bold">S</text>

          <text x="35" y="82" fill="#1e293b" fontSize="8" fontWeight="bold">A</text>
          <text x="82" y="115" fill="#1e293b" fontSize="8" fontWeight="bold">B</text>
          <text x="164" y="98" fill="#1e293b" fontSize="8" fontWeight="bold">C</text>
          <text x="122" y="68" fill="#64748b" fontSize="8" fontWeight="bold">D</text>

          <text x="145" y="45" fill="#4f46e5" fontSize="8" fontWeight="bold">V = ⅓S·h</text>
        </svg>
      );

    case 'cross_section_3d':
      // Polyhedron cut by slicing plane (alpha) -> polygon section
      return (
        <svg
          viewBox="0 0 200 120"
          className={`w-full overflow-hidden select-none ${className}`}
          style={{ height }}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width="200" height="120" fill="#f8fafc" rx="12" />

          {/* Pyramid wireframe background */}
          <line x1="100" y1="15" x2="50" y2="95" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="100" y1="15" x2="90" y2="110" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="100" y1="15" x2="160" y2="100" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="100" y1="15" x2="120" y2="80" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="50" y1="95" x2="90" y2="110" stroke="#cbd5e1" strokeWidth="1.2" />
          <line x1="90" y1="110" x2="160" y2="100" stroke="#cbd5e1" strokeWidth="1.2" />

          {/* Slicing plane (alpha) disc/plane */}
          <polygon
            points="35,65 135,78 175,45 75,32"
            fill="#06b6d4"
            fillOpacity="0.3"
            stroke="#0891b2"
            strokeWidth="1.2"
          />
          <text x="32" y="60" fill="#0891b2" fontSize="9" fontWeight="bold">(α)</text>

          {/* Section Polygon (Intersection with SA, SB, SC, SD) */}
          {/* M1 on SA(72, 60), M2 on SB(94, 69), M3 on SC(134, 63), M4 on SD(111, 44) */}
          <polygon
            points="72,58 94,69 134,63 111,46"
            fill="#f43f5e"
            fillOpacity="0.45"
            stroke="#e11d48"
            strokeWidth="2"
            strokeLinejoin="round"
          />

          <circle cx="72" cy="58" r="2.5" fill="#e11d48" />
          <circle cx="94" cy="69" r="2.5" fill="#e11d48" />
          <circle cx="134" cy="63" r="2.5" fill="#e11d48" />
          <circle cx="111" cy="46" r="2.5" fill="#e11d48" />

          <text x="140" y="55" fill="#be123c" fontSize="8" fontWeight="bold">Thiết diện S_α</text>
          <circle cx="100" cy="15" r="3" fill="#ef4444" />
          <text x="96" y="11" fill="#ef4444" fontSize="8" fontWeight="bold">S</text>
        </svg>
      );

    default:
      return null;
  }
};
