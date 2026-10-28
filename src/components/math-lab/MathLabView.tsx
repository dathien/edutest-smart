import React, { useState, useMemo, useEffect } from 'react';
import {
  Compass,
  BookOpen,
  Layers,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  RotateCcw,
  Save,
  Send,
  Users,
  Search,
  ChevronRight,
  Filter,
  FileText,
  Eye,
  Trash2,
  X,
  Play,
  HelpCircle,
} from 'lucide-react';
import {
  LabGrade,
  LabActivity,
  LabSimulationType,
  LabInteractionMode,
  SavedLabState,
  LabAssignment,
  StudentLabSubmission,
  CurriculumMappingItem,
} from './types';
import { CURRICULUM_MAPPINGS, LAB_ACTIVITIES } from './curriculumData';
import { MathLabStorage } from './mathLabStorage';
import { User, ClassRoom, isTeacher, isStudent } from '../../types';
import { MathRenderer } from '../MathRenderer';
import { LabVisualPreview } from './LabVisualPreview';

// Import the 8 foundation labs
import { Lab01Parabola } from './labs/Lab01Parabola';
import { Lab02Cubic } from './labs/Lab02Cubic';
import { Lab03TrigExp } from './labs/Lab03TrigExp';
import { Lab04Inequalities } from './labs/Lab04Inequalities';
import { Lab05OxyzSystem } from './labs/Lab05OxyzSystem';
import { Lab06LinesPlanes3D } from './labs/Lab06LinesPlanes3D';
import { Lab07Pyramid3D } from './labs/Lab07Pyramid3D';
import { Lab08CrossSection3D } from './labs/Lab08CrossSection3D';

interface MathLabViewProps {
  currentUser: User;
  classes?: ClassRoom[];
  initialLabId?: string;
  onBackToPortal?: () => void;
}

