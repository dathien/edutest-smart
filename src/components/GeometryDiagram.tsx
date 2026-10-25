import React from 'react';
import { VariationTableRenderer } from './VariationTableRenderer';
import { FunctionGraphRenderer } from './FunctionGraphRenderer';
import { GeometryRenderer, GeometryModelType } from './GeometryRenderer';
import { SignTableRenderer } from './SignTableRenderer';

export interface GeometryDiagramProps {
  type?: 'geometry' | 'function_curve' | 'variation_table' | 'coordinate_system' | 'custom_variation_table' | 'sign_table' | 'custom_svg';
  data?: string;
  title?: string;
  className?: string;
  allowAdjust?: boolean;
}

export const GeometryDiagram: React.FC<GeometryDiagramProps> = ({
  type = 'geometry',
  data = 'pyramid_quad',
  title,
  className = '',
  allowAdjust = false,
}) => {
  // Parse data if JSON
  let parsedJson: any = null;
  if (data && typeof data === 'string' && (data.trim().startsWith('{') || data.trim().startsWith('['))) {
    try {
      parsedJson = JSON.parse(data);
    } catch {
      parsedJson = null;
    }
  }

  // 1. Sign Table (Bảng xét dấu)
  if (type === 'sign_table') {
    const label = parsedJson?.label || "f'(x)";
    const xPoints = parsedJson?.xPoints || ['-\\infty', '1', '3', '+\\infty'];
    const signs = parsedJson?.signs || ['+', '0', '-', '0', '+'];
    return (
      <SignTableRenderer
        label={label}
        xPoints={xPoints}
        signs={signs}
        title={title || 'Bảng xét dấu'}
        className={className}
      />
    );
  }

  // 2. Custom Variation Table or standard
  if (type === 'custom_variation_table' || type === 'variation_table') {
    if (parsedJson?.customData) {
      return (
        <VariationTableRenderer
          customData={parsedJson.customData}
          title={title || parsedJson?.title || 'Bảng biến thiên'}
          className={className}
        />
      );
    }

    const preset = parsedJson?.preset || (data && ['cubic_standard', 'cubic_inverted', 'quartic', 'rational_fraction', 'quadratic'].includes(data) ? data : 'cubic_standard');
    return (
      <VariationTableRenderer
        preset={preset}
        title={title || 'Bảng biến thiên hàm số'}
        className={className}
      />
    );
  }

  // 3. Function Graph Curve
  if (type === 'function_curve') {
    const graphPreset = parsedJson?.preset || (data && ['cubic', 'rational', 'quadratic'].includes(data) ? data : 'cubic');
    return (
      <FunctionGraphRenderer
        type={graphPreset}
        title={title || `Đồ thị hàm số`}
        allowAdjust={allowAdjust}
        className={className}
      />
    );
  }

  // 4. Custom Structured Geometry from Interactive Drawer (Points, Segments, Hidden Lines, Vectors)
  if (parsedJson?.points && parsedJson?.segments) {
    const pts: any[] = parsedJson.points;
    const segs: any[] = parsedJson.segments;
    const vecs: any[] = parsedJson.vectors || [];
    const rightAngles: any[] = parsedJson.rightAngles || [];
    const getPt = (id: string) => pts.find((p) => p.id === id);

    return (
      <div className={`my-3 block w-full max-w-[440px] mx-auto bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-2xs text-center ${className}`}>
        {title && <div className="text-xs font-bold text-slate-700 mb-2 uppercase">{title}</div>}
        <svg viewBox="0 0 420 300" className="w-full max-w-[420px] h-auto mx-auto select-none">
          <defs>
            <marker
              id="geo-arrow-view"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#1e293b" />
            </marker>
          </defs>

          {/* Segments */}
          {segs.map((seg: any) => {
            const p1 = getPt(seg.p1Id);
            const p2 = getPt(seg.p2Id);
            if (!p1 || !p2) return null;
            return (
              <line
                key={seg.id}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#1e293b"
                strokeWidth={2}
                strokeDasharray={seg.isDashed ? '5 5' : 'none'}
              />
            );
          })}

          {/* Vectors */}
          {vecs.map((vec: any) => {
            const p1 = getPt(vec.fromId);
            const p2 = getPt(vec.toId);
            if (!p1 || !p2) return null;
            return (
              <line
                key={vec.id}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#4338ca"
                strokeWidth={2}
                markerEnd="url(#geo-arrow-view)"
              />
            );
          })}

          {/* Right angles */}
          {rightAngles.map((ra: any) => {
            const vertex = getPt(ra.vertexId);
            const p1 = getPt(ra.p1Id);
            const p2 = getPt(ra.p2Id);
            if (!vertex || !p1 || !p2) return null;

            const d1x = p1.x - vertex.x;
            const d1y = p1.y - vertex.y;
            const len1 = Math.sqrt(d1x * d1x + d1y * d1y) || 1;
            const u1x = (d1x / len1) * 12;
            const u1y = (d1y / len1) * 12;

            const d2x = p2.x - vertex.x;
            const d2y = p2.y - vertex.y;
            const len2 = Math.sqrt(d2x * d2x + d2y * d2y) || 1;
            const u2x = (d2x / len2) * 12;
            const u2y = (d2y / len2) * 12;

            const cornerX = vertex.x + u1x + u2x;
            const cornerY = vertex.y + u1y + u2y;

            return (
              <polyline
                key={ra.id}
                points={`${vertex.x + u1x},${vertex.y + u1y} ${cornerX},${cornerY} ${vertex.x + u2x},${vertex.y + u2y}`}
                fill="none"
                stroke="#475569"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Points & Labels */}
          {pts.map((p: any) => (
            <g key={p.id}>
              <circle cx={p.x} cy={p.y} r={4.5} fill="#1e293b" stroke="#ffffff" strokeWidth={1.5} />
              <text
                x={p.x + (p.labelOffset?.dx || 10)}
                y={p.y + (p.labelOffset?.dy || -10)}
                fontSize={14}
                fontWeight="bold"
                fontFamily="serif"
                fontStyle="italic"
                fill="#0f172a"
              >
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  // 5. Coordinate System (Oxyz / Oxy)
  if (type === 'coordinate_system') {
    return (
      <GeometryRenderer
        model="oxyz"
        title={title || 'Hệ tọa độ không gian Oxyz'}
        allowTeacherCustomization={allowAdjust}
        className={className}
      />
    );
  }

  // 6. Geometry Models (Pyramids, Prisms, Polyhedra, Triangles, Circles)
  let modelType: GeometryModelType = 'pyramid_quad';
  const shapeCode = parsedJson?.shape || parsedJson?.model || data;

  if (shapeCode === 'pyramid' || shapeCode === 'pyramid_quad' || shapeCode === 'pyramid_s_abcd') modelType = 'pyramid_quad';
  else if (shapeCode === 'pyramid_tri' || shapeCode === 'tetrahedron' || shapeCode === 'pyramid_s_abc') modelType = 'pyramid_tri';
  else if (shapeCode === 'prism' || shapeCode === 'prism_tri' || shapeCode === 'triangular_prism') modelType = 'prism_tri';
  else if (shapeCode === 'cuboid' || shapeCode === 'cube') modelType = 'cuboid';
  else if (shapeCode === 'cone') modelType = 'cone';
  else if (shapeCode === 'cylinder') modelType = 'cylinder';
  else if (shapeCode === 'sphere') modelType = 'sphere';
  else if (shapeCode === 'triangle_right') modelType = 'triangle_right';
  else if (shapeCode === 'circle_tangent') modelType = 'circle_tangent';
  else if (shapeCode === 'oxyz') modelType = 'oxyz';

  return (
    <GeometryRenderer
      model={modelType}
      title={title}
      allowTeacherCustomization={allowAdjust}
      className={className}
    />
  );
};
