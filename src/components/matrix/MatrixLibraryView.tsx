import React, { useState } from 'react';
import {
  FileSpreadsheet,
  PlusCircle,
  FileText,
  PenTool,
  Layers,
  FileCheck,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  MatrixDocument,
  Question,
  Exam,
  User,
  ClassRoom,
} from '../../types';
import { StorageService } from '../../services/storage';
import { playSound } from '../../services/sound';

// 8 Sub-module Components
import { Tab1MatrixLibrary } from './Tab1MatrixLibrary';
import { Tab2MatrixBuilder } from './Tab2MatrixBuilder';
import { Tab3SpecificationView } from './Tab3SpecificationView';
import { Tab4QuestionAuthoring } from './Tab4QuestionAuthoring';
import { Tab5ExamComposer } from './Tab5ExamComposer';
import { Tab6RubricAnswers } from './Tab6RubricAnswers';
import { Tab7ExamAudit } from './Tab7ExamAudit';
import { Tab8ExamLibrary } from './Tab8ExamLibrary';

export type AuthoringSubTab =
  | 'matrix_library'     // 1. Thư viện ma trận
  | 'create_matrix'      // 2. Tạo ma trận mới
  | 'specifications'     // 3. Bản đặc tả đề kiểm tra
  | 'author_question'    // 4. Soạn câu hỏi
  | 'compose_exam'       // 5. Biên soạn đề kiểm tra
  | 'rubric_answers'     // 6. Đáp án & hướng dẫn chấm
  | 'audit_exam'         // 7. Kiểm tra và duyệt đề
  | 'exam_library';      // 8. Thư viện đề kiểm tra

interface MatrixLibraryViewProps {
  currentUser: User;
  matrices: MatrixDocument[];
  questions: Question[];
  classes: ClassRoom[];
  exams?: Exam[];
  onRefreshData: () => void;
  onNavigateExamRoom?: () => void;
}

