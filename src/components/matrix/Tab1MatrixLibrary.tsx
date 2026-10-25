import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  Scale,
  Eye,
  Copy,
  Trash2,
  FileDown,
  Printer,
  Edit3,
  ListOrdered,
  X,
  FileCheck,
  Search,
} from 'lucide-react';
import { MatrixDocument, Question } from '../../types';
import { StorageService } from '../../services/storage';
import { playSound } from '../../services/sound';
import { downloadWordDocument, printDocument } from './exportUtils';

interface Tab1MatrixLibraryProps {
  matrices: MatrixDocument[];
  questions: Question[];
  onSelectMatrixToEdit: (matrix: MatrixDocument) => void;
  onSelectMatrixForSpec: (matrixId: string) => void;
  onSelectMatrixToComposeExam: (matrixId: string) => void;
  onGoToCreateMatrix: () => void;
  onRefreshData: () => void;
}

export const Tab1MatrixLibrary: React.FC<Tab1MatrixLibraryProps> = ({
  matrices,
  questions,
  onSelectMatrixToEdit,
  onSelectMatrixForSpec,
  onSelectMatrixToComposeExam,
  onGoToCreateMatrix,
  onRefreshData,
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [viewingMatrix, setViewingMatrix] = useState<MatrixDocument | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareId1, setCompareId1] = useState<string>(matrices[0]?.id || '');
  const [compareId2, setCompareId2] = useState<string>(matrices[1]?.id || matrices[0]?.id || '');

  // Filtered matrices
  const filteredMatrices = useMemo(() => {
    return matrices.filter(m => {
      if (selectedYear !== 'all' && m.academicYear !== selectedYear) return false;
      if (selectedGrade !== 'all' && m.grade !== Number(selectedGrade)) return false;
      if (selectedSemester !== 'all' && m.semester !== selectedSemester) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          m.issuingUnit.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [matrices, selectedYear, selectedGrade, selectedSemester, searchQuery]);

  const handleDuplicate = (id: string) => {
    playSound('click');
    const clone = StorageService.duplicateMatrix(id);
    if (clone) {
      onRefreshData();
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xoá ma trận:\n"${title}"?`)) {
      playSound('wrong');
      StorageService.deleteMatrix(id);
      onRefreshData();
    }
  };

  const handleExportWord = (matrix: MatrixDocument) => {
    playSound('click');
    const tableRowsHtml = matrix.cells
      .map(
        (c, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td>${c.topic}</td>
        <td>${c.learningOutcome}</td>
        <td class="text-center">${
          c.cognitiveLevel === 'nhan_biet'
            ? 'Nhận biết'
            : c.cognitiveLevel === 'thong_hieu'
            ? 'Thông hiểu'
            : c.cognitiveLevel === 'van_dung'
            ? 'Vận dụng'
            : 'Vận dụng cao'
        }</td>
        <td class="text-center">${
          c.questionType === 'multiple_choice'
            ? 'Trắc nghiệm 4 lựa chọn'
            : c.questionType === 'true_false'
            ? 'Đúng / Sai'
            : c.questionType === 'short_answer'
            ? 'Trả lời ngắn'
            : 'Tự luận'
        }</td>
        <td class="text-center font-bold">${c.questionCount}</td>
        <td class="text-center">${c.pointsPerQuestion}</td>
        <td class="text-center font-bold">${c.totalPoints.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <table class="header-table" style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="width: 45%; text-align: center;">
            <strong>${matrix.issuingUnit.toUpperCase()}</strong><br/>
            <strong>TỔ BỘ MÔN ${matrix.subject.toUpperCase()}</strong>
          </td>
          <td style="width: 55%; text-align: center;">
            <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
            <strong>Độc lập - Tự do - Hạnh phúc</strong>
          </td>
        </tr>
      </table>

      <h2 style="text-align: center; margin-top: 15px; text-transform: uppercase;">
        ${matrix.title}
      </h2>
      <p style="text-align: center; font-style: italic;">
        Môn: ${matrix.subject} - Khối ${matrix.grade} | Năm học: ${matrix.academicYear} | Thời gian: ${matrix.durationMinutes} phút | Tổng điểm: ${matrix.totalPoints}
      </p>

      <table>
        <thead>
          <tr>
            <th>TT</th>
            <th>Chủ đề / Mạch kiến thức</th>
            <th>Yêu cầu cần đạt</th>
            <th>Mức độ</th>
            <th>Hình thức</th>
            <th>Số câu</th>
            <th>Điểm/câu</th>
            <th>Tổng điểm</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    `;
    downloadWordDocument(`MaTran_${matrix.grade}_${matrix.semester}`, matrix.title, html);
  };

  const handlePrint = (matrix: MatrixDocument) => {
    playSound('click');
    const tableRowsHtml = matrix.cells
      .map(
        (c, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td><strong>${c.topic}</strong></td>
        <td>${c.learningOutcome}</td>
        <td class="text-center">${
          c.cognitiveLevel === 'nhan_biet'
            ? 'Nhận biết'
            : c.cognitiveLevel === 'thong_hieu'
            ? 'Thông hiểu'
            : 'Vận dụng'
        }</td>
        <td class="text-center">${
          c.questionType === 'multiple_choice'
            ? 'Trắc nghiệm (4 lựa chọn)'
            : c.questionType === 'true_false'
            ? 'Đúng / Sai'
            : c.questionType === 'short_answer'
            ? 'Trả lời ngắn'
            : 'Tự luận'
        }</td>
        <td class="text-center font-bold">${c.questionCount}</td>
        <td class="text-center">${c.pointsPerQuestion}</td>
        <td class="text-center font-bold">${c.totalPoints.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div style="text-align: center;">
          <div style="font-size: 11pt; font-weight: bold;">${matrix.issuingUnit.toUpperCase()}</div>
          <div style="font-size: 11pt; font-weight: bold;">TỔ TOÁN HỌC</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 11pt; font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div style="font-size: 10pt; font-style: italic;">Độc lập - Tự do - Hạnh phúc</div>
        </div>
      </div>
      <h2 style="text-align: center; font-size: 14pt; margin: 15px 0 5px 0;">${matrix.title.toUpperCase()}</h2>
      <p style="text-align: center; font-size: 10pt; font-style: italic; margin-bottom: 15px;">
        Môn: ${matrix.subject} - Lớp ${matrix.grade} | Năm học: ${matrix.academicYear} | Thời gian làm bài: ${matrix.durationMinutes} phút
      </p>
      <table>
        <thead>
          <tr>
            <th>TT</th>
            <th>Chủ đề</th>
            <th>Yêu cầu cần đạt</th>
            <th>Mức độ</th>
            <th>Hình thức</th>
            <th>Số câu</th>
            <th>Điểm/câu</th>
            <th>Tổng điểm</th>
          </tr>
        </thead>
        <tbody>${tableRowsHtml}</tbody>
      </table>
    `;
    printDocument(matrix.title, html);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            Thư viện ma trận đề kiểm tra
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Tổng hợp các ma trận chuẩn Công văn 7991/BGDĐT-GDTrH cho khối 10, 11, 12 GDPT 2018
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playSound('click');
              setShowCompareModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Scale className="w-4 h-4 text-slate-600" />
            So sánh 2 ma trận
          </button>
          <button
            onClick={() => {
              playSound('click');
              onGoToCreateMatrix();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tạo ma trận mới
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Tìm kiếm ma trận
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tên ma trận, trường..."
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Khối lớp
          </label>
          <select
            value={selectedGrade}
            onChange={e => setSelectedGrade(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả khối (10, 11, 12)</option>
            <option value="12">Khối 12</option>
            <option value="11">Khối 11</option>
            <option value="10">Khối 10</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Năm học
          </label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả năm học</option>
            <option value="2025-2026">2025-2026 (Chính thức)</option>
            <option value="2026-2027">2026-2027 (Kế hoạch)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Học kỳ
          </label>
          <select
            value={selectedSemester}
            onChange={e => setSelectedSemester(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả học kỳ</option>
            <option value="GKI">Giữa học kỳ I (GKI)</option>
            <option value="CKI">Cuối học kỳ I (CKI)</option>
            <option value="GKII">Giữa học kỳ II (GKII)</option>
            <option value="CKII">Cuối học kỳ II (CKII)</option>
          </select>
        </div>
      </div>

      {/* Grid of Matrices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredMatrices.map(matrix => {
          const totalQuestions = matrix.cells.reduce((sum, c) => sum + c.questionCount, 0);
          const totalPts = matrix.cells.reduce((sum, c) => sum + c.totalPoints, 0);

          let knowPts = 0;
          let compPts = 0;
          let appPts = 0;
          matrix.cells.forEach(c => {
            if (c.cognitiveLevel === 'nhan_biet') knowPts += c.totalPoints;
            else if (c.cognitiveLevel === 'thong_hieu') compPts += c.totalPoints;
            else appPts += c.totalPoints;
          });

          const pctKnow = totalPts > 0 ? Math.round((knowPts / totalPts) * 100) : 0;
          const pctComp = totalPts > 0 ? Math.round((compPts / totalPts) * 100) : 0;
          const pctApp = totalPts > 0 ? Math.round((appPts / totalPts) * 100) : 0;

          return (
            <div
              key={matrix.id}
              className="bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    Toán {matrix.grade} • {matrix.semester}
                  </span>
                  {matrix.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Đã xác thực
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Chờ cập nhật
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-800 text-base leading-snug mb-2 line-clamp-2">
                  {matrix.title}
                </h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-1">{matrix.issuingUnit}</p>

                {/* Cognitive Distribution Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
                    <span className="font-semibold text-slate-700">Tỉ lệ nhận thức:</span>
                    {matrix.cognitiveRatioConfig && (
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        Mục tiêu: {matrix.cognitiveRatioConfig.knowPct}% - {matrix.cognitiveRatioConfig.compPct}% - {matrix.cognitiveRatioConfig.appPct}%
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                    <span>Biết: {pctKnow}%</span>
                    <span>Hiểu: {pctComp}%</span>
                    <span>Vận dụng: {pctApp}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div style={{ width: `${pctKnow}%` }} className="bg-sky-500" title={`Nhận biết: ${pctKnow}%`} />
                    <div style={{ width: `${pctComp}%` }} className="bg-amber-500" title={`Thông hiểu: ${pctComp}%`} />
                    <div style={{ width: `${pctApp}%` }} className="bg-emerald-500" title={`Vận dụng: ${pctApp}%`} />
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-50 rounded-lg text-center text-xs">
                  <div>
                    <div className="text-slate-400 font-medium">Thời gian</div>
                    <div className="font-bold text-slate-700 mt-0.5">{matrix.durationMinutes} phút</div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium">Số câu</div>
                    <div className="font-bold text-slate-700 mt-0.5">{totalQuestions} câu</div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-medium">Tổng điểm</div>
                    <div className="font-bold text-indigo-600 mt-0.5">{matrix.totalPoints} đ</div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="border-t border-slate-100 p-3 bg-slate-50/70 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      playSound('click');
                      setViewingMatrix(matrix);
                    }}
                    title="Xem chi tiết"
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleExportWord(matrix)}
                    title="Xuất Word (.doc)"
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePrint(matrix)}
                    title="In ma trận"
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(matrix.id)}
                    title="Nhân bản ma trận"
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSelectMatrixToEdit(matrix)}
                    title="Chỉnh sửa ma trận"
                    className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(matrix.id, matrix.title)}
                    title="Xoá ma trận"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectMatrixForSpec(matrix.id)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-indigo-400 rounded transition-colors"
                  >
                    Bản đặc tả
                  </button>
                  <button
                    onClick={() => onSelectMatrixToComposeExam(matrix.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
                  >
                    Tạo đề
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Matrix Detail Modal */}
      {viewingMatrix && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 gap-2">
              <div className="min-w-0">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block">
                  Toán {viewingMatrix.grade} • {viewingMatrix.academicYear} • {viewingMatrix.semester}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-0.5 truncate">{viewingMatrix.title}</h3>
                <p className="text-xs text-slate-500 truncate">{viewingMatrix.issuingUnit}</p>
              </div>
              <button
                onClick={() => setViewingMatrix(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-indigo-50/50 p-3 sm:p-4 rounded-xl text-center border border-indigo-100">
                <div>
                  <div className="text-[11px] sm:text-xs text-slate-500">Thời gian</div>
                  <div className="text-sm sm:text-base font-bold text-slate-800">{viewingMatrix.durationMinutes} phút</div>
                </div>
                <div>
                  <div className="text-[11px] sm:text-xs text-slate-500">Tổng điểm</div>
                  <div className="text-sm sm:text-base font-bold text-indigo-600">{viewingMatrix.totalPoints} điểm</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Số lượng chủ đề</div>
                  <div className="text-base font-bold text-slate-800">{viewingMatrix.cells.length} dòng</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Tổng số câu</div>
                  <div className="text-base font-bold text-slate-800">
                    {viewingMatrix.cells.reduce((s, c) => s + c.questionCount, 0)} câu
                  </div>
                </div>
              </div>

              {/* Cognitive levels breakdown */}
              {(() => {
                let knowPts = 0;
                let compPts = 0;
                let appPts = 0;
                viewingMatrix.cells.forEach(c => {
                  if (c.cognitiveLevel === 'nhan_biet') knowPts += c.totalPoints;
                  else if (c.cognitiveLevel === 'thong_hieu') compPts += c.totalPoints;
                  else appPts += c.totalPoints;
                });
                const total = viewingMatrix.totalPoints || 1;
                const kPct = Math.round((knowPts / total) * 100);
                const cPct = Math.round((compPts / total) * 100);
                const aPct = Math.round((appPts / total) * 100);
                const cfg = viewingMatrix.cognitiveRatioConfig;

                return (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-bold text-slate-700 mb-2">
                      <span className="uppercase tracking-wider">Phân bố mức độ nhận thức</span>
                      {cfg && (
                        <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-semibold text-[11px] self-start sm:self-auto">
                          Mục tiêu cấu hình: {cfg.knowPct}% Nhận biết – {cfg.compPct}% Thông hiểu – {cfg.appPct}% Vận dụng
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-100">
                        <div className="text-sky-700 font-semibold">Nhận biết</div>
                        <div className="text-base font-bold text-slate-800 mt-0.5">{knowPts.toFixed(2)} đ ({kPct}%)</div>
                        {cfg && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Mục tiêu: {((total * cfg.knowPct) / 100).toFixed(2)} đ ({cfg.knowPct}%)
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                        <div className="text-amber-700 font-semibold">Thông hiểu</div>
                        <div className="text-base font-bold text-slate-800 mt-0.5">{compPts.toFixed(2)} đ ({cPct}%)</div>
                        {cfg && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Mục tiêu: {((total * cfg.compPct) / 100).toFixed(2)} đ ({cfg.compPct}%)
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                        <div className="text-emerald-700 font-semibold">Vận dụng</div>
                        <div className="text-base font-bold text-slate-800 mt-0.5">{appPts.toFixed(2)} đ ({aPct}%)</div>
                        {cfg && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Mục tiêu: {((total * cfg.appPct) / 100).toFixed(2)} đ ({cfg.appPct}%)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                      <th className="p-3 border-b text-center w-12">TT</th>
                      <th className="p-3 border-b">Chủ đề / Mạch kiến thức</th>
                      <th className="p-3 border-b">Yêu cầu cần đạt</th>
                      <th className="p-3 border-b text-center">Mức độ</th>
                      <th className="p-3 border-b text-center">Hình thức</th>
                      <th className="p-3 border-b text-center">Số câu</th>
                      <th className="p-3 border-b text-center">Điểm/câu</th>
                      <th className="p-3 border-b text-center">Tổng điểm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {viewingMatrix.cells.map((cell, idx) => (
                      <tr key={cell.id} className="hover:bg-slate-50/70">
                        <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                        <td className="p-3 font-semibold text-slate-800">{cell.topic}</td>
                        <td className="p-3 text-xs text-slate-600 max-w-xs">{cell.learningOutcome}</td>
                        <td className="p-3 text-center">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              cell.cognitiveLevel === 'nhan_biet'
                                ? 'bg-sky-50 text-sky-700'
                                : cell.cognitiveLevel === 'thong_hieu'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {cell.cognitiveLevel === 'nhan_biet'
                              ? 'Nhận biết'
                              : cell.cognitiveLevel === 'thong_hieu'
                              ? 'Thông hiểu'
                              : 'Vận dụng'}
                          </span>
                        </td>
                        <td className="p-3 text-center text-xs">
                          {cell.questionType === 'multiple_choice'
                            ? 'Trắc nghiệm (4 lựa chọn)'
                            : cell.questionType === 'true_false'
                            ? 'Đúng / Sai'
                            : cell.questionType === 'short_answer'
                            ? 'Trả lời ngắn'
                            : 'Tự luận'}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">{cell.questionCount}</td>
                        <td className="p-3 text-center text-slate-600">{cell.pointsPerQuestion}</td>
                        <td className="p-3 text-center font-bold text-indigo-600">{cell.totalPoints.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportWord(viewingMatrix)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <FileDown className="w-4 h-4" /> Xuất Word
                </button>
                <button
                  onClick={() => handlePrint(viewingMatrix)}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  <Printer className="w-4 h-4" /> In ma trận
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const id = viewingMatrix.id;
                    setViewingMatrix(null);
                    onSelectMatrixToComposeExam(id);
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm text-center"
                >
                  Tạo đề từ ma trận này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-800">So sánh đối chiếu 2 Ma trận</h3>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Ma trận 1 (Cột A)
                  </label>
                  <select
                    value={compareId1}
                    onChange={e => setCompareId1(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    {matrices.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.academicYear})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Ma trận 2 (Cột B)
                  </label>
                  <select
                    value={compareId2}
                    onChange={e => setCompareId2(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    {matrices.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.academicYear})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(() => {
                const m1 = matrices.find(m => m.id === compareId1) || matrices[0];
                const m2 = matrices.find(m => m.id === compareId2) || matrices[1] || matrices[0];
                if (!m1 || !m2) return null;

                const q1Count = m1.cells.reduce((s, c) => s + c.questionCount, 0);
                const q2Count = m2.cells.reduce((s, c) => s + c.questionCount, 0);

                let k1 = 0, h1 = 0, v1 = 0;
                m1.cells.forEach(c => {
                  if (c.cognitiveLevel === 'nhan_biet') k1 += c.totalPoints;
                  else if (c.cognitiveLevel === 'thong_hieu') h1 += c.totalPoints;
                  else v1 += c.totalPoints;
                });

                let k2 = 0, h2 = 0, v2 = 0;
                m2.cells.forEach(c => {
                  if (c.cognitiveLevel === 'nhan_biet') k2 += c.totalPoints;
                  else if (c.cognitiveLevel === 'thong_hieu') h2 += c.totalPoints;
                  else v2 += c.totalPoints;
                });

                return (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase">
                          <th className="p-3 border-b">Tiêu chí so sánh</th>
                          <th className="p-3 border-b text-indigo-700">{m1.title}</th>
                          <th className="p-3 border-b text-violet-700">{m2.title}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr>
                          <td className="p-3 font-semibold text-slate-500">Năm học & Khối</td>
                          <td className="p-3 font-medium">Toán {m1.grade} ({m1.academicYear})</td>
                          <td className="p-3 font-medium">Toán {m2.grade} ({m2.academicYear})</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-500">Thời gian làm bài</td>
                          <td className="p-3 font-medium">{m1.durationMinutes} phút</td>
                          <td className="p-3 font-medium">{m2.durationMinutes} phút</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-500">Tổng điểm</td>
                          <td className="p-3 font-bold text-indigo-600">{m1.totalPoints} đ</td>
                          <td className="p-3 font-bold text-violet-600">{m2.totalPoints} đ</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-500">Tổng số câu hỏi</td>
                          <td className="p-3 font-bold">{q1Count} câu</td>
                          <td className="p-3 font-bold">{q2Count} câu</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-500">Phân bố Nhận biết</td>
                          <td className="p-3">{k1.toFixed(1)} đ ({m1.totalPoints ? Math.round((k1 / m1.totalPoints) * 100) : 0}%)</td>
                          <td className="p-3">{k2.toFixed(1)} đ ({m2.totalPoints ? Math.round((k2 / m2.totalPoints) * 100) : 0}%)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-500">Phân bố Thông hiểu</td>
                          <td className="p-3">{h1.toFixed(1)} đ ({m1.totalPoints ? Math.round((h1 / m1.totalPoints) * 100) : 0}%)</td>
                          <td className="p-3">{h2.toFixed(1)} đ ({m2.totalPoints ? Math.round((h2 / m2.totalPoints) * 100) : 0}%)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-500">Phân bố Vận dụng</td>
                          <td className="p-3">{v1.toFixed(1)} đ ({m1.totalPoints ? Math.round((v1 / m1.totalPoints) * 100) : 0}%)</td>
                          <td className="p-3">{v2.toFixed(1)} đ ({m2.totalPoints ? Math.round((v2 / m2.totalPoints) * 100) : 0}%)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-500">Trạng thái xác thực</td>
                          <td className="p-3">
                            {m1.isVerified ? (
                              <span className="text-emerald-600 font-semibold">Đã xác thực</span>
                            ) : (
                              <span className="text-amber-600 font-semibold">Chờ cập nhật</span>
                            )}
                          </td>
                          <td className="p-3">
                            {m2.isVerified ? (
                              <span className="text-emerald-600 font-semibold">Đã xác thực</span>
                            ) : (
                              <span className="text-amber-600 font-semibold">Chờ cập nhật</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
