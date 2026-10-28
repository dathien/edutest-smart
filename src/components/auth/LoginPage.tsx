import React, { useState, useEffect } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LogIn,
  HelpCircle,
  AlertCircle,
  X,
  ArrowLeft,
  GraduationCap,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Sparkles,
  School,
  Phone,
  BookOpen,
} from 'lucide-react';
import { User, TeacherPermission } from '../../types';
import { playSound } from '../../services/sound';
import {
  signInWithGooglePopup,
  signInWithGoogleRedirect,
  checkGoogleRedirectResult,
  fetchFirestoreUserProfile,
  completeGoogleRegistration,
  loginExistingGoogleUser,
  formatGoogleAuthError,
  isFirebaseAuthReady,
  signInWithFirebaseEmailPassword,
  GoogleRegistrationPayload,
} from '../../services/googleAuth';
import { getFirebaseStatus } from '../../services/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
  onBackToHome: () => void;
}

export const GoogleLogoIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToHome }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showRedirectOption, setShowRedirectOption] = useState(false);

  // Modal / Step hoàn tất đăng ký tài khoản Google
  const [pendingGoogleUser, setPendingGoogleUser] = useState<FirebaseUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<'TEACHER' | 'STUDENT'>('STUDENT');
  const [fullName, setFullName] = useState('');
  const [schoolName, setSchoolName] = useState('THPT GDPT 2018');
  const [phone, setPhone] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [gender, setGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [teachingSubjects, setTeachingSubjects] = useState<string[]>(['TOAN_12']);
  const [registrationSubmitting, setRegistrationSubmitting] = useState(false);
  const [firestoreNotice, setFirestoreNotice] = useState<string | null>(null);

  // Kiểm tra kết quả Redirect khi trang được tải lại
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const user = await checkGoogleRedirectResult();
        if (user) {
          await processAuthenticatedGoogleUser(user);
        }
      } catch (err: unknown) {
        const formatted = formatGoogleAuthError(err);
        setErrorMessage(formatted.message);
      }
    };
    handleRedirectResult();
  }, []);

  // Xử lý logic sau khi Google đã xác thực thành công (cả popup lẫn redirect)
  const processAuthenticatedGoogleUser = async (firebaseUser: FirebaseUser) => {
    setGoogleLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);
    setShowRedirectOption(false);

    try {
      // 1. Kiểm tra hồ sơ users/{uid} trong Cloud Firestore
      const firestoreResult = await fetchFirestoreUserProfile(firebaseUser.uid);

      if (firestoreResult.exists && firestoreResult.profile) {
        // Hồ sơ đã có sẵn trong Firestore -> Đăng nhập ngay theo vai trò đã lưu
        const loginRes = await loginExistingGoogleUser(firebaseUser);
        if (loginRes.success && loginRes.user) {
          playSound('correct');
          if (loginRes.token) {
            sessionStorage.setItem('edutest_token', loginRes.token);
            localStorage.setItem('edutest_token', loginRes.token);
          }
          onLoginSuccess(loginRes.user, loginRes.token || '');
          return;
        } else if (loginRes.isLocked) {
          playSound('wrong');
          setErrorMessage(loginRes.message || 'Tài khoản của bạn đang bị khóa.');
          return;
        }
      }

      // 2. Kiểm tra trên backend server xem tài khoản đã tồn tại chưa
      const backendCheck = await loginExistingGoogleUser(firebaseUser);
      if (backendCheck.success && backendCheck.user) {
        playSound('correct');
        if (backendCheck.token) {
          sessionStorage.setItem('edutest_token', backendCheck.token);
          localStorage.setItem('edutest_token', backendCheck.token);
        }
        onLoginSuccess(backendCheck.user, backendCheck.token || '');
        return;
      } else if (backendCheck.isLocked) {
        playSound('wrong');
        setErrorMessage(backendCheck.message || 'Tài khoản của bạn đang bị khóa.');
        return;
      }

      // 3. Nếu CHƯA có hồ sơ hợp lệ: Chuyển sang bước Hoàn tất đăng ký
      setPendingGoogleUser(firebaseUser);
      setFullName(firebaseUser.displayName || '');
      setStudentCode(`HS${Math.floor(1000 + Math.random() * 9000)}`);
      setInfoMessage(`Đã xác thực Google: ${firebaseUser.email}. Vui lòng chọn vai trò để hoàn tất hồ sơ.`);
      playSound('correct');
    } catch (err) {
      console.error('[GoogleAuth] Lỗi xử lý tài khoản Google:', err);
      const parsed = formatGoogleAuthError(err);
      setErrorMessage(parsed.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  // Kích hoạt đăng nhập Google (ưu tiên Popup trên Desktop, đề xuất Redirect nếu bị chặn)
  const handleGoogleSignIn = async () => {
    playSound('click');
    setErrorMessage(null);
    setInfoMessage(null);
    setGoogleLoading(true);
    setShowRedirectOption(false);

    try {
      const user = await signInWithGooglePopup();
      await processAuthenticatedGoogleUser(user);
    } catch (err: unknown) {
      console.warn('[GoogleAuth] Lỗi popup:', err);
      const parsed = formatGoogleAuthError(err);
      setErrorMessage(parsed.message);
      if (parsed.code === 'auth/popup-blocked' || parsed.code === 'auth/cancelled-popup-request') {
        setShowRedirectOption(true);
      }
      playSound('wrong');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Đăng nhập Google bằng chuyển hướng trang (Redirect)
  const handleGoogleRedirect = async () => {
    playSound('click');
    setErrorMessage(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogleRedirect();
    } catch (err) {
      const parsed = formatGoogleAuthError(err);
      setErrorMessage(parsed.message);
      setGoogleLoading(false);
    }
  };

  // Xác nhận hoàn tất đăng ký tài khoản Google
  const handleConfirmGoogleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleUser) return;

    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên của bạn.');
      playSound('wrong');
      return;
    }

    setRegistrationSubmitting(true);
    setErrorMessage(null);
    setFirestoreNotice(null);

    const payload: GoogleRegistrationPayload = {
      uid: pendingGoogleUser.uid,
      email: pendingGoogleUser.email || '',
      fullName: fullName.trim(),
      role: selectedRole,
      schoolName: schoolName.trim(),
      phone: phone.trim() || undefined,
      teachingSubjects: selectedRole === 'TEACHER' ? teachingSubjects : undefined,
      studentCode: selectedRole === 'STUDENT' ? studentCode.trim() : undefined,
      gender: selectedRole === 'STUDENT' ? gender : undefined,
      avatarUrl: pendingGoogleUser.photoURL || undefined,
    };

    try {
      const result = await completeGoogleRegistration(payload);

      if (result.success && result.user) {
        playSound('correct');
        if (result.token) {
          sessionStorage.setItem('edutest_token', result.token);
          localStorage.setItem('edutest_token', result.token);
        }

        // Kiểm tra tính toàn vẹn Firestore:
        if (!result.firestoreSaved) {
          // Báo rõ ràng trạng thái chưa ghi được Firestore, không báo thành công giả
          setFirestoreNotice(
            result.firestoreError ||
              'Lưu ý: Hồ sơ đã được đồng bộ với phiên đăng nhập, nhưng quyền ghi Firestore từ client đang bị chặn theo quy tắc bảo mật (read/write: if false). Vui lòng cập nhật firestore.rules trên Firebase Console.'
          );
        }

        // Vào không gian làm việc sau khi xác nhận đăng ký
        setTimeout(() => {
          onLoginSuccess(result.user!, result.token || '');
        }, result.firestoreSaved ? 300 : 2500);
      } else {
        playSound('wrong');
        setErrorMessage(result.message || 'Đăng ký không thành công. Vui lòng thử lại.');
      }
    } catch (err: unknown) {
      console.error('[Registration] Lỗi đăng ký:', err);
      const parsed = formatGoogleAuthError(err);
      setErrorMessage(parsed.message);
      playSound('wrong');
    } finally {
      setRegistrationSubmitting(false);
    }
  };

  // Đăng nhập kết hợp: Hỗ trợ đồng thời tài khoản hệ thống & Firebase Authentication Email/Mật khẩu
  const handleSystemLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password;

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      playSound('wrong');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    // 1. Thử xác thực với máy chủ backend (các tài khoản giáo viên/học sinh trong hệ thống)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        playSound('correct');
        if (data.token) {
          sessionStorage.setItem('edutest_token', data.token);
          localStorage.setItem('edutest_token', data.token);
        }
        onLoginSuccess(data.user, data.token || '');
        return;
      }

      // 2. Nếu đăng nhập hệ thống không khớp VÀ người dùng nhập địa chỉ Email VÀ Firebase Auth sẵn sàng:
      // Thử xác thực trực tiếp qua Firebase Authentication Email/Password
      if (cleanUser.includes('@') && isFirebaseAuthReady()) {
        try {
          const fbUser = await signInWithFirebaseEmailPassword(cleanUser, cleanPass);
          if (fbUser) {
            await processAuthenticatedGoogleUser(fbUser);
            return;
          }
        } catch (fbErr: unknown) {
          console.warn('[Firebase Auth Email/Password]:', fbErr);
          const parsed = formatGoogleAuthError(fbErr);
          playSound('wrong');
          setErrorMessage(parsed.message || data.message || 'Email hoặc mật khẩu không chính xác.');
          return;
        }
      }

      // 3. Nếu không phải email Firebase hoặc Firebase không khả dụng: báo lỗi từ API
      playSound('wrong');
      setErrorMessage(data.message || 'Tên đăng nhập hoặc mật khẩu không chính xác.');
    } catch (err) {
      console.error('API login error:', err);

      // Thử Firebase Auth trực tiếp nếu máy chủ tạm thời không phản hồi
      if (cleanUser.includes('@') && isFirebaseAuthReady()) {
        try {
          const fbUser = await signInWithFirebaseEmailPassword(cleanUser, cleanPass);
          if (fbUser) {
            await processAuthenticatedGoogleUser(fbUser);
            return;
          }
        } catch (fbErr: unknown) {
          const parsed = formatGoogleAuthError(fbErr);
          playSound('wrong');
          setErrorMessage(parsed.message);
          return;
        }
      }

      playSound('wrong');
      setErrorMessage('Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra lại mạng hoặc thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center items-center p-3 sm:p-6 selection:bg-indigo-500 selection:text-white relative">
      {/* Background Decorative glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Top Back to Home Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => {
              playSound('click');
              onBackToHome();
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl border border-white/10 transition-colors backdrop-blur-xs cursor-pointer min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang chủ</span>
          </button>
        </div>

        {/* Branding header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white shadow-xl shadow-indigo-500/20 font-black text-2xl tracking-wider mb-2">
            ES
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">EDUTEST SMART</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Hệ thống Kiểm tra Đánh giá & Quản lý Lớp học GDPT 2018
          </p>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white/95 backdrop-blur-xl p-5 sm:p-7 rounded-2xl shadow-2xl border border-white/20">
          {/* Auth Mode Toggle Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage(null);
                setPendingGoogleUser(null);
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all min-h-[44px] cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage(null);
                setPendingGoogleUser(null);
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all min-h-[44px] cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Đăng ký tài khoản
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700 flex items-start gap-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{infoMessage}</div>
            </div>
          )}

          {firestoreNotice && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{firestoreNotice}</div>
            </div>
          )}

          {/* Fallback Redirect Option if Popup Blocked */}
          {showRedirectOption && (
            <div className="mb-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 flex flex-col gap-2">
              <div className="font-semibold flex items-center gap-1.5">
                <ExternalLink className="w-4 h-4 text-indigo-600" />
                Cửa sổ Popup bị trình duyệt chặn?
              </div>
              <p className="text-slate-600">
                Bạn có thể chuyển hướng trực tiếp qua trang đăng nhập của Google để hoàn tất:
              </p>
              <button
                type="button"
                onClick={handleGoogleRedirect}
                disabled={googleLoading}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors min-h-[44px] cursor-pointer"
              >
                Tiếp tục bằng Chuyển hướng (Redirect)
              </button>
            </div>
          )}

          {/* STEP 1: NÚT TIẾP TỤC VỚI GOOGLE (YÊU CẦU 1, 2, 10) */}
          <div className="mb-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all shadow-xs flex items-center justify-center gap-3 min-h-[48px] cursor-pointer disabled:opacity-60 relative group"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                  <span>Đang kết nối với Google...</span>
                </>
              ) : (
                <>
                  <GoogleLogoIcon className="w-5 h-5 shrink-0" />
                  <span className="truncate">
                    {authMode === 'login' ? 'Tiếp tục với Google' : 'Đăng ký nhanh với Google'}
                  </span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-500 mt-1.5">
              Tự động nhận diện tài khoản • Không yêu cầu mật khẩu Gmail
            </p>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider font-semibold">
              <span className="bg-white px-3 text-slate-400">
                Hoặc sử dụng tài khoản hệ thống
              </span>
            </div>
          </div>

          {/* Username / Password Form */}
          <form onSubmit={handleSystemLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tên đăng nhập / Email / Mã số <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập hoặc email"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white font-medium text-slate-800 placeholder:text-slate-400 min-h-[44px]"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white font-medium text-slate-800 placeholder:text-slate-400 min-h-[44px]"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer min-w-[44px] justify-center"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {authMode === 'login' ? 'Đăng nhập hệ thống' : 'Đăng nhập với tài khoản này'}
                </>
              )}
            </button>
          </form>

          {/* Secondary Action */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                playSound('click');
                onBackToHome();
              }}
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer min-h-[44px] inline-flex items-center"
            >
              Quay lại trang chủ giới thiệu
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center mt-5 text-xs text-slate-400 space-y-1">
          <div>
            Xác thực an toàn: <strong className="text-slate-300">Firebase Auth & Google</strong> • Phân quyền{' '}
            <strong className="text-slate-300">Giáo viên & Học sinh</strong>
          </div>
          <div className="text-[11px] text-slate-500">
            Hệ thống không thu thập mật khẩu email và không gộp tài khoản tự động.
          </div>
        </div>
      </div>

      {/* MODAL: HOÀN TẤT ĐĂNG KÝ VỚI TÀI KHOẢN GOOGLE (YÊU CẦU 3, 4, 5, 6, 8) */}
      {pendingGoogleUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <GoogleLogoIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Hoàn tất đăng ký EduTest Smart</h3>
                  <p className="text-xs text-slate-500">Thiết lập vai trò giáo dục và thông tin hồ sơ</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingGoogleUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Google Identity Verified Badge */}
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              {pendingGoogleUser.photoURL ? (
                <img
                  src={pendingGoogleUser.photoURL}
                  alt={pendingGoogleUser.displayName || 'Avatar'}
                  className="w-10 h-10 rounded-full border border-slate-300"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  {(pendingGoogleUser.displayName || 'G')[0]}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {pendingGoogleUser.displayName || 'Tài khoản Google'}
                </div>
                <div className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                  <span>{pendingGoogleUser.email}</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Đã xác thực
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmGoogleRegistration} className="mt-4 space-y-4">
              {/* VAI TRÒ LỰA CHỌN: GIÁO VIÊN HOẶC HỌC SINH (CHẶN HOÀN TOÀN ADMIN) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  1. Chọn vai trò của bạn trong hệ thống <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Option Giáo viên */}
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setSelectedRole('TEACHER');
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer min-h-[70px] ${
                      selectedRole === 'TEACHER'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className={`w-4 h-4 ${selectedRole === 'TEACHER' ? 'text-indigo-600' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold text-slate-800">Giáo viên</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Quyền TIÊU CHUẨN (STANDARD). Trạng thái CHỜ DUYỆT (PENDING).
                    </p>
                  </button>

                  {/* Option Học sinh */}
                  <button
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setSelectedRole('STUDENT');
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer min-h-[70px] ${
                      selectedRole === 'STUDENT'
                        ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <GraduationCap className={`w-4 h-4 ${selectedRole === 'STUDENT' ? 'text-emerald-600' : 'text-slate-500'}`} />
                      <span className="text-xs font-bold text-slate-800">Học sinh</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      KÍCH HOẠT NGAY (ACTIVE). Làm bài kiểm tra & Phòng Lab.
                    </p>
                  </button>
                </div>

                <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-start gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Bảo mật tuyệt đối: Không cho phép tự chọn quyền Quản trị (ADMIN). Quyền Quản trị chỉ được phân định bởi Quản trị viên trường.
                  </span>
                </div>
              </div>

              {/* HỌ VÀ TÊN */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên hiển thị <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên đầy đủ"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                  required
                />
              </div>

              {/* TRƯỜNG HỌC */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trường học / Đơn vị công tác <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <School className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={schoolName}
                    onChange={e => setSchoolName(e.target.value)}
                    placeholder="Ví dụ: THPT Chuyên & GDPT 2018"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                    required
                  />
                </div>
              </div>

              {/* CÁC TRƯỜNG DÀNH RIÊNG CHO GIÁO VIÊN */}
              {selectedRole === 'TEACHER' && (
                <div className="space-y-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Số điện thoại liên hệ
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="Số điện thoại di động"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Khối lớp giảng dạy
                    </label>
                    <div className="flex gap-2">
                      {['TOAN_10', 'TOAN_11', 'TOAN_12'].map(sub => {
                        const isChecked = teachingSubjects.includes(sub);
                        const label = sub.replace('TOAN_', 'Toán ');
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                if (teachingSubjects.length > 1) {
                                  setTeachingSubjects(teachingSubjects.filter(s => s !== sub));
                                }
                              } else {
                                setTeachingSubjects([...teachingSubjects, sub]);
                              }
                            }}
                            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer min-h-[44px] ${
                              isChecked
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* CÁC TRƯỜNG DÀNH RIÊNG CHO HỌC SINH */}
              {selectedRole === 'STUDENT' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mã học sinh
                    </label>
                    <input
                      type="text"
                      value={studentCode}
                      onChange={e => setStudentCode(e.target.value.toUpperCase())}
                      placeholder="VD: HS1201"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-mono min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Giới tính
                    </label>
                    <select
                      value={gender}
                      onChange={e => setGender(e.target.value as 'Nam' | 'Nữ')}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white min-h-[44px]"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingGoogleUser(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px]"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={registrationSubmitting}
                  className="flex-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-500/20 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                >
                  {registrationSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang lưu hồ sơ...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác nhận hoàn tất đăng ký</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
                <HelpCircle className="w-5 h-5" />
                Quên mật khẩu
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>Để bảo đảm an toàn dữ liệu học tập và bảo mật kỳ thi, hệ thống EduTest Smart quy định:</p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div>
                  <strong className="text-slate-800">1. Đối với Học sinh:</strong>
                  <p className="text-slate-500 mt-0.5">
                    Liên hệ Giáo viên chủ nhiệm để được cấp lại mật khẩu hoặc đăng nhập nhanh bằng tài khoản Google đã liên kết.
                  </p>
                </div>
                <div>
                  <strong className="text-slate-800">2. Đối với Giáo viên:</strong>
                  <p className="text-slate-500 mt-0.5">
                    Liên hệ Giáo viên có quyền Quản trị (ADMIN) tại trường để được đặt lại mật khẩu mặc định (<code>password123</code>).
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full mt-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer min-h-[44px]"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