export const MatrixLibraryView: React.FC<MatrixLibraryViewProps> = ({
  currentUser,
  matrices,
  questions,
  classes,
  exams: propExams,
  onRefreshData,
  onNavigateExamRoom = () => {},
}) => {
  // Current active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<AuthoringSubTab>('matrix_library');

  // Shared context states across tabs
  const [editingMatrix, setEditingMatrix] = useState<MatrixDocument | null>(null);
  const [selectedMatrixIdForSpec, setSelectedMatrixIdForSpec] = useState<string>('');
  const [selectedMatrixIdForExam, setSelectedMatrixIdForExam] = useState<string>('');
  const [editingExamId, setEditingExamId] = useState<string | undefined>(undefined);
  const [inspectingExamId, setInspectingExamId] = useState<string>('');

  // Fallback to storage exams if not provided in props
  const allExams = propExams && propExams.length > 0 ? propExams : StorageService.getExams();

  const handleSubTabChange = (tab: AuthoringSubTab) => {
    playSound('click');
    setActiveSubTab(tab);
  };

  // Navigations from Tab 1 (Matrix Library)
  const handleSelectMatrixToEdit = (matrix: MatrixDocument) => {
    setEditingMatrix(matrix);
    setActiveSubTab('create_matrix');
  };

  const handleSelectMatrixForSpec = (matrixId: string) => {
    setSelectedMatrixIdForSpec(matrixId);
    setActiveSubTab('specifications');
  };

  const handleSelectMatrixToComposeExam = (matrixId: string) => {
    setSelectedMatrixIdForExam(matrixId);
    setEditingExamId(undefined);
    setActiveSubTab('compose_exam');
  };

  // Navigations from Tab 2 (Create Matrix)
  const handleMatrixSaved = (savedMatrix: MatrixDocument) => {
    onRefreshData();
    setEditingMatrix(null);
  };

  const handleGoToSpecFromMatrix = (matrixId: string) => {
    setSelectedMatrixIdForSpec(matrixId);
    setActiveSubTab('specifications');
  };

  // Navigations from Tab 4 (Author Question)
  const handleQuestionCreated = (newQ: Question) => {
    onRefreshData();
  };

  // Navigations from Tab 5 (Exam Composer)
  const handleExamSaved = (exam: Exam) => {
    onRefreshData();
    setInspectingExamId(exam.id);
  };

  interface SubTabItem {
    id: AuthoringSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  // Sub-tabs list configuration
  const subTabs: SubTabItem[] = [
    { id: 'matrix_library', label: '1. Thư viện ma trận', icon: FileSpreadsheet, badge: `${matrices.length}` },
    { id: 'create_matrix', label: '2. Tạo ma trận mới', icon: PlusCircle },
    { id: 'specifications', label: '3. Bản đặc tả đề kiểm tra', icon: FileText },
    { id: 'author_question', label: '4. Soạn câu hỏi', icon: PenTool, badge: `${questions.length}` },
    { id: 'compose_exam', label: '5. Biên soạn đề kiểm tra', icon: Layers },
    { id: 'rubric_answers', label: '6. Đáp án & hướng dẫn chấm', icon: FileCheck },
    { id: 'audit_exam', label: '7. Kiểm tra và duyệt đề', icon: ShieldCheck },
    { id: 'exam_library', label: '8. Thư viện đề kiểm tra', icon: BookOpen, badge: `${allExams.length}` },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white rounded-2xl p-6 shadow-md border border-indigo-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-xs mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Quy trình chuẩn hóa Công văn 7991/BGDĐT-GDTrH • GDPT 2018
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Trung tâm biên soạn và quản lý đề kiểm tra
            </h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-2xl">
              Thực hiện trọn gói quy trình: Tạo ma trận → Bản đặc tả → Soạn câu hỏi → Tạo đề → Đáp án & Hướng dẫn chấm → Kiểm định chất lượng → Thư viện & Giao bài.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => {
                setEditingMatrix(null);
                setActiveSubTab('create_matrix');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-700 font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-50 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Tạo ma trận mới
            </button>
            <button
              onClick={() => {
                setEditingExamId(undefined);
                setActiveSubTab('compose_exam');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors"
            >
              <Layers className="w-4 h-4" />
              Biên soạn đề mới
            </button>
          </div>
        </div>

        {/* Linear Step Progression Indicator */}
        <div className="mt-5 pt-4 border-t border-white/15 hidden lg:flex items-center justify-between text-xs font-medium text-indigo-200">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">1</span>
            <span>Ma trận</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 opacity-50" />
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">2</span>
            <span>Bản đặc tả</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 opacity-50" />
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">3</span>
            <span>Soạn câu hỏi</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 opacity-50" />
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">4</span>
            <span>Biên soạn đề</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 opacity-50" />
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">5</span>
            <span>Đáp án & HD chấm</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 opacity-50" />
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">6</span>
            <span>Kiểm định & Duyệt</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 opacity-50" />
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-400/30 text-emerald-200 flex items-center justify-center text-[10px] font-bold">7</span>
            <span>Thư viện & Giao bài</span>
          </div>
        </div>
      </div>

      {/* 8 Chức năng - Bố trí dạng lưới responsive (Desktop: 4 cột × 2 hàng, Tablet: 2 cột, Mobile: 1-2 cột) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>Phân hệ 8 chức năng biên soạn & kiểm định</span>
            <span className="text-[11px] font-normal text-slate-400 font-mono">(4 cột × 2 hàng)</span>
          </div>
          <span className="text-xs text-indigo-700 font-medium">
            Đang mở: <strong className="font-bold">{subTabs.find(t => t.id === activeSubTab)?.label}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {subTabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSubTabChange(tab.id as AuthoringSubTab)}
                className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-300 ring-offset-1'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tab.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${
                          isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-indigo-900/60 text-indigo-100' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      0{idx + 1}
                    </span>
                  </div>
                </div>

                <div>
                  <div className={`text-sm font-bold leading-snug ${isActive ? 'text-white' : 'text-slate-900'}`}>
                    {tab.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display */}
      <div>
        {/* Tab 1: Thư viện ma trận */}
        {activeSubTab === 'matrix_library' && (
          <Tab1MatrixLibrary
            matrices={matrices}
            questions={questions}
            onSelectMatrixToEdit={handleSelectMatrixToEdit}
            onSelectMatrixForSpec={handleSelectMatrixForSpec}
            onSelectMatrixToComposeExam={handleSelectMatrixToComposeExam}
            onGoToCreateMatrix={() => {
              setEditingMatrix(null);
              setActiveSubTab('create_matrix');
            }}
            onRefreshData={onRefreshData}
          />
        )}

        {/* Tab 2: Tạo ma trận mới */}
        {activeSubTab === 'create_matrix' && (
          <Tab2MatrixBuilder
            currentUser={currentUser}
            editingMatrix={editingMatrix}
            onSaved={handleMatrixSaved}
            onGoToSpec={handleGoToSpecFromMatrix}
          />
        )}

        {/* Tab 3: Bản đặc tả đề kiểm tra */}
        {activeSubTab === 'specifications' && (
          <Tab3SpecificationView
            currentUser={currentUser}
            matrices={matrices}
            preselectedMatrixId={selectedMatrixIdForSpec}
            onRefreshData={onRefreshData}
            onGoToAuthorQuestion={() => setActiveSubTab('author_question')}
          />
        )}

        {/* Tab 4: Soạn câu hỏi */}
        {activeSubTab === 'author_question' && (
          <Tab4QuestionAuthoring
            currentUser={currentUser}
            onQuestionCreated={handleQuestionCreated}
            onGoToComposeExam={() => setActiveSubTab('compose_exam')}
          />
        )}

        {/* Tab 5: Biên soạn đề kiểm tra */}
        {activeSubTab === 'compose_exam' && (
          <Tab5ExamComposer
            currentUser={currentUser}
            matrices={matrices}
            questions={questions}
            preselectedMatrixId={selectedMatrixIdForExam}
            editingExam={editingExamId ? allExams.find(e => e.id === editingExamId) : null}
            onExamSaved={handleExamSaved}
            onGoToRubric={examId => {
              setInspectingExamId(examId);
              setActiveSubTab('rubric_answers');
            }}
            onGoToAudit={examId => {
              setInspectingExamId(examId);
              setActiveSubTab('audit_exam');
            }}
          />
        )}

        {/* Tab 6: Đáp án & hướng dẫn chấm */}
        {activeSubTab === 'rubric_answers' && (
          <Tab6RubricAnswers
            currentUser={currentUser}
            exams={allExams}
            preselectedExamId={inspectingExamId}
          />
        )}

        {/* Tab 7: Kiểm tra và duyệt đề */}
        {activeSubTab === 'audit_exam' && (
          <Tab7ExamAudit
            currentUser={currentUser}
            exams={allExams}
            matrices={matrices}
            preselectedExamId={inspectingExamId}
            onExamApproved={() => {
              onRefreshData();
            }}
            onGoToExamLibrary={() => setActiveSubTab('exam_library')}
          />
        )}

        {/* Tab 8: Thư viện đề kiểm tra */}
        {activeSubTab === 'exam_library' && (
          <Tab8ExamLibrary
            currentUser={currentUser}
            exams={allExams}
            classes={classes}
            onRefreshData={onRefreshData}
            onGoToComposeExam={examId => {
              setEditingExamId(examId);
              setActiveSubTab('compose_exam');
            }}
            onGoToAudit={examId => {
              setInspectingExamId(examId);
              setActiveSubTab('audit_exam');
            }}
            onGoToRubric={examId => {
              setInspectingExamId(examId);
              setActiveSubTab('rubric_answers');
            }}
            onNavigateExamRoom={onNavigateExamRoom}
          />
        )}
      </div>
    </div>
  );
};
