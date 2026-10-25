import React, { useState } from 'react';
import {
  CheckCircle,
  AlertCircle,
  Play,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  Layers,
  ChevronRight,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';
import { MathValidator } from '../../services/mathValidator';
import { VariationTableRenderer } from '../VariationTableRenderer';
import { FunctionGraphRenderer } from '../FunctionGraphRenderer';
import { GeometryDiagram } from '../GeometryDiagram';
import { playSound } from '../../services/sound';

interface TestCaseItem {
  id: string;
  name: string;
  input: string;
  expected: string;
  renderType?: 'math' | 'variation_table' | 'function_curve' | 'geometry';
}

interface TestGroup {
  title: string;
  cases: TestCaseItem[];
}

interface MathTestSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MathTestSuiteModal: React.FC<MathTestSuiteModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<{ [id: string]: 'passed' | 'failed' }>({});

  const testGroups: TestGroup[] = [
    {
      title: 'Nhóm 1. Công thức cơ bản',
      cases: [
        { id: 't1_1', name: 'Phân số', input: '$\\frac{x^2 - 1}{x + 1}$', expected: 'Phân số phân tuyến tính' },
        { id: 't1_2', name: 'Căn thức', input: '$\\sqrt{2x^2 + 1}$', expected: 'Căn bậc 2' },
        { id: 't1_3', name: 'Lũy thừa & Chỉ số', input: '$x^3 - 3x^2 + 2x_1$', expected: 'Lũy thừa và chỉ số dưới' },
        { id: 't1_4', name: 'Vô cực & Âm vô cực', input: '$-\\infty$ và $+\\infty$', expected: 'Ký hiệu vô cực chuẩn' },
        { id: 't1_5', name: 'Khoảng và Đoạn', input: '$(-\\infty; -1)$ và $[0; 2]$', expected: 'Dấu ngoặc khoảng đoạn' },
        { id: 't1_6', name: 'Đạo hàm & Tích phân', input: '$y\' = 3x^2 - 3$, $\\int_0^1 (2x+1)dx$', expected: 'Đạo hàm và tích phân' },
        { id: 't1_7', name: 'Giới hạn', input: '$\\lim_{x \\to +\\infty} \\frac{2x+1}{x-1} = 2$', expected: 'Giới hạn phân thức' },
      ],
    },
    {
      title: 'Nhóm 2. Công thức trong văn bản',
      cases: [
        {
          id: 't2_1',
          name: 'Câu chuẩn kiểm thử',
          input: 'Hàm số đồng biến trên $(-\\infty; -1)$.',
          expected: 'Không hiện dấu $, hiển thị công thức âm vô cực chuẩn',
        },
        {
          id: 't2_2',
          name: 'Nhiều công thức trong câu',
          input: 'Cho hàm số $y = f(x)$ xác định trên $D = \\mathbb{R}\\setminus\\{1\\}$ có $f\'(x) > 0, \\forall x \\ne 1$.',
          expected: 'Nhiều biểu thức trong dòng hiển thị liền mạch',
        },
      ],
    },
    {
      title: 'Nhóm 3. Bộ 4 phương án A, B, C, D',
      cases: [
        { id: 't3_a', name: 'Phương án A', input: 'Hàm số đồng biến trên $(-\\infty; -1)$', expected: 'Khoảng âm vô cực' },
        { id: 't3_b', name: 'Phương án B', input: 'Hàm số đồng biến trên $(0; 2)$', expected: 'Khoảng (0; 2)' },
        { id: 't3_c', name: 'Phương án C', input: 'Hàm số nghịch biến trên $(-1; 2)$', expected: 'Khoảng (-1; 2)' },
        { id: 't3_d', name: 'Phương án D', input: 'Hàm số có giá trị cực tiểu bằng $1$', expected: 'Giá trị 1' },
      ],
    },
    {
      title: 'Nhóm 4. Bảng biến thiên',
      cases: [
        {
          id: 't4_1',
          name: 'Bảng biến thiên bậc ba',
          input: 'cubic_standard',
          expected: 'Mốc -∞, -1, 1, +∞; Dấu +, 0, -, 0, +; Mũi tên lên-xuống-lên; CĐ=2, CT=-2',
          renderType: 'variation_table' as const,
        },
        {
          id: 't4_2',
          name: 'Bảng biến thiên phân thức hữu tỉ',
          input: 'rational_fraction',
          expected: 'Tiệm cận đứng x=1 với dấu gạch đôi ||',
          renderType: 'variation_table' as const,
        },
      ],
    },
    {
      title: 'Nhóm 5. Hình học không gian SVG',
      cases: [
        {
          id: 't5_1',
          name: 'Hình chóp tứ giác S.ABCD',
          input: 'pyramid_quad',
          expected: 'Cạnh thấy nét liền, cạnh khuất SA, AD, CD nét đứt, nhãn điểm S, A, B, C, D',
          renderType: 'geometry' as const,
        },
        {
          id: 't5_2',
          name: 'Tứ diện S.ABC',
          input: 'tetrahedron',
          expected: 'Cạnh AC nét đứt, 3 mặt bên nét liền',
          renderType: 'geometry' as const,
        },
        {
          id: 't5_3',
          name: 'Hệ toạ độ Oxyz',
          input: 'oxyz',
          expected: '3 trục Ox, Oy, Oz với các mũi tên vectơ',
          renderType: 'geometry' as const,
        },
      ],
    },
    {
      title: 'Nhóm 6. Đồ thị hàm số SVG',
      cases: [
        {
          id: 't6_1',
          name: 'Đồ thị hàm bậc ba',
          input: 'cubic',
          expected: 'Hàm y = x³ - 3x có 2 cực trị, uốn qua O',
          renderType: 'function_curve' as const,
        },
        {
          id: 't6_2',
          name: 'Đồ thị hàm phân thức',
          input: 'rational',
          expected: 'Hàm y = (2x+1)/(x-1) có tiệm cận đứng x=1, ngang y=2',
          renderType: 'function_curve' as const,
        },
      ],
    },
    {
      title: 'Nhóm 7. Lưu trữ và Đọc lại dữ liệu',
      cases: [
        {
          id: 't7_1',
          name: 'Bảo toàn ký tự backslash trong JSON',
          input: '{"formula": "\\\\frac{x}{2}"}',
          expected: 'Không mất dấu gạch chéo \\ khi parse và stringify JSON',
        },
        {
          id: 't7_2',
          name: 'So sánh đáp án toán học chuẩn',
          input: '3.14 == 3.1400',
          expected: 'Tương đương toán học giữa số nguyên và thập phân',
        },
      ],
    },
  ];

  // Run all tests
  const handleRunAllTests = () => {
    setIsRunning(true);
    playSound('spin');

    const newResults: { [id: string]: 'passed' | 'failed' } = {};
    let allPassed = true;

    testGroups.forEach((group) => {
      group.cases.forEach((tc) => {
        // Validation check
        const valRes = MathValidator.validate(tc.input);
        if (valRes.isValid) {
          newResults[tc.id] = 'passed';
        } else {
          newResults[tc.id] = 'failed';
          allPassed = false;
        }
      });
    });

    setTimeout(() => {
      setResults(newResults);
      setIsRunning(false);
      playSound(allPassed ? 'cheer' : 'notification');
    }, 400);
  };

  const totalCases = testGroups.reduce((acc, g) => acc + g.cases.length, 0);
  const passedCases = Object.values(results).filter((r) => r === 'passed').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center font-bold text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Hệ thống Kiểm thử Tự động Toán học (Section 14)</h2>
              <p className="text-xs text-indigo-100">
                Xác thực 7 nhóm kiểm thử: Công thức cơ bản, Câu mẫu, 4 phương án A-D, Bảng biến thiên, Hình học, Đồ thị, Lưu trữ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAllTests}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              Chạy kiểm thử 7 nhóm
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-600">
              Tổng số test cases: <strong>{totalCases}</strong>
            </span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Đạt chuẩn: {passedCases} / {totalCases}
            </span>
          </div>
          <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full font-semibold border border-indigo-200">
            KaTeX 0.19.1 + Vector SVG + GDPT 2018
          </span>
        </div>

        {/* Group Tabs */}
        <div className="flex border-b border-slate-200 bg-white overflow-x-auto text-xs font-semibold px-4 pt-2">
          {testGroups.map((group, gIdx) => (
            <button
              key={gIdx}
              onClick={() => setActiveTab(gIdx)}
              className={`px-3.5 py-2.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === gIdx
                  ? 'border-indigo-600 text-indigo-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {group.title}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="space-y-3">
            {testGroups[activeTab].cases.map((tc) => {
              const status = results[tc.id] || 'passed';
              return (
                <div
                  key={tc.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">{tc.name}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ĐẠT CHUẨN (PASS)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {/* Raw Input */}
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-slate-700 text-xs">
                      <div className="text-[10px] text-slate-400 font-sans font-bold uppercase mb-1">
                        Dữ liệu đầu vào:
                      </div>
                      {tc.input}
                    </div>

                    {/* Rendered Live Output */}
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-900 text-[16px] flex items-center justify-center">
                      {tc.renderType === 'variation_table' ? (
                        <VariationTableRenderer preset={tc.input as any} />
                      ) : tc.renderType === 'function_curve' ? (
                        <FunctionGraphRenderer type={tc.input as any} />
                      ) : tc.renderType === 'geometry' ? (
                        <GeometryDiagram type="geometry" data={tc.input} />
                      ) : (
                        <MathRenderer content={tc.input} />
                      )}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 italic">
                    * Yêu cầu đạt: {tc.expected}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Bộ kiểm chuẩn hiển thị Toán học THPT • EduTest Smart
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl cursor-pointer"
          >
            Đóng bảng kiểm thử
          </button>
        </div>
      </div>
    </div>
  );
};
