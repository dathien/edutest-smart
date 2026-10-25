import React, { useState } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  LogOut, 
  UserCheck, 
  Sparkles,
  School,
  GraduationCap,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { User, Role } from '../types';
import { getSoundEnabled, setSoundEnabled, playSound } from '../services/sound';

interface HeaderProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  availableUsers: User[];
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onSelectUser, availableUsers }) => {
  const [soundActive, setSoundActive] = useState<boolean>(getSoundEnabled());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const toggleSound = () => {
    const nextState = !soundActive;
    setSoundActive(nextState);
    setSoundEnabled(nextState);
    if (nextState) {
      playSound('click');
    }
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'admin':
        return { label: 'Quản trị viên', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: ShieldCheck };
      case 'teacher':
        return { label: 'Giáo viên', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: School };
      case 'student':
        return { label: 'Học sinh', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: GraduationCap };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);
  const RoleIcon = roleInfo.icon;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 py-2.5 transition-all shadow-xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-lg tracking-wider">
            ES
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 bg-clip-text text-transparent">
                EDUTEST SMART
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                GDPT 2018
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-500 font-medium">
              Hệ thống kiểm tra, đánh giá và quản lý lớp học thông minh
            </p>
          </div>
        </div>

        {/* Right: Actions, Sound, Notifications, User Profile & Fast Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher for Test Evaluation */}
          <div className="hidden xl:flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <span className="text-slate-500 px-2 text-[11px]">Đổi vai trò:</span>
            {availableUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  onSelectUser(u);
                  playSound('click');
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currentUser.id === u.id
                    ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {u.role === 'admin' ? 'Quản trị' : u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
              </button>
            ))}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundActive ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
            className="p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors relative"
            aria-label="Bật tắt âm thanh"
          >
            {soundActive ? <Volume2 className="w-5 h-5 text-indigo-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                playSound('click');
              }}
              className="p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors relative"
              aria-label="Thông báo"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-800">Thông báo hệ thống</h4>
                  <span className="text-[11px] text-indigo-600 font-medium">3 mới</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  <div className="p-3 hover:bg-slate-50 transition-colors text-xs">
                    <p className="font-semibold text-slate-800">Bài kiểm tra Giữa kì I - 12A1</p>
                    <p className="text-slate-500 mt-0.5">48 học sinh đã nộp bài, 2 bài tự luận chờ chấm.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">15 phút trước</span>
                  </div>
                  <div className="p-3 hover:bg-slate-50 transition-colors text-xs">
                    <p className="font-semibold text-slate-800">Đăng ký giáo viên mới</p>
                    <p className="text-slate-500 mt-0.5">Thầy Trần Quốc Tuấn (THPT Nguyễn Thị Minh Khai) đang chờ duyệt.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Hôm nay</span>
                  </div>
                  <div className="p-3 hover:bg-slate-50 transition-colors text-xs">
                    <p className="font-semibold text-slate-800">Cập nhật ma trận CV 7991</p>
                    <p className="text-slate-500 mt-0.5">Hệ thống đã chuẩn hóa ma trận Toán 10, 11, 12 năm 2025-2026.</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Hôm qua</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-indigo-100">
                {currentUser.fullName.split(' ').slice(-1)[0][0]}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.fullName}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <RoleIcon className="w-3 h-3 text-indigo-600" />
                  <span className="text-[11px] font-medium text-slate-500">
                    {roleInfo.label}
                  </span>
                </div>
              </div>
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 rounded-t-xl">
                  <p className="text-xs text-slate-500">Đang đăng nhập với</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{currentUser.fullName}</p>
                  <p className="text-xs text-slate-500 font-mono">{currentUser.email}</p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-100 text-indigo-800">
                    <RoleIcon className="w-3 h-3" />
                    {roleInfo.label} · {currentUser.schoolName}
                  </div>
                </div>

                <div className="p-2">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase px-2 py-1">
                    Chuyển đổi tài khoản thử nghiệm
                  </div>
                  {availableUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u);
                        setShowUserDropdown(false);
                        playSound('click');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors ${
                        currentUser.id === u.id
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-left">
                        <p>{u.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-normal">
                          {u.role === 'admin' ? 'Quản trị viên' : u.role === 'teacher' ? 'Giáo viên Toán' : 'Học sinh'}
                        </p>
                      </div>
                      {currentUser.id === u.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-100 px-2 pt-2">
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      playSound('click');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất phiên làm việc
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
