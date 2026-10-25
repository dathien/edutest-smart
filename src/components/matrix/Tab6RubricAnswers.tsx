import React, { useState, useMemo } from 'react';
import {
  FileCheck,
  CheckCircle,
  Download,
  Printer,
  Sparkles,
  Layers,
  ChevronDown,
  ListOrdered,
  Search,
} from 'lucide-react';
import { Exam, Question, User } from '../../types';
import { MathRenderer } from '../MathRenderer';
import { playSound } from '../../services/sound';
import { downloadWordDocument, printDocument } from './exportUtils';

interface Tab6RubricAnswersProps {
  currentUser: User;
  exams: Exam[];
  preselectedExamId?: string;
}

export const Tab6RubricAnswers: React.FC<Tab6RubricAnswersProps> = ({
  currentUser,
  exams,
  preselectedExamId,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(
    preselectedExamId || exams[0]?.id || ''
  );
  const [selectedVariantTab, setSelectedVariantTab] = useState<string>('goc'); // 'goc' or variant code

  const activeExam = useMemo(() => {
    return exams.find(e => e.id === selectedExamId) || exams[0] || null;
  }, [exams, selectedExamId]);

  // Questions in active exam
  const questions = useMemo(() => activeExam?.questions || [], [activeExam]);

  // Grouped questions by section
  const p1Questions = useMemo(() => questions.filter(q => q.type === 'multiple_choice'), [questions]);
  const p2Questions = useMemo(() => questions.filter(q => q.type === 'true_false'), [questions]);
  const p3Questions = useMemo(() => questions.filter(q => q.type === 'short_answer'), [questions]);
  const p4Questions = useMemo(() => questions.filter(q => q.type === 'essay'), [questions]);
  const pOtherQuestions = useMemo(
    () =>
      questions.filter(q =>
        [
          'true_false_single',
          'numeric_answer',
          'fill_in_blank',
          'dropdown_choice',
          'matching',
          'ordering',
          'multiple_select',
        ].includes(q.type)
      ),
    [questions]
  );

  // Export Word Document
  const handleExportWord = () => {
    if (!activeExam) return;
    playSound('click');

    const p1RowsHtml = p1Questions
      .map(
        (q, idx) => `
      <tr>
        <td class="text-center font-bold">Câu ${idx + 1}</td>
        <td class="text-center font-bold text-indigo-700">${q.correctAnswer || 'A'}</td>
        <td>${q.options ? q.options[['A', 'B', 'C', 'D'].indexOf(q.correctAnswer || 'A')] || '' : ''}</td>
        <td class="text-center">${q.points} đ</td>
      </tr>
    `
      )
      .join('');

    const p2RowsHtml = p2Questions
      .map((q, idx) => {
        const letters = q.trueFalseOptions?.map(o => `${o.id}: ${o.isCorrect ? 'Đ' : 'S'}`).join(', ') || '';
        return `
        <tr>
          <td class="text-center font-bold">Câu ${idx + 1}</td>
          <td>${letters}</td>
          <td>${q.trueFalseOptions?.map(o => `<div><strong>${o.id})</strong> ${o.explanation || ''}</div>`).join('') || ''}</td>
          <td class="text-center">${q.points} đ</td>
        </tr>
      `;
      })
      .join('');

    const p3RowsHtml = p3Questions
      .map(
        (q, idx) => `
      <tr>
        <td class="text-center font-bold">Câu ${idx + 1}</td>
        <td class="text-center font-bold">${q.correctAnswer || ''}</td>
        <td>${q.solution || ''}</td>
        <td class="text-center">${q.points} đ</td>
      </tr>
    `
      )
      .join('');

    const p4RowsHtml = p4Questions
      .map(
        (q, idx) => `
      <div style="margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
        <p><strong>Câu ${idx + 1} (${q.points} điểm):</strong> ${q.prompt}</p>
        <p><strong>Hướng dẫn chấm:</strong></p>
        <p>${q.rubricGuide || q.solution}</p>
      </div>
    `
      )
      .join('');

    const html = `
      <table class="header-table" style="width: 100%; margin-bottom: 20px;">
        <tr>
          <td style="width: 45%; text-align: center;">
            <strong>SỞ GIÁO DỤC VÀ ĐÀO TẠO TP.HCM</strong><br/>
            <strong>TRƯỜNG THPT CHUYÊN & GDPT 2018</strong>
          </td>
          <td style="width: 55%; text-align: center;">
            <strong>ĐÁP ÁN & HƯỚNG DẪN CHẤM</strong><br/>
            <strong>${activeExam.title.toUpperCase()}</strong><br/>
            <em>Mã đề gốc: ${activeExam.code}</em>
          </td>
        </tr>
      </table>

      <h3>PHẦN I. ĐÁP ÁN TRẮC NGHIỆM NHIỀU LỰA CHỌN</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 15%;">Câu</th>
            <th style="width: 15%;">Đáp án đúng</th>
            <th>Nội dung phương án</th>
            <th style="width: 15%;">Điểm</th>
          </tr>
        </thead>
        <tbody>${p1RowsHtml}</tbody>
      </table>

      <h3>PHẦN II. ĐÁP ÁN TRẮC NGHIỆM ĐÚNG / SAI</h3>
      <p><em>Quy ước tính điểm Bộ GD&ĐT: Đúng 1 ý = 0.1đ; Đúng 2 ý = 0.25đ; Đúng 3 ý = 0.5đ; Đúng 4 ý = 1.0đ.</em></p>
      <table>
        <thead>
          <tr>
            <th style="width: 15%;">Câu</th>
            <th style="width: 25%;">Đáp án (Đúng / Sai)</th>
            <th>Giải thích chi tiết</th>
            <th style="width: 15%;">Điểm tối đa</th>
          </tr>
        </thead>
        <tbody>${p2RowsHtml}</tbody>
      </table>

      <h3>PHẦN III. ĐÁP ÁN TRẢ LỜI NGẮN</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 15%;">Câu</th>
            <th style="width: 25%;">Đáp án số / chuỗi</th>
            <th>Lời giải vắn tắt</th>
            <th style="width: 15%;">Điểm</th>
          </tr>
        </thead>
        <tbody>${p3RowsHtml}</tbody>
      </table>

      <h3>PHẦN IV. HƯỚNG DẪN CHẤM TỰ LUẬN</h3>
      ${p4RowsHtml}
    `;

    downloadWordDocument(`DapAn_HuongDanCham_${activeExam.code}`, activeExam.title, html);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-indigo-600" />
            Đáp án & Hướng dẫn chấm chi tiết
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Bảng đáp án trắc nghiệm nhiều mã đề, biểu điểm Đúng/Sai và hướng dẫn chấm tự luận từng bước
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportWord}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Xuất file Word
          </button>
        </div>
      </div>

      {/* Exam Selector Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Chọn đề kiểm tra:
          </label>
          <select
            value={selectedExamId}
            onChange={e => setSelectedExamId(e.target.value)}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 font-semibold text-slate-800"
          >
            {exams.map(e => (
              <option key={e.id} value={e.id}>
                {e.title} (Mã: {e.code})
              </option>
            ))}
          </select>
        </div>

        {/* Variants selector tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <span className="px-2 text-slate-500">Mã đề:</span>
          <button
            onClick={() => setSelectedVariantTab('goc')}
            className={`px-2.5 py-1 rounded transition-colors ${
              selectedVariantTab === 'goc' ? 'bg-white font-bold text-indigo-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            Đề gốc ({activeExam?.code})
          </button>
          {activeExam?.variants?.map(v => (
            <button
              key={v.code}
              onClick={() => setSelectedVariantTab(v.code)}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedVariantTab === v.code
                  ? 'bg-white font-bold text-indigo-600 shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              Mã {v.code}
            </button>
          ))}
        </div>
      </div>

      {/* Part I: Multiple Choice Answers */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-base">
            PHẦN I: Bảng đáp án trắc nghiệm 4 lựa chọn ({p1Questions.length} câu)
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            Tổng điểm: {(p1Questions.length * 0.25).toFixed(2)} đ
          </span>
        </div>

        {/* Answer Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {p1Questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 text-center space-y-1"
            >
              <div className="text-xs text-slate-500 font-medium">Câu {idx + 1}</div>
              <div className="text-xl font-bold text-indigo-600">
                {q.correctAnswer || 'A'}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">{q.points} đ</div>
            </div>
          ))}
        </div>
      </div>

      {/* Part II: True / False Answers */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              PHẦN II: Đáp án trắc nghiệm Đúng / Sai ({p2Questions.length} câu)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Quy tắc tính điểm Bộ GD&ĐT: Đúng 1 ý: 0.10đ | Đúng 2 ý: 0.25đ | Đúng 3 ý: 0.50đ | Đúng 4 ý: 1.00đ
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {p2Questions.map((q, idx) => (
            <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="font-bold text-sm text-slate-800">
                Câu {idx + 1} ({q.points} điểm): <MathRenderer content={q.prompt} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.trueFalseOptions?.map(opt => (
                  <div
                    key={opt.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold uppercase text-slate-700 mr-1.5">
                        Ý {opt.id})
                      </span>
                      <MathRenderer content={opt.text} />
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-bold ${
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

              {q.solution && (
                <div className="p-3 bg-white rounded border border-slate-200 text-xs text-slate-600">
                  <span className="font-bold text-slate-700">Giải thích: </span>
                  <MathRenderer content={q.solution} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Part III: Short Answers */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">
          PHẦN III: Đáp án câu trắc nghiệm trả lời ngắn ({p3Questions.length} câu)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {p3Questions.map((q, idx) => (
            <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="text-xs text-slate-500 font-medium">Câu {idx + 1}</div>
              <div className="text-base font-bold text-indigo-700 font-mono">
                {q.correctAnswer || 'Chưa điền'}
              </div>
              <div className="text-xs text-slate-500 pt-1 line-clamp-2">
                <MathRenderer content={q.prompt} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Part IV: Essay Rubrics */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">
          PHẦN IV: Hướng dẫn chấm chi tiết câu hỏi tự luận ({p4Questions.length} câu)
        </h3>

        <div className="space-y-4">
          {p4Questions.map((q, idx) => (
            <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="font-bold text-sm text-slate-800">
                Câu {idx + 1} ({q.points} điểm): <MathRenderer content={q.prompt} />
              </div>

              {/* Rubric Steps Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold uppercase">
                      <th className="p-2.5 w-24 text-center">Bước</th>
                      <th className="p-2.5">Yêu cầu nội dung cần đạt</th>
                      <th className="p-2.5 w-24 text-center">Điểm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 text-center font-bold">Bước 1</td>
                      <td className="p-2.5">Tìm tập xác định, tính đạo hàm bậc nhất</td>
                      <td className="p-2.5 text-center font-bold text-indigo-600">0.50 đ</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-center font-bold">Bước 2</td>
                      <td className="p-2.5">Giải phương trình đạo hàm bằng 0 và xét dấu</td>
                      <td className="p-2.5 text-center font-bold text-indigo-600">0.50 đ</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-center font-bold">Bước 3</td>
                      <td className="p-2.5">Lập bảng biến thiên hoàn chỉnh hoặc tính giá trị biên</td>
                      <td className="p-2.5 text-center font-bold text-indigo-600">0.50 đ</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-center font-bold">Bước 4</td>
                      <td className="p-2.5">Kết luận chính xác giá trị cần tìm theo yêu cầu bài toán</td>
                      <td className="p-2.5 text-center font-bold text-indigo-600">0.50 đ</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700">
                <div className="font-bold mb-1">Lời giải chi tiết:</div>
                <MathRenderer content={q.solution} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Part V: Other Question Types (Numeric, Blanks, Dropdowns, Matching, Ordering, Multi-select) */}
      {pOtherQuestions.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-3">
            PHẦN V: Đáp án các dạng câu hỏi luyện tập & nâng cao ({pOtherQuestions.length} câu)
          </h3>

          <div className="space-y-4">
            {pOtherQuestions.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5 text-xs">
                <div className="font-bold text-sm text-slate-800">
                  Câu {idx + 1} ({q.points} điểm - Dạng: <span className="font-mono text-indigo-700">{q.type}</span>): <MathRenderer content={q.prompt} />
                </div>

                {q.type === 'true_false_single' && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-bold text-emerald-700">
                    Đáp án: {q.singleTrueFalseAnswer ? 'ĐÚNG' : 'SAI'}
                  </div>
                )}

                {q.type === 'numeric_answer' && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-indigo-700 font-bold">
                    Giá trị: {q.numericAnswerConfig?.targetValue} {q.numericAnswerConfig?.unit} (Sai số: ±{q.numericAnswerConfig?.tolerance ?? 0.01})
                  </div>
                )}

                {q.type === 'fill_in_blank' && q.fillInBlankConfig && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    {q.fillInBlankConfig.blanks.map(b => (
                      <div key={b.id}>
                        <strong className="text-indigo-700">[{b.id}]:</strong> {b.correctAnswers.join(' HOẶC ')}
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'dropdown_choice' && q.dropdownChoiceConfig && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    {q.dropdownChoiceConfig.dropdowns.map(d => (
                      <div key={d.id}>
                        <strong className="text-indigo-700">[{d.id}]:</strong> {d.correctOption}
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'matching' && q.matchingConfig && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                    {q.matchingConfig.pairs.map((p, pIdx) => (
                      <div key={pIdx}>
                        Cặp ghép đúng: <strong className="text-indigo-700">{p.leftId}</strong> ➔ <strong className="text-emerald-700">{p.rightId}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'ordering' && q.orderingConfig && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    Thứ tự đúng: <strong className="text-indigo-700 font-mono">{q.orderingConfig.correctOrder.join(' ➔ ')}</strong>
                  </div>
                )}

                {q.type === 'multiple_select' && q.multipleSelectConfig && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    Các đáp án đúng: <strong className="text-emerald-700 font-bold">{q.multipleSelectConfig.correctAnswers.join(', ')}</strong>
                  </div>
                )}

                {q.solution && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-600">
                    <strong>Lời giải:</strong> <MathRenderer content={q.solution} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
