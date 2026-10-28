import React, { useState } from 'react';
import {
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Trash2,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
} from 'lucide-react';
import { User } from '../../types';
import { playSound } from '../../services/sound';
import { GoogleLogoIcon } from './LoginPage';
import {
  linkGoogleToCurrentAccount,
  unlinkGoogleFromCurrentAccount,
  signInWithGoogleRedirect,
} from '../../services/googleAuth';

interface LinkedAccountsCardProps {
  currentUser: User;
  onUserUpdated: (updatedUser: User) => void;
}

export const LinkedAccountsCard: React.FC<LinkedAccountsCardProps> = ({
  currentUser,
  onUserUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRedirectOption, setShowRedirectOption] = useState(false);
  const [showConfirmUnlink, setShowConfirmUnlink] = useState(false);

  // Kiểm tra phương thức Google đã liên kết chưa
  const hasGoogleLinked =
    (currentUser.linkedProviders && currentUser.linkedProviders.includes('google.com')) ||
    !!currentUser.googleEmail ||
    !!currentUser.googleUid;

  // Kiểm tra phương thức mật khẩu
  const hasPasswordAuth =
    !currentUser.linkedProviders ||
    currentUser.linkedProviders.includes('password') ||
    !hasGoogleLinked;

  const handleLinkGoogle = async () => {
    playSound('click');
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowRedirectOption(false);

    const token =
      sessionStorage.getItem('edutest_token') ||
      localStorage.getItem('edutest_token') ||
      '';

    try {
      const result = await linkGoogleToCurrentAccount(token, currentUser);

      if (result.success && result.user) {
        playSound('correct');
        setSuccessMessage(
          result.message || 'Liên kết tài khoản Google thành công! Từ bây giờ bạn có thể đăng nhập bằng cả 2 cách.'
        );
        onUserUpdated(result.user);
      } else {
        playSound('wrong');
        setErrorMessage(result.message || 'Không thể liên kết tài khoản Google.');
        if (result.message?.includes('chặn cửa sổ') || result.message?.includes('popup')) {
          setShowRedirectOption(true);
        }
      }
    } catch (err: unknown) {
      playSound('wrong');
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    playSound('click');
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const token =
      sessionStorage.getItem('edutest_token') ||
      localStorage.getItem('edutest_token') ||
      '';

    try {
      const result = await unlinkGoogleFromCurrentAccount(token);

      if (result.success && result.user) {
        playSound('correct');
        setSuccessMessage('Đã hủy liên kết Google. Bạn vẫn có thể đăng nhập bình thường bằng Email/Mật khẩu.');
        setShowConfirmUnlink(false);
        onUserUpdated(result.user);
      } else {
        playSound('wrong');
        setErrorMessage(result.message || 'Không thể hủy liên kết Google.');
      }
    } catch (err: unknown) {
      playSound('wrong');
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-indigo-600" />
            Phương thức đăng nhập đã liên kết
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Đăng nhập linh hoạt bằng Email/Mật khẩu hoặc Google Sign-In trong khi bảo toàn 100% dữ liệu và vai trò.
          </p>
        </div>
        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg shrink-0">
          Xác thực kép an toàn
        </span>
      </div>

      {/* Thông báo phản hồi */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-start gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Tùy chọn Redirect nếu Popup bị chặn */}
      {showRedirectOption && (
        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 space-y-2">
          <div className="font-bold flex items-center gap-1.5">
            <ExternalLink className="w-4 h-4 text-indigo-600" />
            Cửa sổ Popup bị trình duyệt chặn?
          </div>
          <p className="text-slate-600 text-xs">
            Bạn có thể chuyển hướng trang để liên kết Google mà không cần mở cửa sổ phụ:
          </p>
          <button
            type="button"
            onClick={() => signInWithGoogleRedirect()}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors cursor-pointer min-h-[44px]"
          >
            Tiếp tục bằng Chuyển hướng (Redirect)
          </button>
        </div>
      )}

      {/* Danh sách 2 phương thức */}
      <div className="space-y-3">
        {/* 1. Email & Mật khẩu */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>Tên đăng nhập / Email & Mật khẩu</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {hasPasswordAuth ? 'Đang hoạt động' : 'Chưa thiết lập'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tài khoản: <strong className="text-slate-700">{currentUser.username}</strong> ({currentUser.email})
              </p>
            </div>
          </div>
          <div className="text-right sm:text-xs text-[11px] text-slate-500 italic">
            Xác thực qua máy chủ EduTest Smart
          </div>
        </div>

        {/* 2. Tài khoản Google (Gmail) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0">
              <GoogleLogoIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span>Google Sign-In (Gmail)</span>
                {hasGoogleLinked ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Đã liên kết
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    Chưa liên kết
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {hasGoogleLinked ? (
                  <span>
                    Email liên kết: <strong className="text-slate-700">{currentUser.googleEmail || currentUser.email}</strong>
                  </span>
                ) : (
                  <span>Đăng nhập nhanh 1-chạm mà không cần nhớ mật khẩu</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            {hasGoogleLinked ? (
              <>
                {showConfirmUnlink ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConfirmUnlink(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-slate-100 rounded-lg min-h-[44px]"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleUnlinkGoogle}
                      disabled={loading}
                      className="px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg min-h-[44px] flex items-center gap-1.5"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Xác nhận gỡ
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmUnlink(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer min-h-[44px]"
                  >
                    Hủy liên kết
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={handleLinkGoogle}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px] disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang liên kết Google...</span>
                  </>
                ) : (
                  <>
                    <GoogleLogoIcon className="w-4 h-4 shrink-0" />
                    <span>Liên kết tài khoản Google</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cam kết an toàn & Nguyên tắc bảo mật */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
        <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Cam kết bảo mật & Toàn vẹn dữ liệu:
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
          <li>
            <strong>Bảo toàn tuyệt đối:</strong> Liên kết Google giữ nguyên 100% UID tài khoản, lịch sử đề thi, bài tập và điểm số.
          </li>
          <li>
            <strong>Phân quyền bất biến:</strong> Tuyệt đối không thay đổi vai trò Giáo viên / Học sinh và không thể tự nâng quyền Quản trị (ADMIN).
          </li>
          <li>
            <strong>Chống xung đột:</strong> Nếu tài khoản Google đã thuộc về một người dùng khác, hệ thống sẽ cảnh báo an toàn và không tự động gộp hoặc ghi đè hồ sơ.
          </li>
          <li>
            <strong>Bảo mật thông tin:</strong> Hệ thống không yêu cầu mật khẩu Gmail và không lưu access token vào cơ sở dữ liệu.
          </li>
        </ul>
      </div>
    </div>
  );
};
