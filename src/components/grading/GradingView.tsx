import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  CheckCircle,
  FileText,
  Download,
  Filter,
  Search,
  Edit,
  Award,
  AlertCircle,
  TrendingUp,
  Percent,
  CheckCheck,
  ChevronDown,
  X,
  Sparkles,
} from 'lucide-react';
import { ExamSubmission, Exam, Question, User, ClassRoom } from '../../types';
import { StorageService } from '../../services/storage';
import { MathRenderer } from '../MathRenderer';
import { playSound } from '../../services/sound';

interface GradingViewProps {
  currentUser: User;
  submissions: ExamSubmission[];
  exams: Exam[];
  questions: Question[];
  classes: ClassRoom[];
  onRefreshData: () => void;
}

export const GradingView: React.FC<GradingViewProps> = ({
  currentUser,
  submissions,
  exams,
  questions,
  classes,
  onRefreshData,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Essay Grading Modal
  const [gradingSubmission, setGradingSubmission] = useState<ExamSubmission | null>(null);
  const [essayPointsInput, setEssayPointsInput] = useState<number>(0);
  const [essayFeedbackInput, setEssayFeedbackInput] = useState<string>('');

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchExam = selectedExamId === 'all' || s.examId === selectedExamId;
      const matchClass = selectedClass === 'all' || s.className === selectedClass;
      const matchSearch =
        s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchExam && matchClass && matchSearch;
    });
  }, [submissions, selectedExamId, selectedClass, searchQuery]);

  // Statistical calculations (Section 14)
  const stats = useMemo(() => {
    if (filteredSubmissions.length === 0) {
      return {
        count: 0,
        avg: 0,
        max: 0,
        min: 0,
        scoreBuckets: [0, 0, 0, 0, 0], // <5, 5-6.5, 6.5-8, 8-9, 9-10
      };
    }

    const scores = filteredSubmissions.map(s => (s.totalScore / s.maxScore) * 10);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = Number((sum / scores.length).toFixed(2));
    const max = Number(Math.max(...scores).toFixed(2));
    const min = Number(Math.min(...scores).toFixed(2));

    const buckets = [0, 0, 0, 0, 0];
    scores.forEach((sc) => {
      if (sc < 5.0) buckets[0]++;
      else if (sc < 6.5) buckets[1]++;
      else if (sc < 8.0) buckets[2]++;
      else if (sc < 9.0) buckets[3]++;
      else buckets[4]++;
    });

    return {
      count: scores.length,
      avg,
      max,
      min,
      scoreBuckets: buckets,
    };
  }, [filteredSubmissions]);

  // Save manual essay grade
  const handleSaveEssayGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    // Find the essay question in submission
    const targetQId = 'q-math-12-06';
    const currentAns = gradingSubmission.answers[targetQId];

    const updatedAnswers = {
      ...gradingSubmission.answers,
      [targetQId]: {
        ...currentAns,
        awardedPoints: Number(essayPointsInput),
        teacherFeedback: essayFeedbackInput,
      },
    };

    const newManualScore = Number(essayPointsInput);
    const newTotalScore = gradingSubmission.autoScore + newManualScore;

    const updatedSubm: ExamSubmission = {
      ...gradingSubmission,
      answers: updatedAnswers,
      manualScore: newManualScore,
      totalScore: Number(newTotalScore.toFixed(2)),
      isGraded: true,
      status: 'graded',
    };

    StorageService.saveSubmission(updatedSubm);
    StorageService.addLog('Chấm điểm tự luận', `Đã chấm bài cho ${gradingSubmission.studentName} (${newManualScore}đ)`);
    playSound('correct');
    setGradingSubmission(null);
    onRefreshData();
  };

  // Export report
  const handleExportReportCSV = () => {
    const headers = 'STT,Mã học sinh,Họ và tên,Lớp,Bài kiểm tra,Điểm trắc nghiệm,Điểm tự luận,Tổng điểm (Hệ 10),Trạng thái,Số lần rời tab\n';
    const rows = filteredSubmissions.map((s, idx) => {
      const scaledScore = ((s.totalScore / s.maxScore) * 10).toFixed(2);
      return `${idx + 1},"${s.studentCode}","${s.studentName}","${s.className}","${s.examTitle}",${s.autoScore},${s.manualScore},${scaledScore},"${s.isGraded ? 'Đã chấm xong' : 'Chờ chấm tự luận'}",${s.violationsCount}`;
    }).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bang_diem_EduTest_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playSound('click');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-800">Chấm điểm & Báo cáo Thống kê</h2>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Hệ thống tự động + Tự luận
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Phân tích phổ điểm, tỉ lệ sai theo chủ đề, xuất báo cáo chuẩn đánh giá GDPT 2018.
          </p>
        </div>

        <button
          onClick={handleExportReportCSV}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" /> Xuất bảng điểm Excel / CSV
        </button>
      </div>

      {/* Statistical Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Số bài đã nộp</span>
          <div className="text-2xl font-black text-slate-800 mt-1">{stats.count} bài</div>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">100% hoàn thành</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Điểm trung bình (Thang 10)</span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{stats.avg}</div>
          <span className="text-[11px] text-slate-400 block mt-1">Toàn bộ danh sách lọc</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Điểm cao nhất</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.max}</div>
          <span className="text-[11px] text-slate-400 block mt-1">Học sinh xuất sắc</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">Điểm thấp nhất</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{stats.min}</div>
          <span className="text-[11px] text-slate-400 block mt-1">Cần ôn tập bổ sung</span>
        </div>
      </div>

      {/* Visual Histogram Chart: Score Distribution */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Biểu đồ Phổ Điểm (Thang điểm 10)
          </h4>
          <span className="text-xs text-slate-400">Phân bố số lượng học sinh theo từng dải điểm</span>
        </div>

        <div className="grid grid-cols-5 gap-3 pt-2 text-center text-xs">
          {[
            { label: 'Dưới 5.0 (Yếu)', count: stats.scoreBuckets[0], color: 'from-rose-500 to-red-400' },
            { label: '5.0 - 6.4 (Trung bình)', count: stats.scoreBuckets[1], color: 'from-amber-500 to-yellow-400' },
            { label: '6.5 - 7.9 (Khá)', count: stats.scoreBuckets[2], color: 'from-blue-500 to-cyan-400' },
            { label: '8.0 - 8.9 (Giỏi)', count: stats.scoreBuckets[3], color: 'from-indigo-500 to-purple-400' },
            { label: '9.0 - 10.0 (Xuất sắc)', count: stats.scoreBuckets[4], color: 'from-emerald-500 to-teal-400' },
          ].map((bar, i) => {
            const heightPct = stats.count > 0 ? Math.max(15, (bar.count / stats.count) * 100) : 15;
            return (
              <div key={i} className="flex flex-col items-center justify-end h-40">
                <span className="text-sm font-black text-slate-800 mb-1">{bar.count} HS</span>
                <div className="w-full max-w-[64px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-28">
                  <div
                    className={`w-full rounded-t-xl bg-gradient-to-t ${bar.color} transition-all duration-500`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-600 mt-2">{bar.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submissions List & Essay Grading Action */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã hoặc tên học sinh..."
                className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="all">Tất cả các lớp</option>
              {classes.map(c => (
                <option key={c.id} value={c.name}>Lớp {c.name}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Hiển thị <strong>{filteredSubmissions.length}</strong> bài nộp
          </div>
        </div>

        {/* Submissions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Mã HS</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Lớp</th>
                <th className="py-3 px-4">Thời gian nộp</th>
                <th className="py-3 px-4 text-center">Trắc nghiệm</th>
                <th className="py-3 px-4 text-center">Tự luận</th>
                <th className="py-3 px-4 text-center">Tổng điểm</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.map((subm) => (
                <tr key={subm.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">{subm.studentCode}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{subm.studentName}</td>
                  <td className="py-2.5 px-4 text-slate-600">{subm.className}</td>
                  <td className="py-2.5 px-4 text-slate-500">{subm.submittedAt}</td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-800 font-mono">
                    {subm.autoScore.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-center font-bold text-purple-700 font-mono">
                    {subm.manualScore > 0 ? subm.manualScore.toFixed(2) : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-center font-extrabold text-indigo-700 font-mono text-sm">
                    {((subm.totalScore / subm.maxScore) * 10).toFixed(1)} / 10
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {subm.isGraded ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCheck className="w-3.5 h-3.5" /> Hoàn tất
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        <AlertCircle className="w-3.5 h-3.5" /> Chờ chấm TL
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => {
                        setGradingSubmission(subm);
                        setEssayPointsInput(subm.manualScore || 1.5);
                        setEssayFeedbackInput(subm.answers['q-math-12-06']?.teacherFeedback || '');
                        playSound('click');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      <Edit className="w-3 h-3" /> Chấm / Xem lại
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Essay Grading Studio */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Chấm Bài Tự Luận: {gradingSubmission.studentName} ({gradingSubmission.studentCode})
                </h3>
                <p className="text-xs text-slate-500">Lớp: {gradingSubmission.className} · Đề thi: {gradingSubmission.examTitle}</p>
              </div>
              <button onClick={() => setGradingSubmission(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEssayGrade} className="space-y-4">
              {/* Question reference */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-indigo-700">Đề bài tự luận (2.0 điểm):</span>
                <div className="text-slate-700">
                  <MathRenderer content="Cho hình chóp tứ giác đều $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, các cạnh bên bằng $a\sqrt{2}$. Tính độ dài đường cao $SO$ và thể tích khối chóp $S.ABCD$." />
                </div>
              </div>

              {/* Student's submitted answer */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Bài làm của học sinh:</label>
                <div className="p-3.5 bg-indigo-50/40 border border-indigo-200 rounded-xl text-xs text-slate-800 leading-relaxed">
                  <MathRenderer content={gradingSubmission.answers['q-math-12-06']?.essayContent || 'Học sinh chưa nhập nội dung tự luận'} />
                </div>
              </div>

              {/* Teacher Score Input & Feedback */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Điểm tự luận (Tối đa 2.0đ) *</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="2.0"
                    required
                    value={essayPointsInput}
                    onChange={(e) => setEssayPointsInput(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-bold text-indigo-700"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lời nhận xét của giáo viên</label>
                  <input
                    type="text"
                    value={essayFeedbackInput}
                    onChange={(e) => setEssayFeedbackInput(e.target.value)}
                    placeholder="Ví dụ: Lập luận tốt, cần trình bày rõ bước áp dụng định lí..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                >
                  Lưu điểm số & Cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
