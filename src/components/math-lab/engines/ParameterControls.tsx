import React from 'react';
import { RotateCcw, Sliders, CheckCircle2 } from 'lucide-react';
import { LabParameter } from '../types';

export interface ParameterPreset {
  label: string;
  description?: string;
  params: Record<string, number>;
}

export interface ParameterControlsProps {
  parameters: LabParameter[];
  values: Record<string, number>;
  onChange: (paramId: string, value: number) => void;
  onReset: () => void;
  presets?: ParameterPreset[];
  onApplyPreset?: (preset: ParameterPreset) => void;
  disabled?: boolean;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  parameters,
  values,
  onChange,
  onReset,
  presets = [],
  onApplyPreset,
  disabled = false,
}) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">BẢNG THAM SỐ TOÁN HỌC</h3>
            <p className="text-[11px] text-slate-500">Điều chỉnh thanh trượt hoặc nhập số trực tiếp</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
          title="Đặt lại các tham số mặc định"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Mặc định</span>
        </button>
      </div>

      {/* Preset Quick Actions */}
      {presets.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Dữ liệu mẫu chuẩn SGK:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onApplyPreset && onApplyPreset(preset)}
                className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg border border-slate-200 transition text-left"
                title={preset.description}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sliders & Inputs */}
      <div className="space-y-3.5">
        {parameters.map((param) => {
          const curVal = values[param.id] ?? param.value;
          return (
            <div key={param.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif italic font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                    {param.symbol}
                  </span>
                  <span className="text-xs font-medium text-slate-700">{param.name}</span>
                </div>

                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={curVal}
                    disabled={disabled}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) onChange(param.id, val);
                    }}
                    className="w-16 px-1.5 py-0.5 text-right font-mono text-xs font-bold bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {param.unit && <span className="text-[11px] text-slate-500 font-mono">{param.unit}</span>}
                </div>
              </div>

              {/* Slider Input */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono w-6 text-right">{param.min}</span>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={curVal}
                  disabled={disabled}
                  onChange={(e) => onChange(param.id, parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 disabled:opacity-50"
                />
                <span className="text-[10px] text-slate-400 font-mono w-6 text-left">{param.max}</span>
              </div>

              {param.description && (
                <p className="text-[10px] text-slate-400 italic">{param.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
