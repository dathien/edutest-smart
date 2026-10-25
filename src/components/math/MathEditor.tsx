import React, { useState, useRef, useId } from 'react';
import {
  Code,
  Eye,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Minimize2,
  Edit3,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { MathValidator } from '../../services/mathValidator';
import { playSound } from '../../services/sound';

export interface MathEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  rows?: number;
  compact?: boolean;
  className?: string;
  prefix?: React.ReactNode;
  showToolbar?: boolean;
}

export const MathEditor: React.FC<MathEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung hoặc công thức $...$',
  label,
  multiline = false,
  rows = 3,
  compact = false,
  className = '',
  prefix,
  showToolbar = true,
}) => {
  // Modes: 'edit' | 'preview' | 'split'
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const [showSymbols, setShowSymbols] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const uniqueId = useId();

  // Validate syntax
  const validation = MathValidator.validate(value);

  // Insert math template at cursor position
  const handleInsertSymbol = (template: string) => {
    playSound('click');
    const input = inputRef.current;
    if (!input) {
      onChange((value ? value + ' ' : '') + template);
      return;
    }

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const updated = before + template + after;
    onChange(updated);

    setTimeout(() => {
      input.focus();
      const newCursorPos = start + template.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const quickSymbols = [
    { label: '(-∞; a)', code: '$(-\\infty; -1)$' },
    { label: '(a; +∞)', code: '$(1; +\\infty)$' },
    { label: '(a; b)', code: '$(0; 2)$' },
    { label: '[a; b]', code: '$[-1; 2]$' },
    { label: 'Phân số', code: '$\\frac{a}{b}$' },
    { label: 'Căn bậc 2', code: '$\\sqrt{x}$' },
    { label: 'Số mũ', code: '$x^{2}$' },
    { label: 'Chỉ số', code: '$x_{1}$' },
    { label: 'Vô cực', code: '$\\infty$' },
    { label: 'Âm vô cực', code: '$-\\infty$' },
    { label: 'Tập số R', code: '$\\mathbb{R}$' },
    { label: 'Vectơ', code: '$\\vec{u}$' },
    { label: '≤', code: '$\\le$' },
    { label: '≥', code: '$\\ge$' },
    { label: '≠', code: '$\\ne$' },
    { label: 'Thuộc', code: '$\\in$' },
  ];

  return (
    <div className={`math-editor-container space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>{label}</span>
          <div className="flex items-center gap-1.5 text-[11px]">
            {validation.isValid ? (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Công thức chuẩn
              </span>
            ) : (
              <span className="text-amber-600 flex items-center gap-1" title={validation.errors.join(', ')}>
                <AlertCircle className="w-3.5 h-3.5" /> {validation.errors[0]}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Editor Box */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
        {/* Top Control Bar */}
        <div className="bg-slate-50/80 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1">
            {prefix}
            <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
              Trình soạn thảo Toán học
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Symbols Toggle */}
            <button
              type="button"
              onClick={() => {
                setShowSymbols(!showSymbols);
                playSound('click');
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                showSymbols ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>Chèn công thức</span>
            </button>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('edit');
                  playSound('click');
                }}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  mode === 'edit' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chế độ nhập văn bản và mã LaTeX"
              >
                Nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('preview');
                  playSound('click');
                }}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  mode === 'preview' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chế độ hiển thị công thức đã dựng"
              >
                Xem trước
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('split');
                  playSound('click');
                }}
                className={`px-2 py-0.5 rounded-md transition-colors ${
                  mode === 'split' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Xem đồng thời cả nhập và xem trước"
              >
                Song song
              </button>
            </div>
          </div>
        </div>

        {/* Quick Math Inserter Toolbar */}
        {showSymbols && (
          <div className="p-2 bg-indigo-50/60 border-b border-indigo-100 flex flex-wrap gap-1 text-xs animate-in fade-in">
            {quickSymbols.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleInsertSymbol(item.code)}
                className="px-2 py-0.5 bg-white hover:bg-indigo-600 hover:text-white text-slate-700 border border-slate-200 rounded font-medium text-[11px] transition-colors shadow-2xs"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* Editor Body Area */}
        <div className="p-2.5">
          {/* Edit Mode: Input / Textarea */}
          {(mode === 'edit' || mode === 'split') && (
            <div className="space-y-2">
              {multiline ? (
                <textarea
                  ref={inputRef as any}
                  id={uniqueId}
                  rows={rows}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className="w-full p-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-400 font-mono text-slate-800 bg-white"
                />
              ) : (
                <input
                  ref={inputRef as any}
                  id={uniqueId}
                  type="text"
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-400 font-mono text-slate-800 bg-white"
                />
              )}
            </div>
          )}

          {/* Rendered View (in preview mode or split mode) */}
          {(mode === 'preview' || mode === 'split') && (
            <div
              onClick={() => {
                if (mode === 'preview') {
                  setMode('edit');
                  playSound('click');
                }
              }}
              className={`p-3 rounded-lg border text-sm transition-all cursor-pointer ${
                mode === 'split' ? 'mt-2 bg-slate-50 border-slate-200' : 'bg-indigo-50/40 border-indigo-200 hover:bg-indigo-50/70'
              }`}
              title="Nhấn vào để chỉnh sửa công thức này"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 border-b border-slate-200/60 pb-1">
                <span className="font-semibold text-indigo-700 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Công thức đã dựng (KaTeX)
                </span>
                {mode === 'preview' && (
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Edit3 className="w-3 h-3 text-indigo-600" /> Nhấn để sửa
                  </span>
                )}
              </div>

              {value.trim() ? (
                <div className="py-1 text-slate-900 leading-relaxed font-sans text-[17px]">
                  <MathRenderer content={value} />
                </div>
              ) : (
                <span className="text-slate-400 italic text-xs">Chưa có nội dung...</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
