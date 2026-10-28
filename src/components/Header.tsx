import React, { useState } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  LogOut, 
  School,
  GraduationCap,
  ShieldCheck,
  LogIn,
  LayoutDashboard,
  ArrowRight,
  Home,
  User as UserIcon,
  Link as LinkIcon,
} from 'lucide-react';
import { User, isAdminTeacher, isStudent } from '../types';
import { getSoundEnabled, setSoundEnabled, playSound } from '../services/sound';
import { UserProfileModal } from './auth/UserProfileModal';

interface HeaderProps {
  currentUser?: User | null;
  onSelectUser?: (user: User) => void;
  availableUsers?: User[];
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  onLogout?: () => void;
  onLoginClick?: () => void;
  onEnterWorkspace?: () => void;
  onGoHome?: () => void;
  onUserUpdated?: (user: User) => void;
  isHomePage?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentUser, 
  onToggleMobileMenu,
  onLogout,
  onLoginClick,
  onEnterWorkspace,
  onGoHome,
  onUserUpdated,
  isHomePage = false,
}) => {
  const [soundActive, setSoundActive] = useState<boolean>(getSoundEnabled());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const toggleSound = () => {
    const nextState = !soundActive;
    setSoundActive(nextState);
    setSoundEnabled(nextState);
    if (nextState) {
      playSound('click');
    }
  };

  const getRoleBadge = (u: User) => {
    if (isAdminTeacher(u)) {
      return { label: 'Giáo viên Quản trị', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: ShieldCheck };
    }
    if (isStudent(u)) {
      return { label: 'Học sinh', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: GraduationCap };
    }
    return { label: 'Giáo viên', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: School };
  };

  const getDisplayName = (u: User) => {
    const name = u.fullName.trim();
    if (u.salutation && !name.startsWith(u.salutation)) {
      return `${u.salutation} ${name}`;
    }
    return name;
  };

  const roleInfo = currentUser ? getRoleBadge(currentUser) : null;
  const RoleIcon = roleInfo ? roleInfo.icon : null;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center transition-all shadow-xs">
      <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
        {/* Left: Mobile Menu Toggle [☰] + Brand & Tagline */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Drawer Toggle Button [☰] (Only if drawer toggle passed) */}
          {onToggleMobileMenu && (
            <button
              onClick={() => {
                onToggleMobileMenu();
                playSound('click');
              }}
              className="lg:hidden p-2 -ml-1 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0 cursor-pointer"
              aria-label="Mở menu chức năng"
              title="Menu chức năng"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Logo badge */}
          <div 
            onClick={onGoHome}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-xs font-black text-sm sm:text-base tracking-wider shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
            title="Về trang chủ EduTest Smart"
          >
            ES
          </div>

          {/* Title & Tagline */}
          <div 
            onClick={onGoHome} 
            className="min-w-0 cursor-pointer group"
            title="Về trang chủ EduTest Smart"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 bg-clip-text text-transparent truncate group-hover:opacity-90">
                EDUTEST SMART
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 shrink-0">
                GDPT 2018
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-500 font-medium truncate">
              Hệ thống kiểm tra, đánh giá và quản lý lớp học thông minh
            </p>
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundActive ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
            className="p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors relative cursor-pointer"
            aria-label="Bật tắt âm thanh"
          >
            {soundActive ? <Volume2 className="w-5 h-5 text-indigo-600" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>

          {/* If NOT logged in -> Show prominent Login Button */}
          {!currentUser ? (
            <button
              onClick={() => {
                playSound('click');
                onLoginClick?.();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-sm transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </button>
          ) : (
            /* If ALREADY logged in */
            <>
              {/* If on public home page, show quick Enter Workspace button */}
              {isHomePage && onEnterWorkspace && (
                <button
                  onClick={() => {
                    playSound('click');
                    onEnterWorkspace();
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Vào không gian làm việc</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Notification Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    playSound('click');
                  }}
                  className="p-2 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors relative cursor-pointer"
                  aria-label="Thông báo hệ thống"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông báo</span>
                      <span className="text-[10px] text-indigo-600 font-semibold">Hệ thống</span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      <div className="p-3 hover:bg-slate-50 transition-colors text-xs">
                        <p className="font-semibold text-slate-800">Xác thực tài khoản</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Phiên làm việc bảo mật đã được xác thực an toàn.
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block">Vừa xong</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowUserDropdown(!showUserDropdown);
                    playSound('click');
                  }}
                  className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-indigo-100">
                    {currentUser.fullName.split(' ').slice(-1)[0][0]}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-bold text-slate-800 leading-tight">
                      {getDisplayName(currentUser)}
                    </div>
                    {roleInfo && RoleIcon && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <RoleIcon className="w-3 h-3 text-indigo-600" />
                        <span className="text-[11px] font-medium text-slate-500">
                          {roleInfo.label}
                        </span>
                      </div>
                    )}
                  </div>
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 rounded-t-xl">
                      <p className="text-xs text-slate-500">Đang đăng nhập với</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{getDisplayName(currentUser)}</p>
                      <p className="text-xs text-slate-500 font-mono">{currentUser.email}</p>
                      {roleInfo && RoleIcon && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-100 text-indigo-800">
                          <RoleIcon className="w-3 h-3" />
                          {roleInfo.label} · {currentUser.schoolName || 'GDPT 2018'}
                        </div>
                      )}
                    </div>

                    <div className="p-2 space-y-1">
                      {onEnterWorkspace && isHomePage && (
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            playSound('click');
                            onEnterWorkspace();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors font-medium cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Vào không gian làm việc
                        </button>
                      )}

                      {!isHomePage && onGoHome && (
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            playSound('click');
                            onGoHome();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium cursor-pointer"
                        >
                          <Home className="w-4 h-4" />
                          Về trang chủ giới thiệu
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          playSound('click');
                          setShowProfileModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors font-medium cursor-pointer"
                      >
                        <LinkIcon className="w-4 h-4 text-indigo-600" />
                        Hồ sơ & Phương thức đăng nhập
                      </button>

                      {onLogout && (
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            playSound('click');
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          Đăng xuất phiên làm việc
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Hồ sơ cá nhân & Liên kết tài khoản */}
      {currentUser && (
        <UserProfileModal
          currentUser={currentUser}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onUserUpdated={(updatedUser) => {
            onUserUpdated?.(updatedUser);
          }}
        />
      )}
    </header>
  );
};
