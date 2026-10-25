import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Trash2,
  Copy,
  Edit3,
  Layers,
  FileText,
  Upload,
  Download,
  X,
  HelpCircle,
  Eye,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Question, QuestionType, CognitiveLevel, User, Subject } from '../../types';
import { StorageService } from '../../services/storage';
import { MathRenderer } from '../MathRenderer';
import { GeometryDiagram } from '../GeometryDiagram';
import { MathShowcaseModal } from './MathShowcaseModal';
import { MathEditor } from '../math/MathEditor';
import { CompactOptionsEditor } from '../math/CompactOptionsEditor';
import { RichQuestionPromptEditor } from '../math/RichQuestionPromptEditor';
import { playSound } from '../../services/sound';

interface QuestionBankViewProps {
  currentUser: User;
  questions: Question[];
  subjects: Subject[];
  onRefreshData: () => void;
}

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  currentUser,
  questions,
  subjects,
  onRefreshData,
}) => {
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<QuestionType | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<CognitiveLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectCode, setSelectedSubjectCode] = useState('TOAN');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMathModal, setShowMathModal] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Form states for new question
  const [formGrade, setFormGrade] = useState<number>(12);
  const [formTopic, setFormTopic] = useState('Ứng dụng đạo hàm khảo sát hàm số');
  const [formLesson, setFormLesson] = useState('');
  const [formLevel, setFormLevel] = useState<CognitiveLevel>('nhan_biet');
  const [formType, setFormType] = useState<QuestionType>('multiple_choice');
  const [formPrompt, setFormPrompt] = useState('');
  const [formPoints, setFormPoints] = useState<number>(0.25);
  const [formSolution, setFormSolution] = useState('');
  const [formDiagramType, setFormDiagramType] = useState<'none' | 'variation_table' | 'function_curve' | 'coordinate_system' | 'geometry'>('none');

  // MC options
  const [mcOptions, setMcOptions] = useState<string[]>([
    'Phương án A',
    'Phương án B',
    'Phương án C',
    'Phương án D',
  ]);
  const [mcCorrect, setMcCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');

  // True/False options
  const [tfOptions, setTfOptions] = useState([
    { id: 'a' as const, text: 'Mệnh đề ý a', isCorrect: true, explanation: '' },
    { id: 'b' as const, text: 'Mệnh đề ý b', isCorrect: true, explanation: '' },
    { id: 'c' as const, text: 'Mệnh đề ý c', isCorrect: false, explanation: '' },
    { id: 'd' as const, text: 'Mệnh đề ý d', isCorrect: true, explanation: '' },
  ]);

  // Short answer
  const [shortAnswerExpected, setShortAnswerExpected] = useState('');

  // Rubric for essay
  const [essayRubric, setEssayRubric] = useState('');

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchGrade = selectedGrade === 'all' || q.grade === selectedGrade;
      const matchType = selectedType === 'all' || q.type === selectedType;
      const matchLevel = selectedLevel === 'all' || q.cognitiveLevel === selectedLevel;
      const matchSearch =
        q.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.code.toLowerCase().includes(searchQuery.toLowerCase());
      return matchGrade && matchType && matchLevel && matchSearch;
    });
  }, [questions, selectedGrade, selectedType, selectedLevel, searchQuery]);

  // Handle Save Question
  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPrompt.trim()) return;

    const newQ: Question = {
      id: `q-${Date.now()}`,
      code: `TOAN${formGrade}-${Date.now().toString().slice(-4)}`,
      subjectCode: 'TOAN',
      grade: Number(formGrade),
      topic: formTopic.trim(),
      lesson: formLesson.trim() || undefined,
      cognitiveLevel: formLevel,
      type: formType,
      prompt: formPrompt.trim(),
      points: Number(formPoints),
      solution: formSolution.trim(),
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      status: 'published',
      createdAt: new Date().toISOString().substring(0, 10),
      diagramType: formDiagramType === 'none' ? undefined : formDiagramType,
    };

    if (formType === 'multiple_choice') {
      newQ.options = mcOptions;
      newQ.correctAnswer = mcCorrect;
    } else if (formType === 'true_false') {
      newQ.trueFalseOptions = tfOptions;
    } else if (formType === 'short_answer') {
      newQ.correctAnswer = shortAnswerExpected.trim();
    } else if (formType === 'essay') {
      newQ.rubricGuide = essayRubric.trim();
    }

    StorageService.saveQuestion(newQ);
    playSound('correct');
    setShowCreateModal(false);
    resetForm();
    onRefreshData();
  };

  const resetForm = () => {
    setFormPrompt('');
    setFormSolution('');
    setShortAnswerExpected('');
    setEssayRubric('');
    setFormDiagramType('none');
  };

  // Handle Duplicate Question
  const handleDuplicate = (q: Question) => {
    const duplicated: Question = {
      ...q,
      id: `q-${Date.now()}`,
      code: `${q.code}-COPY`,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    StorageService.saveQuestion(duplicated);
    playSound('notification');
    onRefreshData();
  };

  // Handle Delete
  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa câu hỏi này khỏi ngân hàng?')) {
      StorageService.deleteQuestion(id);
      playSound('click');
      onRefreshData();
    }
  };

  // Render Cognitive Level Badge
  const renderLevelBadge = (level: CognitiveLevel) => {
    switch (level) {
      case 'nhan_biet':
        return <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">Biết</span>;
      case 'thong_hieu':
        return <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Hiểu</span>;
      case 'van_dung':
        return <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Vận dụng</span>;
      case 'van_dung_cao':
        return <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Vận dụng cao</span>;
    }
  };

  // Render Type Label
  const getTypeName = (type: QuestionType) => {
    switch (type) {
      case 'multiple_choice':
        return 'Nhiều lựa chọn (4 PA)';
      case 'true_false':
        return 'Đúng / Sai (a, b, c, d)';
      case 'short_answer':
        return 'Trả lời ngắn';
      case 'essay':
        return 'Tự luận';
    }
  };

  return (
    <div className="space-y-6">
      {/* Subject Multi-Domain Banner (Section 6 Architecture) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Môn học & Ngân hàng câu hỏi</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tổ chức, tìm kiếm và biên soạn câu hỏi khoa học theo khối lớp và chủ đề bài học.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setShowMathModal(true);
                playSound('notification');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> Kiểm thử chuẩn Toán học (9 mẫu)
            </button>

            <button
              onClick={() => {
                setShowImportModal(true);
                playSound('click');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Nhập từ Word / Excel
            </button>

            <button
              onClick={() => {
                setShowCreateModal(true);
                playSound('click');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Soạn câu hỏi mới
            </button>
          </div>
        </div>

        {/* Subject Tabs */}
        <div className="flex items-center gap-2 pt-3 overflow-x-auto">
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => {
                if (sub.isActive) {
                  setSelectedSubjectCode(sub.code);
                  playSound('click');
                }
              }}
              disabled={!sub.isActive}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                sub.code === selectedSubjectCode
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : sub.isActive
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-50 text-slate-300 border border-dashed border-slate-200 cursor-not-allowed'
              }`}
            >
              {sub.name} {!sub.isActive && '(Sắp ra mắt)'}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Grade filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
            <span className="text-slate-400 px-2 font-medium">Khối:</span>
            {[
              { label: 'Tất cả', val: 'all' },
              { label: 'Lớp 10', val: 10 },
              { label: 'Lớp 11', val: 11 },
              { label: 'Lớp 12', val: 12 },
            ].map((g) => (
              <button
                key={String(g.val)}
                onClick={() => setSelectedGrade(g.val as number | 'all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  selectedGrade === g.val
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as QuestionType | 'all')}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">Mọi dạng câu hỏi ({questions.length})</option>
            <option value="multiple_choice">Trắc nghiệm 4 lựa chọn</option>
            <option value="true_false">Trắc nghiệm Đúng/Sai</option>
            <option value="short_answer">Trả lời ngắn</option>
            <option value="essay">Tự luận</option>
          </select>

          {/* Cognitive Level filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as CognitiveLevel | 'all')}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">Mọi mức độ nhận thức</option>
            <option value="nhan_biet">Nhận biết</option>
            <option value="thong_hieu">Thông hiểu</option>
            <option value="van_dung">Vận dụng</option>
            <option value="van_dung_cao">Vận dụng cao</option>
          </select>

          {/* Search box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm nội dung, công thức hoặc chủ đề..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Đang hiển thị <strong>{filteredQuestions.length}</strong> / {questions.length} câu hỏi
        </div>
      </div>

      {/* Questions Grid / List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Không tìm thấy câu hỏi phù hợp</p>
            <p className="text-xs mt-1">Hãy thử đổi tiêu chí lọc hoặc soạn câu hỏi mới.</p>
          </div>
        ) : (
          filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all space-y-3"
            >
              {/* Question Header Metadata */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    #{idx + 1} · {q.code}
                  </span>
                  <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    Khối {q.grade}
                  </span>
                  <span className="font-medium text-slate-500">
                    {q.topic} {q.lesson && `· ${q.lesson}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {renderLevelBadge(q.cognitiveLevel)}
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {getTypeName(q.type)}
                  </span>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    {q.points} điểm
                  </span>
                </div>
              </div>

              {/* Question Prompt with LaTeX & Diagram */}
              <div className="question-prompt text-[18px] text-slate-900 leading-relaxed font-medium pt-1">
                <MathRenderer content={q.prompt} />
              </div>

              {/* Diagram if available */}
              {q.diagramType && (
                <div className="pt-2 pb-1">
                  <GeometryDiagram type={q.diagramType} data={q.diagramData} allowAdjust={false} />
                </div>
              )}

              {/* Multiple Choice Options */}
              {q.type === 'multiple_choice' && q.options && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {q.options.map((opt, oIdx) => {
                    const letter = ['A', 'B', 'C', 'D'][oIdx];
                    const isCorrect = q.correctAnswer === letter;
                    return (
                      <div
                        key={oIdx}
                        className={`p-3 rounded-xl border text-[17px] leading-normal flex items-start gap-3 transition-colors ${
                          isCorrect
                            ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-semibold shadow-2xs'
                            : 'bg-slate-50/80 border-slate-200 text-slate-800'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {letter}
                        </span>
                        <div className="flex-1 font-medium text-slate-900 overflow-x-auto">
                          <MathRenderer content={opt} />
                        </div>
                        {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* True / False 4-item grid */}
              {q.type === 'true_false' && q.trueFalseOptions && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">Mệnh đề xét tính Đúng / Sai:</div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {q.trueFalseOptions.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl bg-slate-50/90 border border-slate-200 text-[17px] flex items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="font-bold text-indigo-700 uppercase shrink-0">{item.id})</span>
                          <div className="font-medium text-slate-900">
                            <MathRenderer content={item.text} />
                            {item.explanation && (
                              <p className="text-[13px] text-slate-500 mt-1 italic font-normal">
                                Giải thích: {item.explanation}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 ${
                            item.isCorrect
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {item.isCorrect ? 'ĐÚNG' : 'SAI'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Short Answer Preview */}
              {q.type === 'short_answer' && (
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs">
                  <span className="font-semibold text-slate-700">Đáp án chuẩn trả lời ngắn: </span>
                  <span className="font-mono font-bold text-indigo-700 text-sm">{q.correctAnswer}</span>
                </div>
              )}

              {/* Essay Rubric */}
              {q.type === 'essay' && q.rubricGuide && (
                <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs space-y-1">
                  <span className="font-semibold text-purple-900">Hướng dẫn chấm & thang điểm:</span>
                  <p className="text-slate-600 whitespace-pre-line">{q.rubricGuide}</p>
                </div>
              )}

              {/* Solution box */}
              {q.solution && (
                <details className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                  <summary className="font-semibold text-indigo-700 cursor-pointer select-none">
                    Xem lời giải chi tiết & bình luận sư phạm
                  </summary>
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <MathRenderer content={q.solution} />
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                <span className="text-[11px] text-slate-400">
                  Tác giả: {q.authorName} · Ngày tạo: {q.createdAt}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDuplicate(q)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Nhân bản câu hỏi"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Xóa câu hỏi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Soạn câu hỏi mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Soạn Câu Hỏi Mới – Toán THPT GDPT 2018</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              {/* Row 1: Grade, Type, Level, Points */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={formGrade}
                    onChange={(e) => setFormGrade(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value={10}>Toán 10</option>
                    <option value={11}>Toán 11</option>
                    <option value={12}>Toán 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dạng câu hỏi</label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const t = e.target.value as QuestionType;
                      setFormType(t);
                      if (t === 'multiple_choice') setFormPoints(0.25);
                      else if (t === 'true_false') setFormPoints(1.0);
                      else if (t === 'short_answer') setFormPoints(0.5);
                      else if (t === 'essay') setFormPoints(2.0);
                    }}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="multiple_choice">Nhiều lựa chọn (A,B,C,D)</option>
                    <option value="true_false">Đúng / Sai (a,b,c,d)</option>
                    <option value="short_answer">Trả lời ngắn</option>
                    <option value="essay">Tự luận</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mức độ nhận thức</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value as CognitiveLevel)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="nhan_biet">Nhận biết</option>
                    <option value="thong_hieu">Thông hiểu</option>
                    <option value="van_dung">Vận dụng</option>
                    <option value="van_dung_cao">Vận dụng cao</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm số</label>
                  <input
                    type="number"
                    step="0.05"
                    value={formPoints}
                    onChange={(e) => setFormPoints(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Row 2: Topic & Diagram */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chủ đề kiến thức *</label>
                  <input
                    type="text"
                    required
                    value={formTopic}
                    onChange={(e) => setFormTopic(e.target.value)}
                    placeholder="Ví dụ: Ứng dụng đạo hàm khảo sát hàm số"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hình vẽ / Đồ thị toán</label>
                  <select
                    value={formDiagramType}
                    onChange={(e) => setFormDiagramType(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="none">Không có hình vẽ</option>
                    <option value="variation_table">Bảng biến thiên hàm số</option>
                    <option value="function_curve">Đồ thị hàm số bậc ba</option>
                    <option value="coordinate_system">Hệ trục toạ độ không gian Oxyz</option>
                    <option value="geometry">Hình học không gian (Hình chóp S.ABCD)</option>
                  </select>
                </div>
              </div>

              {/* Prompt */}
              <div>
                <RichQuestionPromptEditor
                  value={formPrompt}
                  onChange={setFormPrompt}
                  placeholder="Ví dụ: Cho hàm số $y = f(x) = \frac{2x - 1}{x + 1}$. Tìm phương trình đường tiệm cận ngang của đồ thị hàm số."
                />
              </div>

              {/* Type specific forms */}
              {formType === 'multiple_choice' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <CompactOptionsEditor
                    options={mcOptions}
                    onChange={setMcOptions}
                    correctAnswer={mcCorrect}
                    onCorrectAnswerChange={(ans) => setMcCorrect(ans as 'A' | 'B' | 'C' | 'D')}
                  />
                </div>
              )}

              {formType === 'true_false' && (
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-xs font-bold text-slate-700 mb-2">4 Mệnh đề Đúng / Sai (a, b, c, d):</div>
                  {tfOptions.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="w-5 text-center font-bold text-indigo-700 uppercase">{item.id})</span>
                      <input
                        type="text"
                        required
                        value={item.text}
                        onChange={(e) => {
                          const copy = [...tfOptions];
                          copy[idx].text = e.target.value;
                          setTfOptions(copy);
                        }}
                        className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const copy = [...tfOptions];
                          copy[idx].isCorrect = !copy[idx].isCorrect;
                          setTfOptions(copy);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                          item.isCorrect
                            ? 'bg-emerald-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {item.isCorrect ? 'ĐÚNG' : 'SAI'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formType === 'short_answer' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Đáp án đúng chuẩn *</label>
                  <input
                    type="text"
                    required
                    value={shortAnswerExpected}
                    onChange={(e) => setShortAnswerExpected(e.target.value)}
                    placeholder="Ví dụ: 4 hoặc 0.5 hoặc -1/2..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              )}

              {formType === 'essay' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thang điểm & Hướng dẫn chấm</label>
                  <textarea
                    rows={2}
                    value={essayRubric}
                    onChange={(e) => setEssayRubric(e.target.value)}
                    placeholder="Phân chia điểm từng bước lập luận..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              )}

              {/* Solution */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lời giải chi tiết</label>
                <textarea
                  rows={2}
                  value={formSolution}
                  onChange={(e) => setFormSolution(e.target.value)}
                  placeholder="Trình bày lời giải chi tiết cho học sinh xem sau khi hoàn thành..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              {/* Live KaTeX Preview */}
              {formPrompt && (
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200/80">
                  <div className="text-[11px] font-bold text-indigo-900 mb-1">Xem trước công thức hiển thị:</div>
                  <div className="text-xs text-slate-800">
                    <MathRenderer content={formPrompt} />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                >
                  Lưu vào ngân hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Word / Excel Import */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Nhập Đề từ Word & Excel</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">Hỗ trợ định dạng:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Tệp Word (.docx) chứa công thức MathType, LaTeX hoặc OMML.</li>
                  <li>Bảng Excel (.xlsx) theo định dạng chuẩn: Mã câu | Nội dung | A | B | C | D | Đáp án | Mức độ | Điểm.</li>
                </ul>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
                <Upload className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800">Kéo thả tệp Word hoặc Excel vào đây</p>
                <p className="text-xs text-slate-400 mt-1">Dung lượng tối đa 25MB · Giữ nguyên công thức Toán</p>
                
                <button
                  type="button"
                  onClick={() => {
                    // Simulate import from word
                    const sampleImported: Question = {
                      id: `q-imp-${Date.now()}`,
                      code: 'TOAN12-WORD-099',
                      subjectCode: 'TOAN',
                      grade: 12,
                      topic: 'Tích phân và ứng dụng hình học',
                      cognitiveLevel: 'thong_hieu',
                      type: 'multiple_choice',
                      prompt: 'Tính tích phân $I = \\int_{0}^{1} (2x + 1) dx$.',
                      options: ['$I = 2$', '$I = 1$', '$I = \\frac{3}{2}$', '$I = 3$'],
                      correctAnswer: 'A',
                      points: 0.25,
                      solution: '$I = \\left[ x^2 + x \\right]_{0}^{1} = (1^2 + 1) - 0 = 2$.',
                      authorId: currentUser.id,
                      authorName: currentUser.fullName,
                      status: 'published',
                      createdAt: new Date().toISOString().substring(0, 10),
                    };
                    StorageService.saveQuestion(sampleImported);
                    playSound('correct');
                    setShowImportModal(false);
                    onRefreshData();
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Tải tệp Word mẫu & Trích xuất tự động
                </button>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                * Dữ liệu sau khi trích xuất sẽ được lưu an toàn vào ngân hàng câu hỏi của bạn.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Math Showcase & Verification Suite */}
      <MathShowcaseModal
        isOpen={showMathModal}
        onClose={() => setShowMathModal(false)}
      />
    </div>
  );
};
