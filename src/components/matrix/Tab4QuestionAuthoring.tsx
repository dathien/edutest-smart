import React, { useState } from 'react';
import {
  PenTool,
  Save,
  Eye,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  HelpCircle,
  FileCode,
  Image as ImageIcon,
  CheckCircle,
} from 'lucide-react';
import {
  Question,
  CognitiveLevel,
  QuestionType,
  TrueFalseOption,
  User,
  EssayRubricStep,
} from '../../types';
import { StorageService } from '../../services/storage';
import { playSound } from '../../services/sound';
import { MathRenderer } from '../MathRenderer';
import { GeometryDiagram } from '../GeometryDiagram';
import { VariationTableRenderer } from '../VariationTableRenderer';
import { FunctionGraphRenderer } from '../FunctionGraphRenderer';

interface Tab4QuestionAuthoringProps {
  currentUser: User;
  onQuestionCreated: (newQuestion: Question) => void;
  onGoToComposeExam: () => void;
}

export const Tab4QuestionAuthoring: React.FC<Tab4QuestionAuthoringProps> = ({
  currentUser,
  onQuestionCreated,
  onGoToComposeExam,
}) => {
  // Classification
  const [grade, setGrade] = useState<number>(12);
  const [topic, setTopic] = useState<string>('Ứng dụng đạo hàm khảo sát hàm số');
  const [lesson, setLesson] = useState<string>('Tính đơn điệu và cực trị của hàm số');
  const [cognitiveLevel, setCognitiveLevel] = useState<CognitiveLevel>('nhan_biet');
  const [questionType, setQuestionType] = useState<QuestionType>('multiple_choice');

  // Question Prompt & Solution
  const [prompt, setPrompt] = useState<string>(
    'Cho hàm số $y = f(x)$ liên tục trên $\\mathbb{R}$ có bảng biến thiên như hình vẽ. Khẳng định nào sau đây là đúng?'
  );
  const [solution, setSolution] = useState<string>(
    'Dựa vào bảng biến thiên, hàm số đồng biến trên khoảng $(-\\infty; -1)$ và $(1; +\\infty)$. Vậy khẳng định A đúng.'
  );
  const [points, setPoints] = useState<number>(0.25);

  // Multiple Choice Options
  const [mcOptions, setMcOptions] = useState<string[]>([
    'Hàm số đồng biến trên $(-\\infty; -1)$',
    'Hàm số đồng biến trên $(0; 2)$',
    'Hàm số nghịch biến trên $(-1; 2)$',
    'Hàm số có giá trị cực tiểu bằng $1$',
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('A');

  // True / False Options
  const [tfOptions, setTfOptions] = useState<TrueFalseOption[]>([
    { id: 'a', text: 'Hàm số đã cho đạt cực đại tại $x = -1$.', isCorrect: true, explanation: 'Đúng theo định nghĩa điểm cực đại.' },
    { id: 'b', text: 'Giá trị cực tiểu của hàm số là $y_{CT} = -2$.', isCorrect: true, explanation: 'Đúng, điểm cực tiểu là $(1; -2)$.' },
    { id: 'c', text: 'Đồ thị hàm số có tiệm cận đứng $x = 0$.', isCorrect: false, explanation: 'Sai, hàm số xác định trên toàn bộ R.' },
    { id: 'd', text: 'Phương trình $f(x) = 0$ có đúng 3 nghiệm thực phân biệt.', isCorrect: true, explanation: 'Đúng, đường thẳng y=0 cắt đồ thị tại 3 điểm.' },
  ]);

  // Short Answer Text
  const [shortAnswer, setShortAnswer] = useState<string>('3');

  // Essay Rubrics
  const [rubricGuide, setRubricGuide] = useState<string>(
    'Học sinh lập bảng biến thiên đúng, kết luận chính xác giá trị lớn nhất và nhỏ nhất.'
  );
  const [essaySteps, setEssaySteps] = useState<EssayRubricStep[]>([
    { id: 'step-1', stepNumber: 1, description: 'Tìm tập xác định $D = \\mathbb{R}$ và tính đạo hàm $y\'$', points: 0.5 },
    { id: 'step-2', stepNumber: 2, description: 'Giải phương trình $y\' = 0$ tìm các nghiệm thuộc đoạn', points: 0.5 },
    { id: 'step-3', stepNumber: 3, description: 'Tính các giá trị tại mút và điểm cực trị', points: 0.5 },
    { id: 'step-4', stepNumber: 4, description: 'So sánh và kết luận GTLN, GTNN', points: 0.5 },
  ]);

  // Diagram Support
  const [diagramType, setDiagramType] = useState<
    'none' | 'variation_table' | 'function_curve' | 'geometry'
  >('variation_table');

  const [variationTableType, setVariationTableType] = useState<'cubic_standard' | 'rational_fraction'>('cubic_standard');
  const [graphType, setGraphType] = useState<'cubic' | 'rational' | 'quadratic'>('cubic');
  const [geometryShape, setGeometryShape] = useState<
    'pyramid_s_abcd' | 'tetrahedron' | 'triangular_prism' | 'cube'
  >('pyramid_s_abcd');

  // Quick Math Insert Helper
  const handleInsertSymbol = (latex: string) => {
    playSound('click');
    setPrompt(prev => prev + ' ' + latex);
  };

  // Switch type updates default points
  const handleTypeChange = (newType: QuestionType) => {
    playSound('click');
    setQuestionType(newType);
    if (newType === 'multiple_choice') setPoints(0.25);
    else if (newType === 'true_false') setPoints(1.0);
    else if (newType === 'short_answer') setPoints(0.5);
    else if (newType === 'essay') setPoints(2.0);
  };

  // Add Rubric Step
  const handleAddRubricStep = () => {
    playSound('click');
    const newStep: EssayRubricStep = {
      id: `step-${Date.now()}`,
      stepNumber: essaySteps.length + 1,
      description: 'Nội dung bước giải tiếp theo',
      points: 0.5,
    };
    setEssaySteps([...essaySteps, newStep]);
  };

  const handleSaveQuestion = () => {
    if (!prompt.trim()) {
      alert('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    playSound('correct');
    const newQ: Question = {
      id: `q-math-${Date.now()}`,
      code: `TOAN${grade}-${questionType.substring(0, 2).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      subjectCode: 'TOAN',
      grade,
      topic,
      lesson,
      cognitiveLevel,
      type: questionType,
      prompt,
      points,
      solution,
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      status: 'published',
      createdAt: new Date().toISOString().substring(0, 10),
    };

    if (questionType === 'multiple_choice') {
      newQ.options = mcOptions;
      newQ.correctAnswer = correctAnswer;
    } else if (questionType === 'true_false') {
      newQ.trueFalseOptions = tfOptions;
    } else if (questionType === 'short_answer') {
      newQ.correctAnswer = shortAnswer;
    } else if (questionType === 'essay') {
      newQ.rubricGuide = rubricGuide;
    }

    if (diagramType !== 'none') {
      newQ.diagramType = diagramType as any;
      if (diagramType === 'variation_table') {
        newQ.diagramData = JSON.stringify({ preset: variationTableType });
      } else if (diagramType === 'function_curve') {
        newQ.diagramData = JSON.stringify({ preset: graphType });
      } else if (diagramType === 'geometry') {
        newQ.diagramData = JSON.stringify({ shape: geometryShape });
      }
    }

    StorageService.saveQuestion(newQ);
    onQuestionCreated(newQ);
    alert(`Đã lưu câu hỏi thành công!\nMã câu: ${newQ.code}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <PenTool className="w-6 h-6 text-indigo-600" />
            Trình biên soạn câu hỏi Toán học (GDPT 2018)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Hỗ trợ KaTeX, Bảng biến thiên, Đồ thị hàm số, Hình học không gian và 4 dạng câu hỏi chuẩn Bộ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveQuestion}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Lưu vào Ngân hàng câu hỏi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Authoring Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Classification Settings */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Khối lớp</label>
                <select
                  value={grade}
                  onChange={e => setGrade(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 font-medium"
                >
                  <option value={12}>Lớp 12</option>
                  <option value={11}>Lớp 11</option>
                  <option value={10}>Lớp 10</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mức độ nhận thức</label>
                <select
                  value={cognitiveLevel}
                  onChange={e => setCognitiveLevel(e.target.value as CognitiveLevel)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 font-medium"
                >
                  <option value="nhan_biet">Nhận biết</option>
                  <option value="thong_hieu">Thông hiểu</option>
                  <option value="van_dung">Vận dụng</option>
                  <option value="van_dung_cao">Vận dụng cao</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Điểm câu hỏi</label>
                <input
                  type="number"
                  step="0.05"
                  value={points}
                  onChange={e => setPoints(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 font-bold text-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chủ đề</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Bài học / Đơn vị KT</label>
                <input
                  type="text"
                  value={lesson}
                  onChange={e => setLesson(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300"
                />
              </div>
            </div>

            {/* Question Format Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Định dạng câu hỏi (4 Dạng chuẩn GDPT 2018)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'multiple_choice', label: '1. Trắc nghiệm (4 LC)' },
                  { id: 'true_false', label: '2. Đúng / Sai (4 ý)' },
                  { id: 'short_answer', label: '3. Trả lời ngắn' },
                  { id: 'essay', label: '4. Tự luận' },
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeChange(type.id as QuestionType)}
                    className={`px-2.5 py-2 text-xs font-semibold rounded-lg border transition-all text-center ${
                      questionType === type.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Math Formula Quick Toolbar */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Thanh công cụ chèn nhanh ký hiệu Toán học (KaTeX)</span>
              <span className="text-[11px] font-normal text-slate-500">Bấm để chèn vào đề</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Phân số', latex: '$\\frac{a}{b}$' },
                { label: 'Căn', latex: '$\\sqrt{x}$' },
                { label: 'Căn bậc n', latex: '$\\sqrt[n]{x}$' },
                { label: 'Số mũ', latex: '$x^{2}$' },
                { label: 'Chỉ số dưới', latex: '$x_{1}$' },
                { label: 'Tích phân', latex: '$\\int_{a}^{b} f(x)dx$' },
                { label: 'Giới hạn', latex: '$\\lim_{x \\to 0}$' },
                { label: 'Vectơ', latex: '$\\vec{u}$' },
                { label: 'Góc', latex: '$\\widehat{ABC}$' },
                { label: 'Hệ PT', latex: '$\\begin{cases} x + y = 1 \\\\ x - y = 0 \\end{cases}$' },
                { label: 'Vô cực', latex: '$\\infty$' },
                { label: 'Giao', latex: '$\\cap$' },
                { label: 'Hợp', latex: '$\\cup$' },
                { label: 'Thuộc', latex: '$\\in$' },
                { label: 'R', latex: '$\\mathbb{R}$' },
              ].map((sym, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleInsertSymbol(sym.latex)}
                  className="px-2 py-1 text-xs bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded font-medium text-slate-700 transition-colors shadow-2xs"
                >
                  {sym.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Prompt Editor */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Nội dung câu hỏi (Hỗ trợ cú pháp LaTeX $...$ và $$...$$)
            </label>
            <textarea
              rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Diagram Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Chèn hình vẽ minh hoạ / Bảng biến thiên
              </label>
              <select
                value={diagramType}
                onChange={e => setDiagramType(e.target.value as any)}
                className="px-2.5 py-1 text-xs rounded border border-slate-300 font-medium"
              >
                <option value="none">Không kèm hình</option>
                <option value="variation_table">Bảng biến thiên (SVG)</option>
                <option value="function_curve">Đồ thị hàm số (SVG)</option>
                <option value="geometry">Hình học 2D / 3D (SVG)</option>
              </select>
            </div>

            {diagramType === 'variation_table' && (
              <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                <span className="text-xs text-slate-600 font-medium">Chọn dạng hàm:</span>
                <select
                  value={variationTableType}
                  onChange={e => setVariationTableType(e.target.value as any)}
                  className="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                >
                  <option value="cubic_standard">Hàm số bậc ba chuẩn</option>
                  <option value="rational_fraction">Hàm số phân thức hữu tỉ</option>
                </select>
              </div>
            )}

            {diagramType === 'function_curve' && (
              <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                <span className="text-xs text-slate-600 font-medium">Chọn dạng đồ thị:</span>
                <select
                  value={graphType}
                  onChange={e => setGraphType(e.target.value as any)}
                  className="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                >
                  <option value="cubic">Đồ thị hàm số bậc ba</option>
                  <option value="rational">Đồ thị hàm phân thức hữu tỉ</option>
                  <option value="quadratic">Đồ thị hàm Parabol bậc hai</option>
                </select>
              </div>
            )}

            {diagramType === 'geometry' && (
              <div className="p-3 bg-slate-50 rounded-lg flex items-center gap-3">
                <span className="text-xs text-slate-600 font-medium">Chọn mô hình hình học:</span>
                <select
                  value={geometryShape}
                  onChange={e => setGeometryShape(e.target.value as any)}
                  className="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
                >
                  <option value="pyramid_s_abcd">Hình chóp đáy hình bình hành (S.ABCD)</option>
                  <option value="tetrahedron">Tứ diện đều (A.BCD)</option>
                  <option value="triangular_prism">Lăng trụ tam giác</option>
                  <option value="cube">Hình lập phương</option>
                </select>
              </div>
            )}
          </div>

          {/* Specific Question Format Details */}
          {questionType === 'multiple_choice' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                4 Phương án lựa chọn (A, B, C, D) & Chọn đáp án đúng
              </label>
              {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => (
                <div key={letter} className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={correctAnswer === letter}
                      onChange={() => setCorrectAnswer(letter)}
                      className="w-4 h-4 text-indigo-600"
                    />
                    <span className="font-bold text-sm text-slate-800">{letter}.</span>
                  </label>
                  <input
                    type="text"
                    value={mcOptions[idx]}
                    onChange={e => {
                      const copy = [...mcOptions];
                      copy[idx] = e.target.value;
                      setMcOptions(copy);
                    }}
                    className="flex-1 px-3 py-1.5 text-sm rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    placeholder={`Phương án ${letter}...`}
                  />
                </div>
              ))}
            </div>
          )}

          {questionType === 'true_false' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Trắc nghiệm Đúng / Sai (4 ý a, b, c, d)
                </label>
                <span className="text-xs text-indigo-600 font-medium">
                  Chuẩn Bộ: 1 ý=0.1đ | 2 ý=0.25đ | 3 ý=0.5đ | 4 ý=1.0đ
                </span>
              </div>

              {tfOptions.map((opt, idx) => (
                <div key={opt.id} className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-indigo-700 uppercase w-6">
                      Ý {opt.id})
                    </span>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={e => {
                        const copy = [...tfOptions];
                        copy[idx].text = e.target.value;
                        setTfOptions(copy);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded border border-slate-300 bg-white"
                      placeholder={`Nội dung ý ${opt.id}...`}
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs font-semibold text-emerald-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`tf_${opt.id}`}
                          checked={opt.isCorrect === true}
                          onChange={() => {
                            const copy = [...tfOptions];
                            copy[idx].isCorrect = true;
                            setTfOptions(copy);
                          }}
                        />
                        Đúng
                      </label>
                      <label className="flex items-center gap-1 text-xs font-semibold text-rose-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`tf_${opt.id}`}
                          checked={opt.isCorrect === false}
                          onChange={() => {
                            const copy = [...tfOptions];
                            copy[idx].isCorrect = false;
                            setTfOptions(copy);
                          }}
                        />
                        Sai
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={opt.explanation || ''}
                    onChange={e => {
                      const copy = [...tfOptions];
                      copy[idx].explanation = e.target.value;
                      setTfOptions(copy);
                    }}
                    className="w-full px-2.5 py-1 text-[11px] rounded border border-slate-200 bg-white text-slate-600"
                    placeholder={`Giải thích chi tiết cho ý ${opt.id}...`}
                  />
                </div>
              ))}
            </div>
          )}

          {questionType === 'short_answer' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Đáp án chuẩn dạng số hoặc phân số
              </label>
              <input
                type="text"
                value={shortAnswer}
                onChange={e => setShortAnswer(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-mono font-bold text-indigo-600"
                placeholder="Ví dụ: 3 hoặc -1/2 hoặc 2.5"
              />
              <p className="text-xs text-slate-500">
                Thí sinh nhập số nguyên, số thập phân hoặc phân số theo quy định.
              </p>
            </div>
          )}

          {questionType === 'essay' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Thang điểm từng bước (Rubric Grading Guide)
                </label>
                <button
                  type="button"
                  onClick={handleAddRubricStep}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm bước chấm
                </button>
              </div>

              {essaySteps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 w-16">
                    Bước {step.stepNumber}:
                  </span>
                  <input
                    type="text"
                    value={step.description}
                    onChange={e => {
                      const copy = [...essaySteps];
                      copy[idx].description = e.target.value;
                      setEssaySteps(copy);
                    }}
                    className="flex-1 px-2.5 py-1.5 text-xs rounded border border-slate-300"
                    placeholder="Yêu cầu cần đạt của bước này..."
                  />
                  <input
                    type="number"
                    step="0.25"
                    value={step.points}
                    onChange={e => {
                      const copy = [...essaySteps];
                      copy[idx].points = Number(e.target.value);
                      setEssaySteps(copy);
                    }}
                    className="w-16 px-2 py-1.5 text-xs rounded border border-slate-300 text-center font-bold text-indigo-600"
                  />
                  <span className="text-xs text-slate-400">đ</span>
                </div>
              ))}
            </div>
          )}

          {/* Detailed Solution */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Lời giải chi tiết (Hướng dẫn giải)
            </label>
            <textarea
              rows={3}
              value={solution}
              onChange={e => setSolution(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono"
            />
          </div>
        </div>

        {/* Right Column: Live KaTeX & Visual Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Xem trước trực tiếp (Live Preview)
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {points} điểm • Toán {grade}
                </span>
              </div>

              {/* Question Body */}
              <div className="space-y-3">
                <div className="text-base text-slate-900 leading-relaxed font-medium">
                  <MathRenderer content={prompt} />
                </div>

                {/* Render Diagram */}
                {diagramType === 'variation_table' && (
                  <div className="my-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <VariationTableRenderer
                      preset={variationTableType}
                      title="Bảng biến thiên hàm số"
                    />
                  </div>
                )}

                {diagramType === 'function_curve' && (
                  <div className="my-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <FunctionGraphRenderer
                      type={graphType}
                      title="Đồ thị hàm số y = f(x)"
                    />
                  </div>
                )}

                {diagramType === 'geometry' && (
                  <div className="my-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <GeometryDiagram
                      type="geometry"
                      data={JSON.stringify({ shape: geometryShape })}
                    />
                  </div>
                )}

                {/* Question Options Preview */}
                {questionType === 'multiple_choice' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => (
                      <div
                        key={letter}
                        className={`p-2.5 rounded-lg border text-sm transition-all ${
                          correctAnswer === letter
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <span className="font-bold mr-1.5">{letter}.</span>
                        <MathRenderer content={mcOptions[idx]} />
                      </div>
                    ))}
                  </div>
                )}

                {questionType === 'true_false' && (
                  <div className="space-y-1.5 pt-2">
                    {tfOptions.map(opt => (
                      <div
                        key={opt.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold uppercase text-slate-700 mr-1.5">
                            {opt.id})
                          </span>
                          <MathRenderer content={opt.text} />
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-xs ${
                            opt.isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {opt.isCorrect ? 'ĐÚNG' : 'SAI'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {questionType === 'short_answer' && (
                  <div className="pt-2">
                    <div className="text-xs text-slate-500 mb-1">Đáp án mẫu:</div>
                    <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg font-bold text-indigo-700 text-sm">
                      {shortAnswer}
                    </div>
                  </div>
                )}

                {questionType === 'essay' && (
                  <div className="pt-2 space-y-1.5">
                    <div className="text-xs font-bold text-slate-700">Thang điểm chấm:</div>
                    {essaySteps.map(step => (
                      <div
                        key={step.id}
                        className="p-2 bg-slate-50 rounded border border-slate-200 text-xs flex justify-between"
                      >
                        <span>
                          <strong>Bước {step.stepNumber}:</strong> {step.description}
                        </span>
                        <span className="font-bold text-indigo-600">{step.points} đ</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Solution Preview */}
                <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/50 p-3 rounded-lg text-xs">
                  <div className="font-bold text-slate-700 mb-1">Lời giải chi tiết:</div>
                  <div className="text-slate-600 leading-relaxed">
                    <MathRenderer content={solution} />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2">
                <button
                  onClick={handleSaveQuestion}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors text-center"
                >
                  Lưu câu hỏi này
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
