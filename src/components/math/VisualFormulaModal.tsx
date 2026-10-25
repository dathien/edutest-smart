import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { playSound } from '../../services/sound';

interface VisualFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (formulaText: string) => void;
  initialValue?: string;
  targetLabel?: string;
}

interface FormulaCategory {
  id: string;
  title: string;
  items: {
    label: string;
    description: string;
    latex: string;
    preview: string;
  }[];
}

export const VisualFormulaModal: React.FC<VisualFormulaModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialValue = '',
  targetLabel = 'Nội dung',
}) => {
  if (!isOpen) return null;

  const [selectedCategory, setSelectedCategory] = useState<string>('intervals');
  const [customFormula, setCustomFormula] = useState<string>(initialValue || '$(-\\infty; -1)$');

  const categories: FormulaCategory[] = [
    {
      id: 'intervals',
      title: 'Khoảng & Đoạn (Khảo sát hàm số)',
      items: [
        { label: 'Khoảng âm vô cực', description: 'Từ âm vô cực đến a', latex: '$(-\\infty; -1)$', preview: '$(-\\infty; -1)$' },
        { label: 'Khoảng dương vô cực', description: 'Từ a đến dương vô cực', latex: '$(1; +\\infty)$', preview: '$(1; +\\infty)$' },
        { label: 'Khoảng mở', description: 'Khoảng hai đầu mút', latex: '$(0; 2)$', preview: '$(0; 2)$' },
        { label: 'Khoảng nghịch biến', description: 'Khoảng số âm', latex: '$(-1; 2)$', preview: '$(-1; 2)$' },
        { label: 'Đoạn đóng', description: 'Bao gồm hai đầu mút', latex: '$[-1; 2]$', preview: '$[-1; 2]$' },
        { label: 'Nửa khoảng trái', description: 'Đóng trái, mở phải', latex: '$[0; 2)$', preview: '$[0; 2)$' },
        { label: 'Nửa khoảng phải', description: 'Mở trái, đóng phải', latex: '$(0; 2]$', preview: '$(0; 2]$' },
        { label: 'Toàn bộ trục số R', description: 'Tập số thực (-∞; +∞)', latex: '$(-\\infty; +\\infty)$', preview: '$(-\\infty; +\\infty)$' },
      ],
    },
    {
      id: 'fractions_roots',
      title: 'Phân số & Căn thức',
      items: [
        { label: 'Phân số đơn', description: 'Tử số / Mẫu số', latex: '$\\frac{a}{b}$', preview: '$\\frac{a}{b}$' },
        { label: 'Phân thức bậc nhất', description: 'Hàm số nhất biến', latex: '$\\frac{2x+1}{x-1}$', preview: '$\\frac{2x+1}{x-1}$' },
        { label: 'Phân thức hữu tỉ', description: 'Bậc 2 trên bậc 1', latex: '$\\frac{x^2 - 3x + 2}{x + 1}$', preview: '$\\frac{x^2 - 3x + 2}{x + 1}$' },
        { label: 'Căn bậc hai', description: 'Căn thức bậc 2', latex: '$\\sqrt{x}$', preview: '$\\sqrt{x}$' },
        { label: 'Căn biểu thức', description: 'Căn bậc hai đa thức', latex: '$\\sqrt{2x^2 + 1}$', preview: '$\\sqrt{2x^2 + 1}$' },
        { label: 'Căn bậc n', description: 'Căn bậc 3 hoặc cao hơn', latex: '$\\sqrt[3]{x}$', preview: '$\\sqrt[3]{x}$' },
      ],
    },
    {
      id: 'calculus',
      title: 'Hàm số, Đạo hàm & Giải tích',
      items: [
        { label: 'Hàm số y = f(x)', description: 'Ký hiệu hàm số tổng quát', latex: '$y = f(x)$', preview: '$y = f(x)$' },
        { label: 'Đạo hàm bậc nhất', description: 'Đạo hàm dương (đồng biến)', latex: '$f\'(x) > 0$', preview: '$f\'(x) > 0$' },
        { label: 'Đạo hàm âm', description: 'Đạo hàm âm (nghịch biến)', latex: '$f\'(x) < 0$', preview: '$f\'(x) < 0$' },
        { label: 'Phương trình f\'(x)=0', description: 'Điểm dừng đạo hàm', latex: '$y\' = 3x^2 - 3 = 0$', preview: '$y\' = 3x^2 - 3 = 0$' },
        { label: 'Giá trị cực tiểu', description: 'Cực tiểu hàm số', latex: '$y_{CT} = -2$', preview: '$y_{CT} = -2$' },
        { label: 'Giá trị cực đại', description: 'Cực đại hàm số', latex: '$y_{CĐ} = 2$', preview: '$y_{CĐ} = 2$' },
        { label: 'Giới hạn vô cực', description: 'Giới hạn khi x tiến tới vô cực', latex: '$\\lim_{x \\to +\\infty} f(x) = 2$', preview: '$\\lim_{x \\to +\\infty} f(x) = 2$' },
        { label: 'Tích phân xác định', description: 'Tích phân từ a đến b', latex: '$\\int_{0}^{1} (2x+1)dx$', preview: '$\\int_{0}^{1} (2x+1)dx$' },
      ],
    },
    {
      id: 'powers_subscripts',
      title: 'Lũy thừa, Chỉ số & Logarit',
      items: [
        { label: 'Bình phương', description: 'Số mũ 2', latex: '$x^2$', preview: '$x^2$' },
        { label: 'Bậc ba', description: 'Số mũ 3', latex: '$x^3$', preview: '$x^3$' },
        { label: 'Số mũ n', description: 'Lũy thừa tổng quát', latex: '$x^n$', preview: '$x^n$' },
        { label: 'Chỉ số x_1', description: 'Nghiệm x1', latex: '$x_1$', preview: '$x_1$' },
        { label: 'Chỉ số x_2', description: 'Nghiệm x2', latex: '$x_2$', preview: '$x_2$' },
        { label: 'Logarit cơ số a', description: 'Logarit tổng quát', latex: '$\\log_a b$', preview: '$\\log_a b$' },
        { label: 'Logarit tự nhiên', description: 'Logarit cơ số e', latex: '$\\ln x$', preview: '$\\ln x$' },
        { label: 'Logarit thập phân', description: 'Logarit cơ số 10', latex: '$\\log x$', preview: '$\\log x$' },
      ],
    },
    {
      id: 'sets_symbols',
      title: 'Tập hợp, Ký hiệu & Vô cực',
      items: [
        { label: 'Tập số thực R', description: 'Tập R', latex: '$\\mathbb{R}$', preview: '$\\mathbb{R}$' },
        { label: 'Tập R trừ điểm', description: 'Tập xác định trừ mút', latex: '$\\mathbb{R} \\setminus \\{1\\}$', preview: '$\\mathbb{R} \\setminus \\{1\\}$' },
        { label: 'Âm vô cực', description: 'Ký hiệu âm vô cực', latex: '$-\\infty$', preview: '$-\\infty$' },
        { label: 'Dương vô cực', description: 'Ký hiệu dương vô cực', latex: '$+\\infty$', preview: '$+\\infty$' },
        { label: 'Thuộc tập hợp', description: 'Ký hiệu thuộc', latex: '$\\in$', preview: '$\\in$' },
        { label: 'Hợp hai tập', description: 'Phép hợp', latex: '$\\cup$', preview: '$\\cup$' },
        { label: 'Giao hai tập', description: 'Phép giao', latex: '$\\cap$', preview: '$\\cap$' },
        { label: 'Với mọi', description: 'Ký hiệu với mọi x', latex: '$\\forall x \\in \\mathbb{R}$', preview: '$\\forall x \\in \\mathbb{R}$' },
        { label: 'Tồn tại', description: 'Ký hiệu tồn tại', latex: '$\\exists x$', preview: '$\\exists x$' },
      ],
    },
    {
      id: 'vectors_space',
      title: 'Hình học & Vectơ (SGK THPT)',
      items: [
        { label: 'Vectơ u', description: 'Ký hiệu vectơ u', latex: '$\\vec{u}$', preview: '$\\vec{u}$' },
        { label: 'Vectơ chỉ phương v', description: 'Ký hiệu vectơ v', latex: '$\\vec{v}$', preview: '$\\vec{v}$' },
        { label: 'Vectơ AB', description: 'Vectơ hai điểm', latex: '$\\vec{AB}$', preview: '$\\vec{AB}$' },
        { label: 'Tích vô hướng', description: 'Tích hai vectơ', latex: '$\\vec{a} \\cdot \\vec{b}$', preview: '$\\vec{a} \\cdot \\vec{b}$' },
        { label: 'Toạ độ vectơ', description: 'Bộ ba toạ độ Oxyz', latex: '$\\vec{u} = (x; y; z)$', preview: '$\\vec{u} = (x; y; z)$' },
        { label: 'Quan hệ vuông góc', description: 'Đường thẳng vuông góc', latex: '$SO \\perp (ABCD)$', preview: '$SO \\perp (ABCD)$' },
        { label: 'Quan hệ song song', description: 'Đường thẳng song song', latex: '$AB \\parallel CD$', preview: '$AB \\parallel CD$' },
        { label: 'Độ dài đoạn thẳng', description: 'Căn bậc hai a', latex: '$a\\sqrt{2}$', preview: '$a\\sqrt{2}$' },
      ],
    },
  ];

  const currentCategoryObj = categories.find(c => c.id === selectedCategory) || categories[0];

  const handleApplyPreset = (latex: string) => {
    playSound('click');
    setCustomFormula(latex);
  };

  const handleConfirmInsert = () => {
    playSound('click');
    onInsert(customFormula);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-200" />
            <div>
              <h3 className="font-bold text-base leading-snug">
                Chèn công thức Toán học trực quan
              </h3>
              <p className="text-xs text-indigo-100">
                Áp dụng cho: <strong>{targetLabel}</strong> • Chọn mẫu công thức chuẩn SGK Toán THPT
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split into Categories & Preset Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
          {/* Left Navigation: Categories (4 cols) */}
          <div className="md:col-span-4 bg-slate-50 border-r border-slate-200 p-3 space-y-1 overflow-y-auto">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
              Chủ đề công thức
            </div>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  playSound('click');
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                {cat.title}
              </button>
            ))}
          </div>

          {/* Right Area: Presets & Live Customizer (8 cols) */}
          <div className="md:col-span-8 p-4 overflow-y-auto space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center justify-between">
                <span>{currentCategoryObj.title}</span>
                <span className="text-[11px] text-slate-400 font-normal">Bấm mẫu để chọn</span>
              </div>

              {/* Grid of formula cards */}
              <div className="grid grid-cols-2 gap-2">
                {currentCategoryObj.items.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(item.latex)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-left space-y-1 group"
                  >
                    <div className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-700">
                      {item.label}
                    </div>
                    <div className="h-9 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100 text-slate-900 text-sm overflow-hidden px-1">
                      <MathRenderer content={item.preview} />
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">
                      {item.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Formula Preview Box */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 uppercase">
                  Bản dựng công thức trực quan:
                </span>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                  Hiển thị chuẩn SGK
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 min-h-[50px] flex items-center justify-center text-lg text-slate-900 shadow-2xs">
                <MathRenderer content={customFormula} />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="text-[11px] font-semibold text-slate-500 shrink-0">
                  Chỉnh sửa giá trị:
                </label>
                <input
                  type="text"
                  value={customFormula}
                  onChange={(e) => setCustomFormula(e.target.value)}
                  className="flex-1 px-2.5 py-1 text-xs rounded border border-slate-300 font-mono text-slate-800 bg-white"
                  placeholder="Ví dụ: $(-\\infty; -1)$ hoặc $\frac{a}{b}$"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            * Nhấn <strong>Chèn công thức</strong> để áp dụng trực tiếp vào câu hỏi/phương án
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmInsert}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" /> Chèn công thức
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
