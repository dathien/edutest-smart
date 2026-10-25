import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Edit2,
  Check,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { playSound } from '../../services/sound';

export interface CompactOptionsEditorProps {
  options: string[];
  onChange: (newOptions: string[]) => void;
  correctAnswer: string;
  onCorrectAnswerChange: (newCorrectAnswer: string) => void;
  onOpenVisualFormulaModal?: (targetOptionIndex: number) => void;
}

export const CompactOptionsEditor: React.FC<CompactOptionsEditorProps> = ({
  options,
  onChange,
  correctAnswer,
  onCorrectAnswerChange,
  onOpenVisualFormulaModal,
}) => {
  // Which option index (0 to 3) is currently active for editing; null if all in rendered mode
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [history, setHistory] = useState<{ [idx: number]: string[] }>({});
  const inputRef = useRef<HTMLInputElement | null>(null);

  const letters = ['A', 'B', 'C', 'D'];

  const quickSymbolChips = [
    { label: '(-∞; -1)', code: '$(-\\infty; -1)$' },
    { label: '(0; 2)', code: '$(0; 2)$' },
    { label: '(-1; 2)', code: '$(-1; 2)$' },
    { label: '[0; 2]', code: '$[0; 2]$' },
    { label: '1', code: '$1$' },
    { label: 'Phân số', code: '$\\frac{a}{b}$' },
    { label: 'Căn x', code: '$\\sqrt{x}$' },
    { label: 'R', code: '$\\mathbb{R}$' },
    { label: '+∞', code: '$+\\infty$' },
    { label: '-∞', code: '$-\\infty$' },
  ];

  const handleStartEditing = (idx: number) => {
    playSound('click');
    setEditingIndex(idx);
    // save snapshot to history for undo
    setHistory(prev => ({
      ...prev,
      [idx]: [...(prev[idx] || []), options[idx] || ''],
    }));
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleUpdateOptionText = (idx: number, newText: string) => {
    const updated = [...options];
    updated[idx] = newText;
    onChange(updated);
  };

  const handleInsertQuickSymbol = (code: string) => {
    if (editingIndex === null) return;
    playSound('click');
    const current = options[editingIndex] || '';
    const updated = current ? `${current} ${code}` : code;
    handleUpdateOptionText(editingIndex, updated);
  };

  const handleUndo = (idx: number) => {
    const past = history[idx];
    if (past && past.length > 0) {
      playSound('click');
      const prevVal = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      setHistory(h => ({ ...h, [idx]: newPast }));
      handleUpdateOptionText(idx, prevVal);
    }
  };

  const handleFinishEditing = () => {
    playSound('click');
    setEditingIndex(null);
  };

  return (
    <div className="space-y-3">
      {/* 1. Header Bar with Status and Correct Answer Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div>
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            5. BỐN PHƯƠNG ÁN LỰA CHỌN (A, B, C, D)
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Công thức toán hiển thị trực tiếp. Bấm vào nội dung bất kỳ phương án nào để chỉnh sửa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
            Đáp án đúng: <strong>Phương án {correctAnswer}</strong>
          </span>
        </div>
      </div>

      {/* 2. ONE Shared Contextual Math Toolbar (Appears when editing any option) */}
      {editingIndex !== null && (
        <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Đang chỉnh sửa: <strong>Phương án {letters[editingIndex]}</strong>
            </span>
            <div className="flex items-center gap-2">
              {history[editingIndex] && history[editingIndex].length > 0 && (
                <button
                  type="button"
                  onClick={() => handleUndo(editingIndex)}
                  className="px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white rounded border border-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Hoàn tác
                </button>
              )}
              {onOpenVisualFormulaModal && (
                <button
                  type="button"
                  onClick={() => onOpenVisualFormulaModal(editingIndex)}
                  className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-white hover:bg-indigo-100 rounded-lg border border-indigo-200 flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3 text-indigo-600" /> Bảng công thức đầy đủ
                </button>
              )}
              <button
                type="button"
                onClick={handleFinishEditing}
                className="px-3 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Xong
              </button>
            </div>
          </div>

          {/* Quick symbol inserter chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-500 mr-1">Chèn nhanh:</span>
            {quickSymbolChips.map((chip, cIdx) => (
              <button
                key={cIdx}
                type="button"
                onClick={() => handleInsertQuickSymbol(chip.code)}
                className="px-2 py-0.5 text-xs bg-white hover:bg-indigo-600 hover:text-white text-slate-700 border border-slate-200 rounded-md font-medium transition-colors shadow-2xs cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. The 4 Balanced, High-Contrast Option Rows */}
      <div className="space-y-2">
        {letters.map((letter, idx) => {
          const isSelectedCorrect = correctAnswer === letter;
          const isCurrentlyEditing = editingIndex === idx;
          const optionValue = options[idx] || '';

          return (
            <div
              key={letter}
              className={`rounded-xl border transition-all text-[17px] ${
                isSelectedCorrect
                  ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-100'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              } ${isCurrentlyEditing ? 'border-indigo-500 ring-2 ring-indigo-200' : ''}`}
            >
              {/* Main Row View */}
              <div className="p-3 flex items-start gap-3">
                {/* Radio button to select as correct answer */}
                <div className="pt-0.5 shrink-0">
                  <label className="cursor-pointer flex items-center" title={`Chọn phương án ${letter} làm đáp án đúng`}>
                    <input
                      type="radio"
                      name="compact_mc_correct_answer"
                      checked={isSelectedCorrect}
                      onChange={() => {
                        onCorrectAnswerChange(letter);
                        playSound('click');
                      }}
                      className="w-4 h-4 text-indigo-600 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Letter Badge */}
                <div className="shrink-0">
                  <span
                    className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-bold text-xs ${
                      isSelectedCorrect
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {letter}
                  </span>
                </div>

                {/* Option Content Area: Rendered vs Active Edit */}
                <div className="flex-1 min-w-0">
                  {isCurrentlyEditing ? (
                    <div className="space-y-2">
                      <input
                        ref={inputRef}
                        type="text"
                        value={optionValue}
                        onChange={(e) => handleUpdateOptionText(idx, e.target.value)}
                        placeholder={`Nhập phương án ${letter}, ví dụ: Hàm số đồng biến trên $(-\\infty; -1)$`}
                        className="w-full px-3 py-1.5 text-base rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 font-medium text-slate-800 bg-white"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleFinishEditing();
                          }
                        }}
                      />
                      {/* Live rendered preview strip while typing */}
                      <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
                        <span className="font-semibold text-slate-400 text-[11px] shrink-0">Hiển thị:</span>
                        <div className="text-slate-900 font-medium overflow-x-auto">
                          <MathRenderer content={optionValue || `(Trống)`} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => handleStartEditing(idx)}
                      className="cursor-pointer py-0.5 px-1 rounded hover:bg-slate-50 text-slate-900 font-medium leading-relaxed flex items-center justify-between group"
                      title="Bấm để chỉnh sửa phương án này"
                    >
                      <div className="overflow-x-auto">
                        <MathRenderer content={optionValue || `Nhập phương án ${letter}...`} />
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-2 shrink-0">
                        <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold border border-indigo-100">
                          <Edit2 className="w-3 h-3" /> Sửa
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action button on right */}
                <div className="shrink-0 pt-0.5">
                  {isCurrentlyEditing ? (
                    <button
                      type="button"
                      onClick={handleFinishEditing}
                      className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Hoàn tất sửa"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartEditing(idx)}
                      className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Sửa phương án"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
