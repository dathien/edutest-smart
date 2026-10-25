import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle,
  Download,
  Printer,
  Sparkles,
  ArrowRight,
  Layers,
  Info,
} from 'lucide-react';
import {
  MatrixDocument,
  MatrixCell,
  CognitiveLevel,
  QuestionType,
  User,
  ExamType,
  CognitiveRatioConfig,
} from '../../types';
import { StorageService } from '../../services/storage';
import { playSound } from '../../services/sound';
import { downloadWordDocument, printDocument } from './exportUtils';
import { CognitiveRatioConfigurator } from './CognitiveRatioConfigurator';

interface Tab2MatrixBuilderProps {
  currentUser: User;
  editingMatrix: MatrixDocument | null;
  onSaved: (savedMatrix: MatrixDocument) => void;
  onGoToSpec: (matrixId: string) => void;
}

// Topic suggestions for High School Math
const MATH_TOPICS_BY_GRADE: { [grade: number]: string[] } = {
  12: [
    '1. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
    '2. Toạ độ của vectơ trong không gian Oxyz',
    '3. Các số đặc trưng đo mức độ phân tán cho mẫu số liệu ghép nhóm',
    '4. Nguyên hàm, Tích phân và Ứng dụng',
    '5. Phương pháp toạ độ trong không gian (Mặt phẳng & Đường thẳng)',
    '6. Xác suất có điều kiện và Công thức Bayes',
  ],
  11: [
    '1. Hàm số lượng giác và phương trình lượng giác',
    '2. Dãy số, Cấp số cộng và Cấp số nhân',
    '3. Giới hạn và Hàm số liên tục',
    '4. Đường thẳng và mặt phẳng trong không gian (Quan hệ song song)',
    '5. Các số đặc trưng đo xu thế trung tâm cho mẫu số liệu ghép nhóm',
    '6. Hàm số mũ và hàm số lôgarit',
    '7. Đạo hàm và ý nghĩa hình học',
    '8. Quan hệ vuông góc trong không gian',
  ],
  10: [
    '1. Mệnh đề toán học và Tập hợp',
    '2. Bất phương trình và hệ bất phương trình bậc nhất hai ẩn',
    '3. Hàm số bậc hai và đồ thị',
    '4. Hệ thức lượng trong tam giác',
    '5. Vectơ và các phép toán',
    '6. Các số đặc trưng đo xu thế trung tâm và mức độ phân tán',
    '7. Phương pháp toạ độ trong mặt phẳng Oxy',
    '8. Đại số tổ hợp (Quy tắc đếm, Hoán vị, Chỉnh hợp, Tổ hợp)',
  ],
};

const EXAM_TYPE_OPTIONS: { id: ExamType; label: string }[] = [
  { id: 'kiem_tra_thuong_xuyen', label: 'Kiểm tra thường xuyên' },
  { id: 'giua_ky_1', label: 'Kiểm tra giữa học kỳ I' },
  { id: 'cuoi_ky_1', label: 'Kiểm tra cuối học kỳ I' },
  { id: 'giua_ky_2', label: 'Kiểm tra giữa học kỳ II' },
  { id: 'cuoi_ky_2', label: 'Kiểm tra cuối học kỳ II' },
  { id: 'on_tap', label: 'Kiểm tra ôn tập' },
  { id: 'chu_de', label: 'Kiểm tra theo chủ đề' },
];

