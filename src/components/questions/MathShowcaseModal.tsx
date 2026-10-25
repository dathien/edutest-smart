import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  Compass,
  TrendingUp,
  Activity,
  Maximize2,
} from 'lucide-react';
import { MathRenderer } from '../MathRenderer';
import { VariationTableRenderer } from '../VariationTableRenderer';
import { FunctionGraphRenderer, FunctionType } from '../FunctionGraphRenderer';
import { GeometryRenderer, GeometryModelType } from '../GeometryRenderer';
import { playSound } from '../../services/sound';

interface MathShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MathShowcaseModal: React.FC<MathShowcaseModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'formulas' | 'variation_table' | 'function_graphs' | 'geometry'>('formulas');
  const [selectedGraphType, setSelectedGraphType] = useState<FunctionType>('cubic');
  const [selectedGeoModel, setSelectedGeoModel] = useState<GeometryModelType>('pyramid_quad');

  if (!isOpen) return null;

  // 5 core formula test cases
  const formulaCases = [
    {
      title: '1. Phân số & Căn thức phức hợp',
      latex: '\\[ f(x) = \\frac{x^2 - 3x + 2}{\\sqrt{x^2 + 1} - 1} + \\sqrt[3]{2x - 1} \\]',
      inlineNote: 'Hiển thị căn thức đa tầng, mẫu số chứa căn, số mũ và phân số cấu trúc chuẩn xác.',
    },
    {
      title: '2. Tích phân xác định & Đạo hàm',
      latex: '\\[ I = \\int_{0}^{\\frac{\\pi}{2}} x \\sin(2x)\\,\\mathrm{d}x = \\left[ -\\frac{x\\cos(2x)}{2} \\right]_{0}^{\\frac{\\pi}{2}} + \\int_{0}^{\\frac{\\pi}{2}} \\frac{\\cos(2x)}{2}\\,\\mathrm{d}x = \\frac{\\pi}{4} \\]',
      inlineNote: 'Tích phân từng phần, vi phân dx, cận tích phân và dấu thế cận dọc.',
    },
    {
      title: '3. Giới hạn vô cực & Giới hạn một bên',
      latex: '\\[ \\lim_{x \\to +\\infty} \\left( \\sqrt{4x^2 + 3x - 1} - 2x \\right) = \\lim_{x \\to +\\infty} \\frac{3x - 1}{\\sqrt{4x^2 + 3x - 1} + 2x} = \\frac{3}{4} \\]',
      inlineNote: 'Ký hiệu giới hạn lim, x tiến về dương vô cùng, nhân liên hợp.',
    },
    {
      title: '4. Khoảng, đoạn, nửa khoảng & Tập nghiệm',
      latex: '\\[ D = (-\\infty; -2) \\cup [1; 3) \\cup (5; +\\infty), \\qquad S = \\left\\{ x \\in \\mathbb{R} \\;\\middle|\\; \\frac{2x - 1}{x + 2} \\ge 1 \\right\\} = (-2; 3] \\]',
      inlineNote: 'Tập số thực R, dấu ngoặc tròn (khoảng), ngoặc vuông (đoạn), ký hiệu thuộc và hợp tập hợp.',
    },
    {
      title: '5. Hệ phương trình, Ma trận & Xác suất',
      latex: '\\[ P(A \\cup B) = P(A) + P(B) - P(A \\cap B), \\qquad \\vec{u} \\perp \\vec{v} \\iff \\vec{u} \\cdot \\vec{v} = x_1 x_2 + y_1 y_2 + z_1 z_2 = 0 \\]',
      inlineNote: 'Ký hiệu xác suất giao/hợp, vectơ có mũi tên, quan hệ vuông góc và tích vô hướng không gian.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 my-auto animate-fadeIn max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Kiểm Thử & Hiển Thị Toán Học Chuẩn SGK GDPT 2018
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Đối chiếu 9 bộ quy chuẩn: Công thức KaTeX, Bảng biến thiên SVG, Đồ thị giải tích và Hình học không gian.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-100 shrink-0 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'formulas', label: '1. Công thức LaTeX (5 Trường hợp)', icon: Sparkles },
            { id: 'variation_table', label: '2. Bảng biến thiên SVG', icon: FileSpreadsheet },
            { id: 'function_graphs', label: '3. Đồ thị hàm số', icon: TrendingUp },
            { id: 'geometry', label: '4. Hình học 2D & 3D', icon: Compass },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  playSound('click');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* TAB 1: FORMULAS */}
          {activeTab === 'formulas' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
                <span className="font-semibold">
                  Tất cả công thức bên dưới được xử lý trực tiếp bởi MathRenderer mà không để lộ mã thô hoặc ký tự $.
                </span>
                <span className="font-bold bg-white text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                  Font KaTeX SGK
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {formulaCases.map((fc, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        {fc.title}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn hiển thị
                      </span>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs text-[19px] overflow-x-auto text-slate-900">
                      <MathRenderer content={fc.latex} />
                    </div>

                    <p className="text-[11px] text-slate-500 italic">
                      {fc.inlineNote}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: VARIATION TABLE */}
          {activeTab === 'variation_table' && (
            <div className="space-y-6">
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
                <p className="font-bold">Đặc tả kỹ thuật thành phần VariationTableRenderer:</p>
                <p className="mt-0.5 text-[11px]">
                  - Hàng x: Căn giữa mốc $-\infty$, các nghiệm đạo hàm, $+\infty$.
                  <br />
                  - Hàng y': Dấu đan xen chính xác, vạch kép $||$ tại điểm gián đoạn.
                  <br />
                  - Hàng y: Vector SVG mũi tên tăng đi lên ($\nearrow$) / giảm đi xuống ($\searrow$), giá trị cực đại trên cao, cực tiểu ở dưới. Không dùng emoji.
                </p>
              </div>

              {/* Sample 1: Hàm bậc ba y = x^3 - 3x */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase">
                  <MathRenderer content="Mẫu 1: Hàm số bậc ba $y = x^3 - 3x$ (CĐ tại $x = -1$, CT tại $x = 1$)" inline />
                </div>
                <VariationTableRenderer
                  preset="cubic_standard"
                  title="Bảng biến thiên hàm số y = x³ - 3x"
                />
              </div>

              {/* Sample 2: Hàm phân thức hữu tỉ y = (2x + 1)/(x - 1) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700 uppercase">
                  <MathRenderer content="Mẫu 2: Hàm số phân thức hữu tỉ $y = \frac{2x + 1}{x - 1}$ (Tiệm cận đứng tại $x = 1$ vạch kép ║)" inline />
                </div>
                <VariationTableRenderer
                  preset="rational_fraction"
                  title="Bảng biến thiên hàm số phân thức y = (2x + 1)/(x - 1)"
                />
              </div>

              {/* Sample 3: Hàm trùng phương y = x^4 - 2x^2 */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-700 uppercase">
                  <MathRenderer content="Mẫu 3: Hàm số trùng phương $y = x^4 - 2x^2$ (3 điểm cực trị)" inline />
                </div>
                <VariationTableRenderer
                  preset="quartic"
                  title="Bảng biến thiên hàm số trùng phương y = x⁴ - 2x²"
                />
              </div>
            </div>
          )}

          {/* TAB 3: FUNCTION GRAPHS */}
          {activeTab === 'function_graphs' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800">Chọn dạng hàm số để khảo sát:</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Hệ tọa độ $Ox, Oy$ chính xác, chia vạch chuẩn, tiệm cận nét đứt, điểm cực trị tự động định vị.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'cubic', label: 'Bậc ba y = x³ - 3x' },
                    { id: 'quadratic', label: 'Parabol y = x² - 2x - 1' },
                    { id: 'rational', label: 'Phân thức y = (2x-1)/(x+1)' },
                    { id: 'linear', label: 'Bậc nhất y = 2x - 1' },
                    { id: 'exponential', label: 'Mũ y = 2^x' },
                    { id: 'logarithm', label: 'Logarit y = log₂x' },
                    { id: 'sine', label: 'Lượng giác y = 2sin(x)' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => {
                        setSelectedGraphType(btn.id as FunctionType);
                        playSound('click');
                      }}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        selectedGraphType === btn.id
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center p-2 bg-slate-50/50 rounded-2xl border border-slate-200">
                <FunctionGraphRenderer
                  type={selectedGraphType}
                  allowAdjust={true}
                  title={`Đồ thị khảo sát: ${selectedGraphType.toUpperCase()}`}
                />
              </div>
            </div>
          )}

          {/* TAB 4: GEOMETRY */}
          {activeTab === 'geometry' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-800">Mô hình hình học 2D & 3D không gian:</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Phân định cạnh thấy (nét liền) và cạnh khuất (nét đứt), ký hiệu góc vuông và đường cao.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'pyramid_quad', label: 'Chóp tứ giác S.ABCD' },
                    { id: 'pyramid_tri', label: 'Chóp tam giác S.ABC' },
                    { id: 'prism_tri', label: 'Lăng trụ ABC.A\'B\'C\'' },
                    { id: 'cuboid', label: 'Hộp chữ nhật' },
                    { id: 'cone', label: 'Khối nón' },
                    { id: 'cylinder', label: 'Khối trụ' },
                    { id: 'sphere', label: 'Mặt cầu' },
                    { id: 'triangle_right', label: 'Tam giác vuông' },
                    { id: 'circle_tangent', label: 'Đường tròn tiếp tuyến' },
                    { id: 'oxyz', label: 'Hệ trục Oxyz' },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => {
                        setSelectedGeoModel(btn.id as GeometryModelType);
                        playSound('click');
                      }}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        selectedGeoModel === btn.id
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-center p-2 bg-slate-50/50 rounded-2xl border border-slate-200">
                <GeometryRenderer
                  model={selectedGeoModel}
                  allowTeacherCustomization={true}
                  title={`Mô hình hình học: ${selectedGeoModel}`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Toàn bộ hệ thống đồ họa và công thức tuân thủ tiêu chuẩn GDPT 2018</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Đã kiểm tra xong
          </button>
        </div>
      </div>
    </div>
  );
};
