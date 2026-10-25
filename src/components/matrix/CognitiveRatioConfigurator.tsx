import React, { useState, useEffect, useMemo } from 'react';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Sparkles,
  BookOpen,
  Info,
  Trash2,
  Bookmark,
  Layers,
  ChevronDown,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { CognitiveRatioPreset, CognitiveRatioConfig, MatrixCell, User } from '../../types';
import { StorageService } from '../../services/storage';
import { playSound } from '../../services/sound';

interface CognitiveRatioConfiguratorProps {
  currentUser: User;
  targetTotalPoints: number;
  currentCells: MatrixCell[];
  grade: number;
  examType: string;
  initialRatio?: CognitiveRatioConfig;
  onRatioChange: (config: CognitiveRatioConfig) => void;
  onApplyAutoDistribution?: (newCells: MatrixCell[]) => void;
}

export const CognitiveRatioConfigurator: React.FC<CognitiveRatioConfiguratorProps> = ({
  currentUser,
  targetTotalPoints,
  currentCells,
  grade,
  examType,
  initialRatio,
  onRatioChange,
  onApplyAutoDistribution,
}) => {
  // Target percentages (0 - 100)
  const [knowPct, setKnowPct] = useState<number>(initialRatio?.knowPct ?? 40);
  const [compPct, setCompPct] = useState<number>(initialRatio?.compPct ?? 30);
  const [appPct, setAppPct] = useState<number>(initialRatio?.appPct ?? 30);

  // Auto-balance toggle: false by default per requirement (do not change other ratios unless enabled)
  const [isAutoBalance, setIsAutoBalance] = useState<boolean>(initialRatio?.isAutoBalanced ?? false);

  // Active preset tracker
  const [activePresetId, setActivePresetId] = useState<string>(initialRatio?.presetId ?? 'preset-a');

  // Presets list from storage
  const [presets, setPresets] = useState<CognitiveRatioPreset[]>(StorageService.getCognitivePresets());
  const [presetCategory, setPresetCategory] = useState<'all' | 'reference' | 'teacher_personal' | 'department_approved'>('all');

  // Modal for saving personal preset
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDesc, setNewPresetDesc] = useState('');

  // Confirmation modal before smart distribution
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [distributionProposal, setDistributionProposal] = useState<{
    cells: MatrixCell[];
    actualPoints: { know: number; comp: number; app: number };
    discrepancy: { know: number; comp: number; app: number };
    notes: string[];
  } | null>(null);

  // Total Percentage
  const totalPct = knowPct + compPct + appPct;
  const isValidTotal = totalPct === 100;

  // Calculate actual points from matrix cells
  const actualPointsBreakdown = useMemo(() => {
    let knowPts = 0;
    let compPts = 0;
    let appPts = 0;

    currentCells.forEach((c) => {
      if (c.cognitiveLevel === 'nhan_biet') knowPts += c.totalPoints;
      else if (c.cognitiveLevel === 'thong_hieu') compPts += c.totalPoints;
      else appPts += c.totalPoints; // van_dung and van_dung_cao
    });

    const totalPts = currentCells.reduce((sum, c) => sum + c.totalPoints, 0) || 1;

    return {
      knowPts: Number(knowPts.toFixed(2)),
      knowPctActual: Math.round((knowPts / totalPts) * 100),
      compPts: Number(compPts.toFixed(2)),
      compPctActual: Math.round((compPts / totalPts) * 100),
      appPts: Number(appPts.toFixed(2)),
      appPctActual: Math.round((appPts / totalPts) * 100),
    };
  }, [currentCells]);

  // Target points calculated from targetTotalPoints
  const targetPoints = useMemo(() => {
    return {
      know: Number(((knowPct / 100) * targetTotalPoints).toFixed(2)),
      comp: Number(((compPct / 100) * targetTotalPoints).toFixed(2)),
      app: Number(((appPct / 100) * targetTotalPoints).toFixed(2)),
    };
  }, [knowPct, compPct, appPct, targetTotalPoints]);

  // Notify parent on change
  useEffect(() => {
    onRatioChange({
      knowPct,
      compPct,
      appPct,
      isAutoBalanced: isAutoBalance,
      presetId: activePresetId,
    });
  }, [knowPct, compPct, appPct, isAutoBalance, activePresetId, onRatioChange]);

  // Handle single ratio slider/input adjustment
  const handleUpdateLevel = (level: 'know' | 'comp' | 'app', rawValue: number) => {
    const value = Math.max(0, Math.min(100, Math.round(isNaN(rawValue) ? 0 : rawValue)));
    setActivePresetId('custom');

    if (!isAutoBalance) {
      // Direct independent update - no auto-changing other two
      if (level === 'know') setKnowPct(value);
      if (level === 'comp') setCompPct(value);
      if (level === 'app') setAppPct(value);
      return;
    }

    // Auto-balance mode: distribute remainder across other two levels
    const remainder = 100 - value;
    if (level === 'know') {
      const half1 = Math.round(remainder / 2);
      const half2 = remainder - half1;
      setKnowPct(value);
      setCompPct(Math.max(0, half1));
      setAppPct(Math.max(0, half2));
    } else if (level === 'comp') {
      const half1 = Math.round(remainder / 2);
      const half2 = remainder - half1;
      setCompPct(value);
      setKnowPct(Math.max(0, half1));
      setAppPct(Math.max(0, half2));
    } else {
      const half1 = Math.round(remainder / 2);
      const half2 = remainder - half1;
      setAppPct(value);
      setKnowPct(Math.max(0, half1));
      setCompPct(Math.max(0, half2));
    }
  };

  // Apply a preset
  const handleSelectPreset = (preset: CognitiveRatioPreset) => {
    playSound('click');
    setKnowPct(preset.knowPct);
    setCompPct(preset.compPct);
    setAppPct(preset.appPct);
    setActivePresetId(preset.id);
  };

  // Reset to initial
  const handleResetInitial = () => {
    playSound('click');
    setKnowPct(initialRatio?.knowPct ?? 40);
    setCompPct(initialRatio?.compPct ?? 30);
    setAppPct(initialRatio?.appPct ?? 30);
    setActivePresetId(initialRatio?.presetId ?? 'preset-a');
  };

  // Save personal preset
  const handleSavePersonalPreset = () => {
    if (!newPresetName.trim()) {
      alert('Vui lòng nhập tên cho mẫu cấu hình.');
      return;
    }
    if (!isValidTotal) {
      alert(`Tổng tỉ lệ hiện tại là ${totalPct}%. Vui lòng điều chỉnh về 100% trước khi lưu.`);
      return;
    }

    const newPreset: CognitiveRatioPreset = {
      id: `preset-teacher-${Date.now()}`,
      name: newPresetName.trim(),
      knowPct,
      compPct,
      appPct,
      type: 'teacher_personal',
      description: newPresetDesc.trim() || `Mẫu riêng của ${currentUser.fullName} (${knowPct}% - ${compPct}% - ${appPct}%)`,
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      subject: 'Toán học',
      grade,
      examType,
      createdAt: new Date().toISOString().substring(0, 10),
    };

    StorageService.saveCognitivePreset(newPreset);
    setPresets(StorageService.getCognitivePresets());
    setActivePresetId(newPreset.id);
    setShowSavePresetModal(false);
    setNewPresetName('');
    setNewPresetDesc('');
    playSound('correct');
  };

  // Delete personal preset
  const handleDeletePreset = (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xoá mẫu cấu hình "${name}"?`)) {
      StorageService.deleteCognitivePreset(id);
      setPresets(StorageService.getCognitivePresets());
      playSound('wrong');
    }
  };

  // Smart Distribution Generator
  const calculateSmartDistribution = () => {
    if (!isValidTotal) {
      alert(`Tổng tỉ lệ phải bằng 100% trước khi phân bổ câu hỏi. Hiện tại là ${totalPct}%.`);
      return;
    }

    // Target points for each cognitive level
    const targetKnow = targetPoints.know;
    const targetComp = targetPoints.comp;
    const targetApp = targetPoints.app;

    // High School Math topics by grade
    const topics = grade === 12
      ? [
          '1. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
          '2. Toạ độ của vectơ trong không gian Oxyz',
          '3. Các số đặc trưng đo mức độ phân tán của mẫu số liệu',
          '4. Nguyên hàm, tích phân và ứng dụng thực tiễn',
        ]
      : grade === 11
      ? [
          '1. Hàm số lượng giác và phương trình lượng giác',
          '2. Dãy số, cấp số cộng và cấp số nhân',
          '3. Giới hạn và hàm số liên tục',
          '4. Quan hệ song song và vuông góc trong không gian',
        ]
      : [
          '1. Mệnh đề toán học và tập hợp',
          '2. Bất phương trình bậc nhất hai ẩn',
          '3. Hàm số bậc hai và đồ thị parabol',
          '4. Hệ thức lượng trong tam giác và Vectơ',
        ];

    // Standard CV 7991 High School question distribution heuristic:
    // Multiple Choice: 0.25đ / câu
    // True / False: 1.00đ / câu (4 ý a,b,c,d)
    // Short Answer: 0.50đ / câu
    // Essay: 1.00đ - 2.00đ / câu
    const generatedCells: MatrixCell[] = [];
    const notes: string[] = [];

    // 1. Nhận biết (targetKnow points)
    // Primary format: Multiple choice (0.25đ) + maybe 1 True/False (1.0đ) if target >= 2.0
    let remainKnow = targetKnow;
    let knowMC = Math.floor(remainKnow / 0.25);
    if (remainKnow >= 2.0) {
      // 1 True/False (1.0đ) + remaining in MC
      generatedCells.push({
        id: `gen-know-tf-${Date.now()}`,
        topic: topics[1] || topics[0],
        learningOutcome: 'Nhận biết khái niệm, công thức và toạ độ cơ bản (dạng Đúng/Sai)',
        cognitiveLevel: 'nhan_biet',
        questionType: 'true_false',
        questionCount: 1,
        pointsPerQuestion: 1.0,
        totalPoints: 1.0,
      });
      remainKnow -= 1.0;
      knowMC = Math.floor(remainKnow / 0.25);
    }
    if (knowMC > 0) {
      generatedCells.push({
        id: `gen-know-mc-${Date.now()}`,
        topic: topics[0],
        learningOutcome: 'Nhận biết định nghĩa, tính chất, đọc bảng biến thiên và công thức',
        cognitiveLevel: 'nhan_biet',
        questionType: 'multiple_choice',
        questionCount: knowMC,
        pointsPerQuestion: 0.25,
        totalPoints: Number((knowMC * 0.25).toFixed(2)),
      });
    }

    // 2. Thông hiểu (targetComp points)
    let remainComp = targetComp;
    let compTF = 0;
    let compMC = 0;
    if (remainComp >= 2.0) {
      compTF = 2; // 2 câu True/False = 2.0đ
      remainComp -= 2.0;
    } else if (remainComp >= 1.0) {
      compTF = 1;
      remainComp -= 1.0;
    }
    if (compTF > 0) {
      generatedCells.push({
        id: `gen-comp-tf-${Date.now()}`,
        topic: topics[0],
        learningOutcome: 'Thông hiểu lập luận, xét tính đúng sai của khẳng định toán học',
        cognitiveLevel: 'thong_hieu',
        questionType: 'true_false',
        questionCount: compTF,
        pointsPerQuestion: 1.0,
        totalPoints: Number((compTF * 1.0).toFixed(2)),
      });
    }
    compMC = Math.floor(remainComp / 0.25);
    if (compMC > 0) {
      generatedCells.push({
        id: `gen-comp-mc-${Date.now()}`,
        topic: topics[1] || topics[0],
        learningOutcome: 'Thông hiểu kiến thức giải bài toán biến đổi và tính toán cơ bản',
        cognitiveLevel: 'thong_hieu',
        questionType: 'multiple_choice',
        questionCount: compMC,
        pointsPerQuestion: 0.25,
        totalPoints: Number((compMC * 0.25).toFixed(2)),
      });
    }

    // 3. Vận dụng (targetApp points)
    // Short answer (0.50đ) + Essay (1.0 - 2.0đ)
    let remainApp = targetApp;
    let appShort = 0;
    let appEssay = 0;
    if (remainApp >= 2.0) {
      appEssay = 1;
      remainApp -= 2.0;
    }
    if (appEssay > 0) {
      generatedCells.push({
        id: `gen-app-essay-${Date.now()}`,
        topic: topics[topics.length - 1] || topics[0],
        learningOutcome: 'Vận dụng giải bài toán mô hình hoá thực tế, trình bày lập luận tự luận',
        cognitiveLevel: 'van_dung',
        questionType: 'essay',
        questionCount: 1,
        pointsPerQuestion: 2.0,
        totalPoints: 2.0,
      });
    }
    appShort = Math.floor(remainApp / 0.5);
    if (appShort > 0) {
      generatedCells.push({
        id: `gen-app-short-${Date.now()}`,
        topic: topics[0],
        learningOutcome: 'Vận dụng giải quyết bài toán tối ưu, tìm giá trị tham số (trả lời ngắn)',
        cognitiveLevel: 'van_dung',
        questionType: 'short_answer',
        questionCount: appShort,
        pointsPerQuestion: 0.5,
        totalPoints: Number((appShort * 0.5).toFixed(2)),
      });
      remainApp -= appShort * 0.5;
    }

    // Calculate actual points achieved in proposal
    let pKnow = 0;
    let pComp = 0;
    let pApp = 0;
    generatedCells.forEach(c => {
      if (c.cognitiveLevel === 'nhan_biet') pKnow += c.totalPoints;
      else if (c.cognitiveLevel === 'thong_hieu') pComp += c.totalPoints;
      else pApp += c.totalPoints;
    });

    const discKnow = Number((pKnow - targetKnow).toFixed(2));
    const discComp = Number((pComp - targetComp).toFixed(2));
    const discApp = Number((pApp - targetApp).toFixed(2));

    if (Math.abs(discKnow) > 0 || Math.abs(discComp) > 0 || Math.abs(discApp) > 0) {
      notes.push(
        `Do bước nhảy điểm của các dạng câu hỏi (Trắc nghiệm: 0.25đ, Đúng/Sai: 1.0đ, Trả lời ngắn: 0.5đ, Tự luận: 2.0đ), tỉ lệ thực tế có độ chênh nhỏ so với tỉ lệ phần trăm mục tiêu. Hệ thống đã tối ưu phương án phân bổ gần nhất.`
      );
    } else {
      notes.push('Cấu trúc câu hỏi phân bổ hoàn toàn chính xác với tỉ lệ điểm mục tiêu 100%.');
    }

    setDistributionProposal({
      cells: generatedCells,
      actualPoints: { know: Number(pKnow.toFixed(2)), comp: Number(pComp.toFixed(2)), app: Number(pApp.toFixed(2)) },
      discrepancy: { know: discKnow, comp: discComp, app: discApp },
      notes,
    });
    setShowDistributionModal(true);
    playSound('notification');
  };

  const handleConfirmDistribution = () => {
    if (!distributionProposal || !onApplyAutoDistribution) return;
    onApplyAutoDistribution(distributionProposal.cells);
    setShowDistributionModal(false);
    playSound('correct');
  };

  // Filtered Presets
  const filteredPresets = useMemo(() => {
    return presets.filter(p => {
      if (presetCategory === 'all') return true;
      return p.type === presetCategory;
    });
  }, [presets, presetCategory]);

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
      {/* Header of Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <h3 className="text-base font-extrabold text-slate-800 uppercase tracking-wide">
              THIẾT LẬP TỈ LỆ MỨC ĐỘ NHẬN THỨC
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Chủ động cấu hình tỉ lệ điểm Nhận biết – Thông hiểu – Vận dụng phù hợp mục tiêu đánh giá môn học
          </p>
        </div>

        {/* Total Ratio Status Badge */}
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
              isValidTotal
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
            }`}
          >
            {isValidTotal ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Tổng tỉ lệ: 100% (Chuẩn xác)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Tổng tỉ lệ: {totalPct}% (Cần điều chỉnh về 100%)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preset Quick Chips */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Bookmark className="w-3.5 h-3.5 text-indigo-600" />
            <span>Mẫu cấu hình tham khảo & cá nhân:</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPresetCategory('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                presetCategory === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setPresetCategory('reference')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                presetCategory === 'reference' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Mẫu tham khảo
            </button>
            <button
              type="button"
              onClick={() => setPresetCategory('teacher_personal')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                presetCategory === 'teacher_personal' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Mẫu của tôi
            </button>
          </div>
        </div>

        {/* Presets Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
          {filteredPresets.map((p) => {
            const isSelected = activePresetId === p.id || (knowPct === p.knowPct && compPct === p.compPct && appPct === p.appPct);
            const isTeacherPreset = p.type === 'teacher_personal';

            return (
              <div
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start justify-between gap-2 ${
                  isSelected
                    ? 'bg-indigo-50/90 border-indigo-600 ring-1 ring-indigo-300 shadow-2xs'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-800 truncate">{p.name}</span>
                    {p.type === 'department_approved' && (
                      <span className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.2 rounded font-bold">
                        Tổ duyệt
                      </span>
                    )}
                    {isTeacherPreset && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold">
                        Cá nhân
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono font-semibold text-indigo-700 mt-0.5">
                    {p.knowPct}% – {p.compPct}% – {p.appPct}%
                  </div>
                  {p.description && (
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{p.description}</p>
                  )}
                </div>

                {isTeacherPreset && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePreset(p.id, p.name);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    title="Xoá mẫu này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 Cognitive Level Inputs & Sliders (Mobile First Responsive Stack) */}
      <div className="space-y-4 pt-2">
        {/* Level 1: Nhận biết */}
        <div className="p-3.5 rounded-xl border border-sky-100 bg-sky-50/40 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-500 shrink-0" />
              <label className="text-xs sm:text-sm font-bold text-slate-800">
                1. Mức độ: Nhận biết
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                (Định nghĩa, tính chất, nhận diện công thức)
              </span>
            </div>

            {/* Target Points Indicator */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-600 font-medium">
                Mục tiêu: <strong className="text-sky-700 font-bold">{targetPoints.know} đ</strong>
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">
                Thực tế đề: <strong className="text-slate-800">{actualPointsBreakdown.knowPts} đ ({actualPointsBreakdown.knowPctActual}%)</strong>
              </span>

              {/* Number Input */}
              <div className="flex items-center gap-1 ml-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={knowPct}
                  onChange={(e) => handleUpdateLevel('know', parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-xs font-bold text-center border border-sky-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500"
                />
                <span className="font-bold text-xs text-sky-800">%</span>
              </div>
            </div>
          </div>

          {/* Range Slider */}
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={knowPct}
              onChange={(e) => handleUpdateLevel('know', parseInt(e.target.value))}
              className="w-full accent-sky-600 h-2 bg-sky-100 rounded-lg cursor-pointer"
            />
            <span className="w-12 text-right font-mono font-bold text-xs text-sky-800">
              {knowPct}%
            </span>
          </div>
        </div>

        {/* Level 2: Thông hiểu */}
        <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/40 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
              <label className="text-xs sm:text-sm font-bold text-slate-800">
                2. Mức độ: Thông hiểu
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                (Phân tích, so sánh, đúng/sai nhiều ý)
              </span>
            </div>

            {/* Target Points Indicator */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-600 font-medium">
                Mục tiêu: <strong className="text-amber-700 font-bold">{targetPoints.comp} đ</strong>
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">
                Thực tế đề: <strong className="text-slate-800">{actualPointsBreakdown.compPts} đ ({actualPointsBreakdown.compPctActual}%)</strong>
              </span>

              {/* Number Input */}
              <div className="flex items-center gap-1 ml-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={compPct}
                  onChange={(e) => handleUpdateLevel('comp', parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-xs font-bold text-center border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                />
                <span className="font-bold text-xs text-amber-800">%</span>
              </div>
            </div>
          </div>

          {/* Range Slider */}
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={compPct}
              onChange={(e) => handleUpdateLevel('comp', parseInt(e.target.value))}
              className="w-full accent-amber-600 h-2 bg-amber-100 rounded-lg cursor-pointer"
            />
            <span className="w-12 text-right font-mono font-bold text-xs text-amber-800">
              {compPct}%
            </span>
          </div>
        </div>

        {/* Level 3: Vận dụng */}
        <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
              <label className="text-xs sm:text-sm font-bold text-slate-800">
                3. Mức độ: Vận dụng & Vận dụng cao
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                (Thực tiễn, tối ưu hoá, trả lời ngắn, tự luận)
              </span>
            </div>

            {/* Target Points Indicator */}
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-600 font-medium">
                Mục tiêu: <strong className="text-emerald-700 font-bold">{targetPoints.app} đ</strong>
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-500">
                Thực tế đề: <strong className="text-slate-800">{actualPointsBreakdown.appPts} đ ({actualPointsBreakdown.appPctActual}%)</strong>
              </span>

              {/* Number Input */}
              <div className="flex items-center gap-1 ml-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={appPct}
                  onChange={(e) => handleUpdateLevel('app', parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1 text-xs font-bold text-center border border-emerald-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
                />
                <span className="font-bold text-xs text-emerald-800">%</span>
              </div>
            </div>
          </div>

          {/* Range Slider */}
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={appPct}
              onChange={(e) => handleUpdateLevel('app', parseInt(e.target.value))}
              className="w-full accent-emerald-600 h-2 bg-emerald-100 rounded-lg cursor-pointer"
            />
            <span className="w-12 text-right font-mono font-bold text-xs text-emerald-800">
              {appPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Validation Warning Alert if total != 100 */}
      {!isValidTotal && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <strong>Tổng tỉ lệ hiện tại là {totalPct}%.</strong> Vui lòng điều chỉnh về 100% để đảm bảo ma trận cân bằng số điểm ({totalPct > 100 ? `đang thừa ${totalPct - 100}%` : `đang thiếu ${100 - totalPct}%`}).
          </div>
        </div>
      )}

      {/* Controls & Quick Actions Bar */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        {/* Auto-balance toggle */}
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isAutoBalance}
            onChange={(e) => setIsAutoBalance(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
          />
          <span>Tự động cân đối 100% khi kéo thanh điều chỉnh</span>
        </label>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Reset initial */}
          <button
            type="button"
            onClick={handleResetInitial}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Khôi phục ban đầu
          </button>

          {/* Save personal preset */}
          <button
            type="button"
            onClick={() => {
              if (!isValidTotal) {
                alert(`Tổng tỉ lệ phải bằng 100% trước khi lưu. Hiện tại là ${totalPct}%.`);
                return;
              }
              setNewPresetName(`Mẫu Toán ${grade} (${knowPct}-${compPct}-${appPct})`);
              setShowSavePresetModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Lưu làm mẫu riêng
          </button>

          {/* Smart Distribution Assistant */}
          {onApplyAutoDistribution && (
            <button
              type="button"
              onClick={calculateSmartDistribution}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:opacity-95 rounded-xl shadow-xs transition-opacity"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Tự động phân bổ câu hỏi theo tỉ lệ
            </button>
          )}
        </div>
      </div>

      {/* Modal: Save Personal Preset */}
      {showSavePresetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-indigo-600" />
                Lưu cấu hình tỉ lệ cá nhân
              </h4>
              <button
                type="button"
                onClick={() => setShowSavePresetModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên mẫu cấu hình:
                </label>
                <input
                  type="text"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  placeholder="Ví dụ: Đề phân hóa 12A1 (30-30-40)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú mục đích áp dụng:
                </label>
                <input
                  type="text"
                  value={newPresetDesc}
                  onChange={(e) => setNewPresetDesc(e.target.value)}
                  placeholder="Ví dụ: Dùng cho ôn tập chuyên đề hoặc kiểm tra giữa kỳ"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex justify-between font-mono text-indigo-900 font-bold">
                <span>Nhận biết: {knowPct}%</span>
                <span>Thông hiểu: {compPct}%</span>
                <span>Vận dụng: {appPct}%</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSavePresetModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSavePersonalPreset}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Smart Distribution Confirmation */}
      {showDistributionModal && distributionProposal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Đề xuất phân bổ câu hỏi theo tỉ lệ {knowPct}% – {compPct}% – {appPct}%
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tổng điểm đề: <strong>{targetTotalPoints} điểm</strong> · Môn Toán khối {grade}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDistributionModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Score comparison grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100">
                  <span className="text-[10px] text-sky-700 font-bold block">NHẬN BIẾT ({knowPct}%)</span>
                  <div className="text-sm font-black text-slate-800 mt-0.5">
                    {distributionProposal.actualPoints.know} / {targetPoints.know} đ
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {distributionProposal.discrepancy.know === 0 ? '✓ Khớp chính xác' : `Lệch ${distributionProposal.discrepancy.know > 0 ? '+' : ''}${distributionProposal.discrepancy.know} đ`}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-[10px] text-amber-700 font-bold block">THÔNG HIỂU ({compPct}%)</span>
                  <div className="text-sm font-black text-slate-800 mt-0.5">
                    {distributionProposal.actualPoints.comp} / {targetPoints.comp} đ
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {distributionProposal.discrepancy.comp === 0 ? '✓ Khớp chính xác' : `Lệch ${distributionProposal.discrepancy.comp > 0 ? '+' : ''}${distributionProposal.discrepancy.comp} đ`}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 font-bold block">VẬN DỤNG ({appPct}%)</span>
                  <div className="text-sm font-black text-slate-800 mt-0.5">
                    {distributionProposal.actualPoints.app} / {targetPoints.app} đ
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {distributionProposal.discrepancy.app === 0 ? '✓ Khớp chính xác' : `Lệch ${distributionProposal.discrepancy.app > 0 ? '+' : ''}${distributionProposal.discrepancy.app} đ`}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {distributionProposal.notes.map((n, i) => (
                <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[11px]">
                  {n}
                </div>
              ))}

              {/* Proposed rows preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-3 py-2 bg-slate-100 font-bold text-slate-700 border-b border-slate-200 flex justify-between">
                  <span>Danh sách dòng ma trận đề xuất ({distributionProposal.cells.length} dòng):</span>
                  <span>Tổng điểm: {targetTotalPoints} đ</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {distributionProposal.cells.map((c, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 truncate">{c.topic}</div>
                        <div className="text-[11px] text-slate-500">
                          {c.cognitiveLevel === 'nhan_biet' ? 'Nhận biết' : c.cognitiveLevel === 'thong_hieu' ? 'Thông hiểu' : 'Vận dụng'} · {c.questionType === 'multiple_choice' ? 'Trắc nghiệm 4 lựa chọn' : c.questionType === 'true_false' ? 'Đúng/Sai (4 ý)' : c.questionType === 'short_answer' ? 'Trả lời ngắn' : 'Tự luận'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-slate-800">{c.questionCount} câu</div>
                        <div className="font-bold text-indigo-700">{c.totalPoints.toFixed(2)} đ</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                <strong>Lưu ý:</strong> Khi áp dụng, các dòng ma trận hiện tại sẽ được cập nhật đồng bộ sang phân bổ mới này.
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDistributionModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDistribution}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
              >
                Xác nhận áp dụng vào ma trận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
