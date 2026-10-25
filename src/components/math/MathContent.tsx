import React from 'react';
import { MathRenderer } from './MathRenderer';
import { GeometryDiagram } from '../GeometryDiagram';

export interface MathContentProps {
  content: string;
  diagramType?: 'none' | 'geometry' | 'function_curve' | 'variation_table' | 'coordinate_system' | 'custom_variation_table' | 'sign_table' | 'custom_svg';
  diagramData?: string;
  className?: string;
  inline?: boolean;
}

/**
 * Universal MathContent component for EduTest Smart.
 * Manages mixed content: rich text with KaTeX formulas + mathematical diagrams,
 * variation tables, sign charts, function graphs, and geometric illustrations.
 */
export const MathContent: React.FC<MathContentProps> = ({
  content,
  diagramType = 'none',
  diagramData,
  className = '',
  inline = false,
}) => {
  return (
    <div className={`edutest-math-content space-y-3 ${className}`}>
      {/* 1. Text & Mathematical Formulas */}
      <MathRenderer content={content} inline={inline} />

      {/* 2. Associated Mathematical Diagrams / Tables */}
      {diagramType && diagramType !== 'none' && (
        <div className="my-3 flex justify-center overflow-x-auto">
          <GeometryDiagram
            type={diagramType as any}
            data={diagramData}
            allowAdjust={false}
          />
        </div>
      )}
    </div>
  );
};