export const Tab2MatrixBuilder: React.FC<Tab2MatrixBuilderProps> = ({
  currentUser,
  editingMatrix,
  onSaved,
  onGoToSpec,
}) => {
  // General Info State
  const [matrixId, setMatrixId] = useState<string>(
    editingMatrix ? editingMatrix.id : `matrix-${Date.now()}`
  );
  const [title, setTitle] = useState<string>(
    editingMatrix
      ? editingMatrix.title
      : 'Ma trận Đề kiểm tra Giữa học kỳ I - Toán 12 (Chuẩn CV 7991)'
  );
  const [grade, setGrade] = useState<10 | 11 | 12>(editingMatrix ? editingMatrix.grade : 12);
  const [academicYear, setAcademicYear] = useState<'2025-2026' | '2026-2027'>(
    editingMatrix ? editingMatrix.academicYear : '2025-2026'
  );
  const [semester, setSemester] = useState<'GKI' | 'CKI' | 'GKII' | 'CKII'>(
    editingMatrix ? editingMatrix.semester : 'GKI'
  );
  const [examType, setExamType] = useState<ExamType>(
    (editingMatrix?.examType as ExamType) || 'giua_ky_1'
  );
  const [subject, setSubject] = useState<string>(editingMatrix ? editingMatrix.subject : 'Toán học');
  const [issuingUnit, setIssuingUnit] = useState<string>(
    editingMatrix ? editingMatrix.issuingUnit : currentUser.schoolName || 'THPT Chuyên & GDPT 2018'
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(
    editingMatrix ? editingMatrix.durationMinutes : 90
  );
  const [targetTotalPoints, setTargetTotalPoints] = useState<number>(
    editingMatrix ? editingMatrix.totalPoints : 10.0
  );
  const [authorName, setAuthorName] = useState<string>(
    editingMatrix?.authorName || currentUser.fullName
  );
  const [notes, setNotes] = useState<string>(
    editingMatrix?.notes || 'Căn cứ Công văn 7991/BGDĐT-GDTrH về xây dựng ma trận đặc tả đề kiểm tra'
  );

  // Cognitive Ratio Configuration State (Nhận biết, Thông hiểu, Vận dụng)
  const [cognitiveRatio, setCognitiveRatio] = useState<CognitiveRatioConfig>(
    editingMatrix?.cognitiveRatioConfig || {
      knowPct: 40,
      compPct: 30,
      appPct: 30,
      isAutoBalanced: false,
      presetId: 'preset-a',
    }
  );

  // Mobile View Mode toggle: cards vs full table
  const [mobileViewMode, setMobileViewMode] = useState<'cards' | 'table'>('cards');

  // Matrix Table Cells
  const [cells, setCells] = useState<MatrixCell[]>(
    editingMatrix?.cells?.length
      ? editingMatrix.cells
      : [
          {
            id: 'c-1',
            topic: '1. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
            learningOutcome: 'Nhận biết tính đơn điệu, cực trị, giá trị lớn nhất - nhỏ nhất',
            cognitiveLevel: 'nhan_biet',
            questionType: 'multiple_choice',
            questionCount: 8,
            pointsPerQuestion: 0.25,
            totalPoints: 2.0,
          },
          {
            id: 'c-2',
            topic: '1. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
            learningOutcome: 'Thông hiểu bảng biến thiên, đồ thị và tiệm cận',
            cognitiveLevel: 'thong_hieu',
            questionType: 'multiple_choice',
            questionCount: 4,
            pointsPerQuestion: 0.25,
            totalPoints: 1.0,
          },
          {
            id: 'c-3',
            topic: '1. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
            learningOutcome: 'Phân tích tính chất hàm số đúng/sai',
            cognitiveLevel: 'thong_hieu',
            questionType: 'true_false',
            questionCount: 2,
            pointsPerQuestion: 1.0,
            totalPoints: 2.0,
          },
          {
            id: 'c-4',
            topic: '2. Toạ độ của vectơ trong không gian Oxyz',
            learningOutcome: 'Nhận biết toạ độ điểm, toạ độ vectơ, tích vô hướng',
            cognitiveLevel: 'nhan_biet',
            questionType: 'true_false',
            questionCount: 1,
            pointsPerQuestion: 1.0,
            totalPoints: 1.0,
          },
          {
            id: 'c-5',
            topic: '1. Ứng dụng đạo hàm trong thực tiễn',
            learningOutcome: 'Vận dụng giải bài toán tối ưu thực tế (kinh tế, dung tích)',
            cognitiveLevel: 'van_dung',
            questionType: 'short_answer',
            questionCount: 4,
            pointsPerQuestion: 0.5,
            totalPoints: 2.0,
          },
          {
            id: 'c-6',
            topic: '2. Toạ độ vectơ và bài toán không gian thực tế',
            learningOutcome: 'Gắn hệ trục toạ độ không gian giải quyết công trình kiến trúc',
            cognitiveLevel: 'van_dung',
            questionType: 'essay',
            questionCount: 1,
            pointsPerQuestion: 2.0,
            totalPoints: 2.0,
          },
        ]
  );

  // Sync if editingMatrix prop changes
  useEffect(() => {
    if (editingMatrix) {
      setMatrixId(editingMatrix.id);
      setTitle(editingMatrix.title);
      setGrade(editingMatrix.grade);
      setAcademicYear(editingMatrix.academicYear);
      setSemester(editingMatrix.semester);
      setSubject(editingMatrix.subject);
      setIssuingUnit(editingMatrix.issuingUnit);
      setDurationMinutes(editingMatrix.durationMinutes);
      setTargetTotalPoints(editingMatrix.totalPoints);
      setAuthorName(editingMatrix.authorName || currentUser.fullName);
      setNotes(editingMatrix.notes || '');
      setCells(editingMatrix.cells || []);
      if (editingMatrix.cognitiveRatioConfig) {
        setCognitiveRatio(editingMatrix.cognitiveRatioConfig);
      }
    }
  }, [editingMatrix, currentUser]);

  // Real-time calculations
  const totalQuestions = useMemo(
    () => cells.reduce((sum, c) => sum + (Number(c.questionCount) || 0), 0),
    [cells]
  );
  const totalCalculatedPoints = useMemo(
    () => cells.reduce((sum, c) => sum + (Number(c.totalPoints) || 0), 0),
    [cells]
  );

  const cognitiveBreakdown = useMemo(() => {
    let knowCount = 0;
    let knowPts = 0;
    let compCount = 0;
    let compPts = 0;
    let appCount = 0;
    let appPts = 0;

    cells.forEach(c => {
      const cnt = Number(c.questionCount) || 0;
      const pts = Number(c.totalPoints) || 0;
      if (c.cognitiveLevel === 'nhan_biet') {
        knowCount += cnt;
        knowPts += pts;
      } else if (c.cognitiveLevel === 'thong_hieu') {
        compCount += cnt;
        compPts += pts;
      } else {
        appCount += cnt;
        appPts += pts;
      }
    });

    const totalPts = totalCalculatedPoints || 1;
    return {
      knowCount,
      knowPts,
      knowPct: Math.round((knowPts / totalPts) * 100),
      compCount,
      compPts,
      compPct: Math.round((compPts / totalPts) * 100),
      appCount,
      appPts,
      appPct: Math.round((appPts / totalPts) * 100),
    };
  }, [cells, totalCalculatedPoints]);

  // Points difference validation
  const pointsDifference = Math.round((totalCalculatedPoints - targetTotalPoints) * 100) / 100;
  const isPointsBalanced = Math.abs(pointsDifference) < 0.01;

  // Add Row
  const handleAddRow = () => {
    playSound('click');
    const availableTopics = MATH_TOPICS_BY_GRADE[grade] || [];
    const newCell: MatrixCell = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      topic: availableTopics[0] || 'Chủ đề mới',
      learningOutcome: 'Yêu cầu cần đạt chuẩn kiến thức kỹ năng',
      cognitiveLevel: 'nhan_biet',
      questionType: 'multiple_choice',
      questionCount: 4,
      pointsPerQuestion: 0.25,
      totalPoints: 1.0,
    };
    setCells([...cells, newCell]);
  };

  // Remove Row
  const handleRemoveRow = (id: string) => {
    playSound('click');
    setCells(cells.filter(c => c.id !== id));
  };

  // Update Row
  const handleUpdateRow = (id: string, field: keyof MatrixCell, value: any) => {
    setCells(
      cells.map(c => {
        if (c.id !== id) return c;
        const updated = { ...c, [field]: value };

        // Automatically update points
        if (field === 'questionType') {
          if (value === 'multiple_choice') updated.pointsPerQuestion = 0.25;
          else if (value === 'true_false') updated.pointsPerQuestion = 1.0;
          else if (value === 'short_answer') updated.pointsPerQuestion = 0.5;
          else if (value === 'essay') updated.pointsPerQuestion = 2.0;
          updated.totalPoints =
            Math.round(updated.questionCount * updated.pointsPerQuestion * 100) / 100;
        } else if (field === 'questionCount' || field === 'pointsPerQuestion') {
          const cnt = field === 'questionCount' ? Number(value) : updated.questionCount;
          const p = field === 'pointsPerQuestion' ? Number(value) : updated.pointsPerQuestion;
          updated.totalPoints = Math.round(cnt * p * 100) / 100;
        }

        return updated;
      })
    );
  };

  // Load Preset Template
  const handleLoadTemplate = (targetGrade: 10 | 11 | 12) => {
    playSound('click');
    setGrade(targetGrade);
    setTitle(`Ma trận Đề kiểm tra Giữa học kỳ I - Toán ${targetGrade} (Chuẩn CV 7991)`);
    if (targetGrade === 12) {
      setCells([
        {
          id: 'c-12-1',
          topic: '1. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
          learningOutcome: 'Nhận biết tính đơn điệu, cực trị, giá trị lớn nhất - nhỏ nhất',
          cognitiveLevel: 'nhan_biet',
          questionType: 'multiple_choice',
          questionCount: 8,
          pointsPerQuestion: 0.25,
          totalPoints: 2.0,
        },
        {
          id: 'c-12-2',
          topic: '1. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
          learningOutcome: 'Thông hiểu bảng biến thiên, đồ thị và tiệm cận',
          cognitiveLevel: 'thong_hieu',
          questionType: 'multiple_choice',
          questionCount: 4,
          pointsPerQuestion: 0.25,
          totalPoints: 1.0,
        },
        {
          id: 'c-12-3',
          topic: '1. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
          learningOutcome: 'Phân tích hàm số theo định dạng Đúng/Sai 4 ý',
          cognitiveLevel: 'thong_hieu',
          questionType: 'true_false',
          questionCount: 2,
          pointsPerQuestion: 1.0,
          totalPoints: 2.0,
        },
        {
          id: 'c-12-4',
          topic: '2. Toạ độ của vectơ trong không gian Oxyz',
          learningOutcome: 'Nhận biết toạ độ điểm, toạ độ vectơ, tích vô hướng',
          cognitiveLevel: 'nhan_biet',
          questionType: 'true_false',
          questionCount: 1,
          pointsPerQuestion: 1.0,
          totalPoints: 1.0,
        },
        {
          id: 'c-12-5',
          topic: '1. Ứng dụng đạo hàm trong thực tiễn',
          learningOutcome: 'Vận dụng giải bài toán tối ưu thực tế (kinh tế, dung tích)',
          cognitiveLevel: 'van_dung',
          questionType: 'short_answer',
          questionCount: 4,
          pointsPerQuestion: 0.5,
          totalPoints: 2.0,
        },
        {
          id: 'c-12-6',
          topic: '2. Toạ độ vectơ và bài toán không gian thực tế',
          learningOutcome: 'Gắn hệ trục toạ độ không gian giải quyết công trình kiến trúc',
          cognitiveLevel: 'van_dung',
          questionType: 'essay',
          questionCount: 1,
          pointsPerQuestion: 2.0,
          totalPoints: 2.0,
        },
      ]);
    } else if (targetGrade === 11) {
      setCells([
        {
          id: 'c-11-1',
          topic: '1. Hàm số lượng giác và phương trình lượng giác',
          learningOutcome: 'Công thức biến đổi, chu kỳ và phương trình cơ bản',
          cognitiveLevel: 'nhan_biet',
          questionType: 'multiple_choice',
          questionCount: 12,
          pointsPerQuestion: 0.25,
          totalPoints: 3.0,
        },
        {
          id: 'c-11-2',
          topic: '2. Dãy số, Cấp số cộng và Cấp số nhân',
          learningOutcome: 'Số hạng tổng quát, công sai, công bội và tổng n số hạng',
          cognitiveLevel: 'thong_hieu',
          questionType: 'true_false',
          questionCount: 2,
          pointsPerQuestion: 1.0,
          totalPoints: 2.0,
        },
        {
          id: 'c-11-3',
          topic: '3. Quan hệ song song trong không gian',
          learningOutcome: 'Giao tuyến, vị trí tương đối và thiết diện song song',
          cognitiveLevel: 'thong_hieu',
          questionType: 'true_false',
          questionCount: 1,
          pointsPerQuestion: 1.0,
          totalPoints: 1.0,
        },
        {
          id: 'c-11-4',
          topic: '4. Ứng dụng lượng giác & cấp số',
          learningOutcome: 'Bài toán thực tế lãi kép và dao động điều hòa',
          cognitiveLevel: 'van_dung',
          questionType: 'short_answer',
          questionCount: 4,
          pointsPerQuestion: 0.5,
          totalPoints: 2.0,
        },
        {
          id: 'c-11-5',
          topic: '5. Hình học không gian tổng hợp',
          learningOutcome: 'Chứng minh quan hệ song song và xác định thiết diện',
          cognitiveLevel: 'van_dung',
          questionType: 'essay',
          questionCount: 1,
          pointsPerQuestion: 2.0,
          totalPoints: 2.0,
        },
      ]);
    } else {
      setCells([
        {
          id: 'c-10-1',
          topic: '1. Mệnh đề toán học và Tập hợp',
          learningOutcome: 'Mệnh đề đúng/sai, phủ định, các phép toán tập hợp',
          cognitiveLevel: 'nhan_biet',
          questionType: 'multiple_choice',
          questionCount: 12,
          pointsPerQuestion: 0.25,
          totalPoints: 3.0,
        },
        {
          id: 'c-10-2',
          topic: '2. Bất phương trình và hệ bất phương trình bậc nhất hai ẩn',
          learningOutcome: 'Biểu diễn miền nghiệm và tìm giá trị lớn nhất/nhỏ nhất F(x,y)',
          cognitiveLevel: 'thong_hieu',
          questionType: 'true_false',
          questionCount: 2,
          pointsPerQuestion: 1.0,
          totalPoints: 2.0,
        },
        {
          id: 'c-10-3',
          topic: '3. Hệ thức lượng trong tam giác',
          learningOutcome: 'Định lí côsin, sin và công thức tính diện tích',
          cognitiveLevel: 'thong_hieu',
          questionType: 'true_false',
          questionCount: 1,
          pointsPerQuestion: 1.0,
          totalPoints: 1.0,
        },
        {
          id: 'c-10-4',
          topic: '4. Vectơ và các phép toán',
          learningOutcome: 'Tích vô hướng và ứng dụng hình học thực tế',
          cognitiveLevel: 'van_dung',
          questionType: 'short_answer',
          questionCount: 4,
          pointsPerQuestion: 0.5,
          totalPoints: 2.0,
        },
        {
          id: 'c-10-5',
          topic: '5. Tối ưu hoá quy hoạch tuyến tính',
          learningOutcome: 'Lập mô hình toán học giải quyết bài toán kinh tế',
          cognitiveLevel: 'van_dung',
          questionType: 'essay',
          questionCount: 1,
          pointsPerQuestion: 2.0,
          totalPoints: 2.0,
        },
      ]);
    }
  };

  // Save Matrix
  const handleSave = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tên ma trận.');
      return;
    }
    if (cells.length === 0) {
      alert('Vui lòng thêm ít nhất một dòng trong ma trận.');
      return;
    }

    const totalRatio =
      Number(cognitiveRatio.knowPct) +
      Number(cognitiveRatio.compPct) +
      Number(cognitiveRatio.appPct);
    if (totalRatio !== 100) {
      alert(
        `Tổng tỉ lệ hiện tại là ${totalRatio}%. Vui lòng điều chỉnh về 100% trước khi lưu ma trận.`
      );
      return;
    }

    playSound('correct');
    const newMatrixDoc: MatrixDocument = {
      id: matrixId,
      title: title.trim(),
      academicYear,
      grade,
      semester,
      subject,
      curriculum: 'Kết nối tri thức với cuộc sống (CV 7991/BGDĐT-GDTrH)',
      issuingUnit: issuingUnit.trim(),
      sourceDocument: notes.trim(),
      isVerified: true,
      durationMinutes,
      totalPoints: targetTotalPoints,
      examType,
      authorName,
      notes,
      cognitiveRatioConfig: cognitiveRatio,
      cells,
      createdAt: editingMatrix?.createdAt || new Date().toISOString().substring(0, 10),
      updatedAt: new Date().toISOString().substring(0, 10),
    };

    StorageService.saveMatrix(newMatrixDoc);
    onSaved(newMatrixDoc);
  };

  // Export Word
  const handleExportWord = () => {
    playSound('click');
    const tableRowsHtml = cells
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
            <strong>${issuingUnit.toUpperCase()}</strong><br/>
            <strong>TỔ BỘ MÔN ${subject.toUpperCase()}</strong>
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
        Môn: ${subject} - Khối ${grade} | Năm học: ${academicYear} | Thời gian: ${durationMinutes} phút | Tổng điểm: ${targetTotalPoints}
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
      <p style="margin-top: 20px;">
        <strong>Phân bố mức độ nhận thức:</strong> Nhận biết: ${cognitiveBreakdown.knowPts} đ (${cognitiveBreakdown.knowPct}%) | 
        Thông hiểu: ${cognitiveBreakdown.compPts} đ (${cognitiveBreakdown.compPct}%) | 
        Vận dụng: ${cognitiveBreakdown.appPts} đ (${cognitiveBreakdown.appPct}%)
      </p>
    `;
    downloadWordDocument(`MaTran_${grade}_${semester}`, title, html);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            {editingMatrix ? 'Chỉnh sửa ma trận' : 'Thiết kế mới'}
          </span>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mt-0.5">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            Thiết kế ma trận đề kiểm tra trực tiếp
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Tính toán tự động thời gian thực số câu, số điểm, tỉ lệ % nhận thức chuẩn GDPT 2018
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <span className="px-2 font-semibold text-slate-600">Nạp mẫu:</span>
            <button
              onClick={() => handleLoadTemplate(12)}
              className="px-2 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 rounded font-medium text-slate-700 transition-colors shadow-2xs"
            >
              Toán 12
            </button>
            <button
              onClick={() => handleLoadTemplate(11)}
              className="px-2 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 rounded font-medium text-slate-700 transition-colors shadow-2xs"
            >
              Toán 11
            </button>
            <button
              onClick={() => handleLoadTemplate(10)}
              className="px-2 py-1 bg-white hover:bg-indigo-50 hover:text-indigo-600 rounded font-medium text-slate-700 transition-colors shadow-2xs"
            >
              Toán 10
            </button>
          </div>

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
            Lưu ma trận
          </button>
        </div>
      </div>

      {/* Section 2.1: General Information */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Info className="w-5 h-5 text-indigo-600" />
          1. Thông tin chung của Ma trận
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tên ma trận đề kiểm tra <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              placeholder="Ví dụ: Ma trận Đề kiểm tra Giữa học kỳ I - Toán 12"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Loại kiểm tra</label>
            <select
              value={examType}
              onChange={e => setExamType(e.target.value as ExamType)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {EXAM_TYPE_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Khối lớp</label>
            <select
              value={grade}
              onChange={e => {
                const g = Number(e.target.value) as 10 | 11 | 12;
                setGrade(g);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="12">Lớp 12 (GDPT 2018)</option>
              <option value="11">Lớp 11 (GDPT 2018)</option>
              <option value="10">Lớp 10 (GDPT 2018)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Năm học</label>
            <select
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="2025-2026">2025-2026 (Chính thức)</option>
              <option value="2026-2027">2026-2027 (Kế hoạch)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Học kỳ</label>
            <select
              value={semester}
              onChange={e => setSemester(e.target.value as any)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="GKI">Giữa học kỳ I (GKI)</option>
              <option value="CKI">Cuối học kỳ I (CKI)</option>
              <option value="GKII">Giữa học kỳ II (GKII)</option>
              <option value="CKII">Cuối học kỳ II (CKII)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Thời gian làm bài (phút)
            </label>
            <input
              type="number"
              value={durationMinutes}
              onChange={e => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tổng điểm thang đo
            </label>
            <input
              type="number"
              step="0.5"
              value={targetTotalPoints}
              onChange={e => setTargetTotalPoints(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Người biên soạn
            </label>
            <input
              type="text"
              value={authorName}
              onChange={e => setAuthorName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Trường / Đơn vị ban hành & Căn cứ công văn
            </label>
            <input
              type="text"
              value={issuingUnit}
              onChange={e => setIssuingUnit(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Thiết lập Tỉ lệ Mức độ Nhận thức (Nhận biết - Thông hiểu - Vận dụng) */}
      <CognitiveRatioConfigurator
        currentUser={currentUser}
        targetTotalPoints={targetTotalPoints}
        currentCells={cells}
        grade={grade}
        examType={examType}
        initialRatio={cognitiveRatio}
        onRatioChange={setCognitiveRatio}
        onApplyAutoDistribution={newCells => {
          setCells(newCells);
          playSound('correct');
        }}
      />

      {/* Real-time Statistics & Target vs Actual Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Questions & Points */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Tổng câu & Tổng điểm</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-800">{totalQuestions}</span>
            <span className="text-xs text-slate-500">câu</span>
            <span className="text-slate-300 font-bold">/</span>
            <span
              className={`text-2xl font-bold ${
                isPointsBalanced ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {totalCalculatedPoints.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500">/ {targetTotalPoints} đ</span>
          </div>
          {!isPointsBalanced && (
            <div className="flex items-center gap-1 text-xs text-rose-600 mt-2 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {pointsDifference > 0
                ? `Thừa ${pointsDifference} điểm`
                : `Thiếu ${Math.abs(pointsDifference)} điểm`}
            </div>
          )}
          {isPointsBalanced && (
            <div className="flex items-center gap-1 text-xs text-emerald-600 mt-2 font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Tổng điểm khớp chuẩn {targetTotalPoints} đ
            </div>
          )}
        </div>

        {/* Nhận biết */}
        <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100">
          <div className="flex justify-between items-center text-xs font-semibold text-sky-700">
            <span>Mức độ: Nhận biết</span>
            <span className="font-bold text-sm">
              {cognitiveBreakdown.knowPct}%{' '}
              <span className="text-[10px] text-sky-600 font-normal">
                (MT: {cognitiveRatio.knowPct}%)
              </span>
            </span>
          </div>
          <div className="mt-2 text-slate-800 font-bold text-lg">
            {cognitiveBreakdown.knowPts.toFixed(2)} điểm
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 mt-0.5">
            <span>{cognitiveBreakdown.knowCount} câu hỏi</span>
            <span>MT: {((targetTotalPoints * cognitiveRatio.knowPct) / 100).toFixed(2)} đ</span>
          </div>
        </div>

        {/* Thông hiểu */}
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100">
          <div className="flex justify-between items-center text-xs font-semibold text-amber-700">
            <span>Mức độ: Thông hiểu</span>
            <span className="font-bold text-sm">
              {cognitiveBreakdown.compPct}%{' '}
              <span className="text-[10px] text-amber-600 font-normal">
                (MT: {cognitiveRatio.compPct}%)
              </span>
            </span>
          </div>
          <div className="mt-2 text-slate-800 font-bold text-lg">
            {cognitiveBreakdown.compPts.toFixed(2)} điểm
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 mt-0.5">
            <span>{cognitiveBreakdown.compCount} câu hỏi</span>
            <span>MT: {((targetTotalPoints * cognitiveRatio.compPct) / 100).toFixed(2)} đ</span>
          </div>
        </div>

        {/* Vận dụng */}
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
          <div className="flex justify-between items-center text-xs font-semibold text-emerald-700">
            <span>Mức độ: Vận dụng</span>
            <span className="font-bold text-sm">
              {cognitiveBreakdown.appPct}%{' '}
              <span className="text-[10px] text-emerald-600 font-normal">
                (MT: {cognitiveRatio.appPct}%)
              </span>
            </span>
          </div>
          <div className="mt-2 text-slate-800 font-bold text-lg">
            {cognitiveBreakdown.appPts.toFixed(2)} điểm
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 mt-0.5">
            <span>{cognitiveBreakdown.appCount} câu hỏi</span>
            <span>MT: {((targetTotalPoints * cognitiveRatio.appPct) / 100).toFixed(2)} đ</span>
          </div>
        </div>
      </div>

      {/* Target vs Actual Comparison Guidance */}
      <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-slate-700 flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <div>
            <strong>Cấu hình tỉ lệ mục tiêu giáo viên thiết lập:</strong>{' '}
            <span className="font-semibold text-indigo-700">
              {cognitiveRatio.knowPct}% Nhận biết (
              {((targetTotalPoints * cognitiveRatio.knowPct) / 100).toFixed(2)}đ) –{' '}
              {cognitiveRatio.compPct}% Thông hiểu (
              {((targetTotalPoints * cognitiveRatio.compPct) / 100).toFixed(2)}đ) –{' '}
              {cognitiveRatio.appPct}% Vận dụng (
              {((targetTotalPoints * cognitiveRatio.appPct) / 100).toFixed(2)}đ)
            </span>
            .
          </div>
          <div className="mt-1 text-slate-600">
            Thực tế ma trận hiện tại:{' '}
            <span className="font-medium text-slate-800">
              {cognitiveBreakdown.knowPct}% – {cognitiveBreakdown.compPct}% –{' '}
              {cognitiveBreakdown.appPct}%
            </span>{' '}
            ({cognitiveBreakdown.knowPts.toFixed(2)}đ – {cognitiveBreakdown.compPts.toFixed(2)}đ –{' '}
            {cognitiveBreakdown.appPts.toFixed(2)}đ).
            {Math.abs(cognitiveBreakdown.knowPct - cognitiveRatio.knowPct) <= 2 &&
            Math.abs(cognitiveBreakdown.compPct - cognitiveRatio.compPct) <= 2 &&
            Math.abs(cognitiveBreakdown.appPct - cognitiveRatio.appPct) <= 2 ? (
              <span className="ml-1.5 inline-flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 inline" /> Khớp hoàn hảo với tỉ lệ mục tiêu!
              </span>
            ) : (
              <span className="ml-1.5 text-slate-500">
                (Có thể dùng nút "Tự động phân bổ câu hỏi" ở trên để cân đối chính xác theo tỉ lệ)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Section 2.2: Interactive Matrix Table / Cards */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            2. Bảng phân bố ma trận chi tiết ({cells.length} dòng)
          </h3>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle for Responsive Editing */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMobileViewMode('cards')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  mobileViewMode === 'cards'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📱 Dạng thẻ
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('table')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  mobileViewMode === 'table'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 Dạng bảng
              </button>
            </div>

            <button
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Thêm dòng
            </button>
          </div>
        </div>

        {/* Mode 1: Mobile Card View */}
        {mobileViewMode === 'cards' && (
          <div className="space-y-3">
            {cells.map((cell, idx) => (
              <div 
                key={cell.id} 
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 transition-colors shadow-2xs space-y-3"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800 line-clamp-1">
                      {cell.topic || 'Chủ đề chưa đặt tên'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveRow(cell.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Xoá dòng này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Topic field */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Chủ đề / Mạch kiến thức
                  </label>
                  <input
                    type="text"
                    list={`topics-grade-${grade}`}
                    value={cell.topic}
                    onChange={e => handleUpdateRow(cell.id, 'topic', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                    placeholder="Chọn hoặc nhập chủ đề..."
                  />
                  <datalist id={`topics-grade-${grade}`}>
                    {(MATH_TOPICS_BY_GRADE[grade] || []).map((t, i) => (
                      <option key={i} value={t} />
                    ))}
                  </datalist>
                </div>

                {/* Learning Outcome field */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Yêu cầu cần đạt
                  </label>
                  <input
                    type="text"
                    value={cell.learningOutcome}
                    onChange={e => handleUpdateRow(cell.id, 'learningOutcome', e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Mô tả yêu cầu cần đạt..."
                  />
                </div>

                {/* Cognitive Level & Question Type in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Mức độ nhận thức
                    </label>
                    <select
                      value={cell.cognitiveLevel}
                      onChange={e => handleUpdateRow(cell.id, 'cognitiveLevel', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-medium"
                    >
                      <option value="nhan_biet">Nhận biết</option>
                      <option value="thong_hieu">Thông hiểu</option>
                      <option value="van_dung">Vận dụng</option>
                      <option value="van_dung_cao">Vận dụng cao</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Hình thức câu hỏi
                    </label>
                    <select
                      value={cell.questionType}
                      onChange={e => handleUpdateRow(cell.id, 'questionType', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                    >
                      <option value="multiple_choice">Trắc nghiệm (4 lựa chọn)</option>
                      <option value="true_false">Đúng / Sai (4 ý a,b,c,d)</option>
                      <option value="short_answer">Trả lời ngắn</option>
                      <option value="essay">Tự luận</option>
                    </select>
                  </div>
                </div>

                {/* Numbers: Count, Points per question, Total Points in 3 columns */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
                  <div>
                    <span className="block text-[10px] text-slate-500">Số câu</span>
                    <input
                      type="number"
                      min="0"
                      value={cell.questionCount}
                      onChange={e => handleUpdateRow(cell.id, 'questionCount', Number(e.target.value))}
                      className="w-full max-w-[64px] mx-auto mt-1 px-1 py-1 text-xs font-bold text-center border border-slate-300 rounded bg-white"
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500">Điểm / câu</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={cell.pointsPerQuestion}
                      onChange={e => handleUpdateRow(cell.id, 'pointsPerQuestion', Number(e.target.value))}
                      className="w-full max-w-[64px] mx-auto mt-1 px-1 py-1 text-xs font-medium text-center border border-slate-300 rounded bg-white"
                    />
                  </div>

                  <div>
                    <span className="block text-[10px] text-slate-500">Tổng điểm</span>
                    <div className="mt-1 py-1 text-xs font-extrabold text-indigo-700">
                      {cell.totalPoints.toFixed(2)} đ
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mode 2: Full Table View (with horizontal scroll) */}
        {mobileViewMode === 'table' && (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-sm text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                  <th className="p-3 border-b text-center w-12">TT</th>
                  <th className="p-3 border-b min-w-[200px]">Chủ đề / Mạch kiến thức</th>
                  <th className="p-3 border-b min-w-[220px]">Yêu cầu cần đạt</th>
                  <th className="p-3 border-b w-32">Mức độ</th>
                  <th className="p-3 border-b w-40">Hình thức</th>
                  <th className="p-3 border-b text-center w-20">Số câu</th>
                  <th className="p-3 border-b text-center w-20">Điểm/câu</th>
                  <th className="p-3 border-b text-center w-24">Tổng điểm</th>
                  <th className="p-3 border-b text-center w-12">Xoá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {cells.map((cell, idx) => (
                  <tr key={cell.id} className="hover:bg-slate-50/70">
                    <td className="p-3 text-center text-slate-400 font-semibold">{idx + 1}</td>

                    {/* Topic */}
                    <td className="p-2">
                      <input
                        type="text"
                        list={`topics-grade-${grade}`}
                        value={cell.topic}
                        onChange={e => handleUpdateRow(cell.id, 'topic', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                        placeholder="Chọn hoặc nhập chủ đề..."
                      />
                    </td>

                    {/* Learning Outcome */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={cell.learningOutcome}
                        onChange={e => handleUpdateRow(cell.id, 'learningOutcome', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Mô tả yêu cầu cần đạt..."
                      />
                    </td>

                    {/* Cognitive Level */}
                    <td className="p-2">
                      <select
                        value={cell.cognitiveLevel}
                        onChange={e => handleUpdateRow(cell.id, 'cognitiveLevel', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 font-medium"
                      >
                        <option value="nhan_biet">Nhận biết</option>
                        <option value="thong_hieu">Thông hiểu</option>
                        <option value="van_dung">Vận dụng</option>
                        <option value="van_dung_cao">Vận dụng cao</option>
                      </select>
                    </td>

                    {/* Question Type */}
                    <td className="p-2">
                      <select
                        value={cell.questionType}
                        onChange={e => handleUpdateRow(cell.id, 'questionType', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded border border-slate-300"
                      >
                        <option value="multiple_choice">Trắc nghiệm</option>
                        <option value="true_false">Đúng / Sai</option>
                        <option value="short_answer">Trả lời ngắn</option>
                        <option value="essay">Tự luận</option>
                      </select>
                    </td>

                    {/* Question Count */}
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min="0"
                        value={cell.questionCount}
                        onChange={e => handleUpdateRow(cell.id, 'questionCount', Number(e.target.value))}
                        className="w-14 px-1.5 py-1.5 text-xs rounded border border-slate-300 text-center font-bold"
                      />
                    </td>

                    {/* Points per question */}
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        value={cell.pointsPerQuestion}
                        onChange={e =>
                          handleUpdateRow(cell.id, 'pointsPerQuestion', Number(e.target.value))
                        }
                        className="w-14 px-1.5 py-1.5 text-xs rounded border border-slate-300 text-center font-medium"
                      />
                    </td>

                    {/* Total points */}
                    <td className="p-2 text-center">
                      <span className="font-bold text-indigo-600 text-xs">
                        {cell.totalPoints.toFixed(2)} đ
                      </span>
                    </td>

                    {/* Delete Button */}
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleRemoveRow(cell.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Xoá dòng này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/90 font-bold text-slate-800 text-xs">
                  <td colSpan={5} className="p-3 text-right">
                    TỔNG CỘNG TOÀN MA TRẬN:
                  </td>
                  <td className="p-3 text-center text-sm">{totalQuestions} câu</td>
                  <td className="p-3 text-center">-</td>
                  <td
                    className={`p-3 text-center text-sm ${
                      isPointsBalanced ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {totalCalculatedPoints.toFixed(2)} đ
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Footer Navigation Next Step */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Lưu ý: Sau khi lưu ma trận, bạn có thể chuyển thẳng sang tạo Bản đặc tả chi tiết.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              Lưu ma trận
            </button>
            <button
              onClick={() => {
                handleSave();
                onGoToSpec(matrixId);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              Lập Bản đặc tả cho ma trận này
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
