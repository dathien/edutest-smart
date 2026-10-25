import React from 'react';
import { VariationTableRenderer } from './VariationTableRenderer';
import { FunctionGraphRenderer } from './FunctionGraphRenderer';
import { GeometryRenderer, GeometryModelType } from './GeometryRenderer';

export interface GeometryDiagramProps {
  type?: 'geometry' | 'function_curve' | 'variation_table' | 'coordinate_system' | 'custom_svg';
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
  if (type === 'variation_table') {
    return (
      <VariationTableRenderer
        preset="cubic_standard"
        title={title || 'Bảng biến thiên chuẩn'}
        className={className}
      />
    );
  }

  if (type === 'function_curve') {
    return (
      <FunctionGraphRenderer
        type="cubic"
        title={title || 'Đồ thị hàm số bậc ba y = x³ - 3x'}
        allowAdjust={allowAdjust}
        className={className}
      />
    );
  }

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

  // Map legacy string or model
  let modelType: GeometryModelType = 'pyramid_quad';
  if (data === 'pyramid' || data === 'pyramid_quad') modelType = 'pyramid_quad';
  else if (data === 'pyramid_tri') modelType = 'pyramid_tri';
  else if (data === 'prism' || data === 'prism_tri') modelType = 'prism_tri';
  else if (data === 'cuboid') modelType = 'cuboid';
  else if (data === 'cone') modelType = 'cone';
  else if (data === 'cylinder') modelType = 'cylinder';
  else if (data === 'sphere') modelType = 'sphere';
  else if (data === 'triangle_right') modelType = 'triangle_right';
  else if (data === 'circle_tangent') modelType = 'circle_tangent';
  else if (data === 'oxyz') modelType = 'oxyz';

  return (
    <GeometryRenderer
      model={modelType}
      title={title}
      allowTeacherCustomization={allowAdjust}
      className={className}
    />
  );
};
