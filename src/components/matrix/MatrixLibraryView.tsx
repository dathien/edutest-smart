import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  BookOpen,
  Scale,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Send,
  Sliders,
  Check,
  RefreshCw,
  FileCheck,
  Eye,
  X,
} from 'lucide-react';
import { MatrixDocument, MatrixCell, Question, Exam, User, ClassRoom } from '../../types';
import { StorageService } from '../../services/storage';
import { playSound } from '../../services/sound';

interface MatrixLibraryViewProps {
  currentUser: User;
  matrices: MatrixDocument[];
  questions: Question[];
  classes: ClassRoom[];
  onRefreshData: () => void;
  onNavigateExamRoom?: () => void;
}

export const MatrixLibraryView: React.FC<MatrixLibraryViewProps> = ({
  currentUser,
  matrices,
  questions,
  classes,
  onRefreshData,
}) => {
  const [selectedYear, setSelectedYear] = useState<'2025-2026' | '2026-2027'>('2025-2026');
  const [selectedGrade, setSelectedGrade] = useState<10 | 11 | 12>(12);
  const [activeMatrixId, setActiveMatrixId] = useState<string>(matrices[0]?.id || '');
  
  // Matrix comparison state
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareMatrixId1, setCompareMatrixId1] = useState<string>(matrices[0]?.id || '');
  const [compareMatrixId2, setCompareMatrixId2] = useState<string>(matrices[4]?.id || '');

  // Generate Exam from Matrix state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examDuration, setExamDuration] = useState(90);
  const [examShuffleQuestions, setExamShuffleQuestions] = useState(true);
  const [examShuffleOptions, setExamShuffleOptions] = useState(true);
  const [examProctoring, setExamProctoring] = useState<'basic' | 'standard' | 'strict'>('standard');
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>(['class-12a1']);

  // Active matrix document
  const currentMatrix = useMemo(() => {
    return matrices.find(m => m.id === activeMatrixId) || matrices[0];
  }, [matrices, activeMatrixId]);

  // Automated Matrix Validation Engine (Section 8.6)
  const validationReport = useMemo(() => {
    if (!currentMatrix || !currentMatrix.isVerified) {
      return {
        isValid: false,
        totalPoints: 0,
        totalQuestions: 0,
        levelBreakdown: { nhan_biet: 0, thong_hieu: 0, van_dung: 0 },
        missingQuestions: [],
        message: 'Tài liệu chưa được xác minh hoặc đang ở trạng thái Chờ cập nhật tài liệu.',
      };
    }

    const totalPoints = currentMatrix.cells.reduce((sum, c) => sum + c.totalPoints, 0);
    const totalQuestions = currentMatrix.cells.reduce((sum, c) => sum + c.questionCount, 0);

    // Points distribution
    let knowPts = 0;
    let compPts = 0;
    let appPts = 0;

    currentMatrix.cells.forEach(c => {
      if (c.cognitiveLevel === 'nhan_biet') knowPts += c.totalPoints;
      else if (c.cognitiveLevel === 'thong_hieu') compPts += c.totalPoints;
      else if (c.cognitiveLevel === 'van_dung' || c.cognitiveLevel === 'van_dung_cao') appPts += c.totalPoints;
    });

    // Check Question Bank Inventory vs Matrix Requirements
    const missingItems: { topic: string; level: string; needed: number; available: number }[] = [];

    currentMatrix.cells.forEach(cell => {
      const available = questions.filter(
        q => q.grade === currentMatrix.grade && q.type === cell.questionType && q.cognitiveLevel === cell.cognitiveLevel
      ).length;

      if (available < cell.questionCount) {
        missingItems.push({
          topic: cell.topic,
          level: cell.cognitiveLevel === 'nhan_biet' ? 'Biết' : cell.cognitiveLevel === 'thong_hieu' ? 'Hiểu' : 'Vận dụng',
          needed: cell.questionCount,
          available,
        });
      }
    });

    const isSumValid = Math.abs(totalPoints - 10.0) < 0.01;

    return {
      isValid: isSumValid,
      totalPoints,
      totalQuestions,
      levelBreakdown: {
        nhan_biet: knowPts,
        thong_hieu: compPts,
        van_dung: appPts,
      },
      missingQuestions: missingItems,
      message: isSumValid
        ? 'Ma trận chuẩn xác 10.0 điểm, phù hợp khung hướng dẫn CV 7991/BGDĐT-GDTrH.'
        : `Tổng điểm hiện tại là ${totalPoints.toFixed(1)}/10.0 điểm (Cần điều chỉnh về đúng 10.0 điểm).`,
    };
  }, [currentMatrix, questions]);

  // Handle Generate Exam from Matrix
  const handleGenerateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMatrix) return;

    // Pick questions matching matrix criteria
    const examQuestions: Question[] = [];
    currentMatrix.cells.forEach(cell => {
      const candidates = questions.filter(
        q => q.grade === currentMatrix.grade && q.type === cell.questionType
      );
      examQuestions.push(...candidates.slice(0, cell.questionCount));
    });

    // Fallback if inventory is tight in test mode: grab available
    if (examQuestions.length === 0) {
      examQuestions.push(...questions.filter(q => q.grade === currentMatrix.grade));
    }

    const newExam: Exam = {
      id: `exam-${Date.now()}`,
      code: `DE-${currentMatrix.grade}-${currentMatrix.semester}-${Date.now().toString().slice(-4)}`,
      title: examTitle || `Đề kiểm tra ${currentMatrix.title}`,
      subjectCode: 'TOAN',
      grade: currentMatrix.grade,
      academicYear: currentMatrix.academicYear,
      semester: currentMatrix.semester,
      durationMinutes: Number(examDuration),
      matrixId: currentMatrix.id,
      questions: examQuestions,
      totalPoints: 10.0,
      shuffleQuestions: examShuffleQuestions,
      shuffleOptions: examShuffleOptions,
      proctoringMode: examProctoring,
      showResultsImmediately: true,
      allowReviewSolutions: true,
      maxAttempts: 1,
      createdById: currentUser.id,
      createdByName: currentUser.fullName,
      createdAt: new Date().toISOString().substring(0, 10),
      status: 'published',
    };

    StorageService.saveExam(newExam);

    // Auto assign if classes selected
    if (assignedClassIds.length > 0) {
      const targetClasses = classes.filter(c => assignedClassIds.includes(c.id));
      const totalCount = targetClasses.reduce((sum, c) => sum + c.studentCount, 0);

      StorageService.saveAssignment({
        id: `assign-${Date.now()}`,
        examId: newExam.id,
        examTitle: newExam.title,
        classIds: assignedClassIds,
        classNames: targetClasses.map(c => c.name),
        startDate: new Date().toISOString().substring(0, 16).replace('T', ' '),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 16).replace('T', ' '),
        status: 'in_progress',
        totalAssigned: totalCount,
        totalSubmitted: 0,
      });
    }

    playSound('cheer');
    setShowGenerateModal(false);
    onRefreshData();
  };

  // Compare 2 matrices
  const matrix1 = matrices.find(m => m.id === compareMatrixId1);
  const matrix2 = matrices.find(m => m.id === compareMatrixId2);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-800">
              Thư viện Ma trận & Bản đặc tả GDPT 2018
            </h2>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Công văn 7991/BGDĐT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Phân hệ chuyên môn trọng tâm môn Toán THPT. Chuẩn hóa theo năm học 2025–2026 và 2026–2027.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowCompareModal(true);
              playSound('click');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Scale className="w-4 h-4 text-slate-500" /> So sánh 2 ma trận
          </button>

          <button
            onClick={() => {
              setExamTitle(`Đề kiểm tra ${currentMatrix.title}`);
              setShowGenerateModal(true);
              playSound('click');
            }}
            disabled={!currentMatrix.isVerified}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs ${
              currentMatrix.isVerified
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Xuất đề thi từ ma trận này
          </button>
        </div>
      </div>

      {/* Year & Grade Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Năm học:</span>
          {(['2025-2026', '2026-2027'] as const).map((year) => (
            <button
              key={year}
              onClick={() => {
                setSelectedYear(year);
                // switch active matrix to first available of that year
                const found = matrices.find(m => m.academicYear === year && m.grade === selectedGrade);
                if (found) setActiveMatrixId(found.id);
                playSound('click');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedYear === year
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {year} {year === '2025-2026' ? '(Đã chuẩn hóa)' : '(Dự thảo)'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Khối lớp:</span>
          {([10, 11, 12] as const).map((gr) => (
            <button
              key={gr}
              onClick={() => {
                setSelectedGrade(gr);
                const found = matrices.find(m => m.academicYear === selectedYear && m.grade === gr);
                if (found) setActiveMatrixId(found.id);
                playSound('click');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedGrade === gr
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Toán {gr}
            </button>
          ))}
        </div>
      </div>

      {/* Available Matrix Documents in Selected Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {matrices
          .filter(m => m.academicYear === selectedYear && m.grade === selectedGrade)
          .map((m) => {
            const isActive = m.id === activeMatrixId;
            return (
              <div
                key={m.id}
                onClick={() => {
                  setActiveMatrixId(m.id);
                  playSound('click');
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-200 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    Kỳ: {m.semester}
                  </span>
                  {m.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle className="w-3 h-3" /> Đã xác minh
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Clock className="w-3 h-3" /> Chờ cập nhật tài liệu
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">
                  {m.title}
                </h4>

                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">{m.issuingUnit}</span>
                  <div className="flex justify-between text-slate-400 mt-1">
                    <span>{m.durationMinutes} phút</span>
                    <span>{m.totalPoints} điểm</span>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Active Matrix Details & Automated Verification Report */}
      {currentMatrix && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          {/* Header of Active Document */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {currentMatrix.academicYear} · Khối {currentMatrix.grade} · {currentMatrix.semester}
                </span>
                {currentMatrix.isVerified ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Nguồn chính thức: {currentMatrix.issuingUnit}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Chờ cập nhật tài liệu gốc
                  </span>
                )}
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">{currentMatrix.title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Nguồn: {currentMatrix.sourceDocument || 'Chưa công bố văn bản gốc'} · Bộ sách: {currentMatrix.curriculum}
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-2xl font-black text-indigo-700">{currentMatrix.totalPoints.toFixed(1)} / 10</div>
              <span className="text-[11px] text-slate-400 font-medium">Thời gian: {currentMatrix.durationMinutes} phút</span>
            </div>
          </div>

          {/* Section 8.6: Automated Matrix Verification Box */}
          <div
            className={`p-4 rounded-xl border text-xs ${
              validationReport.isValid
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {validationReport.isValid ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
              Kiểm tra Ma trận Tự động (CV 7991/BGDĐT-GDTrH)
            </div>
            <p className="leading-relaxed">{validationReport.message}</p>

            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200/60 font-semibold text-slate-800">
              <div>
                Biết: <span className="font-extrabold text-indigo-700">{validationReport.levelBreakdown.nhan_biet} đ</span> ({Math.round(validationReport.levelBreakdown.nhan_biet * 10)}%)
              </div>
              <div>
                Hiểu: <span className="font-extrabold text-indigo-700">{validationReport.levelBreakdown.thong_hieu} đ</span> ({Math.round(validationReport.levelBreakdown.thong_hieu * 10)}%)
              </div>
              <div>
                Vận dụng: <span className="font-extrabold text-indigo-700">{validationReport.levelBreakdown.van_dung} đ</span> ({Math.round(validationReport.levelBreakdown.van_dung * 10)}%)
              </div>
            </div>

            {/* Inventory shortage warning if any */}
            {validationReport.missingQuestions.length > 0 && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] space-y-1">
                <span className="font-bold">Cảnh báo ngân hàng câu hỏi:</span>
                <p>Ngân hàng chưa đủ câu hỏi theo ma trận đối với các mục sau:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {validationReport.missingQuestions.map((m, i) => (
                    <li key={i}>
                      {m.topic} (Mức {m.level}): Cần <strong>{m.needed}</strong> câu, hiện có <strong>{m.available}</strong> câu.
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Matrix Specification Table (Bản đặc tả & ma trận chi tiết) */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold">
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-3 w-8 text-center">STT</th>
                  <th className="py-3 px-3 w-1/4">Chủ đề & Nội dung kiểm tra</th>
                  <th className="py-3 px-3 w-1/3">Yêu cầu cần đạt (Bản đặc tả)</th>
                  <th className="py-3 px-3">Hình thức</th>
                  <th className="py-3 px-3 text-center">Mức độ</th>
                  <th className="py-3 px-3 text-center">Số câu</th>
                  <th className="py-3 px-3 text-right">Điểm/câu</th>
                  <th className="py-3 px-3 text-right">Tổng điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentMatrix.cells.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Tài liệu đang ở trạng thái "Chờ cập nhật tài liệu chính thức". Chưa có bảng đặc tả.
                    </td>
                  </tr>
                ) : (
                  currentMatrix.cells.map((cell, idx) => (
                    <tr key={cell.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{cell.topic}</td>
                      <td className="py-3 px-3 text-slate-600 leading-relaxed">{cell.learningOutcome}</td>
                      <td className="py-3 px-3 text-slate-700">
                        {cell.questionType === 'multiple_choice' && 'Trắc nghiệm 4 PA'}
                        {cell.questionType === 'true_false' && 'Đúng / Sai'}
                        {cell.questionType === 'short_answer' && 'Trả lời ngắn'}
                        {cell.questionType === 'essay' && 'Tự luận'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cell.cognitiveLevel === 'nhan_biet'
                              ? 'bg-sky-50 text-sky-700'
                              : cell.cognitiveLevel === 'thong_hieu'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {cell.cognitiveLevel === 'nhan_biet' ? 'Biết' : cell.cognitiveLevel === 'thong_hieu' ? 'Hiểu' : 'Vận dụng'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">{cell.questionCount}</td>
                      <td className="py-3 px-3 text-right text-slate-600 font-mono">{cell.pointsPerQuestion}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-indigo-700 font-mono">
                        {cell.totalPoints.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Generate & Assign Exam */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Tạo & Phát hành Đề thi từ Ma trận</h3>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên đề kiểm tra *</label>
                <input
                  type="text"
                  required
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian làm bài (phút)</label>
                  <input
                    type="number"
                    value={examDuration}
                    onChange={(e) => setExamDuration(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chế độ giám sát</label>
                  <select
                    value={examProctoring}
                    onChange={(e) => setExamProctoring(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="basic">Cơ bản (Cảnh báo chuyển tab)</option>
                    <option value="standard">Tiêu chuẩn (Ghi log vi phạm & Toàn màn hình)</option>
                    <option value="strict">Nghiêm ngặt (Khóa khi rời tab & chụp nhật ký)</option>
                  </select>
                </div>
              </div>

              {/* Shuffling Options */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                <div className="font-semibold text-slate-700 mb-1">Cấu hình trộn đề (Mã đề tự động):</div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={examShuffleQuestions}
                    onChange={(e) => setExamShuffleQuestions(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Đảo thứ tự câu hỏi giữa các học sinh</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={examShuffleOptions}
                    onChange={(e) => setExamShuffleOptions(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Đảo thứ tự phương án A, B, C, D (Không áp dụng cho câu phụ thuộc thứ tự)</span>
                </label>
              </div>

              {/* Assign to classes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Giao bài cho lớp học *</label>
                <div className="grid grid-cols-2 gap-2">
                  {classes.map((cls) => {
                    const isChecked = assignedClassIds.includes(cls.id);
                    return (
                      <label
                        key={cls.id}
                        className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50 border-indigo-300 font-semibold text-indigo-900' : 'bg-white border-slate-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignedClassIds([...assignedClassIds, cls.id]);
                            } else {
                              setAssignedClassIds(assignedClassIds.filter(id => id !== cls.id));
                            }
                          }}
                          className="rounded text-indigo-600"
                        />
                        <span>Lớp {cls.name} ({cls.studentCount} HS)</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> Tạo đề & Giao phòng thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Compare 2 Matrices (Section 8.7) */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">So Sánh Hai Ma Trận Kiểm Tra</h3>
              </div>
              <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Select 2 matrices */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ma trận A (Gốc)</label>
                <select
                  value={compareMatrixId1}
                  onChange={(e) => setCompareMatrixId1(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {matrices.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.academicYear} · {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ma trận B (Đối chiếu)</label>
                <select
                  value={compareMatrixId2}
                  onChange={(e) => setCompareMatrixId2(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {matrices.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.academicYear} · {m.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Side-by-side comparison cards */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Matrix A */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-indigo-700">{matrix1?.title}</div>
                <div className="text-slate-500">
                  Năm học: <strong>{matrix1?.academicYear}</strong> · Trường: <strong>{matrix1?.issuingUnit}</strong>
                </div>
                <div>
                  Trạng thái:{' '}
                  {matrix1?.isVerified ? (
                    <span className="text-emerald-700 font-bold">Chính thức đã xác minh</span>
                  ) : (
                    <span className="text-amber-700 font-bold">Chờ cập nhật tài liệu</span>
                  )}
                </div>
                <div>Tổng số nội dung: <strong>{matrix1?.cells.length || 0} mục</strong></div>
                <div>Thời gian: <strong>{matrix1?.durationMinutes} phút</strong></div>
              </div>

              {/* Matrix B */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="font-bold text-indigo-700">{matrix2?.title}</div>
                <div className="text-slate-500">
                  Năm học: <strong>{matrix2?.academicYear}</strong> · Trường: <strong>{matrix2?.issuingUnit}</strong>
                </div>
                <div>
                  Trạng thái:{' '}
                  {matrix2?.isVerified ? (
                    <span className="text-emerald-700 font-bold">Chính thức đã xác minh</span>
                  ) : (
                    <span className="text-amber-700 font-bold">Chờ cập nhật tài liệu</span>
                  )}
                </div>
                <div>Tổng số nội dung: <strong>{matrix2?.cells.length || 0} mục</strong></div>
                <div>Thời gian: <strong>{matrix2?.durationMinutes} phút</strong></div>
              </div>
            </div>

            {(!matrix1?.isVerified || !matrix2?.isVerified) && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <strong>Lưu ý:</strong> Một hoặc cả hai ma trận đang ở trạng thái <em>"Chờ cập nhật tài liệu"</em>, không đủ dữ liệu văn bản chính thức để thực hiện so sánh vi sai chi tiết.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
