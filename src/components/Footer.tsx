import React from 'react';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-slate-200 py-4 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">EDUTEST SMART</span>
          <span>·</span>
          <span>Hệ thống kiểm tra, đánh giá và quản lý lớp học thông minh THPT GDPT 2018</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <span>Copyright © 2026 – Phát triển bởi</span>
          <span className="font-bold text-indigo-700">GV. Hồ Nguyễn Đa Thiện</span>
        </div>
      </div>
    </footer>
  );
};
