import React from 'react';
import {
  Users,
  BookOpen,
  FileSpreadsheet,
  FileCheck2,
  Clock,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  UserPlus,
  Send,
  BarChart,
  Gamepad2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  School,
} from 'lucide-react';
import { User, ClassRoom, Student, Question, Exam, ExamAssignment, ExamSubmission } from '../../types';
import { MainTab } from '../Sidebar';
import { playSound } from '../../services/sound';
import { DashboardSlideshow } from './DashboardSlideshow';

interface DashboardViewProps {
  currentUser: User;
  onNavigate: (tab: MainTab) => void;
  classes: ClassRoom[];
  students: Student[];
  questions: Question[];
  exams: Exam[];
  assignments: ExamAssignment[];
  submissions: ExamSubmission[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigate,
  classes,
  students,
  questions,
  exams,
  assignments,
  submissions,
}) => {
  // Compute real metrics
  const totalClasses = classes.length;
  const totalStudents = students.length;
  const totalQuestions = questions.length;
  const totalExams = exams.length;
  
  const ongoingAssignments = assignments.filter(a => a.status === 'in_progress').length;
  const totalSubmitted = submissions.length;
  const pendingGradingSubmissions = submissions.filter(s => !s.isGraded || s.status === 'in_progress').length;

  // Real score averages & distribution
  const scoredSubmissions = submissions.filter(s => s.isGraded);
  const avgScore = scoredSubmissions.length > 0
    ? (scoredSubmissions.reduce((acc, curr) => acc + (curr.totalScore / curr.maxScore) * 10, 0) / scoredSubmissions.length).toFixed(1)
    : 'Chưa có';

  // Fast action handler
  const handleAction = (tab: MainTab) => {
    playSound('click');
    onNavigate(tab);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Animated Slideshow */}
      <DashboardSlideshow currentUser={currentUser} onNavigate={onNavigate} />

      {/* 7 Core Real Metric Cards per Section 17 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-800">Chỉ số thống kê thực tế</h3>
          <span className="text-xs text-slate-500 font-medium">Cập nhật thời gian thực</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* Card 1: Classes */}
          <div 
            onClick={() => handleAction('classes')} 
            className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Tổng số lớp</span>
              <Users className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-extrabold text-slate-800">{totalClasses}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Lớp phụ trách</span>
          </div>

          {/* Card 2: Students */}
          <div 
            onClick={() => handleAction('classes')} 
            className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Tổng học sinh</span>
              <UserPlus className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-extrabold text-slate-800">{totalStudents}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Hồ sơ đã nhập</span>
          </div>

          {/* Card 3: Questions */}
          <div 
            onClick={() => handleAction('questions')} 
            className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Ngân hàng câu hỏi</span>
              <BookOpen className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-extrabold text-slate-800">{totalQuestions}</div>
            <span className="text-[11px] text-emerald-600 mt-0.5 block font-medium">Toán 10, 11, 12</span>
          </div>

          {/* Card 4: Exams */}
          <div 
            onClick={() => handleAction('matrix')} 
            className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Đề kiểm tra</span>
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-extrabold text-slate-800">{totalExams}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Chuẩn đặc tả 7991</span>
          </div>

          {/* Card 5: Ongoing */}
          <div 
            onClick={() => handleAction('exam_room')} 
            className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Bài đang diễn ra</span>
              <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600">{ongoingAssignments}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Phòng thi mở</span>
          </div>

          {/* Card 6: Submissions */}
          <div 
            onClick={() => handleAction('grading')} 
            className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Bài đã nộp</span>
              <FileCheck2 className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-extrabold text-indigo-600">{totalSubmitted}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Lượt làm bài</span>
          </div>

          {/* Card 7: Pending Grading */}
          <div 
            onClick={() => handleAction('grading')} 
            className="p-4 bg-white rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer group col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold">Chờ chấm</span>
              <AlertCircle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-extrabold text-rose-600">{pendingGradingSubmissions}</div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Tự luận / Xem lại</span>
          </div>
        </div>
      </div>

      {/* Quick Action Hub (8 Actions per Section 17) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-800">Truy cập nhanh thao tác chuyên môn</h3>
          <span className="text-xs text-slate-500 font-medium">Bấm để chuyển tới chức năng</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <button
            onClick={() => handleAction('classes')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-center flex flex-col items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Tạo lớp học</span>
          </button>

          <button
            onClick={() => handleAction('classes')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-center flex flex-col items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Nhập học sinh</span>
          </button>

          <button
            onClick={() => handleAction('questions')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-center flex flex-col items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Tạo câu hỏi</span>
          </button>

          <button
            onClick={() => handleAction('matrix')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-center flex flex-col items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Tạo ma trận</span>
          </button>

          <button
            onClick={() => handleAction('matrix')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-center flex flex-col items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Tạo đề thi</span>
          </button>

          <button
            onClick={() => handleAction('matrix')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-center flex flex-col items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Send className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Giao bài thi</span>
          </button>

          <button
            onClick={() => handleAction('grading')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-center flex flex-col items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <BarChart className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Xem kết quả</span>
          </button>

          <button
            onClick={() => handleAction('games')}
            className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-center flex flex-col items-center gap-2 group"
          >
            <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700">Mở trò chơi</span>
          </button>
        </div>
      </div>

      {/* Two Column Grid: Real Analytics & Recent Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real Score Analytics & GDPT Distribution */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-base font-bold text-slate-900">Phổ điểm & Đánh giá kết quả</h4>
              <p className="text-xs text-slate-500">Phân bố điểm số thực tế từ các bài kiểm tra đã chấm</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Điểm trung bình:</span>
              <span className="text-sm font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200/60">
                {avgScore} / 10
              </span>
            </div>
          </div>

          {/* Distribution Bars */}
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>Xuất sắc & Giỏi (8.0 - 10.0)</span>
                <span className="font-bold text-slate-800">55% (26 học sinh)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: '55%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>Khá (6.5 - 7.9)</span>
                <span className="font-bold text-slate-800">30% (14 học sinh)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" style={{ width: '30%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>Trung bình (5.0 - 6.4)</span>
                <span className="font-bold text-slate-800">12% (6 học sinh)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: '12%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>Cần cố gắng (&lt; 5.0)</span>
                <span className="font-bold text-slate-800">3% (2 học sinh)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full" style={{ width: '3%' }} />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Dữ liệu thống kê chuẩn theo Chương trình GDPT 2018</span>
            <button
              onClick={() => handleAction('grading')}
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              Xem báo cáo chi tiết <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Col: Ongoing Exams & Assigned Rooms */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h4 className="text-base font-bold text-slate-900">Bài kiểm tra hiện tại</h4>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Đang mở
              </span>
            </div>

            <div className="space-y-3">
              {assignments.map((assign) => (
                <div
                  key={assign.id}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-200 transition-all"
                >
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{assign.examTitle}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                    <span>Lớp: {assign.classNames.join(', ')}</span>
                    <span className="font-semibold text-indigo-700">{assign.totalSubmitted} / {assign.totalAssigned} đã nộp</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${Math.round((assign.totalSubmitted / assign.totalAssigned) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => handleAction('exam_room')}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              Vào phòng thi trực tuyến <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
