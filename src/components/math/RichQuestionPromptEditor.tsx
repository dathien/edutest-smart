import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Edit3,
  Check,
  Maximize2,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { playSound } from '../../services/sound';

export interface RichQuestionPromptEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  onOpenVisualFormulaModal?: () => void;
  rows?: number;
}

export const RichQuestionPromptEditor: React.FC<RichQuestionPromptEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung câu hỏi...',
  onOpenVisualFormulaModal,
  rows = 4,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const quickMathChips = [
    { label: 'y = f(x)', code: '$y = f(x)$' },
    { label: 'f\'(x) > 0', code: '$f\'(x) > 0$' },
    { label: '(-∞; -1)', code: '$(-\\infty; -1)$' },
    { label: '(0; 2)', code: '$(0; 2)$' },
    { label: 'R', code: '$\\mathbb{R}$' },
    { label: 'Phân số', code: '$\\frac{a}{b}$' },
    { label: 'Căn x', code: '$\\sqrt{x}$' },
    { label: 'x²', code: '$x^2$' },
    { label: 'y_CT', code: '$y_{CT}$' },
    { label: '+∞', code: '$+\\infty$' },
    { label: '-∞', code: '$-\\infty$' },
  ];

  const handleInsertSymbol = (code: string) => {
    playSound('click');
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange((value ? value + ' ' : '') + code);
      return;
    }

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const updated = before + (before.endsWith(' ') || before.length === 0 ? '' : ' ') + code + (after.startsWith(' ') || after.length === 0 ? '' : ' ') + after;
    onChange(updated);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + code.length + 1;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
    }
  }, [isEditing]);

  return (
    <div className="space-y-2">
      {/* 1. Header with clean title and Mode Switch */}
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          3. NỘI DUNG CÂU HỎI
        </label>
        <div className="flex items-center gap-1.5">
          {isEditing ? (
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setIsEditing(false);
              }}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Hoàn tất
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                playSound('click');
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {/* 2. Visual Rendered Mode (Default) */}
      {!isEditing && (
        <div
          onClick={() => {
            playSound('click');
            setIsEditing(true);
          }}
          className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/20 transition-all cursor-pointer min-h-[90px] shadow-2xs group"
          title="Bấm để chỉnh sửa nội dung câu hỏi"
        >
          <div className="text-[18px] text-slate-900 leading-relaxed font-medium">
            <MathRenderer content={value || placeholder} />
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Bấm vào khung để chỉnh sửa văn bản hoặc công thức</span>
            <span className="text-indigo-600 font-semibold group-hover:underline flex items-center gap-1">
              <Edit3 className="w-3 h-3" /> Sửa nhanh
            </span>
          </div>
        </div>
      )}

      {/* 3. Active Edit Mode */}
      {isEditing && (
        <div className="rounded-xl border border-indigo-300 bg-white shadow-xs overflow-hidden space-y-2 p-3 ring-2 ring-indigo-100 animate-in fade-in">
          {/* Contextual Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Chèn nhanh:</span>
              {quickMathChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInsertSymbol(chip.code)}
                  className="px-2 py-0.5 text-xs bg-slate-50 hover:bg-indigo-600 hover:text-white text-slate-700 border border-slate-200 rounded-md font-medium transition-colors shadow-2xs cursor-pointer"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {onOpenVisualFormulaModal && (
              <button
                type="button"
                onClick={onOpenVisualFormulaModal}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Bảng công thức đầy đủ
              </button>
            )}
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full p-2.5 text-base rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-400 font-medium text-slate-900 bg-white leading-relaxed resize-y"
          />

          {/* Real-time preview strip right below */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Xem trước trực tiếp:</span>
              <span className="text-emerald-600 font-medium">Hiển thị chuẩn</span>
            </div>
            <div className="text-[17px] text-slate-900 font-medium leading-relaxed">
              <MathRenderer content={value || '(Chưa có nội dung)'} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