export const MathLabView: React.FC<MathLabViewProps> = ({
  currentUser,
  classes = [],
  initialLabId,
  onBackToPortal,
}) => {
  const isUserTeacher = isTeacher(currentUser);

  // Tab Filtering: 'all' | 10 | 11 | 12 | 'assigned' | 'saved'
  type FilterTab = 'all' | 10 | 11 | 12 | 'assigned' | 'saved';
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('all');

  const [searchQuery, setSearchQuery] = useState('');

  // Currently active lab activity
  const [activeActivity, setActiveActivity] = useState<LabActivity | null>(() => {
    if (initialLabId) {
      return LAB_ACTIVITIES.find((a) => a.id === initialLabId) || LAB_ACTIVITIES[0];
    }
    return null; // Start on catalog list view
  });

  // Current simulation parameters
  const [currentParams, setCurrentParams] = useState<Record<string, number>>(() => {
    return activeActivity ? { ...activeActivity.defaultParams } : {};
  });

  // Active interaction mode
  const [interactionMode, setInteractionMode] = useState<LabInteractionMode>('explore');

  // Curriculum table modal
  const [showCurriculumModal, setShowCurriculumModal] = useState(false);

  // Teacher Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    selectedClasses: [] as string[],
    instructions: '',
    deadline: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
  });

  // Student Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [activeAssignmentToSubmit, setActiveAssignmentToSubmit] = useState<LabAssignment | null>(null);

  // Teacher Review Submissions Modal
  const [viewingAssignmentSubmissions, setViewingAssignmentSubmissions] = useState<LabAssignment | null>(null);

  // Saved States & Assignments from storage
  const [savedStates, setSavedStates] = useState<SavedLabState[]>(() =>
    MathLabStorage.getSavedStates(currentUser.id)
  );
  const [assignments, setAssignments] = useState<LabAssignment[]>(() =>
    MathLabStorage.getAssignments()
  );

  // Toast feedback banner
  const [toastMsg, setToastMsg] = useState<{ title: string; type: 'success' | 'info' } | null>(null);

  const showToast = (title: string, type: 'success' | 'info' = 'success') => {
    setToastMsg({ title, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Sync parameters when changing activity
  const handleSelectActivity = (activity: LabActivity) => {
    setActiveActivity(activity);
    setCurrentParams({ ...activity.defaultParams });
    setInteractionMode('explore');
  };

  const handleParamChange = (paramId: string, val: number) => {
    setCurrentParams((prev) => ({ ...prev, [paramId]: val }));
  };

  const handleResetParams = () => {
    if (!activeActivity) return;
    setCurrentParams({ ...activeActivity.defaultParams });
  };

  // Save current state
  const handleSaveState = () => {
    if (!activeActivity) return;
    const notes = prompt('Nhập ghi chú cho bản lưu này (tùy chọn):', 'Bản thử nghiệm thông số cá nhân') || '';
    const newState = MathLabStorage.saveState({
      labId: activeActivity.id,
      simulationType: activeActivity.simulationType,
      title: activeActivity.title,
      grade: activeActivity.grade,
      userId: currentUser.id,
      userName: currentUser.fullName,
      params: currentParams,
      notes,
    });
    setSavedStates(MathLabStorage.getSavedStates(currentUser.id));
    showToast(`Đã lưu trạng thái bài lab vào danh sách của bạn!`);
  };

  // Restore saved state
  const handleRestoreSavedState = (saved: SavedLabState) => {
    const act = LAB_ACTIVITIES.find((a) => a.id === saved.labId || a.simulationType === saved.simulationType);
    if (act) {
      setActiveActivity(act);
      setCurrentParams({ ...saved.params });
      setInteractionMode('explore');
      showToast(`Đã tải lại bản lưu: ${saved.title}`);
    }
  };

  // Teacher assigns lab to classes
  const handleCreateAssignment = () => {
    if (!activeActivity) return;
    if (assignForm.selectedClasses.length === 0) {
      alert('Vui lòng chọn ít nhất một lớp học để giao bài.');
      return;
    }

    const selectedClassObjs = classes.filter((c) => assignForm.selectedClasses.includes(c.id));
    const classNames = selectedClassObjs.map((c) => c.name);

    MathLabStorage.createAssignment({
      labId: activeActivity.id,
      labTitle: activeActivity.title,
      simulationType: activeActivity.simulationType,
      grade: activeActivity.grade,
      assignedByTeacherId: currentUser.id,
      assignedByTeacherName: currentUser.fullName,
      classIds: assignForm.selectedClasses,
      classNames,
      instructions: assignForm.instructions || 'Yêu cầu các em thực hiện bài mô phỏng và trả lời câu hỏi.',
      deadline: new Date(assignForm.deadline).toISOString(),
      status: 'active',
    });

    setAssignments(MathLabStorage.getAssignments());
    setShowAssignModal(false);
    showToast(`Đã giao bài thực hành tới ${classNames.join(', ')} thành công!`);
  };

  // Student submits work
  const handleStudentSubmit = () => {
    if (!activeAssignmentToSubmit || !activeActivity) return;

    MathLabStorage.submitWork({
      assignmentId: activeAssignmentToSubmit.id,
      labId: activeActivity.id,
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      className: currentUser.assignedClassIds?.[0] || '12A1',
      params: currentParams,
      answers: studentAnswers,
    });

    setAssignments(MathLabStorage.getAssignments());
    setShowSubmitModal(false);
    showToast('Nộp bài thực hành thành công! Thầy cô sẽ xem kết quả của em.');
  };

  // Filtered Lab Activities
  const filteredActivities = useMemo(() => {
    return LAB_ACTIVITIES.filter((act) => {
      // Grade filter
      if (selectedFilter !== 'all' && selectedFilter !== 'assigned' && selectedFilter !== 'saved') {
        if (act.grade !== selectedFilter) return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = act.title.toLowerCase().includes(q);
        const matchDesc = act.description.toLowerCase().includes(q);
        const matchCode = act.curriculumCode.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCode) return false;
      }
      return true;
    });
  }, [selectedFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg border border-emerald-500 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMsg.title}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="relative bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 lg:p-8 shadow-md overflow-hidden">
        {/* Background glow patterns */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                <Compass className="w-3.5 h-3.5" />
                GDPT 2018 – Kết Nối Tri Thức
              </span>
              <span className="text-xs text-indigo-300 font-medium">Toán 10 • 11 • 12</span>
            </div>

            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>PHÒNG LAB TOÁN HỌC TƯƠNG TÁC 2D/3D</span>
            </h1>

            <p className="text-xs lg:text-sm text-indigo-100/90 max-w-2xl leading-relaxed">
              Mô phỏng hình học giải tích 2D và không gian 3D tương tác thực thời gian thực. Giúp giáo viên trực quan hóa bài giảng và học sinh tự tay kéo thả, xoay 360°, khám phá bản chất toán học.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCurriculumModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-cyan-300" />
              <span>Bảng Ánh Xạ SGK (Toán 10–12)</span>
            </button>

            {activeActivity && (
              <button
                type="button"
                onClick={() => setActiveActivity(null)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
              >
                <Layers className="w-4 h-4" />
                <span>Danh Mục Bài Lab</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW A: ACTIVE SIMULATION WORKSPACE */}
      {activeActivity ? (
        <div className="space-y-5 animate-fade-in">
          {/* Active Lab Header & Mode Switcher */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  {activeActivity.curriculumCode}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Lớp {activeActivity.grade} • {activeActivity.curriculumLesson}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                {activeActivity.title}
              </h2>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setInteractionMode('explore')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  interactionMode === 'explore'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Khám Phá Tự Do
              </button>
              <button
                type="button"
                onClick={() => setInteractionMode('guided')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  interactionMode === 'guided'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Thực Hành Hướng Dẫn
              </button>
              <button
                type="button"
                onClick={() => setInteractionMode('assigned')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  interactionMode === 'assigned'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Bài Tập Thực Hành
              </button>
            </div>

            {/* Actions: Save & Assign */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveState}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                title="Lưu trạng thái hiện tại"
              >
                <Save className="w-4 h-4 text-slate-600" />
                <span>Lưu Bài Làm</span>
              </button>

              {isUserTeacher && (
                <button
                  type="button"
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition"
                >
                  <Users className="w-4 h-4" />
                  <span>Giao Cho Lớp</span>
                </button>
              )}
            </div>
          </div>

          {/* Guided Tasks Banner if mode is Guided or Assigned */}
          {interactionMode === 'guided' && (
            <div className="bg-indigo-50/70 rounded-2xl border border-indigo-200/80 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  CÁC BƯỚC HƯỚNG DẪN THỰC HÀNH TỪNG BƯỚC
                </span>
                <span className="text-[11px] text-indigo-600 font-semibold bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                  {activeActivity.guideSteps.length} bước
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {activeActivity.guideSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-3 rounded-xl border border-indigo-100 text-xs text-slate-700 leading-relaxed shadow-2xs"
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {interactionMode === 'assigned' && (
            <div className="bg-amber-50/80 rounded-2xl border border-amber-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  BÀI TẬP TỰ ĐÁNH GIÁ VÀ NỘP BÀI THỰC HÀNH
                </span>
                {isStudent(currentUser) && (
                  <button
                    type="button"
                    onClick={() => {
                      const matchedAssign = assignments.find((a) => a.labId === activeActivity.id);
                      setActiveAssignmentToSubmit(matchedAssign || assignments[0] || null);
                      setShowSubmitModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Nộp Bài Cho Giáo Viên</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {activeActivity.tasks.map((task, idx) => {
                  const isSatisfied = task.checkCondition ? task.checkCondition(currentParams) : false;
                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border transition ${
                        isSatisfied
                          ? 'bg-emerald-50/90 border-emerald-200'
                          : 'bg-white border-amber-200/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800">
                            Nhiệm vụ {idx + 1}: {task.question}
                          </p>
                          <p className="text-[11px] text-slate-500 italic">Gợi ý: {task.hint}</p>
                        </div>
                        {task.checkCondition && (
                          <div className="flex-shrink-0">
                            {isSatisfied ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Đã đạt điều kiện
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                Đang điều chỉnh...
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RENDER SIMULATION ENGINE */}
          <div className="w-full">
            {activeActivity.simulationType === 'parabola_2d' && (
              <Lab01Parabola
                activity={activeActivity}
                params={currentParams}
                onParamChange={handleParamChange}
                onResetParams={handleResetParams}
              />
            )}

            {activeActivity.simulationType === 'cubic_function_2d' && (
              <Lab02Cubic
                activity={activeActivity}
                params={currentParams}
                onParamChange={handleParamChange}
                onResetParams={handleResetParams}
              />
            )}

            {activeActivity.simulationType === 'trig_exponential_2d' && (
              <Lab03TrigExp
                activity={activeActivity}
                params={currentParams}
                onParamChange={handleParamChange}
                onResetParams={handleResetParams}
              />
            )}

            {activeActivity.simulationType === 'linear_inequalities_2d' && (
              <Lab04Inequalities
                activity={activeActivity}
                params={currentParams}
                onParamChange={handleParamChange}
                onResetParams={handleResetParams}
              />
            )}

            {activeActivity.simulationType === 'coordinate_system_3d' && (
              <Lab05OxyzSystem
                activity={activeActivity}
                params={currentParams}
                onParamChange={handleParamChange}
                onResetParams={handleResetParams}
              />
            )}

            {activeActivity.simulationType === 'lines_planes_3d' && (
              <Lab06LinesPlanes3D
                activity={activeActivity}
                params={currentParams}
                onParamChange={handleParamChange}
                onResetParams={handleResetParams}
              />
            )}

            {activeActivity.simulationType === 'pyramid_polyhedra_3d' && (
              <Lab07Pyramid3D
                activity={activeActivity}
                params={currentParams}
                onParamChange={handleParamChange}
                onResetParams={handleResetParams}
              />
            )}

            {activeActivity.simulationType === 'cross_section_3d' && (
              <Lab08CrossSection3D
                activity={activeActivity}
                params={currentParams}
                onParamChange={handleParamChange}
                onResetParams={handleResetParams}
              />
            )}
          </div>
        </div>
      ) : (
        /* VIEW B: CATALOG / OVERVIEW LIST */
        <div className="space-y-6">
          {/* Filter Bar & Search */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'Tất Cả (8 Bài Lab)' },
                { id: 10, label: 'Toán 10' },
                { id: 11, label: 'Toán 11' },
                { id: 12, label: 'Toán 12' },
                { id: 'assigned', label: `Bài Được Giao (${assignments.length})` },
                { id: 'saved', label: `Đã Lưu (${savedStates.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedFilter(tab.id as FilterTab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    selectedFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm bài lab, mã SGK, chủ đề..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Sub-view: Assigned Labs */}
          {selectedFilter === 'assigned' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  DANH SÁCH BÀI THỰC HÀNH ĐÃ ĐƯỢC GIAO
                </h3>
              </div>

              {assignments.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                  Chưa có bài thực hành nào được giao.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignments.map((assign) => (
                    <div
                      key={assign.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            Khối {assign.grade} • Lớp: {assign.classNames.join(', ')}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {new Date(assign.deadline).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 leading-snug">{assign.labTitle}</h4>
                        <p className="text-xs text-slate-600 line-clamp-2">{assign.instructions}</p>
                        <p className="text-[11px] text-slate-400 italic">Người giao: {assign.assignedByTeacherName}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        {isUserTeacher ? (
                          <button
                            type="button"
                            onClick={() => setViewingAssignmentSubmissions(assign)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem bài nộp ({assign.submissionCount})</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">
                            {assign.submissionCount > 0 ? 'Đã nộp bài' : 'Chưa nộp bài'}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const act = LAB_ACTIVITIES.find(
                              (a) => a.id === assign.labId || a.simulationType === assign.simulationType
                            );
                            if (act) {
                              handleSelectActivity(act);
                              setInteractionMode('assigned');
                            }
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-xl shadow-xs transition"
                        >
                          <span>Mở Bài Lab</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-view: Saved States */}
          {selectedFilter === 'saved' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                BÀI THỰC HÀNH ĐÃ LƯU CỦA BẠN
              </h3>

              {savedStates.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                  Bạn chưa lưu bài thực hành nào. Hãy vào bất kỳ bài Lab nào và nhấn "Lưu Bài Làm".
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedStates.map((saved) => (
                    <div
                      key={saved.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            Khối {saved.grade}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(saved.savedAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{saved.title}</h4>
                        {saved.notes && <p className="text-xs text-slate-600 italic">"{saved.notes}"</p>}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            MathLabStorage.deleteSavedState(saved.id);
                            setSavedStates(MathLabStorage.getSavedStates(currentUser.id));
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa bản lưu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRestoreSavedState(saved)}
                          className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          <span>Mở lại bản lưu</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activities Cards Grid */}
          {selectedFilter !== 'assigned' && selectedFilter !== 'saved' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-400 transition flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Top Banner with Grade Badge */}
                  <div className="p-5 pb-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        Toán {activity.grade}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {activity.curriculumCode}
                      </span>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                      {activity.title}
                    </h3>

                    {/* Visual Mathematical SVG Preview */}
                    <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50/70 p-1 group-hover:border-indigo-200 transition">
                      <LabVisualPreview simulationType={activity.simulationType} height={115} />
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {activity.description}
                    </p>
                  </div>

                  {/* Math Formula Rendered with KaTeX */}
                  <div className="px-4 py-2 bg-slate-50 border-t border-b border-slate-100 text-center text-xs overflow-x-auto min-h-[40px] flex items-center justify-center">
                    <MathRenderer content={`$${activity.formulaLatex}$`} className="text-indigo-950 font-bold" />
                  </div>

                  {/* Card Footer with Start Button */}
                  <div className="p-4 bg-white flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {activity.parameters.length} tham số tương tác
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSelectActivity(activity)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Vào Lab</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: BẢNG ÁNH XẠ CHƯƠNG TRÌNH GDPT 2018 (SGK KẾT NỐI TRI THỨC) */}
      {showCurriculumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold tracking-wide">
                    BẢNG ÁNH XẠ CHƯƠNG TRÌNH TOÁN GDPT 2018 – SGK KẾT NỐI TRI THỨC
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Đối chiếu chi tiết giữa đơn vị bài học SGK và phân hệ mô phỏng tương tác
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCurriculumModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-auto p-5">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <th className="py-2.5 px-3">Mã Bài</th>
                    <th className="py-2.5 px-3">Khối</th>
                    <th className="py-2.5 px-3">Chương & Bài Học SGK</th>
                    <th className="py-2.5 px-3">Đơn Vị Kiến Thức</th>
                    <th className="py-2.5 px-3">Mô Phỏng Tương Tác</th>
                    <th className="py-2.5 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {CURRICULUM_MAPPINGS.map((item) => (
                    <tr key={item.id} className="hover:bg-indigo-50/40 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{item.code}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">Lớp {item.grade}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{item.lessonName}</span>
                        <span className="text-[11px] text-slate-500">{item.chapter}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 leading-snug">{item.knowledgeTopic}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          Hoạt động thực tế
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const act = LAB_ACTIVITIES.find((a) => a.simulationType === item.simulationType);
                            if (act) {
                              setShowCurriculumModal(false);
                              handleSelectActivity(act);
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 hover:border-transparent rounded-lg transition"
                        >
                          Vào Lab
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GIÁO VIÊN GIAO BÀI CHO LỚP */}
      {showAssignModal && activeActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  GIAO BÀI THỰC HÀNH CHO LỚP HỌC
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Bài Lab được giao:</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                  {activeActivity.title}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Chọn lớp nhận bài:</label>
                <div className="grid grid-cols-3 gap-2">
                  {classes.map((cls) => {
                    const isSelected = assignForm.selectedClasses.includes(cls.id);
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => {
                          setAssignForm((prev) => ({
                            ...prev,
                            selectedClasses: isSelected
                              ? prev.selectedClasses.filter((id) => id !== cls.id)
                              : [...prev.selectedClasses, cls.id],
                          }));
                        }}
                        className={`p-2 rounded-xl border text-center font-bold text-xs transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cls.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Hạn nộp bài:</label>
                <input
                  type="date"
                  value={assignForm.deadline}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, deadline: e.target.value }))}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Hướng dẫn hoặc yêu cầu thêm:</label>
                <textarea
                  rows={3}
                  value={assignForm.instructions}
                  onChange={(e) => setAssignForm((prev) => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Yêu cầu học sinh khảo sát các trường hợp tham số a, b, c và ghi lại kết luận..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleCreateAssignment}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs"
              >
                Xác nhận giao bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: HỌC SINH NỘP BÀI THỰC HÀNH */}
      {showSubmitModal && activeAssignmentToSubmit && activeActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  NỘP BÀI THỰC HÀNH TOÁN HỌC
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-1">
                <span className="font-bold text-indigo-900 block">{activeAssignmentToSubmit.labTitle}</span>
                <p className="text-slate-600 text-[11px]">{activeAssignmentToSubmit.instructions}</p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Thông số mô phỏng hiện tại của em (được lưu tự động):
                </label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700">
                  {Object.entries(currentParams)
                    .map(([k, v]) => `${k} = ${v}`)
                    .join('; ')}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Kết luận hoặc câu trả lời bài làm của em:
                </label>
                <textarea
                  rows={4}
                  placeholder="Ghi lại các nhận xét, tọa độ cực trị, khoảng đồng biến hoặc các câu trả lời cho nhiệm vụ của bài..."
                  value={studentAnswers['summary'] || ''}
                  onChange={(e) =>
                    setStudentAnswers((prev) => ({ ...prev, summary: e.target.value }))
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleStudentSubmit}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: GIÁO VIÊN XEM DANH SÁCH BÀI NỘP */}
      {viewingAssignmentSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold tracking-wide">
                  KẾT QUẢ BÀI NỘP THỰC HÀNH CỦA HỌC SINH
                </h3>
                <p className="text-[11px] text-slate-400">
                  {viewingAssignmentSubmissions.labTitle} • Lớp: {viewingAssignmentSubmissions.classNames.join(', ')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingAssignmentSubmissions(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-auto p-5 space-y-3">
              {MathLabStorage.getSubmissions(viewingAssignmentSubmissions.id).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Chưa có học sinh nào nộp bài cho đợt thực hành này.
                </div>
              ) : (
                MathLabStorage.getSubmissions(viewingAssignmentSubmissions.id).map((sub) => (
                  <div key={sub.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{sub.studentName}</span>
                        <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {sub.className}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 font-mono">
                      <span className="text-slate-400 text-[10px] block font-sans">Tham số học sinh đã thiết lập:</span>
                      {Object.entries(sub.params).map(([k, v]) => `${k} = ${v}`).join('; ')}
                    </div>

                    {sub.answers?.summary && (
                      <div className="text-xs text-slate-800 bg-white p-2.5 rounded-xl border border-slate-100">
                        <span className="text-slate-400 text-[10px] block font-sans">Bài làm & Kết luận:</span>
                        {sub.answers.summary}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
