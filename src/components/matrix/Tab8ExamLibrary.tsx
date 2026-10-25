import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Archive,
  Copy,
  Trash2,
  Edit3,
  ShieldCheck,
  FileDown,
  Printer,
  Send,
  Plus,
  Search,
  Eye,
  FileCheck,
  Calendar,
  X,
  Users,
} from 'lucide-react';
import {
  Exam,
  ClassRoom,
  ExamAssignment,
  User,
} from '../../types';
import { StorageService } from '../../services/storage';
import { playSound } from '../../services/sound';
import { downloadWordDocument, printDocument } from './exportUtils';

interface Tab8ExamLibraryProps {
  currentUser: User;
  exams: Exam[];
  classes: ClassRoom[];
  onRefreshData: () => void;
  onGoToComposeExam: (examId?: string) => void;
  onGoToAudit: (examId: string) => void;
  onGoToRubric: (examId: string) => void;
  onNavigateExamRoom: () => void;
}

export const Tab8ExamLibrary: React.FC<Tab8ExamLibraryProps> = ({
  currentUser,
  exams,
  classes,
  onRefreshData,
  onGoToComposeExam,
  onGoToAudit,
  onGoToRubric,
  onNavigateExamRoom,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Assign Modal State
  const [assigningExam, setAssigningExam] = useState<Exam | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([classes[0]?.id || '']);
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().substring(0, 16);
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return future.toISOString().substring(0, 16);
  });

  // Filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter(e => {
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      if (gradeFilter !== 'all' && e.grade !== Number(gradeFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [exams, statusFilter, gradeFilter, searchQuery]);

  // Duplicate Exam
  const handleDuplicate = (id: string) => {
    playSound('click');
    const copy = StorageService.duplicateExam(id);
    if (copy) {
      onRefreshData();
    }
  };

  // Delete Exam
  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xoá đề kiểm tra:\n"${title}"?`)) {
      playSound('wrong');
      StorageService.deleteExam(id);
      onRefreshData();
    }
  };

  // Export Student Exam (No answers)
  const handleExportStudentExam = (exam: Exam) => {
    playSound('click');

    const questionsHtml = exam.questions
      .map((q, idx) => {
        let optHtml = '';
        if (q.type === 'multiple_choice' && q.options) {
          optHtml = `
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
          optHtml = q.trueFalseOptions
            .map(opt => `<div style="margin-left: 15pt;"><strong>${opt.id})</strong> ${opt.text}</div>`)
            .join('');
        }

        return `
          <div style="margin-bottom: 12pt;">
            <p><strong>Câu ${idx + 1} (${q.points} điểm):</strong> ${q.prompt}</p>
            ${optHtml}
          </div>
        `;
      })
      .join('');

    const html = `
      <table class="header-table" style="width: 100%; margin-bottom: 15px;">
        <tr>
          <td style="width: 45%; text-align: center;">
            <strong>SỞ GIÁO DỤC VÀ ĐÀO TẠO TP.HCM</strong><br/>
            <strong>TRƯỜNG THPT CHUYÊN & GDPT 2018</strong>
          </td>
          <td style="width: 55%; text-align: center;">
            <strong>${exam.title.toUpperCase()}</strong><br/>
            <strong>MÔN: TOÁN HỌC - KHỐI ${exam.grade}</strong><br/>
            <em>Thời gian làm bài: ${exam.durationMinutes} phút</em>
          </td>
        </tr>
      </table>

      <table style="width: 100%; border: 1px solid #000; margin-bottom: 20px;">
        <tr>
          <td style="padding: 6pt; border: none;">
            <strong>Mã đề thi: ${exam.code}</strong><br/>
            Họ và tên thí sinh: .................................................... SBD: .................... Phòng: ......
          </td>
        </tr>
      </table>

      ${questionsHtml}
      <div style="text-align: center; margin-top: 30px;">
        <strong>-------------------- HẾT --------------------</strong>
      </div>
    `;

    downloadWordDocument(`DeThi_HocSinh_${exam.code}`, exam.title, html);
  };

  // Export Teacher Exam (With full answers & solutions)
  const handleExportTeacherExam = (exam: Exam) => {
    playSound('click');

    const questionsHtml = exam.questions
      .map((q, idx) => {
        let optHtml = '';
        if (q.type === 'multiple_choice' && q.options) {
          optHtml = `
            <table style="width: 100%; border: none; margin: 4pt 0;">
              <tr>
                <td style="width: 25%; border: none; ${q.correctAnswer === 'A' ? 'font-weight: bold; color: red;' : ''}">A. ${q.options[0] || ''}</td>
                <td style="width: 25%; border: none; ${q.correctAnswer === 'B' ? 'font-weight: bold; color: red;' : ''}">B. ${q.options[1] || ''}</td>
                <td style="width: 25%; border: none; ${q.correctAnswer === 'C' ? 'font-weight: bold; color: red;' : ''}">C. ${q.options[2] || ''}</td>
                <td style="width: 25%; border: none; ${q.correctAnswer === 'D' ? 'font-weight: bold; color: red;' : ''}">D. ${q.options[3] || ''}</td>
              </tr>
            </table>
          `;
        }

        return `
          <div style="margin-bottom: 15pt; border-bottom: 1px dashed #ddd; padding-bottom: 8pt;">
            <p><strong>Câu ${idx + 1} (${q.points} điểm):</strong> ${q.prompt}</p>
            ${optHtml}
            <p style="color: #4338ca; margin-top: 4pt;">
              <strong>Đáp án:</strong> ${q.correctAnswer || (q.trueFalseOptions ? q.trueFalseOptions.map(o => `${o.id}: ${o.isCorrect ? 'Đ' : 'S'}`).join(', ') : 'Tự luận')}
            </p>
            <p style="font-style: italic; color: #475569;">
              <strong>Lời giải:</strong> ${q.solution || ''}
            </p>
          </div>
        `;
      })
      .join('');

    const html = `
      <table class="header-table" style="width: 100%; margin-bottom: 15px;">
        <tr>
          <td style="width: 45%; text-align: center;">
            <strong>SỞ GIÁO DỤC VÀ ĐÀO TẠO TP.HCM</strong><br/>
            <strong>TRƯỜNG THPT CHUYÊN & GDPT 2018</strong>
          </td>
          <td style="width: 55%; text-align: center;">
            <strong>${exam.title.toUpperCase()} (BẢN GIÁO VIÊN KÈM ĐÁP ÁN)</strong><br/>
            <strong>MÔN: TOÁN HỌC - KHỐI ${exam.grade}</strong><br/>
            <em>Mã đề: ${exam.code}</em>
          </td>
        </tr>
      </table>

      ${questionsHtml}
    `;

    downloadWordDocument(`DeThi_GiaoVien_${exam.code}`, exam.title, html);
  };

  // Submit Assignment into Online Exam Room
  const handleAssignToExamRoom = () => {
    if (!assigningExam) return;
    if (selectedClassIds.length === 0) {
      alert('Vui lòng chọn ít nhất một lớp để giao bài.');
      return;
    }

    playSound('correct');
    const selectedClasses = classes.filter(c => selectedClassIds.includes(c.id));
    const totalStudents = selectedClasses.reduce((s, c) => s + c.studentCount, 0);

    const assignment: ExamAssignment = {
      id: `assign-${Date.now()}`,
      examId: assigningExam.id,
      examTitle: assigningExam.title,
      classIds: selectedClassIds,
      classNames: selectedClasses.map(c => c.name),
      startDate,
      endDate,
      status: 'upcoming',
      totalAssigned: totalStudents,
      totalSubmitted: 0,
    };

    StorageService.saveAssignment(assignment);
    setAssigningExam(null);
    onRefreshData();
    alert(`Đã giao đề "${assigningExam.title}" thành công cho các lớp: ${assignment.classNames.join(', ')}!`);
    onNavigateExamRoom();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Thư viện đề kiểm tra ({exams.length} đề thi)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý phiên bản, nhân bản, xuất tài liệu in ấn và giao bài trực tuyến vào phòng thi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onGoToComposeExam()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo đề thi mới
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Tìm kiếm đề thi
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tên đề, mã đề..."
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Trạng thái kiểm định
          </label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="published">Đã duyệt (Phê chuẩn)</option>
            <option value="draft">Bản nháp (Đang soạn)</option>
            <option value="archived">Đã lưu trữ</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Khối lớp
          </label>
          <select
            value={gradeFilter}
            onChange={e => setGradeFilter(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300"
          >
            <option value="all">Tất cả khối lớp</option>
            <option value="12">Khối 12</option>
            <option value="11">Khối 11</option>
            <option value="10">Khối 10</option>
          </select>
        </div>
      </div>

      {/* Grid of Exams */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExams.map(exam => {
          const totalPoints = exam.questions.reduce((s, q) => s + (Number(q.points) || 0), 0);
          return (
            <div
              key={exam.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    Toán {exam.grade} • {exam.semester}
                  </span>
                  {exam.status === 'published' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Đã duyệt
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      <Clock className="w-3.5 h-3.5" />
                      Bản nháp
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-800 text-base leading-snug mb-1 line-clamp-2">
                  {exam.title}
                </h3>
                <div className="text-xs font-mono text-slate-400 mb-3">Mã đề: {exam.code}</div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-lg text-center text-xs mb-4">
                  <div>
                    <div className="text-slate-400">Thời gian</div>
                    <div className="font-bold text-slate-700 mt-0.5">{exam.durationMinutes} phút</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Số câu</div>
                    <div className="font-bold text-slate-700 mt-0.5">{exam.questions.length} câu</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Tổng điểm</div>
                    <div className="font-bold text-indigo-600 mt-0.5">{totalPoints.toFixed(2)} đ</div>
                  </div>
                </div>

                {/* Variants preview if any */}
                {exam.variants && exam.variants.length > 0 && (
                  <div className="text-xs text-slate-500 mb-2 flex items-center gap-1.5">
                    <span className="font-medium">Mã đề hoán vị:</span>
                    <span className="font-mono font-semibold text-indigo-700">
                      {exam.variants.map(v => v.code).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 p-3 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleExportStudentExam(exam)}
                      title="Xuất file Word Đề học sinh"
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleExportTeacherExam(exam)}
                      title="Xuất file Word Đề giáo viên (Kèm đáp án & Lời giải)"
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                    >
                      <FileCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicate(exam.id)}
                      title="Nhân bản đề này"
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onGoToComposeExam(exam.id)}
                      title="Chỉnh sửa đề"
                      className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exam.id, exam.title)}
                      title="Xoá đề này"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onGoToAudit(exam.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Kiểm định
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                  <button
                    onClick={() => onGoToRubric(exam.id)}
                    className="flex-1 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-indigo-300 rounded-lg transition-colors text-center"
                  >
                    Đáp án & HD chấm
                  </button>
                  <button
                    onClick={() => {
                      playSound('click');
                      setAssigningExam(exam);
                    }}
                    className="flex-1 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    Giao bài thi
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Exam Modal */}
      {assigningExam && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  Giao bài thi vào Phòng thi trực tuyến
                </h3>
              </div>
              <button
                onClick={() => setAssigningExam(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
                <div className="text-xs text-slate-500">Đề kiểm tra được chọn:</div>
                <div className="font-bold text-slate-800 text-sm mt-0.5">{assigningExam.title}</div>
                <div className="text-xs text-indigo-600 font-mono mt-0.5">
                  Mã đề: {assigningExam.code} • {assigningExam.durationMinutes} phút • {assigningExam.questions.length} câu
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Chọn lớp học tham gia thi <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 p-2 rounded-lg">
                  {classes.map(c => {
                    const isChecked = selectedClassIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedClassIds(selectedClassIds.filter(id => id !== c.id));
                              } else {
                                setSelectedClassIds([...selectedClassIds, c.id]);
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded"
                          />
                          <span className="font-semibold text-slate-800">{c.name}</span>
                          <span className="text-slate-400">({c.studentCount} học sinh)</span>
                        </div>
                        <span className="text-slate-500">Khối {c.grade}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Bắt đầu mở thi
                  </label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Hạn chót nộp bài
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setAssigningExam(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAssignToExamRoom}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Xác nhận giao bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
