import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Shuffle,
  Eye,
  Save,
  Download,
  Printer,
  Sparkles,
  Layers,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
  Check,
} from 'lucide-react';
import {
  Exam,
  Question,
  MatrixDocument,
  ExamVariant,
  User,
  QuestionType,
} from '../../types';
import { StorageService } from '../../services/storage';
import { playSound } from '../../services/sound';
import { MathRenderer } from '../MathRenderer';
import { GeometryDiagram } from '../GeometryDiagram';
import { VariationTableRenderer } from '../VariationTableRenderer';
import { FunctionGraphRenderer } from '../FunctionGraphRenderer';
import { downloadWordDocument, printDocument } from './exportUtils';

interface Tab5ExamComposerProps {
  currentUser: User;
  matrices: MatrixDocument[];
  questions: Question[];
  preselectedMatrixId?: string;
  editingExam?: Exam | null;
  onExamSaved: (exam: Exam) => void;
  onGoToRubric: (examId: string) => void;
  onGoToAudit: (examId: string) => void;
}

export const Tab5ExamComposer: React.FC<Tab5ExamComposerProps> = ({
  currentUser,
  matrices,
  questions,
  preselectedMatrixId,
  editingExam,
  onExamSaved,
  onGoToRubric,
  onGoToAudit,
}) => {
  // Modes: 'matrix_auto' | 'manual'
  const [composerMode, setComposerMode] = useState<'matrix_auto' | 'manual'>(
    editingExam?.matrixId || preselectedMatrixId ? 'matrix_auto' : 'manual'
  );

  // Selected Matrix for Auto Mode
  const [selectedMatrixId, setSelectedMatrixId] = useState<string>(
    editingExam?.matrixId || preselectedMatrixId || matrices[0]?.id || ''
  );

  // Exam Meta Information
  const [examId, setExamId] = useState<string>(editingExam ? editingExam.id : `exam-${Date.now()}`);
  const [title, setTitle] = useState<string>(
    editingExam
      ? editingExam.title
      : 'Đề kiểm tra Giữa học kỳ I - Toán 12 (Chuẩn cấu trúc GDPT 2018)'
  );
  const [code, setCode] = useState<string>(editingExam ? editingExam.code : 'DE-TOAN12-GKI-101');
  const [grade, setGrade] = useState<number>(editingExam ? editingExam.grade : 12);
  const [academicYear, setAcademicYear] = useState<string>(
    editingExam ? editingExam.academicYear : '2025-2026'
  );
  const [semester, setSemester] = useState<string>(editingExam ? editingExam.semester : 'GKI');
  const [durationMinutes, setDurationMinutes] = useState<number>(
    editingExam ? editingExam.durationMinutes : 90
  );
  const [proctoringMode, setProctoringMode] = useState<'basic' | 'standard' | 'strict'>(
    editingExam ? editingExam.proctoringMode : 'standard'
  );

  // Exam Questions in order
  const [examQuestions, setExamQuestions] = useState<Question[]>(
    editingExam ? editingExam.questions : []
  );

  // Bank Filter for Manual Mode
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchBankQuery, setSearchBankQuery] = useState('');

  // Variants (Mã đề hoán vị)
  const [variants, setVariants] = useState<ExamVariant[]>(editingExam?.variants || []);
  const [selectedVariantCode, setSelectedVariantCode] = useState<string>('101');

  // Preview Modal
  const [showA4Preview, setShowA4Preview] = useState(false);

  // Current Matrix Document
  const currentMatrix = useMemo(() => {
    return matrices.find(m => m.id === selectedMatrixId) || matrices[0];
  }, [matrices, selectedMatrixId]);

  // Sync if editingExam changes
  useEffect(() => {
    if (editingExam) {
      setExamId(editingExam.id);
      setTitle(editingExam.title);
      setCode(editingExam.code);
      setGrade(editingExam.grade);
      setAcademicYear(editingExam.academicYear);
      setSemester(editingExam.semester);
      setDurationMinutes(editingExam.durationMinutes);
      setProctoringMode(editingExam.proctoringMode);
      setExamQuestions(editingExam.questions);
      if (editingExam.matrixId) {
        setSelectedMatrixId(editingExam.matrixId);
        setComposerMode('matrix_auto');
      }
      if (editingExam.variants) {
        setVariants(editingExam.variants);
      }
    }
  }, [editingExam]);

  // Total points
  const totalCalculatedPoints = useMemo(() => {
    return examQuestions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  }, [examQuestions]);

  // Automated Matrix Assembly & Gap Analysis
  const matrixAssemblyReport = useMemo(() => {
    if (!currentMatrix || composerMode !== 'matrix_auto') return null;

    const matchedQuestions: Question[] = [];
    const gaps: {
      topic: string;
      level: string;
      type: QuestionType;
      needed: number;
      available: number;
    }[] = [];

    // Filter available pool
    const pool = questions.filter(q => q.grade === currentMatrix.grade);

    currentMatrix.cells.forEach(cell => {
      const candidates = pool.filter(
        q => q.type === cell.questionType && q.cognitiveLevel === cell.cognitiveLevel
      );

      if (candidates.length < cell.questionCount) {
        gaps.push({
          topic: cell.topic,
          level: cell.cognitiveLevel,
          type: cell.questionType,
          needed: cell.questionCount,
          available: candidates.length,
        });
      }

      // Pick needed questions
      candidates.slice(0, cell.questionCount).forEach(q => {
        if (!matchedQuestions.some(existing => existing.id === q.id)) {
          matchedQuestions.push({ ...q, points: cell.pointsPerQuestion });
        }
      });
    });

    return { matchedQuestions, gaps };
  }, [currentMatrix, questions, composerMode]);

  // Handle Load Questions from Matrix
  const handleAutoGenerateFromMatrix = () => {
    if (!matrixAssemblyReport) return;
    playSound('click');
    setExamQuestions(matrixAssemblyReport.matchedQuestions);
  };

  // Grouped questions by 4 standard GDPT 2018 sections
  const groupedSections = useMemo(() => {
    const part1 = examQuestions.filter(q => q.type === 'multiple_choice');
    const part2 = examQuestions.filter(q => q.type === 'true_false');
    const part3 = examQuestions.filter(q => q.type === 'short_answer');
    const part4 = examQuestions.filter(q => q.type === 'essay');
    return { part1, part2, part3, part4 };
  }, [examQuestions]);

  // Reorder question Up / Down
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    playSound('click');
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= examQuestions.length) return;
    const copy = [...examQuestions];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setExamQuestions(copy);
  };

  // Remove question from exam
  const handleRemoveQuestion = (id: string) => {
    playSound('click');
    setExamQuestions(examQuestions.filter(q => q.id !== id));
  };

  // Update question points
  const handleUpdatePoints = (id: string, newPoints: number) => {
    setExamQuestions(examQuestions.map(q => (q.id === id ? { ...q, points: newPoints } : q)));
  };

  // Add question from bank (Manual mode)
  const handleAddQuestionFromBank = (q: Question) => {
    if (examQuestions.some(item => item.id === q.id)) return;
    playSound('click');
    setExamQuestions([...examQuestions, q]);
  };

  // Generate 4 Scrambled Test Variants (101, 102, 103, 104)
  const handleGenerateVariants = () => {
    if (examQuestions.length === 0) {
      alert('Vui lòng thêm câu hỏi vào đề trước khi tạo mã đề hoán vị.');
      return;
    }
    playSound('click');

    const variantCodes = ['101', '102', '103', '104'];
    const generated: ExamVariant[] = variantCodes.map(codeStr => {
      // Shuffled copy
      const shuffledQ = [...examQuestions].sort(() => 0.5 - Math.random());
      const answerKeyMap: { [questionId: string]: string } = {};

      shuffledQ.forEach(q => {
        if (q.type === 'multiple_choice' && q.correctAnswer) {
          answerKeyMap[q.id] = q.correctAnswer;
        } else if (q.type === 'true_false' && q.trueFalseOptions) {
          answerKeyMap[q.id] = q.trueFalseOptions.map(o => (o.isCorrect ? 'Đ' : 'S')).join('-');
        } else if (q.type === 'short_answer' && q.correctAnswer) {
          answerKeyMap[q.id] = q.correctAnswer;
        }
      });

      return {
        code: codeStr,
        questions: shuffledQ,
        answerKeyMap,
      };
    });

    setVariants(generated);
    alert(`Đã sinh thành công 4 mã đề hoán vị: 101, 102, 103, 104!`);
  };

  // Save Exam
  const handleSaveExam = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tên đề kiểm tra.');
      return;
    }
    if (examQuestions.length === 0) {
      alert('Đề kiểm tra chưa có câu hỏi nào.');
      return;
    }

    playSound('correct');
    const newExam: Exam = {
      id: examId,
      code: code.trim(),
      title: title.trim(),
      subjectCode: 'TOAN',
      grade,
      academicYear,
      semester,
      durationMinutes,
      matrixId: composerMode === 'matrix_auto' ? selectedMatrixId : undefined,
      questions: examQuestions,
      totalPoints: Math.round(totalCalculatedPoints * 100) / 100,
      shuffleQuestions: true,
      shuffleOptions: true,
      proctoringMode,
      showResultsImmediately: false,
      allowReviewSolutions: true,
      maxAttempts: 1,
      createdById: currentUser.id,
      createdByName: currentUser.fullName,
      createdAt: editingExam?.createdAt || new Date().toISOString().substring(0, 10),
      status: editingExam?.status || 'draft',
      version: editingExam?.version || 'v1.0',
      variants,
    };

    StorageService.saveExam(newExam);
    onExamSaved(newExam);
  };

  // Export A4 Word
  const handleExportWordA4 = () => {
    playSound('click');

    const renderQuestionsHtml = (list: Question[], startIdx: number) => {
      return list
        .map((q, i) => {
          const qNum = startIdx + i;
          let optionsHtml = '';
          if (q.type === 'multiple_choice' && q.options) {
            optionsHtml = `
              <table style="width: 100%; border: none; margin: 4pt 0;">
                <tr>
                  <td style="width: 25%; border: none;"><strong>A.</strong> ${q.options[0] || ''}</td>
                  <td style="width: 25%; border: none;"><strong>B.</strong> ${q.options[1] || ''}</td>
                  <td style="width: 25%; border: none;"><strong>C.</strong> ${q.options[2] || ''}</td>
                  <td style="width: 25%; border: none;"><strong>D.</strong> ${q.options[3] || ''}</td>
                </tr>
              </table>
            `;
          } else if (q.type === 'true_false' && q.trueFalseOptions) {
            optionsHtml = q.trueFalseOptions
              .map(
                opt => `<div style="margin-left: 15pt;"><strong>${opt.id})</strong> ${opt.text}</div>`
              )
              .join('');
          }

          return `
            <div style="margin-bottom: 12pt;">
              <p><strong>Câu ${qNum} (${q.points} điểm):</strong> ${q.prompt}</p>
              ${optionsHtml}
            </div>
          `;
        })
        .join('');
    };

    let counter = 1;
    const p1Html = renderQuestionsHtml(groupedSections.part1, counter);
    counter += groupedSections.part1.length;
    const p2Html = renderQuestionsHtml(groupedSections.part2, counter);
    counter += groupedSections.part2.length;
    const p3Html = renderQuestionsHtml(groupedSections.part3, counter);
    counter += groupedSections.part3.length;
    const p4Html = renderQuestionsHtml(groupedSections.part4, counter);

    const fullHtml = `
      <table class="header-table" style="width: 100%; margin-bottom: 15px;">
        <tr>
          <td style="width: 45%; text-align: center;">
            <strong>SỞ GIÁO DỤC VÀ ĐÀO TẠO TP.HCM</strong><br/>
            <strong>TRƯỜNG THPT CHUYÊN & GDPT 2018</strong><br/>
            <em>(Đề thi chính thức)</em>
          </td>
          <td style="width: 55%; text-align: center;">
            <strong>${title.toUpperCase()}</strong><br/>
            <strong>MÔN: TOÁN HỌC - KHỐI ${grade}</strong><br/>
            <em>Thời gian làm bài: ${durationMinutes} phút (không kể thời gian phát đề)</em>
          </td>
        </tr>
      </table>

      <table style="width: 100%; border: 1px solid #000; margin-bottom: 20px;">
        <tr>
          <td style="padding: 6pt; border: none;">
            <strong>Mã đề thi: ${code}</strong><br/>
            Họ và tên thí sinh: ............................................................................ SBD: ...................... Phòng thi: ............
          </td>
        </tr>
      </table>

      ${
        groupedSections.part1.length > 0
          ? `<h3>PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (Thí sinh trả lời từ câu 1 đến câu ${groupedSections.part1.length})</h3>${p1Html}`
          : ''
      }
      ${
        groupedSections.part2.length > 0
          ? `<h3>PHẦN II. Câu trắc nghiệm đúng sai (Thí sinh trả lời từ câu 1 đến câu ${groupedSections.part2.length})</h3>${p2Html}`
          : ''
      }
      ${
        groupedSections.part3.length > 0
          ? `<h3>PHẦN III. Câu trắc nghiệm trả lời ngắn (Thí sinh điền kết quả)</h3>${p3Html}`
          : ''
      }
      ${
        groupedSections.part4.length > 0
          ? `<h3>PHẦN IV. Câu hỏi tự luận (Thí sinh trình bày chi tiết lời giải)</h3>${p4Html}`
          : ''
      }

      <div style="text-align: center; margin-top: 30px;">
        <strong>-------------------- HẾT --------------------</strong><br/>
        <em>(Cán bộ coi thi không giải thích gì thêm)</em>
      </div>
    `;

    downloadWordDocument(`DeThi_Toan${grade}_${code}`, title, fullHtml);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Trung tâm biên soạn đề kiểm tra
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Biên soạn đề theo Ma trận chuẩn hoặc chọn câu hỏi thủ công từ ngân hàng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              playSound('click');
              setShowA4Preview(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <Eye className="w-4 h-4 text-indigo-600" />
            Xem trước trang A4
          </button>
          <button
            onClick={handleExportWordA4}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Xuất file Word
          </button>
          <button
            onClick={handleSaveExam}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Lưu đề thi
          </button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Chế độ tạo đề:
        </span>
        <button
          onClick={() => {
            playSound('click');
            setComposerMode('matrix_auto');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            composerMode === 'matrix_auto'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Chế độ 1: Sinh tự động theo Ma trận & Đặc tả
        </button>
        <button
          onClick={() => {
            playSound('click');
            setComposerMode('manual');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            composerMode === 'manual'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Chế độ 2: Chọn câu hỏi thủ công từ ngân hàng
        </button>
      </div>

      {/* Matrix Auto Assembly Section */}
      {composerMode === 'matrix_auto' && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Chọn Ma trận chuẩn làm căn cứ sinh đề
              </label>
              <select
                value={selectedMatrixId}
                onChange={e => setSelectedMatrixId(e.target.value)}
                className="w-full sm:w-96 px-3 py-2 text-sm rounded-lg border border-slate-300 font-medium"
              >
                {matrices.map(m => (
                  <option key={m.id} value={m.id}>
                    Toán {m.grade} • {m.title} ({m.academicYear})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAutoGenerateFromMatrix}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors self-start sm:self-end"
            >
              <Sparkles className="w-4 h-4" />
              Tự động bốc câu hỏi khớp ma trận
            </button>
          </div>

          {/* Gaps notification if any */}
          {matrixAssemblyReport && matrixAssemblyReport.gaps.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Cảnh báo thiếu câu hỏi trong ngân hàng ({matrixAssemblyReport.gaps.length} mục chưa đủ):
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                {matrixAssemblyReport.gaps.map((gap, i) => (
                  <li key={i}>
                    {gap.topic} (Mức: {gap.level}, Dạng: {gap.type}): Cần {gap.needed} câu, hiện có {gap.available} câu trong ngân hàng.
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Exam Meta Info Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Tên đề thi</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 font-semibold"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Mã đề gốc</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 font-mono font-bold text-indigo-600"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Thời gian (phút)</label>
          <input
            type="number"
            value={durationMinutes}
            onChange={e => setDurationMinutes(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Tổng điểm đề thi</label>
          <div className="flex items-center gap-2">
            <span
              className={`text-lg font-bold ${
                Math.abs(totalCalculatedPoints - 10.0) < 0.01 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {totalCalculatedPoints.toFixed(2)} / 10.0 đ
            </span>
            <span className="text-xs text-slate-500 font-medium">({examQuestions.length} câu)</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Questions in Exam (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base">
                Danh sách câu hỏi trong đề ({examQuestions.length} câu)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateVariants}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Sinh 4 mã đề hoán vị
                </button>
              </div>
            </div>

            {examQuestions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                Chưa có câu hỏi nào trong đề. Vui lòng bấm "Tự động bốc câu hỏi" hoặc chọn từ ngân hàng.
              </div>
            ) : (
              <div className="space-y-3">
                {examQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">Câu {idx + 1}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {q.type === 'multiple_choice'
                            ? 'Trắc nghiệm 4 LC'
                            : q.type === 'true_false'
                            ? 'Đúng / Sai'
                            : q.type === 'short_answer'
                            ? 'Trả lời ngắn'
                            : 'Tự luận'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">{q.code}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.05"
                          value={q.points}
                          onChange={e => handleUpdatePoints(q.id, Number(e.target.value))}
                          className="w-14 px-1.5 py-0.5 text-xs rounded border border-slate-300 text-center font-bold text-indigo-600"
                        />
                        <span className="text-xs text-slate-400 mr-2">đ</span>

                        <button
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          title="Lên trên"
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          disabled={idx === examQuestions.length - 1}
                          title="Xuống dưới"
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveQuestion(q.id)}
                          title="Xoá câu hỏi này khỏi đề"
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="text-sm text-slate-800 leading-snug">
                      <MathRenderer content={q.prompt} />
                    </div>

                    {q.diagramType && (
                      <div className="my-2 flex justify-center">
                        <GeometryDiagram type={q.diagramType} data={q.diagramData} allowAdjust={false} />
                      </div>
                    )}

                    {q.options && q.type === 'multiple_choice' && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {q.options.map((opt, i) => (
                          <div key={i} className={q.correctAnswer === String.fromCharCode(65 + i) ? 'font-bold text-indigo-700' : ''}>
                            <span>{String.fromCharCode(65 + i)}. </span>
                            <MathRenderer content={opt} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Question Bank Picker (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base flex items-center justify-between">
              <span>Ngân hàng câu hỏi Toán {grade}</span>
              <span className="text-xs text-slate-500 font-normal">
                {questions.filter(q => q.grade === grade).length} câu khả dụng
              </span>
            </h3>

            {/* Filter Inputs */}
            <div className="space-y-2">
              <input
                type="text"
                value={searchBankQuery}
                onChange={e => setSearchBankQuery(e.target.value)}
                placeholder="Tìm kiếm nội dung câu hỏi..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-slate-300"
                >
                  <option value="all">Tất cả định dạng (11 Dạng)</option>
                  <option value="multiple_choice">1. Trắc nghiệm 4 LC</option>
                  <option value="true_false">2. Đúng / Sai (4 ý)</option>
                  <option value="short_answer">3. Trả lời ngắn</option>
                  <option value="essay">4. Tự luận rubric</option>
                  <option value="true_false_single">5. Đúng / Sai đơn</option>
                  <option value="numeric_answer">6. Trả lời bằng số</option>
                  <option value="fill_in_blank">7. Điền chỗ trống</option>
                  <option value="dropdown_choice">8. Điền chọn Dropdown</option>
                  <option value="matching">9. Nối đôi Cột A-B</option>
                  <option value="ordering">10. Sắp xếp thứ tự</option>
                  <option value="multiple_select">11. Chọn nhiều đáp án</option>
                </select>
                <select
                  value={filterTopic}
                  onChange={e => setFilterTopic(e.target.value)}
                  className="px-2 py-1 text-xs rounded border border-slate-300"
                >
                  <option value="all">Tất cả chủ đề</option>
                  <option value="Ứng dụng đạo hàm">Ứng dụng đạo hàm</option>
                  <option value="Toạ độ">Toạ độ không gian Oxyz</option>
                  <option value="Lượng giác">Lượng giác & Dãy số</option>
                  <option value="Tập hợp">Tập hợp & Bất PT</option>
                </select>
              </div>
            </div>

            {/* Question Pool List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {questions
                .filter(q => q.grade === grade)
                .filter(q => (filterType === 'all' ? true : q.type === filterType))
                .filter(q => (filterTopic === 'all' ? true : q.topic.includes(filterTopic)))
                .filter(q =>
                  searchBankQuery.trim()
                    ? q.prompt.toLowerCase().includes(searchBankQuery.toLowerCase())
                    : true
                )
                .map(q => {
                  const isAdded = examQuestions.some(item => item.id === q.id);
                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${
                        isAdded
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200 hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-indigo-700">{q.code}</span>
                        <span className="text-slate-400 text-[11px]">{q.topic}</span>
                      </div>
                      <div className="text-slate-700 line-clamp-2">
                        <MathRenderer content={q.prompt} />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-400">{q.points} điểm</span>
                        <button
                          disabled={isAdded}
                          onClick={() => handleAddQuestionFromBank(q)}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                            isAdded
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {isAdded ? 'Đã trong đề' : '+ Thêm vào đề'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* A4 Print Preview Modal */}
      {showA4Preview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-800">
                  Xem trước trang in A4 chuẩn Bộ GD&ĐT
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportWordA4}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <Download className="w-4 h-4" /> Xuất Word
                </button>
                <button
                  onClick={() => setShowA4Preview(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Đóng
                </button>
              </div>
            </div>

            {/* A4 Sheet Body */}
            <div className="p-8 overflow-y-auto bg-slate-100 flex justify-center">
              <div className="bg-white shadow-lg p-10 max-w-[800px] w-full rounded border border-slate-200 text-slate-900 space-y-6">
                {/* Official Header */}
                <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                  <div className="text-center w-1/2">
                    <div className="text-xs font-bold uppercase">SỞ GIÁO DỤC VÀ ĐÀO TẠO TP. HỒ CHÍ MINH</div>
                    <div className="text-xs font-bold uppercase text-indigo-900 mt-0.5">
                      TRƯỜNG THPT CHUYÊN & GDPT 2018
                    </div>
                    <div className="text-[11px] italic text-slate-500 mt-1">(Đề kiểm tra chính thức)</div>
                  </div>
                  <div className="text-center w-1/2">
                    <div className="text-xs font-bold uppercase">{title}</div>
                    <div className="text-xs font-bold uppercase text-slate-700 mt-0.5">
                      MÔN: TOÁN HỌC - KHỐI {grade}
                    </div>
                    <div className="text-[11px] italic text-slate-500 mt-1">
                      Thời gian làm bài: {durationMinutes} phút (không kể thời gian phát đề)
                    </div>
                  </div>
                </div>

                {/* Candidate Info Box */}
                <div className="border border-slate-400 p-3 rounded text-xs grid grid-cols-2 gap-2">
                  <div>
                    <strong>Mã đề thi: {code}</strong>
                  </div>
                  <div>
                    Phòng thi số: ................................................
                  </div>
                  <div>
                    Họ và tên thí sinh: ....................................................
                  </div>
                  <div>
                    Số báo danh: ................................................
                  </div>
                </div>

                {/* Section I */}
                {groupedSections.part1.length > 0 && (
                  <div className="space-y-4">
                    <div className="font-bold text-sm uppercase text-slate-900 bg-slate-100 p-2 rounded">
                      PHẦN I. Thí sinh trả lời từ câu 1 đến câu {groupedSections.part1.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.
                    </div>
                    {groupedSections.part1.map((q, idx) => (
                      <div key={q.id} className="text-sm space-y-2">
                        <div className="font-medium">
                          <strong>Câu {idx + 1}:</strong> <MathRenderer content={q.prompt} />
                        </div>
                        {q.diagramType && (
                          <div className="my-2 flex justify-center">
                            <GeometryDiagram type={q.diagramType} data={q.diagramData} allowAdjust={false} />
                          </div>
                        )}
                        {q.options && (
                          <div className="grid grid-cols-2 gap-2 pl-4 text-xs">
                            {q.options.map((opt, i) => (
                              <div key={i}>
                                <strong>{String.fromCharCode(65 + i)}.</strong>{' '}
                                <MathRenderer content={opt} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Section II */}
                {groupedSections.part2.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="font-bold text-sm uppercase text-slate-900 bg-slate-100 p-2 rounded">
                      PHẦN II. Câu trắc nghiệm đúng sai. Thí sinh trả lời từ câu 1 đến câu {groupedSections.part2.length}.
                    </div>
                    {groupedSections.part2.map((q, idx) => (
                      <div key={q.id} className="text-sm space-y-2">
                        <div className="font-medium">
                          <strong>Câu {idx + 1}:</strong> <MathRenderer content={q.prompt} />
                        </div>
                        {q.diagramType && (
                          <div className="my-2 flex justify-center">
                            <GeometryDiagram type={q.diagramType} data={q.diagramData} allowAdjust={false} />
                          </div>
                        )}
                        {q.trueFalseOptions && (
                          <div className="space-y-1 pl-4 text-xs">
                            {q.trueFalseOptions.map(opt => (
                              <div key={opt.id} className="flex items-center justify-between">
                                <div>
                                  <strong>{opt.id})</strong> <MathRenderer content={opt.text} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Section III */}
                {groupedSections.part3.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="font-bold text-sm uppercase text-slate-900 bg-slate-100 p-2 rounded">
                      PHẦN III. Câu trắc nghiệm trả lời ngắn.
                    </div>
                    {groupedSections.part3.map((q, idx) => (
                      <div key={q.id} className="text-sm space-y-1">
                        <div className="font-medium">
                          <strong>Câu {idx + 1}:</strong> <MathRenderer content={q.prompt} />
                        </div>
                        {q.diagramType && (
                          <div className="my-2 flex justify-center">
                            <GeometryDiagram type={q.diagramType} data={q.diagramData} allowAdjust={false} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Section IV */}
                {groupedSections.part4.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-200">
                    <div className="font-bold text-sm uppercase text-slate-900 bg-slate-100 p-2 rounded">
                      PHẦN IV. Tự luận (Thí sinh trình bày chi tiết lời giải).
                    </div>
                    {groupedSections.part4.map((q, idx) => (
                      <div key={q.id} className="text-sm space-y-1">
                        <div className="font-medium">
                          <strong>Câu {idx + 1} ({q.points} điểm):</strong>{' '}
                          <MathRenderer content={q.prompt} />
                        </div>
                        {q.diagramType && (
                          <div className="my-2 flex justify-center">
                            <GeometryDiagram type={q.diagramType} data={q.diagramData} allowAdjust={false} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-center pt-8 text-xs font-bold text-slate-400">
                  ------------------------- HẾT -------------------------
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
