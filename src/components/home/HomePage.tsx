import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Users,
  Compass,
  BookOpen,
  MonitorPlay,
  BarChart3,
  Gamepad2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  LogIn,
  LayoutDashboard,
  Clock,
  Search,
  FileText,
  ChevronRight,
  School,
  Play,
  Award,
  Layers,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import {
  User,
  ClassRoom,
  Student,
  Question,
  Exam,
  ExamAssignment,
  ExamSubmission,
  isTeacher,
  isStudent,
  isAdminTeacher,
} from '../../types';
import { Header } from '../Header';
import { Footer } from '../Footer';
import { DashboardSlideshow } from '../dashboard/DashboardSlideshow';
import { MainTab } from '../Sidebar';
import { playSound } from '../../services/sound';
import { LAB_ACTIVITIES } from '../math-lab/curriculumData';
import { LabVisualPreview } from '../math-lab/LabVisualPreview';
import { MathRenderer } from '../MathRenderer';

interface HomePageProps {
  currentUser?: User | null;
  classes: ClassRoom[];
  students: Student[];
  questions: Question[];
  exams: Exam[];
  assignments: ExamAssignment[];
  submissions: ExamSubmission[];
  onLoginClick: () => void;
  onEnterWorkspace: () => void;
  onLogout: () => void;
  onNavigateTab?: (tab: MainTab) => void;
  onOpenMathLab?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentUser,
  classes = [],
  students = [],
  questions = [],
  exams = [],
  assignments = [],
  submissions = [],
  onLoginClick,
  onEnterWorkspace,
  onLogout,
  onNavigateTab,
  onOpenMathLab,
}) => {
  const isUserTeacher = isTeacher(currentUser);
  const isUserStudent = isStudent(currentUser);

  // Search filter across dashboard operations and resources
  const [searchQuery, setSearchQuery] = useState('');

  // Safe navigation dispatcher with feedback
  const handleAction = (tab: MainTab) => {
    playSound('click');
    if (tab === 'math_lab' && onOpenMathLab) {
      onOpenMathLab();
      return;
    }
    if (currentUser) {
      if (onNavigateTab) {
        onNavigateTab(tab);
      } else {
        onEnterWorkspace();
      }
    } else {
      onLoginClick();
    }
  };

  // Student specific data filtering
  const studentClassId = currentUser?.assignedClassIds?.[0] || '';
  const myClass = useMemo(() => {
    if (!currentUser) return null;
    return classes.find((c) => c.id === studentClassId) || null;
  }, [classes, studentClassId, currentUser]);

  const studentAssignments = useMemo(() => {
    if (!currentUser || !isUserStudent) return [];
    return assignments.filter((a) => {
      if (a.targetType === 'student') {
        return a.targetStudentIds?.includes(currentUser.id);
      }
      return a.classIds.includes(studentClassId);
    });
  }, [assignments, studentClassId, currentUser, isUserStudent]);

  const studentSubmissions = useMemo(() => {
    if (!currentUser || !isUserStudent) return [];
    return submissions.filter((s) => s.studentId === currentUser.id);
  }, [submissions, currentUser, isUserStudent]);

  // Teacher specific data filtering
  const teacherClasses = useMemo(() => {
    if (!currentUser || !isUserTeacher) return [];
    if (isAdminTeacher(currentUser)) return classes;
    return classes.filter(
      (c) =>
        c.teacherId === currentUser.id ||
        currentUser.assignedClassIds?.includes(c.id)
    );
  }, [classes, currentUser, isUserTeacher]);

  // Filter modules based on search query
  const matchesSearch = (text: string) => {
    if (!searchQuery.trim()) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white antialiased overflow-x-hidden">
      {/* Top Application Header */}
      <Header
        currentUser={currentUser}
        isHomePage={true}
        onLoginClick={onLoginClick}
        onEnterWorkspace={onEnterWorkspace}
        onLogout={onLogout}
      />

      {/* Main Operational Dashboard Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* 1. OPERATIONAL DASHBOARD HERO STATUS BAR */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Hệ Thống Trực Tuyến
                </span>
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  • Chương trình GDPT 2018 Toán 10–11–12
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                BÀN ĐIỀU HÀNH KIỂM TRA, ĐÁNH GIÁ & QUẢN LÝ LỚP HỌC
              </h1>

              <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                Nền tảng chuyên môn tích hợp đồng bộ: Ma trận bản đặc tả CV 7991, ngân hàng câu hỏi, phòng thi trực tuyến chống gian lận, chấm điểm tự động và phòng Lab Toán học 2D/3D.
              </p>
            </div>

            {/* Quick Actions & Role Badge */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {currentUser ? (
                <div className="flex items-center gap-3">
                  <div className="text-right hidden lg:block">
                    <span className="text-sm font-bold text-slate-800 block">
                      {currentUser.fullName}
                    </span>
                    <span className="text-xs text-indigo-600 font-semibold">
                      {isUserTeacher
                        ? isAdminTeacher(currentUser)
                          ? 'Giáo viên Quản trị'
                          : 'Giáo viên bộ môn'
                        : `Học sinh • Lớp ${myClass?.name || '12A1'}`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      onEnterWorkspace();
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs transition-all cursor-pointer min-h-[44px] min-w-[44px]"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Vào không gian làm việc</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    playSound('click');
                    onLoginClick();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs transition-all cursor-pointer min-h-[44px] min-w-[44px]"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Search Tool */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Tìm kiếm phân hệ, ma trận đề, ngân hàng câu hỏi, bài lab 2D/3D..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all min-h-[44px]"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Lối tắt:</span>
              <button
                type="button"
                onClick={() => handleAction('matrix')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-medium transition cursor-pointer"
              >
                Ma trận CV 7991
              </button>
              <button
                type="button"
                onClick={() => handleAction('math_lab')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 font-medium transition cursor-pointer"
              >
                Lab 2D/3D
              </button>
              <button
                type="button"
                onClick={() => handleAction('exam_room')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-medium transition cursor-pointer"
              >
                Phòng thi
              </button>
            </div>
          </div>
        </section>

        {/* 2. UPGRADED 3-SLIDE INTERACTIVE SLIDESHOW */}
        <section aria-label="Tiêu điểm nghiệp vụ">
          <DashboardSlideshow
            currentUser={currentUser}
            onActionClick={handleAction}
          />
        </section>

        {/* 3. TỔNG QUAN CHỈ SỐ THỰC TẾ (REAL METRICS OVERVIEW) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-700">
                CHỈ SỐ TÀI NGUYÊN VÀ HOẠT ĐỘNG THỰC TẾ
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {currentUser ? `Quyền: ${currentUser.role}` : 'Chế độ xem công khai'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Lớp học */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Lớp học</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {isUserTeacher ? teacherClasses.length : isUserStudent ? (myClass ? 1 : 0) : classes.length}
              </div>
              <span className="text-xs text-slate-500 mt-1 block truncate">
                {isUserTeacher ? 'Lớp phụ trách' : isUserStudent ? `Lớp ${myClass?.name || '12A1'}` : 'Đang hoạt động'}
              </span>
            </div>

            {/* Học sinh */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Học sinh</span>
                <GraduationCap className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {isUserTeacher ? students.length : isUserStudent ? (myClass ? 35 : 0) : students.length}
              </div>
              <span className="text-xs text-slate-500 mt-1 block truncate">
                {isUserTeacher ? 'Đã lập danh sách' : isUserStudent ? 'Sĩ số lớp em' : 'Hồ sơ đồng bộ'}
              </span>
            </div>

            {/* Câu hỏi Toán */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Câu hỏi Toán</span>
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {questions.length}
              </div>
              <span className="text-xs text-emerald-600 font-semibold mt-1 block truncate">
                Biết - Hiểu - Vận dụng
              </span>
            </div>

            {/* Đề kiểm tra */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đề kiểm tra</span>
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {exams.length}
              </div>
              <span className="text-xs text-slate-500 mt-1 block truncate">
                Chuẩn CV 7991
              </span>
            </div>

            {/* Đợt thi / Bài tập */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-amber-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đợt thi & Bài tập</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {isUserStudent ? studentAssignments.length : assignments.length}
              </div>
              <span className="text-xs text-amber-600 font-semibold mt-1 block truncate">
                {isUserStudent ? 'Bài của em' : 'Đã giao bài'}
              </span>
            </div>

            {/* Phòng Lab */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-teal-300 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Phòng Lab 2D/3D</span>
                <Compass className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                8
              </div>
              <span className="text-xs text-teal-600 font-semibold mt-1 block truncate">
                Mô phỏng thực tế
              </span>
            </div>
          </div>
        </section>

        {/* 4. TRUNG TÂM PHÂN HỆ NGHIỆP VỤ (3 NHÓM CHỨC NĂNG RÕ RÀNG) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                CÁC PHÂN HỆ CHUYÊN MÔN THEO NHÓM CHỨC NĂNG
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Lựa chọn phân hệ nghiệp vụ để thực hiện thao tác tương ứng
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* NHÓM 1: QUẢN LÝ LỚP HỌC */}
            {matchesSearch('quản lý lớp học sinh excel phân công') && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Nhóm 1
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Quản Lý Lớp Học & Học Sinh
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      Thiết lập danh sách lớp, đồng bộ học sinh từ file Excel, phân công chuyên môn giáo viên và theo dõi sĩ số thực tế.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-medium">Lớp đang quản lý:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {classes.length} lớp học
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-medium">Hồ sơ học sinh:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {students.length} học sinh
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleAction('classes')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer min-h-[44px]"
                >
                  <span>Mở quản lý lớp học</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* NHÓM 2: KIỂM TRA & ĐÁNH GIÁ */}
            {matchesSearch('kiểm tra đánh giá ma trận đề thi câu hỏi chấm điểm phòng thi') && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Nhóm 2
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Kiểm Tra & Đánh Giá
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      Ma trận chuẩn Công văn 7991, ngân hàng câu hỏi KaTeX, tạo đề kiểm tra, phòng thi chống gian lận và chấm tự động.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-medium">Ngân hàng câu hỏi:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {questions.length} câu hỏi
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-medium">Đề thi trong thư viện:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {exams.length} đề thi
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAction('matrix')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer min-h-[44px]"
                  >
                    <span>Ma trận đề</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('exam_room')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer min-h-[44px]"
                  >
                    <span>Phòng thi</span>
                    <MonitorPlay className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* NHÓM 3: HỌC TẬP & ÔN LUYỆN */}
            {matchesSearch('học tập ôn luyện lab toán mô phỏng trò chơi game') && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-cyan-300 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
                      <Compass className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                      Nhóm 3
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Học Tập & Ôn Luyện
                    </h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      Phòng Lab Toán học tương tác 2D/3D trực quan, kèm 4 trò chơi học tập sinh động hỗ trợ khởi động và củng cố kiến thức.
                    </p>
                  </div>

                  <div className="space-y-2 pt-1 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-medium">Mô phỏng 2D/3D:</span>
                      <span className="font-bold text-cyan-800 font-mono">
                        8 Phòng Lab chuẩn GDPT
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600 font-medium">Trò chơi ôn tập:</span>
                      <span className="font-bold text-pink-700 font-mono">
                        4 Game học tập
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenMathLab) onOpenMathLab();
                      else handleAction('math_lab');
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-all cursor-pointer min-h-[44px]"
                  >
                    <span>Phòng Lab</span>
                    <Compass className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('games')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-xs sm:text-sm font-bold bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 transition-all cursor-pointer min-h-[44px]"
                  >
                    <span>Trò chơi</span>
                    <Gamepad2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 5. PHÒNG LAB TOÁN HỌC 10–11–12 (VISUAL SVG PREVIEWS & KATEX FORMULAS) */}
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-md space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/60 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider bg-cyan-950/80 px-2.5 py-0.5 rounded-full border border-cyan-800/50">
                  Mô phỏng toán học thực tế
                </span>
                <span className="text-xs text-indigo-300 font-mono">
                  8 Phòng Lab Tương Tác
                </span>
              </div>

              <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-white tracking-tight">
                PHÒNG LAB TOÁN HỌC 10–11–12 (GDPT 2018)
              </h2>

              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Tương tác giải tích 2D và hình học không gian 3D thời gian thực. Bấm vào bất kỳ bài Lab nào để mở trực tiếp mô phỏng kéo thả và tính toán giải tích.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                playSound('click');
                if (onOpenMathLab) onOpenMathLab();
                else handleAction('math_lab');
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-extrabold shadow-md transition-all cursor-pointer shrink-0 min-h-[44px]"
            >
              <Compass className="w-4 h-4" />
              <span>Mở Phòng Lab Toàn Phần</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 8 Lab Cards Grid with Visual Mathematical Previews & KaTeX */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LAB_ACTIVITIES.map((lab) => (
              <div
                key={lab.id}
                onClick={() => {
                  playSound('click');
                  if (onOpenMathLab) onOpenMathLab();
                  else handleAction('math_lab');
                }}
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/60 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded-md border border-cyan-800/40">
                      Toán {lab.grade}
                    </span>
                    <span className="font-mono text-slate-400 text-[11px]">{lab.curriculumCode}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition leading-snug">
                    {lab.title}
                  </h3>

                  {/* Real Mathematical Visual SVG Preview */}
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-slate-950/40 p-1">
                    <LabVisualPreview simulationType={lab.simulationType} height={105} />
                  </div>

                  {/* Math Formula Rendered with KaTeX */}
                  <div className="py-1 px-2 rounded-lg bg-white/5 text-center min-h-[36px] flex items-center justify-center overflow-x-auto text-xs">
                    <MathRenderer content={`$${lab.formulaLatex}$`} className="text-cyan-200 font-semibold" />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    {lab.parameters.length} tham số
                  </span>
                  <span className="text-cyan-300 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Vào Lab</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. HOẠT ĐỘNG THỰC TẾ & KHÔNG GIAN LỚP HỌC THEO VAI TRÒ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recent Operations Feed (7 Cols) */}
          <section className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  HOẠT ĐỘNG VÀ ĐỢT KIỂM TRA THỰC TẾ
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {assignments.length} đợt hoạt động
              </span>
            </div>

            {isUserStudent ? (
              /* Student View */
              studentAssignments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Hiện tại lớp của em chưa có đợt bài tập hoặc bài kiểm tra nào mới.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentAssignments.slice(0, 4).map((assign) => {
                    const sub = studentSubmissions.find((s) => s.assignmentId === assign.id);
                    return (
                      <div
                        key={assign.id}
                        className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              {assign.category === 'exam' ? 'Kiểm tra' : 'Bài tập'}
                            </span>
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {assign.examTitle}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Hạn nộp: {new Date(assign.endDate).toLocaleDateString('vi-VN')}
                          </p>
                        </div>

                        <div>
                          {sub ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đã nộp bài
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAction('exam_room')}
                              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition min-h-[44px]"
                            >
                              Làm bài
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : isUserTeacher ? (
              /* Teacher View */
              assignments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Chưa có đợt kiểm tra nào được phát động. Bấm nút giao bài bên dưới để bắt đầu.
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.slice(0, 4).map((assign) => {
                    const subCount = submissions.filter((s) => s.assignmentId === assign.id).length;
                    return (
                      <div
                        key={assign.id}
                        className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {assign.examTitle}
                            </span>
                            <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {assign.classNames?.join(', ') || 'Toàn trường'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Hạn: {new Date(assign.endDate).toLocaleDateString('vi-VN')} • Đã nộp: {subCount} bài
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAction('exam_room')}
                          className="px-3.5 py-2 text-xs font-semibold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 rounded-xl transition min-h-[44px]"
                        >
                          Giám sát
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              /* Guest View */
              <div className="p-6 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-indigo-900 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span>Chế độ công khai bảo mật</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Để xem bài làm của học sinh, quản lý danh sách lớp và truy cập kết quả thi nội bộ, vui lòng đăng nhập tài khoản Giáo viên hoặc Học sinh.
                </p>
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition min-h-[44px]"
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}
          </section>

          {/* Classroom Space (5 Cols) */}
          <section className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-purple-600" />
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  KHÔNG GIAN LỚP HỌC
                </h2>
              </div>
              {isUserTeacher && (
                <button
                  type="button"
                  onClick={() => handleAction('classes')}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  Quản lý lớp
                </button>
              )}
            </div>

            {isUserTeacher ? (
              teacherClasses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Chưa có lớp nào được phân công.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {teacherClasses.map((cls) => {
                    const classStudentCount = students.filter((s) => s.classId === cls.id).length;
                    return (
                      <div
                        key={cls.id}
                        className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-purple-200 transition flex items-center justify-between"
                      >
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{cls.name}</h3>
                          <span className="text-xs text-slate-500">
                            Khối {cls.grade} • Sĩ số: {classStudentCount || 35} học sinh
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAction('classes')}
                          className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition min-h-[44px]"
                        >
                          Mở lớp
                        </button>
                      </div>
                    );
                  })}
                </div>
              )
            ) : isUserStudent ? (
              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-indigo-900">
                    Lớp: {myClass?.name || '12A1'}
                  </span>
                  <span className="text-xs font-mono text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Năm học 2025–2026
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Em đang học tập trong lớp {myClass?.name || '12A1'}. Mọi bài tập và thông báo sẽ được giáo viên bộ môn chuyển trực tiếp vào tài khoản của em.
                </p>
                <button
                  type="button"
                  onClick={() => handleAction('exam_room')}
                  className="w-full py-3 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs text-center min-h-[44px]"
                >
                  Vào phòng học & kiểm tra
                </button>
              </div>
            ) : (
              <div className="p-6 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-100">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm text-slate-600">
                  Đăng nhập để xem danh sách lớp học và bài làm của học sinh.
                </p>
                <button
                  type="button"
                  onClick={onLoginClick}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition min-h-[44px]"
                >
                  Đăng nhập tài khoản
                </button>
              </div>
            )}
          </section>
        </div>

        {/* 7. TRÒ CHƠI ÔN TẬP TOÁN HỌC (REVIEW GAMES) */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-pink-600" />
              <div>
                <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  TRÒ CHƠI HỌC TẬP VÀ ÔN TẬP TOÁN HỌC
                </h2>
                <p className="text-xs text-slate-500">
                  Ứng dụng ngân hàng câu hỏi vào các hoạt động khởi động và củng cố kiến thức
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleAction('games')}
              className="text-xs font-bold text-pink-600 hover:text-pink-800 flex items-center gap-1"
            >
              <span>Vào trung tâm trò chơi</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                id: 'lucky_wheel',
                title: 'Vòng quay may mắn',
                desc: 'Quay chọn câu hỏi ngẫu nhiên và thưởng điểm số tương tác',
                color: 'text-amber-600 bg-amber-50',
              },
              {
                id: 'crossword',
                title: 'Ô chữ Toán học',
                desc: 'Giải mã từ khóa chuyên môn qua các câu hỏi gợi ý',
                color: 'text-purple-600 bg-purple-50',
              },
              {
                id: 'battle_arena',
                title: 'Đấu trường tri thức',
                desc: 'Đối kháng tính giờ trực tiếp giữa các nhóm học sinh',
                color: 'text-blue-600 bg-blue-50',
              },
              {
                id: 'golden_bell',
                title: 'Rung chuông vàng',
                desc: 'Thử thách loại trực tiếp với thang câu hỏi nâng cao',
                color: 'text-rose-600 bg-rose-50',
              },
            ].map((game) => (
              <div
                key={game.id}
                onClick={() => handleAction('games')}
                className="p-4 rounded-2xl border border-slate-200/90 hover:border-pink-300 hover:shadow-xs transition bg-slate-50/40 cursor-pointer flex flex-col justify-between space-y-3 group min-h-[120px]"
              >
                <div className="space-y-1.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${game.color}`}>
                    <Gamepad2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-pink-600 transition">
                    {game.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {game.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-pink-600">
                  <span>Khởi động game</span>
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
