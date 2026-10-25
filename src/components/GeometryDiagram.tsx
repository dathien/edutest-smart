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

  // 4. Coordinate System (Oxyz / Oxy)
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

  // 5. Geometry Models (Pyramids, Prisms, Polyhedra, Triangles, Circles)
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
