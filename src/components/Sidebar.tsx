import React from 'react';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileSpreadsheet,
  MonitorPlay,
  BarChart3,
  Gamepad2,
  Settings,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Role } from '../types';
import { playSound } from '../services/sound';

export type MainTab = 
  | 'dashboard'
  | 'classes'
  | 'questions'
  | 'matrix'
  | 'exam_room'
  | 'grading'
  | 'games'
  | 'settings';

interface SidebarProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  userRole: Role;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface MenuItem {
  id: MainTab;
  label: string;
  subLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  allowedRoles: Role[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  userRole,
  isOpenMobile,
  onCloseMobile,
}) => {
  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Tổng quan hệ thống',
      subLabel: 'Báo cáo & Phím tắt nhanh',
      icon: LayoutDashboard,
      allowedRoles: ['admin', 'teacher', 'student'],
    },
    {
      id: 'classes',
      label: 'Quản lý lớp & học sinh',
      subLabel: 'Danh sách, Nhập Excel',
      icon: Users,
      badge: '4 lớp',
      allowedRoles: ['admin', 'teacher'],
    },
    {
      id: 'questions',
      label: 'Môn học & ngân hàng câu hỏi',
      subLabel: 'Toán 10, 11, 12 GDPT 2018',
      icon: BookOpen,
      badge: 'Toán THPT',
      allowedRoles: ['admin', 'teacher'],
    },
    {
      id: 'matrix',
      label: 'Ma trận, đặc tả & đề thi',
      subLabel: 'Chuẩn Công văn 7991',
      icon: FileSpreadsheet,
      badge: '2025–2027',
      allowedRoles: ['admin', 'teacher'],
    },
    {
      id: 'exam_room',
      label: 'Phòng thi trực tuyến',
      subLabel: userRole === 'student' ? 'Làm bài kiểm tra & Nộp bài' : 'Giám sát thi & Trực quan',
      icon: MonitorPlay,
      badge: userRole === 'student' ? 'Bài mới' : 'Trực tiếp',
      allowedRoles: ['admin', 'teacher', 'student'],
    },
    {
      id: 'grading',
      label: 'Chấm điểm & thống kê',
      subLabel: 'Phổ điểm, Báo cáo & Chấm tự luận',
      icon: BarChart3,
      allowedRoles: ['admin', 'teacher', 'student'],
    },
    {
      id: 'games',
      label: 'Trò chơi học tập',
      subLabel: 'Vòng quay, Ô chữ, Đấu trường',
      icon: Gamepad2,
      badge: '4 Game',
      allowedRoles: ['admin', 'teacher', 'student'],
    },
    {
      id: 'settings',
      label: 'Tài khoản & cài đặt',
      subLabel: 'Google Sheets / GAS API & Phân quyền',
      icon: Settings,
      allowedRoles: ['admin', 'teacher', 'student'],
    },
  ];

  const handleSelect = (tab: MainTab) => {
    playSound('click');
    onTabChange(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[57px] left-0 h-screen lg:h-[calc(100vh-57px)] w-72 bg-white border-r border-slate-200 z-40 transition-transform duration-200 ease-in-out flex flex-col justify-between ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation list */}
        <div className="py-4 px-3 flex-1 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="px-3 pb-3 mb-1 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                Menu Chức Năng
              </span>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                {userRole === 'admin' ? 'Admin' : userRole === 'teacher' ? 'Giáo viên' : 'Học sinh'}
              </span>
            </div>

            <nav className="space-y-1 mt-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isAllowed = item.allowedRoles.includes(userRole);

                if (!isAllowed) {
                  return (
                    <div
                      key={item.id}
                      className="px-3.5 py-2.5 rounded-xl text-slate-300 flex items-center justify-between cursor-not-allowed select-none text-sm"
                      title="Chức năng chỉ dành cho Giáo viên / Quản trị viên"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-slate-300 shrink-0" />
                        <span className="text-[15px] font-medium line-through">{item.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-300">Khóa</span>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm font-semibold'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-indigo-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <div className="text-[15px] leading-tight truncate">
                          {item.label}
                        </div>
                        {item.subLabel && (
                          <div
                            className={`text-[11px] truncate mt-0.5 ${
                              isActive ? 'text-white/80' : 'text-slate-400 group-hover:text-indigo-500'
                            }`}
                          >
                            {item.subLabel}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      {item.badge && !isActive && (
                        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-500'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Notice Card at Sidebar Bottom */}
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/80 text-xs text-slate-700">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Công văn 7991/BGDĐT
            </div>
            <p className="text-[12px] text-slate-600 leading-relaxed">
              Cấu trúc đề Toán THPT: 12 trắc nghiệm 4 lựa chọn, 4 câu đúng/sai (a,b,c,d), 6 câu trả lời ngắn & tự luận.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
