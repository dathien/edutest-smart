import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileSpreadsheet,
  Users,
  Compass,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  MonitorPlay,
  Layers,
  Sparkles,
} from 'lucide-react';
import { User, isTeacher, isStudent } from '../../types';
import { MainTab } from '../Sidebar';
import { playSound } from '../../services/sound';

interface DashboardSlideshowProps {
  currentUser?: User | null;
  onNavigate?: (tab: MainTab) => void;
  onActionClick?: (targetTab: MainTab) => void;
  className?: string;
}

export const DashboardSlideshow: React.FC<DashboardSlideshowProps> = ({
  currentUser,
  onNavigate,
  onActionClick,
  className = '',
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const slides = [
    // Slide 1: Kiểm tra & đánh giá
    {
      id: 0,
      badge: 'Khảo thí & Đánh giá',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      badgeIcon: FileSpreadsheet,
      title: 'Kiểm Tra & Đánh Giá Chuẩn GDPT 2018',
      description:
        'Biên soạn ma trận đề thi chuẩn Công văn 7991/BGDĐT, 4 dạng thức câu hỏi phân hóa, phòng thi chống gian lận và chấm tự động.',
      actionLabel: 'Mở ma trận & đề kiểm tra',
      targetTab: 'matrix' as MainTab,
      highlightPills: ['Chuẩn CV 7991', '4 dạng thức trắc nghiệm', 'Chấm tự động'],
      themeColor: 'from-emerald-600 via-teal-600 to-indigo-700',
      accentBg: 'bg-emerald-500/10 text-emerald-600',
      svgGraphic: (
        <svg viewBox="0 0 160 100" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
          <rect x="10" y="10" width="140" height="80" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="20" y="20" width="70" height="8" rx="3" fill="#10b981" />
          <rect x="20" y="34" width="120" height="4" rx="2" fill="#cbd5e1" />
          <rect x="20" y="42" width="105" height="4" rx="2" fill="#e2e8f0" />
          <rect x="20" y="50" width="115" height="4" rx="2" fill="#e2e8f0" />
          {/* Question Choices Mini Pills */}
          <rect x="20" y="62" width="26" height="16" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
          <text x="33" y="73" fill="#047857" fontSize="8" fontWeight="bold" textAnchor="middle">A</text>
          <rect x="52" y="62" width="26" height="16" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          <text x="65" y="73" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">B</text>
          <rect x="84" y="62" width="26" height="16" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          <text x="97" y="73" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">C</text>
          <rect x="116" y="62" width="26" height="16" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          <text x="129" y="73" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">D</text>
          {/* 10 Score badge */}
          <circle cx="130" cy="24" r="10" fill="#f59e0b" />
          <text x="130" y="27" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">10đ</text>
        </svg>
      ),
    },

    // Slide 2: Quản lý lớp học
    {
      id: 1,
      badge: 'Quản lý & Đồng bộ',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      badgeIcon: Users,
      title: 'Quản Lý Lớp Học & Học Sinh Toàn Diện',
      description:
        'Đồng bộ danh sách học sinh từ Excel, phân công chuyên môn giáo viên, phân lớp linh hoạt và lưu trữ lịch sử thi an toàn.',
      actionLabel: 'Mở quản lý lớp học',
      targetTab: 'classes' as MainTab,
      highlightPills: ['Nhập xuất file Excel', 'Quản lý danh sách lớp', 'Bảo toàn dữ liệu'],
      themeColor: 'from-indigo-600 via-indigo-700 to-purple-800',
      accentBg: 'bg-indigo-500/10 text-indigo-600',
      svgGraphic: (
        <svg viewBox="0 0 160 100" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
          {/* Classroom cards stacked */}
          <rect x="15" y="15" width="130" height="70" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
          <rect x="25" y="24" width="45" height="14" rx="4" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1" />
          <text x="47" y="34" fill="#4338ca" fontSize="8" fontWeight="bold" textAnchor="middle">Lớp 12A1</text>
          <rect x="75" y="24" width="45" height="14" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
          <text x="97" y="34" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">Lớp 10A2</text>
          {/* Student rows */}
          <circle cx="32" cy="52" r="5" fill="#c7d2fe" />
          <rect x="42" y="49" width="60" height="6" rx="3" fill="#cbd5e1" />
          <circle cx="125" cy="52" r="4" fill="#10b981" />

          <circle cx="32" cy="68" r="5" fill="#fbcfe8" />
          <rect x="42" y="65" width="50" height="6" rx="3" fill="#cbd5e1" />
          <circle cx="125" cy="68" r="4" fill="#10b981" />
        </svg>
      ),
    },

    // Slide 3: Phòng Lab & Ôn tập
    {
      id: 2,
      badge: 'Mô phỏng 2D/3D & Trò chơi',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      badgeIcon: Compass,
      title: 'Phòng Lab Toán Học 10–12 & Ôn Tập',
      description:
        'Tương tác thực với 8 mô phỏng giải tích 2D và không gian 3D Three.js, cùng 4 trò chơi học tập kích thích hứng thú cuối giờ.',
      actionLabel: 'Vào phòng Lab 2D/3D',
      targetTab: 'math_lab' as MainTab,
      highlightPills: ['8 Lab tương tác thực', 'Không gian 3D Three.js', '4 Trò chơi học tập'],
      themeColor: 'from-cyan-700 via-blue-700 to-indigo-900',
      accentBg: 'bg-cyan-500/10 text-cyan-600',
      svgGraphic: (
        <svg viewBox="0 0 160 100" className="w-full h-full select-none" preserveAspectRatio="xMidYMid meet">
          <rect width="160" height="100" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
          {/* 3D Axes Mini */}
          <line x1="80" y1="55" x2="40" y2="80" stroke="#ef4444" strokeWidth="1.5" />
          <line x1="80" y1="55" x2="135" y2="55" stroke="#10b981" strokeWidth="1.5" />
          <line x1="80" y1="55" x2="80" y2="15" stroke="#3b82f6" strokeWidth="1.5" />
          {/* 3D Pyramid */}
          <polygon points="80,18 45,75 75,85 125,75" fill="#6366f1" fillOpacity="0.2" stroke="#4f46e5" strokeWidth="1.2" />
          <line x1="80" y1="18" x2="75" y2="85" stroke="#4f46e5" strokeWidth="1.5" />
          <circle cx="80" cy="18" r="3" fill="#ef4444" />
          <circle cx="100" cy="40" r="2.5" fill="#f59e0b" />
          {/* Sine wave accent */}
          <path d="M 15 35 Q 25 15, 35 35 T 55 35" fill="none" stroke="#06b6d4" strokeWidth="1.5" />
        </svg>
      ),
    },
  ];

  // Auto-switch slide every 6 seconds
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide]);

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const current = slides[currentSlide];
  const BadgeIcon = current.badgeIcon;

  const handleAction = () => {
    if (onActionClick) {
      onActionClick(current.targetTab);
    } else if (onNavigate) {
      onNavigate(current.targetTab);
    }
  };

  return (
    <div
      className={`relative w-full rounded-2xl bg-white border border-slate-200/90 shadow-sm overflow-hidden transition-all duration-300 ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 6-second Top Progress Bar */}
      <div className="w-full bg-slate-100 h-1 overflow-hidden">
        <div
          key={currentSlide}
          className={`h-full bg-indigo-600 transition-all ${
            isPaused ? 'opacity-50' : 'animate-progress-6s'
          }`}
          style={{ width: isPaused ? '100%' : undefined }}
        />
      </div>

      <div className="p-4 sm:p-5 lg:p-6 flex flex-col md:flex-row items-center justify-between gap-5 min-h-[170px] sm:min-h-[185px]">
        {/* Left: Text & Info */}
        <div className="space-y-2.5 max-w-2xl w-full">
          {/* Badge & Step indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${current.badgeColor}`}
            >
              <BadgeIcon className="w-3.5 h-3.5" />
              {current.badge}
            </span>

            <span className="text-[11px] font-mono text-slate-400">
              Trang {currentSlide + 1} / {slides.length}
            </span>
          </div>

          <h2 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 tracking-tight leading-snug">
            {current.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {current.description}
          </p>

          {/* Highlight Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {current.highlightPills.map((pill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/80 font-medium"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                <span>{pill}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Right: Real UI SVG Graphic & Action Button */}
        <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 w-full md:w-56 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          <div className="w-36 h-20 sm:w-44 sm:h-24 rounded-xl overflow-hidden shadow-2xs border border-slate-200/70 bg-slate-50 flex items-center justify-center p-1">
            {current.svgGraphic}
          </div>

          <button
            type="button"
            onClick={handleAction}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer min-h-[44px] min-w-[44px]"
          >
            <span>{current.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Controls Bar: Dots & Nav Buttons (Touch Target >= 44x44px) */}
      <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 flex items-center justify-between">
        {/* Dot Indicators */}
        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                playSound('click');
                setCurrentSlide(idx);
              }}
              className={`transition-all rounded-full cursor-pointer p-1 ${
                currentSlide === idx
                  ? 'w-7 h-2.5 bg-indigo-600'
                  : 'w-2.5 h-2.5 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Chuyển đến slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Navigation & Pause Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-200/60 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            title={isPaused ? 'Tiếp tục tự chuyển' : 'Tạm dừng tự chuyển'}
            aria-label={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              playSound('click');
              prevSlide();
            }}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-200/60 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Slide trước"
            title="Slide trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              playSound('click');
              nextSlide();
            }}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-200/60 rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Slide tiếp theo"
            title="Slide tiếp theo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
