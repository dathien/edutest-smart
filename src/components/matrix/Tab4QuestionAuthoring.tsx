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
  ArrowUpDown,
  Link,
  ChevronDown,
  ListOrdered,
  CheckSquare,
  Hash,
  ToggleLeft,
} from 'lucide-react';
import {
  Question,
  CognitiveLevel,
  QuestionType,
  TrueFalseOption,
  User,
  EssayRubricStep,
  NumericAnswerConfig,
  FillInBlankConfig,
  DropdownChoiceConfig,
  MatchingConfig,
  OrderingConfig,
  MultipleSelectConfig,
} from '../../types';
import { StorageService } from '../../services/storage';
import { playSound } from '../../services/sound';
import { MathRenderer } from '../MathRenderer';
import { GeometryDiagram } from '../GeometryDiagram';
import { VariationTableRenderer } from '../VariationTableRenderer';
import { FunctionGraphRenderer } from '../FunctionGraphRenderer';
import { SignTableRenderer } from '../SignTableRenderer';

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

  // 1. Multiple Choice (4 Options)
  const [mcOptions, setMcOptions] = useState<string[]>([
    'Hàm số đồng biến trên $(-\\infty; -1)$',
    'Hàm số đồng biến trên $(0; 2)$',
    'Hàm số nghịch biến trên $(-1; 2)$',
    'Hàm số có giá trị cực tiểu bằng $1$',
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('A');

  // 2. Single True/False
  const [singleTfAnswer, setSingleTfAnswer] = useState<boolean>(true);

  // 3. Multi True/False (4 Items - CV 7991)
  const [tfOptions, setTfOptions] = useState<TrueFalseOption[]>([
    { id: 'a', text: 'Hàm số đã cho đạt cực đại tại $x = -1$.', isCorrect: true, explanation: 'Đúng theo định nghĩa điểm cực đại.' },
    { id: 'b', text: 'Giá trị cực tiểu của hàm số là $y_{CT} = -2$.', isCorrect: true, explanation: 'Đúng, điểm cực tiểu là $(1; -2)$.' },
    { id: 'c', text: 'Đồ thị hàm số có tiệm cận đứng $x = 0$.', isCorrect: false, explanation: 'Sai, hàm số xác định trên toàn bộ R.' },
    { id: 'd', text: 'Phương trình $f(x) = 0$ có đúng 3 nghiệm thực phân biệt.', isCorrect: true, explanation: 'Đúng, đường thẳng y=0 cắt đồ thị tại 3 điểm.' },
  ]);

  // 4. Short Answer Text
  const [shortAnswer, setShortAnswer] = useState<string>('3');

  // 5. Numeric Answer Config
  const [numericValue, setNumericValue] = useState<number>(4);
  const [numericTolerance, setNumericTolerance] = useState<number>(0.01);
  const [numericUnit, setNumericUnit] = useState<string>('');
  const [allowFractions, setAllowFractions] = useState<boolean>(true);

  // 6. Essay Rubrics
  const [rubricGuide, setRubricGuide] = useState<string>(
    'Học sinh lập bảng biến thiên đúng, kết luận chính xác giá trị lớn nhất và nhỏ nhất.'
  );
  const [essaySteps, setEssaySteps] = useState<EssayRubricStep[]>([
    { id: 'step-1', stepNumber: 1, description: 'Tìm tập xác định $D = \\mathbb{R}$ và tính đạo hàm $y\'$', points: 0.5 },
    { id: 'step-2', stepNumber: 2, description: 'Giải phương trình $y\' = 0$ tìm các nghiệm thuộc đoạn', points: 0.5 },
    { id: 'step-3', stepNumber: 3, description: 'Tính các giá trị tại mút và điểm cực trị', points: 0.5 },
    { id: 'step-4', stepNumber: 4, description: 'So sánh và kết luận GTLN, GTNN', points: 0.5 },
  ]);

  // 7. Fill In Blank Config
  const [blankTemplate, setBlankTemplate] = useState<string>(
    'Hàm số $y = x^3 - 3x$ đồng biến trên khoảng [blank_1] và đạt cực đại tại điểm $x =$ [blank_2].'
  );
  const [blankItems, setBlankItems] = useState([
    { id: 'blank_1', label: 'Ô trống (1)', correctAnswers: ['(-\\infty; -1)', '(-\\infty; -1) và (1; +\\infty)'] },
    { id: 'blank_2', label: 'Ô trống (2)', correctAnswers: ['-1', 'x = -1'] },
  ]);

  // 8. Dropdown Choice Config
  const [dropdownTemplate, setDropdownTemplate] = useState<string>(
    'Hàm số $y = \\frac{2x+1}{x-1}$ có đường tiệm cận đứng là [dropdown_1] và tiệm cận ngang là [dropdown_2].'
  );
  const [dropdownItems, setDropdownItems] = useState([
    { id: 'dropdown_1', label: 'Tiệm cận đứng (1)', options: ['x = 1', 'x = -1', 'y = 2', 'y = 1'], correctOption: 'x = 1' },
    { id: 'dropdown_2', label: 'Tiệm cận ngang (2)', options: ['y = 2', 'y = -2', 'x = 1', 'y = 1'], correctOption: 'y = 2' },
  ]);

  // 9. Matching Config
  const [matchingLeft, setMatchingLeft] = useState([
    { id: 'A1', text: 'Hàm số $y = x^4 - 2x^2 + 1$' },
    { id: 'A2', text: 'Hàm số $y = \\frac{x-1}{x+1}$' },
    { id: 'A3', text: 'Hàm số $y = x^3 - 3x^2 + 2$' },
  ]);
  const [matchingRight, setMatchingRight] = useState([
    { id: 'B1', text: 'Có 3 điểm cực trị' },
    { id: 'B2', text: 'Đồng biến trên từng khoảng xác định' },
    { id: 'B3', text: 'Có điểm uốn tại $x = 1$' },
  ]);
  const [matchingPairs, setMatchingPairs] = useState([
    { leftId: 'A1', rightId: 'B1' },
    { leftId: 'A2', rightId: 'B2' },
    { leftId: 'A3', rightId: 'B3' },
  ]);

  // 10. Ordering Config
  const [orderingItems, setOrderingItems] = useState([
    { id: 'ord_1', text: 'Bước 1: Tìm tập xác định $D = \\mathbb{R}\\setminus\\{1\\}$.' },
    { id: 'ord_2', text: 'Bước 2: Tính đạo hàm $y\' = \\frac{-3}{(x-1)^2} < 0, \\forall x \\ne 1$.' },
    { id: 'ord_3', text: 'Bước 3: Lập bảng biến thiên và xác định các đường tiệm cận.' },
    { id: 'ord_4', text: 'Bước 4: Kết luận tính đơn điệu của hàm số.' },
  ]);

  // 11. Multiple Select Config
  const [multiSelectOptions, setMultiSelectOptions] = useState([
    'Hàm số đồng biến trên $(-\\infty; -1)$',
    'Hàm số có hai điểm cực trị',
    'Đồ thị hàm số đi qua gốc toạ độ $O(0;0)$',
    'Đồ thị có tiệm cận ngang',
  ]);
  const [multiSelectCorrect, setMultiSelectCorrect] = useState<string[]>(['A', 'B']);

  // Diagram Support
  const [diagramType, setDiagramType] = useState<
    'none' | 'variation_table' | 'function_curve' | 'geometry' | 'sign_table' | 'custom_variation_table'
  >('variation_table');

  const [variationTableType, setVariationTableType] = useState<'cubic_standard' | 'rational_fraction' | 'quadratic'>('cubic_standard');
  const [graphType, setGraphType] = useState<'cubic' | 'rational' | 'quadratic'>('cubic');
  const [geometryShape, setGeometryShape] = useState<
    'pyramid_s_abcd' | 'tetrahedron' | 'triangular_prism' | 'cube' | 'oxyz'
  >('pyramid_s_abcd');

  // Custom Variation Table State
  const [customVarX, setCustomVarX] = useState<string>('-\\infty, -1, 1, +\\infty');
  const [customVarYPrime, setCustomVarYPrime] = useState<string>('+, 0, -, 0, +');
  const [customVarY, setCustomVarY] = useState<string>('-\\infty, 2, -2, +\\infty');

  // Sign Table State
  const [signLabel, setSignLabel] = useState<string>("f'(x)");
  const [signPoints, setSignPoints] = useState<string>('-\\infty, -1, 2, +\\infty');
  const [signValues, setSignValues] = useState<string>('+, 0, -, 0, +');

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
    else if (newType === 'true_false_single') setPoints(0.25);
    else if (newType === 'true_false') setPoints(1.0);
    else if (newType === 'short_answer') setPoints(0.5);
    else if (newType === 'numeric_answer') setPoints(0.5);
    else if (newType === 'essay') setPoints(2.0);
    else if (newType === 'fill_in_blank') setPoints(0.5);
    else if (newType === 'dropdown_choice') setPoints(0.5);
    else if (newType === 'matching') setPoints(0.75);
    else if (newType === 'ordering') setPoints(0.75);
    else if (newType === 'multiple_select') setPoints(0.5);
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
      code: `TOAN${grade}-${questionType.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
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

    // Populate format-specific fields
    if (questionType === 'multiple_choice') {
      newQ.options = mcOptions;
      newQ.correctAnswer = correctAnswer;
    } else if (questionType === 'true_false_single') {
      newQ.singleTrueFalseAnswer = singleTfAnswer;
    } else if (questionType === 'true_false') {
      newQ.trueFalseOptions = tfOptions;
    } else if (questionType === 'short_answer') {
      newQ.correctAnswer = shortAnswer;
    } else if (questionType === 'numeric_answer') {
      newQ.numericAnswerConfig = {
        targetValue: numericValue,
        tolerance: numericTolerance,
        unit: numericUnit,
        allowFractions,
        displayAnswer: String(numericValue),
      };
      newQ.correctAnswer = String(numericValue);
    } else if (questionType === 'essay') {
      newQ.rubricGuide = rubricGuide;
    } else if (questionType === 'fill_in_blank') {
      newQ.fillInBlankConfig = {
        template: blankTemplate,
        blanks: blankItems,
      };
    } else if (questionType === 'dropdown_choice') {
      newQ.dropdownChoiceConfig = {
        template: dropdownTemplate,
        dropdowns: dropdownItems,
      };
    } else if (questionType === 'matching') {
      newQ.matchingConfig = {
        leftItems: matchingLeft,
        rightItems: matchingRight,
        pairs: matchingPairs,
      };
    } else if (questionType === 'ordering') {
      newQ.orderingConfig = {
        items: orderingItems,
        correctOrder: orderingItems.map(it => it.id),
      };
    } else if (questionType === 'multiple_select') {
      newQ.multipleSelectConfig = {
        options: multiSelectOptions,
        correctAnswers: multiSelectCorrect,
        partialScoring: true,
      };
    }

    // Attach diagram data
    if (diagramType !== 'none') {
      newQ.diagramType = diagramType as any;
      if (diagramType === 'variation_table') {
        newQ.diagramData = JSON.stringify({ preset: variationTableType });
      } else if (diagramType === 'custom_variation_table') {
        const xArr = customVarX.split(',').map(s => s.trim());
        const yPrimeArr = customVarYPrime.split(',').map(s => s.trim());
        const yArr = customVarY.split(',').map(s => s.trim());
        newQ.diagramData = JSON.stringify({
          customData: {
            xLabels: xArr,
            yPrimeSigns: yPrimeArr,
            yPoints: yArr.map((v, i) => ({
              val: v,
              position: i % 2 === 0 ? 'bottom' : 'top',
              note: i === 1 ? 'CĐ' : i === 2 ? 'CT' : undefined,
            })),
            trends: yArr.slice(0, -1).map((_, i) => (i % 2 === 0 ? 'up' : 'down')),
          },
        });
      } else if (diagramType === 'sign_table') {
        newQ.diagramData = JSON.stringify({
          label: signLabel,
          xPoints: signPoints.split(',').map(s => s.trim()),
          signs: signValues.split(',').map(s => s.trim()),
        });
      } else if (diagramType === 'function_curve') {
        newQ.diagramData = JSON.stringify({ preset: graphType });
      } else if (diagramType === 'geometry') {
        newQ.diagramData = JSON.stringify({ shape: geometryShape });
      }
    }

    StorageService.saveQuestion(newQ);
    onQuestionCreated(newQ);
    alert(`Đã lưu câu hỏi thành công!\nMã câu: ${newQ.code}\nĐịnh dạng: ${newQ.type}`);
  };

  const questionTypeCategories = [
    {
      group: '4 Dạng kiểm tra định kỳ (Bộ GD&ĐT - Công văn 7991)',
      items: [
        { id: 'multiple_choice', label: '1. Trắc nghiệm 4 lựa chọn', desc: 'Chọn 1 trong 4 đáp án A, B, C, D' },
        { id: 'true_false', label: '2. Đúng / Sai (4 ý)', desc: 'Thang điểm phân hoá 0.1 - 0.25 - 0.5 - 1.0' },
        { id: 'short_answer', label: '3. Trả lời ngắn', desc: 'Nhập số hoặc biểu thức ngắn gọn' },
        { id: 'essay', label: '4. Tự luận rubric', desc: 'Chấm điểm từng bước giải logic' },
      ],
    },
    {
      group: '7 Dạng luyện tập & kiểm tra đánh giá đa dạng',
      items: [
        { id: 'true_false_single', label: '5. Đúng / Sai đơn', desc: '1 mệnh đề khẳng định' },
        { id: 'numeric_answer', label: '6. Trả lời bằng số', desc: 'Có sai số ±ε và đơn vị đo' },
        { id: 'fill_in_blank', label: '7. Điền vào chỗ trống', desc: 'Điền từ / số vào các ô khuyết' },
        { id: 'dropdown_choice', label: '8. Điền chọn Dropdown', desc: 'Chọn phương án từ menu thả xuống' },
        { id: 'matching', label: '9. Nối đôi Cột A - B', desc: 'Ghép cặp quan hệ tương ứng' },
        { id: 'ordering', label: '10. Sắp xếp thứ tự', desc: 'Sắp xếp quy trình các bước giải' },
        { id: 'multiple_select', label: '11. Chọn nhiều đáp án', desc: 'Checkbox chọn ≥ 2 đáp án đúng' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Hệ thống 11 dạng câu hỏi Toán THPT • GDPT 2018
          </div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <PenTool className="w-6 h-6 text-indigo-600" />
            Trình biên soạn câu hỏi & Công cụ Toán học
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Hỗ trợ KaTeX, Bảng biến thiên tùy chỉnh, Bảng xét dấu, Đồ thị SVG, Hình học không gian và 11 định dạng kiểm tra
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveQuestion}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Thông tin phân loại & Mức độ nhận thức
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Khối lớp</label>
                <select
                  value={grade}
                  onChange={e => setGrade(Number(e.target.value))}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 font-medium bg-white"
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
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 font-medium bg-white"
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
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 font-bold text-indigo-700 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Chủ đề / Mạch kiến thức</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Bài học / Đơn vị kiến thức</label>
                <input
                  type="text"
                  value={lesson}
                  onChange={e => setLesson(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>

            {/* 11 Question Formats Selector */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Chọn dạng câu hỏi (11 Dạng đầy đủ)
                </label>
                <span className="text-xs text-indigo-600 font-medium">
                  Hiện chọn: <strong>{questionType}</strong>
                </span>
              </div>

              {questionTypeCategories.map(cat => (
                <div key={cat.group} className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {cat.group}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.items.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleTypeChange(item.id as QuestionType)}
                        className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                          questionType === item.id
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs ring-1 ring-indigo-400'
                            : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-xs flex items-center justify-between">
                          <span>{item.label}</span>
                          {questionType === item.id && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className={`text-[11px] mt-0.5 ${questionType === item.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {item.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Math Quick Toolbar */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Thanh công cụ ký hiệu Toán học (KaTeX)</span>
              <span className="text-[11px] font-normal text-slate-500">Bấm để chèn nhanh</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Phân số', latex: '$\\frac{a}{b}$' },
                { label: 'Căn', latex: '$\\sqrt{x}$' },
                { label: 'Số mũ', latex: '$x^{2}$' },
                { label: 'Chỉ số dưới', latex: '$x_{1}$' },
                { label: 'Tích phân', latex: '$\\int_{a}^{b} f(x)dx$' },
                { label: 'Giới hạn', latex: '$\\lim_{x \\to 0}$' },
                { label: 'Vectơ', latex: '$\\vec{u}$' },
                { label: 'Vô cực', latex: '$\\infty$' },
                { label: 'Tập số', latex: '$\\mathbb{R}$' },
                { label: 'Thuộc', latex: '$\\in$' },
                { label: 'Khoảng', latex: '$(-\\infty; 0)$' },
                { label: 'Đoạn', latex: '$[a; b]$' },
                { label: 'Hệ PT', latex: '$\\begin{cases} x+y=2 \\\\ x-y=0 \\end{cases}$' },
              ].map((sym, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleInsertSymbol(sym.latex)}
                  className="px-2.5 py-1 text-xs bg-white hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg font-medium text-slate-700 transition-colors shadow-2xs cursor-pointer"
                >
                  {sym.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Prompt Editor */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Nội dung câu hỏi (LaTeX: $...$ và $$...$$)
              </label>
              <span className="text-xs text-slate-400 font-mono">KaTeX Render Ready</span>
            </div>
            <textarea
              rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono bg-white"
              placeholder="Nhập nội dung đề bài, dùng $công thức$..."
            />
          </div>

          {/* Diagram Selector & Configuration */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                4. Chèn hình học / Bảng biến thiên / Bảng xét dấu
              </label>
              <select
                value={diagramType}
                onChange={e => setDiagramType(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 font-medium bg-white"
              >
                <option value="none">Không kèm hình</option>
                <option value="variation_table">Bảng biến thiên mẫu (SVG)</option>
                <option value="custom_variation_table">Bảng biến thiên tùy chỉnh chi tiết</option>
                <option value="sign_table">Bảng xét dấu đạo hàm / biểu thức</option>
                <option value="function_curve">Đồ thị hàm số Oxy (SVG)</option>
                <option value="geometry">Hình học không gian / 2D (SVG)</option>
              </select>
            </div>

            {diagramType === 'variation_table' && (
              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                <span className="text-xs text-slate-600 font-medium">Mẫu hàm số:</span>
                <select
                  value={variationTableType}
                  onChange={e => setVariationTableType(e.target.value as any)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="cubic_standard">Hàm số bậc ba chuẩn (2 cực trị)</option>
                  <option value="rational_fraction">Hàm số phân thức hữu tỉ (tiệm cận đứng x=1)</option>
                  <option value="quadratic">Hàm số Parabol bậc hai</option>
                </select>
              </div>
            )}

            {diagramType === 'custom_variation_table' && (
              <div className="p-3.5 bg-slate-50 rounded-xl space-y-2.5 border border-slate-200">
                <div className="text-xs font-bold text-slate-700">Tùy chỉnh thông số Bảng biến thiên:</div>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-0.5">Các mốc giá trị $x$ (ngăn cách bằng dấu phẩy):</label>
                    <input
                      type="text"
                      value={customVarX}
                      onChange={e => setCustomVarX(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Dấu đạo hàm $y'$ (+, 0, -, ||, 0, +):</label>
                    <input
                      type="text"
                      value={customVarYPrime}
                      onChange={e => setCustomVarYPrime(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">Giá trị $y$ tại các mốc:</label>
                    <input
                      type="text"
                      value={customVarY}
                      onChange={e => setCustomVarY(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {diagramType === 'sign_table' && (
              <div className="p-3.5 bg-slate-50 rounded-xl space-y-2.5 border border-slate-200">
                <div className="text-xs font-bold text-slate-700">Tùy chỉnh Bảng xét dấu:</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-0.5">Tên biểu thức:</label>
                    <input
                      type="text"
                      value={signLabel}
                      onChange={e => setSignLabel(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 font-mono bg-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-slate-600 mb-0.5">Các mốc nghiệm $x$:</label>
                    <input
                      type="text"
                      value={signPoints}
                      onChange={e => setSignPoints(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-slate-300 font-mono bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-0.5">Dấu các khoảng (+, 0, -, 0, +):</label>
                  <input
                    type="text"
                    value={signValues}
                    onChange={e => setSignValues(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 font-mono bg-white"
                  />
                </div>
              </div>
            )}

            {diagramType === 'function_curve' && (
              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                <span className="text-xs text-slate-600 font-medium">Đồ thị hàm số:</span>
                <select
                  value={graphType}
                  onChange={e => setGraphType(e.target.value as any)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="cubic">Đồ thị hàm số bậc ba y = x³ - 3x</option>
                  <option value="rational">Đồ thị phân thức y = (2x+1)/(x-1)</option>
                  <option value="quadratic">Đồ thị Parabol y = x² - 4x + 3</option>
                </select>
              </div>
            )}

            {diagramType === 'geometry' && (
              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                <span className="text-xs text-slate-600 font-medium">Mô hình không gian:</span>
                <select
                  value={geometryShape}
                  onChange={e => setGeometryShape(e.target.value as any)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                >
                  <option value="pyramid_s_abcd">Hình chóp đáy hình bình hành (S.ABCD)</option>
                  <option value="tetrahedron">Tứ diện đều (A.BCD)</option>
                  <option value="triangular_prism">Lăng trụ tam giác</option>
                  <option value="cube">Hình lập phương</option>
                  <option value="oxyz">Hệ tọa độ không gian Oxyz</option>
                </select>
              </div>
            )}
          </div>

          {/* Format-specific interactive editors */}
          {/* 1. Multiple Choice */}
          {questionType === 'multiple_choice' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                5. Thiết lập 4 phương án lựa chọn & Chọn đáp án đúng
              </label>
              {(['A', 'B', 'C', 'D'] as const).map((letter, idx) => (
                <div key={letter} className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={correctAnswer === letter}
                      onChange={() => setCorrectAnswer(letter)}
                      className="w-4 h-4 text-indigo-600 cursor-pointer"
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
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono bg-white"
                    placeholder={`Phương án ${letter}...`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 2. Single True / False */}
          {questionType === 'true_false_single' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                5. Thiết lập đáp án Đúng / Sai đơn
              </label>
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-sm font-semibold text-slate-700">Mệnh đề đề bài là:</span>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-700">
                  <input
                    type="radio"
                    name="single_tf"
                    checked={singleTfAnswer === true}
                    onChange={() => setSingleTfAnswer(true)}
                  />
                  ĐÚNG
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700">
                  <input
                    type="radio"
                    name="single_tf"
                    checked={singleTfAnswer === false}
                    onChange={() => setSingleTfAnswer(false)}
                  />
                  SAI
                </label>
              </div>
            </div>
          )}

          {/* 3. Multi True / False (4 Items) */}
          {questionType === 'true_false' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  5. Trắc nghiệm Đúng / Sai (4 ý a, b, c, d)
                </label>
                <span className="text-xs text-indigo-600 font-medium">
                  Chuẩn Bộ: 1 ý=0.1đ | 2 ý=0.25đ | 3 ý=0.5đ | 4 ý=1.0đ
                </span>
              </div>

              {tfOptions.map((opt, idx) => (
                <div key={opt.id} className="p-3.5 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
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
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
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
                    className="w-full px-3 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-600"
                    placeholder={`Giải thích chi tiết cho ý ${opt.id}...`}
                  />
                </div>
              ))}
            </div>
          )}

          {/* 4. Short Answer */}
          {questionType === 'short_answer' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                5. Đáp án trả lời ngắn
              </label>
              <input
                type="text"
                value={shortAnswer}
                onChange={e => setShortAnswer(e.target.value)}
                className="w-full max-w-sm px-3.5 py-2 text-sm rounded-xl border border-slate-300 font-mono font-bold text-indigo-700 bg-white"
                placeholder="Ví dụ: 3 hoặc 0.5..."
              />
            </div>
          )}

          {/* 5. Numeric Answer */}
          {questionType === 'numeric_answer' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                5. Cấu hình câu hỏi Trả lời bằng số
              </label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Giá trị số mục tiêu (Target value):</label>
                  <input
                    type="number"
                    step="0.001"
                    value={numericValue}
                    onChange={e => setNumericValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-indigo-700 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Sai số cho phép (Tolerance ±ε):</label>
                  <input
                    type="number"
                    step="0.001"
                    value={numericTolerance}
                    onChange={e => setNumericTolerance(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 mb-1">Đơn vị đo (nếu có, vd: cm, m², rad):</label>
                  <input
                    type="text"
                    value={numericUnit}
                    onChange={e => setNumericUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                    placeholder="Không bắt buộc"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowFractions}
                      onChange={e => setAllowFractions(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    Cho phép học sinh nhập phân số (vd: 3/4)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 6. Essay Rubric */}
          {questionType === 'essay' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  5. Biểu điểm Rubric chấm từng bước giải
                </label>
                <button
                  type="button"
                  onClick={handleAddRubricStep}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm bước
                </button>
              </div>

              <div className="space-y-2">
                {essaySteps.map((step, idx) => (
                  <div key={step.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                    <span className="font-bold text-xs text-indigo-700 shrink-0">
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
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        step="0.25"
                        value={step.points}
                        onChange={e => {
                          const copy = [...essaySteps];
                          copy[idx].points = Number(e.target.value);
                          setEssaySteps(copy);
                        }}
                        className="w-16 px-2 py-1 text-xs rounded-lg border border-slate-300 font-bold text-indigo-700 bg-white"
                      />
                      <span className="text-xs text-slate-500">đ</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Fill in Blank */}
          {questionType === 'fill_in_blank' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                5. Thiết lập đoạn văn điền chỗ trống & Đáp án đúng
              </label>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Mẫu văn bản chứa các placeholder [blank_1], [blank_2]:</label>
                <textarea
                  rows={2}
                  value={blankTemplate}
                  onChange={e => setBlankTemplate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono bg-white"
                />
              </div>
              <div className="space-y-2">
                {blankItems.map((item, idx) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                    <span className="font-bold text-xs text-indigo-700 shrink-0">[{item.id}]:</span>
                    <input
                      type="text"
                      value={item.correctAnswers.join('; ')}
                      onChange={e => {
                        const copy = [...blankItems];
                        copy[idx].correctAnswers = e.target.value.split(';').map(s => s.trim());
                        setBlankItems(copy);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      placeholder="Các đáp án đúng ngăn cách bằng dấu chấm phẩy (;)"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. Dropdown Choice */}
          {questionType === 'dropdown_choice' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                5. Thiết lập Dropdown lựa chọn trong câu
              </label>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Văn bản chứa [dropdown_1], [dropdown_2]:</label>
                <textarea
                  rows={2}
                  value={dropdownTemplate}
                  onChange={e => setDropdownTemplate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono bg-white"
                />
              </div>
              <div className="space-y-2">
                {dropdownItems.map((item, idx) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-700">
                      <span>[{item.id}]</span>
                      <span>Đáp án đúng: <strong className="text-emerald-700">{item.correctOption}</strong></span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-slate-500 mb-0.5">Danh sách phương án (phẩy):</label>
                        <input
                          type="text"
                          value={item.options.join(', ')}
                          onChange={e => {
                            const copy = [...dropdownItems];
                            copy[idx].options = e.target.value.split(',').map(s => s.trim());
                            setDropdownItems(copy);
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-0.5">Phương án đúng:</label>
                        <input
                          type="text"
                          value={item.correctOption}
                          onChange={e => {
                            const copy = [...dropdownItems];
                            copy[idx].correctOption = e.target.value.trim();
                            setDropdownItems(copy);
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-300 bg-white font-bold text-emerald-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. Matching */}
          {questionType === 'matching' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                5. Thiết lập Cặp ghép nối đôi Cột A & Cột B
              </label>
              <div className="space-y-2">
                {matchingLeft.map((left, idx) => (
                  <div key={left.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-bold text-indigo-700">Cột A ({left.id}):</span>
                      <input
                        type="text"
                        value={left.text}
                        onChange={e => {
                          const copy = [...matchingLeft];
                          copy[idx].text = e.target.value;
                          setMatchingLeft(copy);
                        }}
                        className="w-full mt-1 px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-emerald-700">Ghép với Cột B ({matchingRight[idx]?.id}):</span>
                      <input
                        type="text"
                        value={matchingRight[idx]?.text || ''}
                        onChange={e => {
                          const copy = [...matchingRight];
                          copy[idx].text = e.target.value;
                          setMatchingRight(copy);
                        }}
                        className="w-full mt-1 px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. Ordering */}
          {questionType === 'ordering' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                5. Danh sách các bước theo thứ tự chuẩn
              </label>
              <div className="space-y-2">
                {orderingItems.map((item, idx) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                    <span className="font-bold text-xs text-indigo-700 shrink-0">#{idx + 1}</span>
                    <input
                      type="text"
                      value={item.text}
                      onChange={e => {
                        const copy = [...orderingItems];
                        copy[idx].text = e.target.value;
                        setOrderingItems(copy);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. Multiple Select */}
          {questionType === 'multiple_select' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                5. Chọn các phương án đúng (Checkbox đa lựa chọn)
              </label>
              {multiSelectOptions.map((opt, idx) => {
                const letter = ['A', 'B', 'C', 'D'][idx];
                const isChecked = multiSelectCorrect.includes(letter);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        if (isChecked) {
                          setMultiSelectCorrect(multiSelectCorrect.filter(c => c !== letter));
                        } else {
                          setMultiSelectCorrect([...multiSelectCorrect, letter]);
                        }
                      }}
                      className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-sm text-slate-800 w-4">{letter}.</span>
                    <input
                      type="text"
                      value={opt}
                      onChange={e => {
                        const copy = [...multiSelectOptions];
                        copy[idx] = e.target.value;
                        setMultiSelectOptions(copy);
                      }}
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 font-mono bg-white"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Solution Editor */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              6. Lời giải chi tiết & Hướng dẫn chấm
            </label>
            <textarea
              rows={4}
              value={solution}
              onChange={e => setSolution(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono bg-white"
              placeholder="Giải thích chi tiết lời giải, lý do chọn phương án..."
            />
          </div>
        </div>

        {/* Right Column: Live KaTeX & Visual Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-sm text-slate-800">Xem trước hiển thị thực tế</span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold">
                {points} điểm
              </span>
            </div>

            {/* Rendered Prompt */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 text-slate-900 leading-relaxed text-sm">
              <MathRenderer content={prompt} />
            </div>

            {/* Rendered Diagram */}
            {diagramType === 'variation_table' && (
              <div className="flex justify-center">
                <VariationTableRenderer preset={variationTableType} />
              </div>
            )}

            {diagramType === 'custom_variation_table' && (
              <div className="flex justify-center">
                <VariationTableRenderer
                  customData={{
                    xLabels: customVarX.split(',').map(s => s.trim()),
                    yPrimeSigns: customVarYPrime.split(',').map(s => s.trim()),
                    yPoints: customVarY.split(',').map((v, i) => ({
                      val: v.trim(),
                      position: i % 2 === 0 ? 'bottom' : 'top',
                      note: i === 1 ? 'CĐ' : i === 2 ? 'CT' : undefined,
                    })),
                    trends: customVarY.split(',').slice(0, -1).map((_, i) => (i % 2 === 0 ? 'up' : 'down')),
                  }}
                />
              </div>
            )}

            {diagramType === 'sign_table' && (
              <div className="flex justify-center">
                <SignTableRenderer
                  label={signLabel}
                  xPoints={signPoints.split(',').map(s => s.trim())}
                  signs={signValues.split(',').map(s => s.trim())}
                />
              </div>
            )}

            {diagramType === 'function_curve' && (
              <div className="flex justify-center">
                <FunctionGraphRenderer type={graphType} />
              </div>
            )}

            {diagramType === 'geometry' && (
              <div className="flex justify-center">
                <GeometryDiagram type="geometry" data={geometryShape} />
              </div>
            )}

            {/* Answer Display Preview */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Đáp án cấu hình:
              </div>
              {questionType === 'multiple_choice' && (
                <div className="font-bold text-sm text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  Đáp án đúng: Phương án {correctAnswer}
                </div>
              )}
              {questionType === 'true_false_single' && (
                <div className="font-bold text-sm text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  Đáp án: {singleTfAnswer ? 'ĐÚNG' : 'SAI'}
                </div>
              )}
              {questionType === 'true_false' && (
                <div className="text-xs space-y-1 font-mono">
                  {tfOptions.map(o => (
                    <div key={o.id} className="flex justify-between py-1 border-b border-slate-100">
                      <span>Ý {o.id})</span>
                      <strong className={o.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                        {o.isCorrect ? 'ĐÚNG' : 'SAI'}
                      </strong>
                    </div>
                  ))}
                </div>
              )}
              {questionType === 'short_answer' && (
                <div className="font-bold text-sm text-indigo-700 bg-indigo-50 p-2.5 rounded-xl border border-indigo-200 font-mono">
                  {shortAnswer}
                </div>
              )}
              {questionType === 'numeric_answer' && (
                <div className="text-xs space-y-1 bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
                  <div>Giá trị: <strong className="text-indigo-700 font-mono">{numericValue}</strong> {numericUnit}</div>
                  <div>Sai số: <span className="text-slate-500 font-mono">±{numericTolerance}</span></div>
                </div>
              )}
              {questionType === 'multiple_select' && (
                <div className="font-bold text-xs text-indigo-700 bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
                  Đáp án đúng: {multiSelectCorrect.join(', ')}
                </div>
              )}
            </div>

            {/* Solution Preview */}
            {solution && (
              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Lời giải chi tiết:
                </div>
                <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <MathRenderer content={solution} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
