import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  BookOpen,
  MonitorPlay,
  BarChart3,
  School,
  CheckCircle2,
  Layers,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { User } from '../../types';
import { MainTab } from '../Sidebar';
import { playSound } from '../../services/sound';

interface DashboardSlideshowProps {
  currentUser: User;
  onNavigate: (tab: MainTab) => void;
}

export const DashboardSlideshow: React.FC<DashboardSlideshowProps> = ({ currentUser, onNavigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Dynamic greeting: ensure personalized salutation
  const getGreetingName = () => {
    const name = currentUser.fullName.trim();
    const salutation = currentUser.salutation?.trim();
    if (salutation && !name.startsWith(salutation)) {
      return `${salutation} ${name}`;
    }
    return name;
  };

  const slides = [
    // Slide 1 – Học tập và đánh giá thông minh
    {
      id: 1,
      badge: 'Nền tảng Giáo dục Thông minh',
      badgeIcon: Sparkles,
      title: 'EDUTEST SMART – HỌC TẬP VÀ ĐÁNH GIÁ THÔNG MINH',
      description: 'Quản lý lớp học, tổ chức kiểm tra và theo dõi kết quả học tập trên cùng một nền tảng.',
      highlight: `Xin chào, ${getGreetingName()}!`,
      pills: [
        { label: currentUser.schoolName || 'Trường THPT', icon: School },
        { label: `Vai trò: ${currentUser.role === 'admin' ? 'Quản trị viên' : currentUser.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}`, icon: ShieldCheck },
        { label: 'Năm học 2025–2026', icon: CheckCircle2 },
      ],
      actionLabel: 'Khám phá tính năng',
      targetTab: 'classes' as MainTab,
    },
    // Slide 2 – Tạo đề kiểm tra dễ dàng
    {
      id: 2,
      badge: 'Cấu trúc & Đề kiểm tra',
      badgeIcon: FileSpreadsheet,
      title: 'TẠO ĐỀ KIỂM TRA DỄ DÀNG',
      description: 'Xây dựng đề kiểm tra phù hợp nội dung bài học, khối lớp và mục tiêu đánh giá.',
      highlight: 'Ma trận Toán 10, 11, 12 chuẩn hóa và đồng bộ câu hỏi',
      pills: [
        { label: '4 dạng thức chuẩn GDPT', icon: Layers },
        { label: 'Bản đặc tả chi tiết', icon: CheckCircle2 },
        { label: 'Tự động tạo nhiều mã đề', icon: TrendingUp },
      ],
      actionLabel: 'Tạo đề kiểm tra',
      targetTab: 'matrix' as MainTab,
    },
    // Slide 3 – Ngân hàng câu hỏi khoa học
    {
      id: 3,
      badge: 'Kho học liệu số',
      badgeIcon: BookOpen,
      title: 'NGÂN HÀNG CÂU HỎI KHOA HỌC',
      description: 'Sắp xếp, tìm kiếm và sử dụng câu hỏi thuận tiện cho từng môn học.',
      highlight: 'Hỗ trợ công thức Toán KaTeX, đồ thị hàm số và hình học không gian',
      pills: [
        { label: 'Phân loại Biết - Hiểu - Vận dụng', icon: CheckCircle2 },
        { label: 'Nhập tệp Word & Excel', icon: Layers },
        { label: 'Biên soạn trực quan linh hoạt', icon: CheckCircle2 },
      ],
      actionLabel: 'Mở ngân hàng câu hỏi',
      targetTab: 'questions' as MainTab,
    },
    // Slide 4 – Kiểm tra trực tuyến thuận tiện
    {
      id: 4,
      badge: 'Phòng thi trực tuyến',
      badgeIcon: MonitorPlay,
      title: 'KIỂM TRA TRỰC TUYẾN THUẬN TIỆN',
      description: 'Giao bài, theo dõi tiến độ và quản lý kết quả kiểm tra của học sinh.',
      highlight: 'Giám sát thời gian thực & tự động lưu bài làm an toàn',
      pills: [
        { label: 'Bảng câu hỏi điều hướng dễ dàng', icon: CheckCircle2 },
        { label: 'Đồng hồ đếm ngược tự động', icon: ShieldCheck },
        { label: 'Theo dõi tiến trình trực tiếp', icon: MonitorPlay },
      ],
      actionLabel: 'Quản lý kiểm tra',
      targetTab: 'exam_room' as MainTab,
    },
    // Slide 5 – Theo dõi tiến bộ học tập
    {
      id: 5,
      badge: 'Đánh giá & Thống kê',
      badgeIcon: BarChart3,
      title: 'THEO DÕI TIẾN BỘ HỌC TẬP',
      description: 'Thống kê kết quả, nhận diện nội dung cần củng cố và hỗ trợ học sinh tiến bộ.',
      highlight: 'Biểu đồ trực quan, phổ điểm chi tiết và xuất báo cáo điểm số',
      pills: [
        { label: 'Chấm trắc nghiệm tự động', icon: CheckCircle2 },
        { label: 'Thống kê 5 dải điểm chuẩn', icon: TrendingUp },
        { label: 'Xuất dữ liệu Excel & PDF', icon: FileSpreadsheet },
      ],
      actionLabel: 'Xem thống kê',
      targetTab: 'grading' as MainTab,
    },
  ];

  // Auto-advance interval: Exactly 6 seconds (6000ms)
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const handlePrev = () => {
    playSound('click');
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    playSound('click');
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleGoTo = (index: number) => {
    playSound('click');
    setCurrentSlide(index);
  };

  // Touch swipe support on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const current = slides[currentSlide];
  const BadgeIcon = current.badgeIcon;

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-lg select-none min-h-[240px] md:min-h-[260px] flex flex-col justify-between p-5 md:p-7 text-white transition-all duration-300"
      style={{
        background: 'linear-gradient(120deg, #6D28D9 0%, #4F46E5 48%, #2563EB 100%)',
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Subtle ambient light shapes - purely decorative, high contrast preserved */}
      <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -left-12 -top-12 w-56 h-56 rounded-full bg-indigo-300/10 blur-xl pointer-events-none" />

      {/* Top row: Badge & Slide counter */}
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[#FFFFFF] text-xs font-semibold border border-white/25 shadow-xs">
          <BadgeIcon className="w-3.5 h-3.5 text-[#E0E7FF]" />
          <span>{current.badge}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12px] font-mono font-bold text-[#FFFFFF] bg-black/30 px-2.5 py-0.5 rounded-md border border-white/15">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>
      </div>

      {/* Middle row: Slide content with key for fresh fade/slide entrance */}
      <div
        key={currentSlide}
        className="relative z-10 my-auto py-2 max-w-3xl transition-opacity duration-500 ease-out animate-fadeIn"
      >
        {/* Title: Pure white, font-weight 800 (extrabold), WCAG AA compliant */}
        <h2
          className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-snug"
          style={{ color: '#FFFFFF', fontWeight: 800 }}
        >
          {current.title}
        </h2>

        {/* Personalized highlight / sub-label */}
        {current.highlight && (
          <div
            className="text-xs sm:text-sm md:text-base font-bold mt-1.5 flex items-center gap-1.5"
            style={{ color: '#FDE047' }}
          >
            <span>★</span>
            <span>{current.highlight}</span>
          </div>
        )}

        {/* Description: High contrast #F1F5F9 */}
        <p
          className="mt-1.5 text-xs sm:text-sm md:text-[15px] leading-relaxed max-w-2xl font-medium"
          style={{ color: '#F1F5F9' }}
        >
          {current.description}
        </p>

        {/* Info pills: #E0E7FF text */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {current.pills.map((p, idx) => {
            const PillIcon = p.icon;
            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 border border-white/20 font-medium"
                style={{ color: '#E0E7FF' }}
              >
                <PillIcon className="w-3.5 h-3.5 text-[#E0E7FF] shrink-0" />
                <span>{p.label}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Bottom row: Action button & Navigation Controls */}
      <div className="flex items-center justify-between gap-4 pt-3 relative z-10 border-t border-white/15">
        {/* Action Button: White with dark indigo text */}
        <button
          onClick={() => {
            playSound('click');
            onNavigate(current.targetTab);
          }}
          className="text-xs sm:text-sm font-bold px-4 py-2 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
        >
          <span>{current.actionLabel}</span>
          <span className="font-mono">→</span>
        </button>

        {/* Right side: Dots & Arrows */}
        <div className="flex items-center gap-3">
          {/* Indicator dots */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/30 border border-white/15">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => handleGoTo(i)}
                aria-label={`Chuyển tới slide ${i + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  i === currentSlide
                    ? 'w-6 h-2 bg-white shadow-xs'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/80'
                }`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              aria-label="Slide trước"
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/35 active:bg-white/40 border border-white/25 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Slide tiếp theo"
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/35 active:bg-white/40 border border-white/25 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
