import React, { useState, useMemo } from 'react';
import { Geometry3DEngine, PolyhedronData, SlicingPlaneData } from '../engines/Geometry3DEngine';
import { ParameterControls, ParameterPreset } from '../engines/ParameterControls';
import { LabActivity } from '../types';
import { Layers } from 'lucide-react';

interface Lab08CrossSection3DProps {
  activity: LabActivity;
  params: Record<string, number>;
  onParamChange: (paramId: string, val: number) => void;
  onResetParams: () => void;
  disabled?: boolean;
}

export const Lab08CrossSection3D: React.FC<Lab08CrossSection3DProps> = ({
  activity,
  params,
  onParamChange,
  onResetParams,
  disabled = false,
}) => {
  const sliceHeight = params.sliceHeight ?? 2.2;
  const tiltAngle = params.tiltAngle ?? 15;
  const rotAngle = params.rotAngle ?? 0;

  const [sectionArea, setSectionArea] = useState<number>(0);
  const [sectionVerticesCount, setSectionVerticesCount] = useState<number>(4);

  // Polyhedron: Standard Pyramid S.ABCD
  const polyhedron: PolyhedronData = useMemo(() => {
    return {
      type: 'pyramid',
      apex: [0, 0, 5],
      baseVertices: [
        [-2.5, -2, 0],
        [2.5, -2, 0],
        [2.5, 2, 0],
        [-2.5, 2, 0],
      ],
      color: '#6366f1',
    };
  }, []);

  // Slicing plane configuration
  const slicingPlane: SlicingPlaneData = useMemo(() => {
    return {
      heightZ: sliceHeight,
      tiltDeg: tiltAngle,
      rotDeg: rotAngle,
      color: '#06b6d4',
      showSectionPolygon: true,
    };
  }, [sliceHeight, tiltAngle, rotAngle]);

  // Presets
  const presets: ParameterPreset[] = [
    {
      label: 'Mặt phẳng song song với đáy (θ = 0°)',
      description: 'Thiết diện đồng dạng với đáy',
      params: { sliceHeight: 2.5, tiltAngle: 0, rotAngle: 0 },
    },
    {
      label: 'Mặt phẳng nghiêng nhẹ (θ = 15°)',
      description: 'Thiết diện tứ giác cắt cả 4 cạnh bên',
      params: { sliceHeight: 2.2, tiltAngle: 15, rotAngle: 0 },
    },
    {
      label: 'Mặt phẳng nghiêng mạnh (θ = 35°)',
      description: 'Góc nghiêng lớn cắt xiên',
      params: { sliceHeight: 1.8, tiltAngle: 35, rotAngle: 45 },
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full">
      {/* 3D Canvas */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Thiết diện cắt bởi mặt phẳng (α)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
              Đa giác {sectionVerticesCount} đỉnh | S = {sectionArea.toFixed(2)} đvdt
            </span>
          </div>
        </div>

        <Geometry3DEngine
          polyhedron={polyhedron}
          slicingPlane={slicingPlane}
          showGrid={true}
          showAxes={true}
          axesSize={6}
          height={460}
          onCrossSectionAreaCalculated={(area, count) => {
            setSectionArea(area);
            setSectionVerticesCount(count);
          }}
        />
      </div>

      {/* Right Controls */}
      <div className="lg:col-span-5 space-y-4">
        <ParameterControls
          parameters={activity.parameters}
          values={params}
          onChange={onParamChange}
          onReset={onResetParams}
          presets={presets}
          onApplyPreset={(p) => {
            Object.entries(p.params).forEach(([k, v]) => onParamChange(k, v));
          }}
          disabled={disabled}
        />

        {/* Section Properties */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
            THUỘC TÍNH THIẾT DIỆN ĐỘNG
          </h4>

          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Số đỉnh giao điểm</span>
                <span className="font-bold font-mono text-rose-600 text-sm">
                  {sectionVerticesCount} đỉnh (M₁...M_{sectionVerticesCount})
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 block text-[11px]">Diện tích thiết diện</span>
                <span className="font-bold font-mono text-indigo-700 text-sm">
                  S ≈ {sectionArea.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200/80 text-rose-950 space-y-1">
              <span className="font-semibold block text-[11px]">Đặc điểm hình học:</span>
              <p className="text-[11px] leading-relaxed">
                {tiltAngle === 0
                  ? 'Khi (α) song song với đáy (ABCD), thiết diện thu được là một hình chữ nhật đồng dạng với đáy với tỉ số k = (h - z₀)/h.'
                  : `Mặt phẳng (α) nghiêng góc ${tiltAngle}° tạo thành thiết diện đa giác có chu vi và diện tích thay đổi linh hoạt theo cao độ z₀.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
