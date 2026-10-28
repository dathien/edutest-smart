import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  FileCheck2,
  Trophy,
  History,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Volume2,
  VolumeX,
  PlayCircle,
  Eye,
  Award,
  Sparkles,
  ShieldAlert,
  Home,
  Compass,
} from 'lucide-react';
import {
  User,
  ExamAssignment,
  Exam,
  ExamSubmission,
  AssignmentCategory,
} from '../../types';
import { playSound, getSoundEnabled, setSoundEnabled } from '../../services/sound';

interface StudentPortalViewProps {
  currentUser: User;
  assignments: ExamAssignment[];
  exams: Exam[];
  submissions: ExamSubmission[];
  onStartExam: (assignment: ExamAssignment) => void;
  onViewResult: (submission: ExamSubmission) => void;
  onLogout: () => void;
  onGoHome?: () => void;
  onOpenMathLab?: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  currentUser,
  assignments,
  exams,
  submissions,
  onStartExam,
  onViewResult,
  onLogout,
  onGoHome,
  onOpenMathLab,
}) => {
  // 4 Core Student Sections
  type StudentTab = 'homework' | 'test' | 'exam' | 'results';
  const [activeTab, setActiveTab] = useState<StudentTab>('homework');
  const [soundActive, setSoundActive] = useState<boolean>(getSoundEnabled());

  const toggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    setSoundEnabled(next);
    if (next) playSound('click');
  };

  // Student Class ID (from user assigned classes or fallback)
  const studentClassId = currentUser.assignedClassIds?.[0] || 'class-12a1';

  // Filter assignments strictly for this student
  const studentAssignments = useMemo(() => {
    return assignments.filter(a => {
      if (a.targetType === 'student') {
        return a.targetStudentIds?.includes(currentUser.id);
      }
      return a.classIds.includes(studentClassId);
    });
  }, [assignments, studentClassId, currentUser.id]);

  // Group by Category
  const homeworkList = useMemo(() => {
    return studentAssignments.filter(a => a.category === 'homework');
  }, [studentAssignments]);

  const testList = useMemo(() => {
    return studentAssignments.filter(a => a.category === 'test' || !a.category);
  }, [studentAssignments]);

  const examList = useMemo(() => {
    return studentAssignments.filter(a => a.category === 'exam');
  }, [studentAssignments]);

  // Student's submissions history
  const mySubmissions = useMemo(() => {
    return submissions.filter(
      s => s.studentId === currentUser.id || s.studentCode === (currentUser as any).studentCode
    );
  }, [submissions, currentUser]);

  // Status computation for an assignment
  const getAssignmentStatus = (a: ExamAssignment) => {
    const sub = mySubmissions.find(s => s.assignmentId === a.id);
    const now = new Date();
    const isPastDue = new Date(a.endDate) < now;

    if (sub) {
      return {
        label: 'Đã hoàn thành',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        canTake: false,
        canView: true,
        submission: sub,
      };
    }
    if (isPastDue) {
      return {
        label: 'Quá hạn nộp',
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        canTake: false,
        canView: false,
      };
    }
    return {
      label: 'Đang mở (Chưa làm)',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      canTake: true,
      canView: false,
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Student Dedicated Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center shadow-xs">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-3">
          {/* Logo & Student Identity */}
          <div 
            onClick={onGoHome}
            className={`flex items-center gap-3 min-w-0 ${onGoHome ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''}`}
            title="Về trang chủ EduTest Smart"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-xs font-black text-base shrink-0">
              ES
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-800 tracking-tight truncate">
                  EDUTEST SMART
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  Học sinh
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate">
                {currentUser.fullName} • Lớp 12A1
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title={soundActive ? 'Tắt âm thanh' : 'Bật âm thanh'}
              aria-label="Âm thanh"
            >
              {soundActive ? <Volume2 className="w-5 h-5 text-indigo-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>

            {onGoHome && (
              <button
                onClick={() => {
                  playSound('click');
                  onGoHome();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                title="Về trang chủ giới thiệu"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Trang chủ</span>
              </button>
            )}

            <button
              onClick={() => {
                playSound('click');
                onLogout();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Student Portal Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Greeting Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/15 text-indigo-100 backdrop-blur-md mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Cổng học tập & kiểm tra trực tuyến
            </span>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              BÀI HỌC VÀ KIỂM TRA CỦA EM
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Xin chào <strong>{currentUser.fullName}</strong>. Chúc em hoàn thành bài làm thật tốt, tự tin đạt điểm cao!
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
            <div className="text-xs text-indigo-200">Đã hoàn thành</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300">
              {mySubmissions.length} <span className="text-sm font-normal text-indigo-200">bài</span>
            </div>
          </div>
        </div>

        {/* Math Lab 2D/3D Highlight Banner */}
        {onOpenMathLab && (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-indigo-500/20 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-cyan-300 flex items-center justify-center border border-indigo-400/30 flex-shrink-0">
                <Compass className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                    Không Gian Mới
                  </span>
                  <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">
                    GDPT 2018
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  PHÒNG LAB TOÁN HỌC 10–11–12
                </h3>
                <p className="text-xs text-slate-300 max-w-xl">
                  Khám phá tương tác 2D/3D: Parabol, hàm bậc ba, lượng giác, tọa độ Oxyz và thiết diện động.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                onOpenMathLab();
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-md transition-colors flex-shrink-0 cursor-pointer"
            >
              <span>Vào Phòng Lab</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Core Navigation Tabs (Large Touch Buttons) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Tab 1: Bài tập */}
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('homework');
            }}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === 'homework'
                ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeTab === 'homework' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {homeworkList.length}
              </span>
            </div>
            <div className="font-bold text-sm sm:text-base text-slate-800">1. Bài tập được giao</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Rèn luyện & củng cố</div>
          </button>

          {/* Tab 2: Bài kiểm tra */}
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('test');
            }}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === 'test'
                ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeTab === 'test' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                <FileCheck2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {testList.length}
              </span>
            </div>
            <div className="font-bold text-sm sm:text-base text-slate-800">2. Bài kiểm tra</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Thường xuyên & Giữa kỳ</div>
          </button>

          {/* Tab 3: Bài thi */}
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('exam');
            }}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === 'exam'
                ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeTab === 'exam' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                <Trophy className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {examList.length}
              </span>
            </div>
            <div className="font-bold text-sm sm:text-base text-slate-800">3. Bài thi</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Học kỳ & Khảo sát</div>
          </button>

          {/* Tab 4: Kết quả học tập */}
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('results');
            }}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeTab === 'results'
                ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeTab === 'results' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                <History className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {mySubmissions.length}
              </span>
            </div>
            <div className="font-bold text-sm sm:text-base text-slate-800">4. Kết quả học tập</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Lịch sử & Điểm số</div>
          </button>
        </div>

        {/* Content Body based on activeTab */}
        <div className="space-y-4">
          {/* Section: Bài tập / Kiểm tra / Bài thi */}
          {activeTab !== 'results' && (
            <div className="space-y-4">
              {(() => {
                const currentList =
                  activeTab === 'homework' ? homeworkList : activeTab === 'test' ? testList : examList;

                if (currentList.length === 0) {
                  return (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h3 className="text-base font-bold text-slate-700">Hiện tại chưa có bài nào</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Khi thầy cô giao bài mới, bài tập sẽ xuất hiện tại đây ngay lập tức.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentList.map(item => {
                      const status = getAssignmentStatus(item);

                      return (
                        <div
                          key={item.id}
                          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            {/* Badges: Subject & Status */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {item.subject || 'Toán học 12'}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.color}`}
                              >
                                {status.label}
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="font-bold text-slate-800 text-base sm:text-lg mb-2 leading-snug">
                              {item.examTitle}
                            </h3>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 mb-4">
                              <div>
                                <span className="text-slate-400">Giáo viên giao:</span>
                                <div className="font-semibold text-slate-700 mt-0.5">
                                  {item.teacherName || 'Thầy Hồ Nguyễn Đa Thiện'}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-400">Thời gian làm:</span>
                                <div className="font-semibold text-slate-700 mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                  {item.durationMinutes || 90} phút
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-400">Hạn chót:</span>
                                <div className="font-semibold text-slate-700 mt-0.5">
                                  {new Date(item.endDate).toLocaleDateString('vi-VN')}
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-400">Số lần được làm:</span>
                                <div className="font-semibold text-slate-700 mt-0.5">
                                  {item.maxAttempts || 1} lần
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div>
                            {status.canTake && (
                              <button
                                onClick={() => {
                                  playSound('click');
                                  onStartExam(item);
                                }}
                                className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
                              >
                                <PlayCircle className="w-5 h-5" />
                                Bắt đầu làm bài ngay
                              </button>
                            )}

                            {status.canView && status.submission && (
                              <button
                                onClick={() => {
                                  playSound('click');
                                  onViewResult(status.submission!);
                                }}
                                className="w-full py-2.5 px-4 rounded-xl text-indigo-700 font-semibold text-sm bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center justify-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                Xem kết quả bài làm (
                                {status.submission.totalScore.toFixed(2)} đ)
                              </button>
                            )}

                            {!status.canTake && !status.canView && (
                              <div className="w-full py-2.5 text-center text-xs text-slate-400 font-medium bg-slate-100 rounded-xl">
                                Đã kết thúc thời gian nộp bài
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Section 4: Kết quả học tập */}
          {activeTab === 'results' && (
            <div className="space-y-4">
              {mySubmissions.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <History className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-slate-700">Chưa có lịch sử làm bài</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Sau khi hoàn thành bài tập hoặc bài kiểm tra, điểm số và bài làm sẽ lưu tại đây.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mySubmissions.map(sub => (
                    <div
                      key={sub.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs text-slate-400">
                            Nộp bài lúc: {sub.submittedAt || sub.startedAt}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Đã chấm
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-800 text-base mb-3 leading-snug">
                          {sub.examTitle}
                        </h3>

                        {/* Score Display Card */}
                        <div className="bg-gradient-to-tr from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between mb-4">
                          <div>
                            <div className="text-xs text-indigo-700 font-semibold uppercase tracking-wider">
                              Điểm số đạt được
                            </div>
                            <div className="text-3xl font-black text-indigo-700 mt-0.5">
                              {sub.totalScore.toFixed(2)}{' '}
                              <span className="text-xs font-semibold text-slate-400">/ {sub.maxScore} đ</span>
                            </div>
                          </div>
                          <Award className="w-10 h-10 text-indigo-500/70" />
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          playSound('click');
                          onViewResult(sub);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl text-white font-semibold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết bài làm & nhận xét
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
