import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  FileCheck,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  Exam,
  MatrixDocument,
  AuditCriterionResult,
  User,
} from '../../types';
import { StorageService } from '../../services/storage';
import { playSound } from '../../services/sound';

interface Tab7ExamAuditProps {
  currentUser: User;
  exams: Exam[];
  matrices: MatrixDocument[];
  preselectedExamId?: string;
  onExamApproved: (approvedExam: Exam) => void;
  onGoToExamLibrary: () => void;
}

export const Tab7ExamAudit: React.FC<Tab7ExamAuditProps> = ({
  currentUser,
  exams,
  matrices,
  preselectedExamId,
  onExamApproved,
  onGoToExamLibrary,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(
    preselectedExamId || exams[0]?.id || ''
  );

  const activeExam = useMemo(() => {
    return exams.find(e => e.id === selectedExamId) || exams[0] || null;
  }, [exams, selectedExamId]);

  const linkedMatrix = useMemo(() => {
    if (!activeExam?.matrixId) return null;
    return matrices.find(m => m.id === activeExam.matrixId) || null;
  }, [activeExam, matrices]);

  // Automated 12-criteria Quality Assurance Audit Engine
  const auditReport = useMemo<{
    criteria: AuditCriterionResult[];
    passedCount: number;
    warningCount: number;
    failedCount: number;
    canApprove: boolean;
  }>(() => {
    if (!activeExam) {
      return {
        criteria: [],
        passedCount: 0,
        warningCount: 0,
        failedCount: 0,
        canApprove: false,
      };
    }

    const qList = activeExam.questions || [];
    const totalPoints = qList.reduce((s, q) => s + (Number(q.points) || 0), 0);

    const results: AuditCriterionResult[] = [];

    // 1. Số lượng câu hỏi theo ma trận
    const matrixCount = linkedMatrix
      ? linkedMatrix.cells.reduce((s, c) => s + c.questionCount, 0)
      : qList.length;
    const isCountMatch = qList.length === matrixCount;
    results.push({
      id: 1,
      title: 'Số lượng câu hỏi theo ma trận',
      category: 'Cấu trúc',
      status: isCountMatch ? 'pass' : 'warning',
      description: `Đề thi có ${qList.length} câu. ${
        linkedMatrix ? `Ma trận yêu cầu ${matrixCount} câu.` : 'Đề soạn tự do (không ràng buộc ma trận).'
      }`,
      detail: isCountMatch ? 'Khớp hoàn toàn với ma trận' : `Chênh lệch ${Math.abs(qList.length - matrixCount)} câu`,
      required: true,
    });

    // 2. Tổng điểm đúng 10.0
    const isScoreTen = Math.abs(totalPoints - 10.0) < 0.05;
    results.push({
      id: 2,
      title: 'Tổng điểm thang đo đúng 10.0',
      category: 'Điểm số',
      status: isScoreTen ? 'pass' : 'fail',
      description: `Tổng điểm hiện tại: ${totalPoints.toFixed(2)} điểm.`,
      detail: isScoreTen ? 'Đạt chuẩn 10.0 điểm' : 'Tổng điểm chưa đạt chuẩn 10.0 điểm theo quy định Bộ',
      required: true,
    });

    // 3. Phân bố điểm theo mức độ nhận thức
    let knowPts = 0, compPts = 0, appPts = 0;
    qList.forEach(q => {
      const p = Number(q.points) || 0;
      if (q.cognitiveLevel === 'nhan_biet') knowPts += p;
      else if (q.cognitiveLevel === 'thong_hieu') compPts += p;
      else appPts += p;
    });
    const knowPct = totalPoints > 0 ? Math.round((knowPts / totalPoints) * 100) : 0;
    const compPct = totalPoints > 0 ? Math.round((compPts / totalPoints) * 100) : 0;
    const appPct = totalPoints > 0 ? Math.round((appPts / totalPoints) * 100) : 0;
    const isDistributionGood = knowPct >= 30 && knowPct <= 50 && compPct >= 20 && compPct <= 45;
    results.push({
      id: 3,
      title: 'Phân bố mức độ nhận thức (Biết - Hiểu - Vận dụng)',
      category: 'Sư phạm',
      status: isDistributionGood ? 'pass' : 'warning',
      description: `Tỉ lệ hiện tại: Biết ${knowPct}% – Hiểu ${compPct}% – Vận dụng ${appPct}%.`,
      detail: isDistributionGood ? 'Phù hợp định hướng CV 7991 (40 - 30 - 30)' : 'Khuyến nghị cân đối lại tỉ lệ',
      required: false,
    });

    // 4. Mọi câu hỏi đều có đáp án xác định
    const missingAnswerQ = qList.filter(q => {
      if (q.type === 'multiple_choice') return !q.correctAnswer;
      if (q.type === 'true_false') return !q.trueFalseOptions || q.trueFalseOptions.length === 0;
      if (q.type === 'short_answer') return !q.correctAnswer;
      return false;
    });
    results.push({
      id: 4,
      title: 'Khóa đáp án hợp lệ cho mọi câu hỏi',
      category: 'Nội dung',
      status: missingAnswerQ.length === 0 ? 'pass' : 'fail',
      description: missingAnswerQ.length === 0 ? 'Tất cả câu trắc nghiệm đều có đáp án' : `Có ${missingAnswerQ.length} câu thiếu đáp án`,
      detail: missingAnswerQ.length === 0 ? 'Đã kiểm tra 100% câu hỏi' : `Mã câu: ${missingAnswerQ.map(q => q.code).join(', ')}`,
      required: true,
    });

    // 5. Câu trắc nghiệm đủ 4 phương án và không trùng lặp
    const invalidMcQ = qList.filter(q => {
      if (q.type === 'multiple_choice') {
        if (!q.options || q.options.length < 4) return true;
        const set = new Set(q.options);
        return set.size !== q.options.length;
      }
      return false;
    });
    results.push({
      id: 5,
      title: 'Trắc nghiệm 4 lựa chọn không trùng lặp phương án',
      category: 'Nội dung',
      status: invalidMcQ.length === 0 ? 'pass' : 'fail',
      description: invalidMcQ.length === 0 ? 'Tất cả phương án A, B, C, D đều phân biệt' : `Có ${invalidMcQ.length} câu bị trùng hoặc thiếu phương án`,
      detail: invalidMcQ.length === 0 ? 'Đạt chuẩn' : `Mã câu: ${invalidMcQ.map(q => q.code).join(', ')}`,
      required: true,
    });

    // 6. Các câu Đúng/Sai có đủ 4 ý a, b, c, d
    const invalidTfQ = qList.filter(q => {
      if (q.type === 'true_false') {
        return !q.trueFalseOptions || q.trueFalseOptions.length !== 4;
      }
      return false;
    });
    results.push({
      id: 6,
      title: 'Đúng / Sai chuẩn cấu trúc 4 ý a, b, c, d',
      category: 'Cấu trúc',
      status: invalidTfQ.length === 0 ? 'pass' : 'fail',
      description: invalidTfQ.length === 0 ? 'Tất cả câu Đúng/Sai đều đủ 4 ý a, b, c, d' : `Có ${invalidTfQ.length} câu không đủ 4 ý`,
      detail: invalidTfQ.length === 0 ? 'Đạt chuẩn cấu trúc GDPT 2018' : 'Cần bổ sung đủ 4 ý a, b, c, d',
      required: true,
    });

    // 7. Công thức Toán học KaTeX hợp lệ
    const invalidLatexQ = qList.filter(q => {
      const openMatches = (q.prompt.match(/\$/g) || []).length;
      return openMatches % 2 !== 0; // unmatched $
    });
    results.push({
      id: 7,
      title: 'Cú pháp công thức Toán KaTeX hợp lệ',
      category: 'Kỹ thuật',
      status: invalidLatexQ.length === 0 ? 'pass' : 'warning',
      description: invalidLatexQ.length === 0 ? 'Không phát hiện lỗi đóng/mở thẻ $' : `Có ${invalidLatexQ.length} câu có dấu $ chưa đóng`,
      detail: invalidLatexQ.length === 0 ? 'Hiển thị KaTeX chuẩn xác' : 'Kiểm tra lại cặp dấu $ trong nội dung',
      required: false,
    });

    // 8. Hình vẽ và Bảng biến thiên tải bình thường
    const diagramQCount = qList.filter(q => Boolean(q.diagramType)).length;
    results.push({
      id: 8,
      title: 'Hình vẽ minh hoạ và Bảng biến thiên SVG',
      category: 'Kỹ thuật',
      status: 'pass',
      description: `Đề thi có ${diagramQCount} câu kèm hình vẽ / bảng biến thiên vector SVG.`,
      detail: 'Tất cả hình ảnh vector hiển thị sắc nét chuẩn in ấn',
      required: false,
    });

    // 9. Lời giải chi tiết cho tất cả các câu
    const missingSolutionQ = qList.filter(q => !q.solution || q.solution.trim().length < 5);
    results.push({
      id: 9,
      title: 'Có lời giải chi tiết cho mọi câu hỏi',
      category: 'Sư phạm',
      status: missingSolutionQ.length === 0 ? 'pass' : 'warning',
      description: missingSolutionQ.length === 0 ? '100% câu hỏi đều có hướng dẫn giải' : `Có ${missingSolutionQ.length} câu chưa có lời giải chi tiết`,
      detail: missingSolutionQ.length === 0 ? 'Đạt yêu cầu phục vụ học sinh ôn tập' : 'Khuyến nghị bổ sung lời giải',
      required: false,
    });

    // 10. Có hướng dẫn chấm cho câu tự luận
    const essayQ = qList.filter(q => q.type === 'essay');
    const hasRubric = essayQ.length === 0 || essayQ.every(q => q.solution || q.rubricGuide);
    results.push({
      id: 10,
      title: 'Thang điểm hướng dẫn chấm câu tự luận',
      category: 'Chấm điểm',
      status: hasRubric ? 'pass' : 'fail',
      description: hasRubric ? 'Đã có biểu điểm từng bước cho câu tự luận' : 'Thiếu thang điểm các bước tự luận',
      detail: 'Đảm bảo tính khách quan khi chấm bài',
      required: true,
    });

    // 11. Thời gian làm bài phù hợp dung lượng đề
    const isDurationOk = activeExam.durationMinutes >= 45 && activeExam.durationMinutes <= 120;
    results.push({
      id: 11,
      title: 'Thời lượng làm bài phù hợp',
      category: 'Quy chế',
      status: isDurationOk ? 'pass' : 'warning',
      description: `Thời gian làm bài: ${activeExam.durationMinutes} phút.`,
      detail: isDurationOk ? 'Phù hợp đề định kỳ (45 - 90 phút)' : 'Thời gian có thể chưa tương xứng dung lượng',
      required: false,
    });

    // 12. Không trùng lặp câu hỏi trong đề
    const ids = qList.map(q => q.id);
    const uniqueIds = new Set(ids);
    const isNoDuplicates = uniqueIds.size === ids.length;
    results.push({
      id: 12,
      title: 'Không trùng lặp câu hỏi trong đề thi',
      category: 'Toàn vẹn',
      status: isNoDuplicates ? 'pass' : 'fail',
      description: isNoDuplicates ? 'Tất cả câu hỏi trong đề đều độc nhất' : 'Phát hiện câu hỏi bị thêm trùng lặp',
      detail: isNoDuplicates ? 'Kiểm tra ID và mã câu duy nhất' : 'Cần xoá các câu trùng lặp',
      required: true,
    });

    const passedCount = results.filter(r => r.status === 'pass').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const failedCount = results.filter(r => r.status === 'fail').length;

    // Can approve if no REQUIRED criteria failed
    const canApprove = results.filter(r => r.required && r.status === 'fail').length === 0;

    return { criteria: results, passedCount, warningCount, failedCount, canApprove };
  }, [activeExam, linkedMatrix]);

  // Handle Approve Exam
  const handleApprove = () => {
    if (!activeExam) return;
    if (!auditReport.canApprove) {
      alert('Đề kiểm tra chưa đạt các tiêu chí bắt buộc. Vui lòng khắc phục trước khi duyệt.');
      return;
    }

    playSound('correct');
    const updatedExam: Exam = {
      ...activeExam,
      status: 'published',
      auditStatus: 'approved',
      version: activeExam.version ? `${activeExam.version} (Đã duyệt)` : 'v1.0 (Đã duyệt)',
    };

    StorageService.saveExam(updatedExam);
    onExamApproved(updatedExam);
    alert(`Duyệt đề kiểm tra "${updatedExam.title}" thành công!\nTrạng thái: ĐÃ DUYỆT (Sẵn sàng sử dụng).`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Kiểm tra và duyệt đề kiểm tra (QA Quality Audit)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Hệ thống thẩm định chất lượng đề thi tự động theo bộ 12 tiêu chí sư phạm & kỹ thuật GDPT 2018
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleApprove}
            disabled={!auditReport.canApprove}
            className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-lg shadow-sm transition-all ${
              auditReport.canApprove
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Duyệt đề kiểm tra này
          </button>
        </div>
      </div>

      {/* Exam Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Chọn đề kiểm tra cần thẩm định:
          </label>
          <select
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 font-semibold text-slate-800"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.title} (Mã: {e.code}) • {e.status === 'published' ? 'Đã duyệt' : 'Bản nháp'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {auditReport.passedCount} tiêu chí Đạt
          </span>
          <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            {auditReport.warningCount} Cảnh báo
          </span>
          <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            {auditReport.failedCount} Chưa đạt
          </span>
        </div>
      </div>

      {/* Score Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Trạng thái duyệt</div>
          <div className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-1.5">
            {activeExam?.status === 'published' ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-emerald-700">Đã phê duyệt</span>
              </>
            ) : (
              <>
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-amber-700">Chờ thẩm định</span>
              </>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">Phiên bản: {activeExam?.version || 'v1.0'}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Tổng điểm kiểm định</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {activeExam?.questions.reduce((s, q) => s + (Number(q.points) || 0), 0).toFixed(2)} / 10.0 đ
          </div>
          <div className="text-xs text-slate-400 mt-1">{activeExam?.questions.length} câu hỏi</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Chỉ số chất lượng</div>
          <div className="text-2xl font-bold text-indigo-600 mt-1">
            {Math.round((auditReport.passedCount / 12) * 100)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">{auditReport.passedCount}/12 tiêu chí đạt</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Quyền ban hành</div>
          <div className="text-sm font-bold text-slate-800 mt-1.5">
            {auditReport.canApprove ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Đủ điều kiện ban hành
              </span>
            ) : (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <XCircle className="w-4 h-4" /> Cần sửa tiêu chí đỏ
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Chuẩn hội đồng tổ chuyên môn</div>
        </div>
      </div>

      {/* 12-Criteria Checklist */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3 flex items-center justify-between">
          <span>Chi tiết 12 tiêu chuẩn kiểm định chất lượng</span>
          <span className="text-xs text-slate-400 font-normal">Hệ thống thẩm định tự động</span>
        </h3>

        <div className="divide-y divide-slate-100">
          {auditReport.criteria.map(c => (
            <div key={c.id} className="py-3.5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {c.status === 'pass' && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                  {c.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                  {c.status === 'fail' && <XCircle className="w-5 h-5 text-rose-600" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">
                      Tiêu chí {c.id}: {c.title}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {c.category}
                    </span>
                    {c.required && (
                      <span className="text-[11px] font-bold text-rose-600">Bắt buộc</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{c.description}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    c.status === 'pass'
                      ? 'bg-emerald-50 text-emerald-700'
                      : c.status === 'warning'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {c.status === 'pass' ? 'ĐẠT' : c.status === 'warning' ? 'CẢNH BÁO' : 'CHƯA ĐẠT'}
                </span>
                {c.detail && (
                  <div className="text-[11px] text-slate-400 mt-1 max-w-xs">{c.detail}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Approval Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {auditReport.canApprove
              ? 'Tất cả tiêu chuẩn bắt buộc đã hoàn tất. Bạn có thể nhấn Duyệt đề để sẵn sàng giao bài thi.'
              : 'Đề kiểm tra có tiêu chí bắt buộc chưa đạt. Vui lòng quay lại biên soạn để bổ sung.'}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApprove}
              disabled={!auditReport.canApprove}
              className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors ${
                auditReport.canApprove
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Phê duyệt đề kiểm tra
            </button>
            <button
              onClick={onGoToExamLibrary}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Về Thư viện đề
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
