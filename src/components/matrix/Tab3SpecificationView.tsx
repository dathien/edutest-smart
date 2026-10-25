import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Download,
  Printer,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Link as LinkIcon,
  Search,
} from 'lucide-react';
import {
  SpecificationDocument,
  SpecificationRow,
  MatrixDocument,
  CognitiveLevel,
  QuestionType,
  User,
} from '../../types';
import { StorageService } from '../../services/storage';
import { playSound } from '../../services/sound';
import { downloadWordDocument, printDocument } from './exportUtils';

interface Tab3SpecificationViewProps {
  currentUser: User;
  matrices: MatrixDocument[];
  preselectedMatrixId?: string;
  onRefreshData: () => void;
  onGoToAuthorQuestion: () => void;
}

export const Tab3SpecificationView: React.FC<Tab3SpecificationViewProps> = ({
  currentUser,
  matrices,
  preselectedMatrixId,
  onRefreshData,
  onGoToAuthorQuestion,
}) => {
  const [specs, setSpecs] = useState<SpecificationDocument[]>(() =>
    StorageService.getSpecifications()
  );
  const [selectedMatrixId, setSelectedMatrixId] = useState<string>(
    preselectedMatrixId || matrices[0]?.id || ''
  );
  const [activeSpecId, setActiveSpecId] = useState<string>('');

  // Find or create active specification for selected matrix
  const activeSpec = useMemo(() => {
    let found = specs.find(s => s.id === activeSpecId);
    if (!found && selectedMatrixId) {
      found = specs.find(s => s.matrixId === selectedMatrixId);
    }
    return found || specs[0] || null;
  }, [specs, activeSpecId, selectedMatrixId]);

  // Linked Matrix Document
  const linkedMatrix = useMemo(() => {
    if (!activeSpec) return null;
    return matrices.find(m => m.id === activeSpec.matrixId) || null;
  }, [activeSpec, matrices]);

  // Editable specification state
  const [title, setTitle] = useState('');
  const [rows, setRows] = useState<SpecificationRow[]>([]);

  useEffect(() => {
    if (activeSpec) {
      setTitle(activeSpec.title);
      setRows(activeSpec.rows || []);
      setActiveSpecId(activeSpec.id);
      setSelectedMatrixId(activeSpec.matrixId);
    }
  }, [activeSpec]);

  // Matrix vs Specification alignment validation
  const syncValidation = useMemo(() => {
    if (!linkedMatrix) {
      return { isLinked: false, isMatched: true, message: 'Bản đặc tả độc lập (chưa liên kết ma trận cụ thể).' };
    }

    const matrixTotalQuestions = linkedMatrix.cells.reduce((sum, c) => sum + c.questionCount, 0);
    const specTotalQuestions = rows.reduce((sum, r) => sum + (Number(r.questionCount) || 0), 0);

    const isMatched = matrixTotalQuestions === specTotalQuestions;
    return {
      isLinked: true,
      isMatched,
      matrixTotalQuestions,
      specTotalQuestions,
      diff: specTotalQuestions - matrixTotalQuestions,
    };
  }, [linkedMatrix, rows]);

  // Synchronize rows from Linked Matrix
  const handleSyncFromMatrix = () => {
    if (!linkedMatrix) return;
    playSound('click');

    let currentQuestionCounter = 1;
    const newRows: SpecificationRow[] = linkedMatrix.cells.map((cell, idx) => {
      const startQ = currentQuestionCounter;
      const endQ = currentQuestionCounter + cell.questionCount - 1;
      currentQuestionCounter += cell.questionCount;

      let sectionName = 'Phần I';
      if (cell.questionType === 'true_false') sectionName = 'Phần II';
      else if (cell.questionType === 'short_answer') sectionName = 'Phần III';
      else if (cell.questionType === 'essay') sectionName = 'Phần IV';

      const codeString =
        cell.questionCount === 1
          ? `Câu ${startQ} (${sectionName})`
          : `Câu ${startQ} - Câu ${endQ} (${sectionName})`;

      return {
        id: `spec-row-${Date.now()}-${idx}`,
        matrixCellId: cell.id,
        topic: cell.topic,
        knowledgeUnit: cell.learningOutcome.split('.')[0] || cell.topic,
        learningOutcomes: cell.learningOutcome,
        cognitiveLevel: cell.cognitiveLevel,
        questionType: cell.questionType,
        questionCount: cell.questionCount,
        questionCodes: codeString,
      };
    });

    setRows(newRows);
  };

  // Add Spec Row
  const handleAddRow = () => {
    playSound('click');
    const newRow: SpecificationRow = {
      id: `spec-row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      topic: linkedMatrix?.cells[0]?.topic || 'Chủ đề mới',
      knowledgeUnit: 'Đơn vị kiến thức cụ thể',
      learningOutcomes: 'Chuẩn kiến thức, kỹ năng cần kiểm tra, đánh giá',
      cognitiveLevel: 'nhan_biet',
      questionType: 'multiple_choice',
      questionCount: 1,
      questionCodes: `Câu ${rows.length + 1}`,
    };
    setRows([...rows, newRow]);
  };

  // Remove Row
  const handleRemoveRow = (id: string) => {
    playSound('click');
    setRows(rows.filter(r => r.id !== id));
  };

  // Update Row
  const handleUpdateRow = (id: string, field: keyof SpecificationRow, value: any) => {
    setRows(rows.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  };

  // Save Spec
  const handleSave = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bản đặc tả.');
      return;
    }
    playSound('correct');

    const updatedDoc: SpecificationDocument = {
      id: activeSpec?.id || `spec-${Date.now()}`,
      matrixId: selectedMatrixId,
      title: title.trim(),
      subject: linkedMatrix?.subject || 'Toán học',
      grade: linkedMatrix?.grade || 12,
      academicYear: linkedMatrix?.academicYear || '2025-2026',
      semester: linkedMatrix?.semester || 'GKI',
      issuingUnit: linkedMatrix?.issuingUnit || currentUser.schoolName,
      rows,
      createdAt: activeSpec?.createdAt || new Date().toISOString().substring(0, 10),
      updatedAt: new Date().toISOString().substring(0, 10),
    };

    StorageService.saveSpecification(updatedDoc);
    setSpecs(StorageService.getSpecifications());
    setActiveSpecId(updatedDoc.id);
    onRefreshData();
  };

  // Export Word
  const handleExportWord = () => {
    playSound('click');
    const rowsHtml = rows
      .map(
        (r, idx) => `
      <tr>
        <td class="text-center">${idx + 1}</td>
        <td><strong>${r.topic}</strong></td>
        <td>${r.knowledgeUnit}</td>
        <td>${r.learningOutcomes}</td>
        <td class="text-center">${
          r.cognitiveLevel === 'nhan_biet'
            ? 'Nhận biết'
            : r.cognitiveLevel === 'thong_hieu'
            ? 'Thông hiểu'
            : 'Vận dụng'
        }</td>
        <td class="text-center">${
          r.questionType === 'multiple_choice'
            ? 'TN 4 lựa chọn'
            : r.questionType === 'true_false'
            ? 'Đúng / Sai'
            : r.questionType === 'short_answer'
            ? 'Trả lời ngắn'
            : 'Tự luận'
        }</td>
        <td class="text-center font-bold">${r.questionCount}</td>
        <td class="text-center">${r.questionCodes || ''}</td>
      </tr>
    `
      )
      .join('');

    const html = `
      <table class="header-table" style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="width: 45%; text-align: center;">
            <strong>${(linkedMatrix?.issuingUnit || currentUser.schoolName).toUpperCase()}</strong><br/>
            <strong>TỔ TOÁN HỌC</strong>
          </td>
          <td style="width: 55%; text-align: center;">
            <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
            <strong>Độc lập - Tự do - Hạnh phúc</strong>
          </td>
        </tr>
      </table>

      <h2 style="text-align: center; margin-top: 15px; text-transform: uppercase;">
        ${title}
      </h2>
      <p style="text-align: center; font-style: italic;">
        Môn: ${linkedMatrix?.subject || 'Toán học'} - Khối ${linkedMatrix?.grade || 12} | Năm học: ${
      linkedMatrix?.academicYear || '2025-2026'
    } | Thời gian: ${linkedMatrix?.durationMinutes || 90} phút
      </p>

      <table>
        <thead>
          <tr>
            <th>TT</th>
            <th>Chủ đề / Mạch kiến thức</th>
            <th>Đơn vị kiến thức / Kỹ năng</th>
            <th>Chuẩn kiến thức, kĩ năng cần kiểm tra, đánh giá (Yêu cầu cần đạt)</th>
            <th>Mức độ</th>
            <th>Hình thức</th>
            <th>Số câu</th>
            <th>Câu hỏi trong đề</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;

    downloadWordDocument(`BanDacTa_${linkedMatrix?.grade || 12}`, title, html);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Bản đặc tả đề kiểm tra (CV 7991/BGDĐT-GDTrH)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Mô tả chi tiết chuẩn kiến thức, kỹ năng, yêu cầu cần đạt và ánh xạ vị trí từng câu hỏi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportWord}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Xuất Word
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Save className="w-4 h-4" />
            Lưu bản đặc tả
          </button>
        </div>
      </div>

      {/* Linked Matrix Selector & Sync Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Liên kết với Ma trận đề kiểm tra
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedMatrixId}
                onChange={e => {
                  setSelectedMatrixId(e.target.value);
                  const matchedSpec = specs.find(s => s.matrixId === e.target.value);
                  if (matchedSpec) {
                    setActiveSpecId(matchedSpec.id);
                  }
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-medium"
              >
                {matrices.map(m => (
                  <option key={m.id} value={m.id}>
                    Toán {m.grade} - {m.title} ({m.academicYear})
                  </option>
                ))}
              </select>
              <button
                onClick={handleSyncFromMatrix}
                title="Đồng bộ tự động các dòng từ Ma trận"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg whitespace-nowrap transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Đồng bộ từ ma trận
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Bản đặc tả đã lưu ({specs.length})
            </label>
            <select
              value={activeSpecId}
              onChange={e => setActiveSpecId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
            >
              {specs.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Tiêu đề bản đặc tả <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 font-semibold text-slate-800"
            placeholder="Ví dụ: Bản đặc tả Đề kiểm tra Giữa học kỳ I - Toán 12"
          />
        </div>

        {/* Sync Status Badge */}
        {syncValidation.isLinked && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
              syncValidation.isMatched
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncValidation.isMatched ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              )}
              <span>
                <strong>Kiểm tra tính khớp:</strong> Ma trận yêu cầu{' '}
                <strong>{syncValidation.matrixTotalQuestions} câu</strong>. Bản đặc tả hiện có{' '}
                <strong>{syncValidation.specTotalQuestions} câu</strong>.
                {linkedMatrix?.cognitiveRatioConfig && (
                  <span className="ml-2 text-indigo-700 font-medium">
                    (Tỉ lệ nhận thức: {linkedMatrix.cognitiveRatioConfig.knowPct}% –{' '}
                    {linkedMatrix.cognitiveRatioConfig.compPct}% –{' '}
                    {linkedMatrix.cognitiveRatioConfig.appPct}%)
                  </span>
                )}
                {!syncValidation.isMatched &&
                  ` (${
                    syncValidation.diff! > 0
                      ? `Lệch thừa ${syncValidation.diff} câu`
                      : `Lệch thiếu ${Math.abs(syncValidation.diff!)} câu`
                  })`}
              </span>
            </div>

            {!syncValidation.isMatched && (
              <button
                onClick={handleSyncFromMatrix}
                className="text-xs font-bold text-amber-800 underline hover:text-amber-900"
              >
                Nhấn để đồng bộ lại ngay
              </button>
            )}
          </div>
        )}
      </div>

      {/* Specification Table */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">
            Chi tiết các mục trong Bản đặc tả ({rows.length} mục)
          </h3>
          <button
            onClick={handleAddRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm dòng đặc tả
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <th className="p-3 border-b text-center w-12">TT</th>
                <th className="p-3 border-b min-w-[180px]">Chủ đề / Mạch KT</th>
                <th className="p-3 border-b min-w-[180px]">Đơn vị kiến thức / Kỹ năng</th>
                <th className="p-3 border-b min-w-[280px]">Chuẩn kiến thức & Yêu cầu cần đạt</th>
                <th className="p-3 border-b w-32 text-center">Mức độ</th>
                <th className="p-3 border-b w-36 text-center">Hình thức</th>
                <th className="p-3 border-b text-center w-20">Số câu</th>
                <th className="p-3 border-b min-w-[140px] text-center">Vị trí câu trong đề</th>
                <th className="p-3 border-b text-center w-12">Xoá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rows.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  <td className="p-3 text-center text-slate-400 font-semibold">{idx + 1}</td>

                  {/* Topic */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.topic}
                      onChange={e => handleUpdateRow(row.id, 'topic', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 font-semibold"
                    />
                  </td>

                  {/* Knowledge Unit */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.knowledgeUnit}
                      onChange={e => handleUpdateRow(row.id, 'knowledgeUnit', e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-300"
                    />
                  </td>

                  {/* Learning Outcomes */}
                  <td className="p-2">
                    <textarea
                      rows={2}
                      value={row.learningOutcomes}
                      onChange={e => handleUpdateRow(row.id, 'learningOutcomes', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300"
                    />
                  </td>

                  {/* Cognitive Level */}
                  <td className="p-2 text-center">
                    <select
                      value={row.cognitiveLevel}
                      onChange={e => handleUpdateRow(row.id, 'cognitiveLevel', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300 font-medium"
                    >
                      <option value="nhan_biet">Nhận biết</option>
                      <option value="thong_hieu">Thông hiểu</option>
                      <option value="van_dung">Vận dụng</option>
                      <option value="van_dung_cao">Vận dụng cao</option>
                    </select>
                  </td>

                  {/* Question Type */}
                  <td className="p-2 text-center">
                    <select
                      value={row.questionType}
                      onChange={e => handleUpdateRow(row.id, 'questionType', e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300"
                    >
                      <option value="multiple_choice">Trắc nghiệm 4 lựa chọn</option>
                      <option value="true_false">Đúng / Sai</option>
                      <option value="short_answer">Trả lời ngắn</option>
                      <option value="essay">Tự luận</option>
                    </select>
                  </td>

                  {/* Count */}
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      min="1"
                      value={row.questionCount}
                      onChange={e => handleUpdateRow(row.id, 'questionCount', Number(e.target.value))}
                      className="w-14 px-1.5 py-1 text-xs rounded border border-slate-300 text-center font-bold"
                    />
                  </td>

                  {/* Question Codes */}
                  <td className="p-2 text-center">
                    <input
                      type="text"
                      value={row.questionCodes || ''}
                      onChange={e => handleUpdateRow(row.id, 'questionCodes', e.target.value)}
                      placeholder="VD: Câu 1 - Câu 8"
                      className="w-full px-2 py-1 text-xs rounded border border-slate-300 text-center font-medium text-indigo-700"
                    />
                  </td>

                  {/* Delete */}
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleRemoveRow(row.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Tổng cộng: <strong>{rows.reduce((s, r) => s + (Number(r.questionCount) || 0), 0)} câu hỏi</strong> được đặc tả.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              Lưu bản đặc tả
            </button>
            <button
              onClick={() => {
                handleSave();
                onGoToAuthorQuestion();
              }}
              className="px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
            >
              Chuyển sang Soạn câu hỏi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
