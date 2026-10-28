import React from 'react';
import { X, User as UserIcon, School, GraduationCap, ShieldCheck } from 'lucide-react';
import { User, isAdminTeacher, isStudent } from '../../types';
import { LinkedAccountsCard } from './LinkedAccountsCard';

interface UserProfileModalProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (user: User) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  if (!isOpen) return null;

  const roleLabel = isAdminTeacher(currentUser)
    ? 'Giáo viên Quản trị (ADMIN)'
    : isStudent(currentUser)
    ? 'Học sinh'
    : 'Giáo viên (STANDARD)';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
              {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{currentUser.fullName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500">{currentUser.email}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông tin trường lớp */}
        <div className="grid grid-cols-2 gap-3 my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block">Đơn vị / Trường học:</span>
            <strong className="text-slate-800 mt-0.5 block truncate">{currentUser.schoolName || 'THPT GDPT 2018'}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Mã định danh:</span>
            <strong className="text-slate-800 mt-0.5 block font-mono">{currentUser.teacherCode || (currentUser as any).studentCode || currentUser.id}</strong>
          </div>
        </div>

        {/* Thẻ Quản lý Phương thức Đăng nhập Đã Liên Kết */}
        <LinkedAccountsCard
          currentUser={currentUser}
          onUserUpdated={onUserUpdated}
        />

        {/* Nút đóng */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer min-h-[44px]"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
