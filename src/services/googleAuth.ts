import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  User as FirebaseUser,
  AuthError,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  FirestoreError,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb, getFirebaseStatus } from './firebase';
import { User, TeacherPermission, UserRole } from '../types';

// Google Auth Provider setup with select_account prompt
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});
googleAuthProvider.addScope('email');
googleAuthProvider.addScope('profile');

export interface GoogleAuthResult {
  firebaseUser: FirebaseUser;
  isNewUser: boolean;
  existingProfile?: User | null;
}

export interface GoogleRegistrationPayload {
  uid: string;
  email: string;
  fullName: string;
  role: 'TEACHER' | 'STUDENT';
  schoolName: string;
  phone?: string;
  teachingSubjects?: string[];
  studentCode?: string;
  grade?: number;
  gender?: 'Nam' | 'Nữ';
  avatarUrl?: string;
}

/**
 * Kiểm tra xem Firebase Authentication có sẵn sàng trong phiên làm việc hiện tại hay không
 */
export const isFirebaseAuthReady = (): boolean => {
  return !!getFirebaseAuth();
};

/**
 * Phân tích lỗi xác thực Firebase Authentication và chuyển đổi thành thông điệp tiếng Việt tường minh
 */
export const formatGoogleAuthError = (error: unknown): { code: string; message: string; recommendation?: string } => {
  const err = error as (AuthError | FirestoreError | Error);
  const code = 'code' in err ? String(err.code) : '';
  const rawMsg = err.message || '';

  if (code === 'auth/popup-blocked') {
    return {
      code,
      message: 'Trình duyệt đã chặn cửa sổ bật lên (Popup) của Google.',
      recommendation: 'Vui lòng bấm cho phép popup trên thanh địa chỉ trình duyệt, hoặc sử dụng tùy chọn "Đăng nhập chuyển hướng (Redirect)".',
    };
  }

  if (code === 'auth/popup-closed-by-user') {
    return {
      code,
      message: 'Cửa sổ đăng nhập Google đã được đóng trước khi hoàn tất xác thực.',
      recommendation: 'Vui lòng bấm lại nút "Tiếp tục với Google" và chọn tài khoản Google của bạn.',
    };
  }

  if (code === 'auth/cancelled-popup-request') {
    return {
      code,
      message: 'Yêu cầu mở cửa sổ đăng nhập Google trước đó đã bị hủy.',
      recommendation: 'Vui lòng thử lại một lần nữa.',
    };
  }

  if (code === 'auth/account-exists-with-different-credential') {
    return {
      code,
      message: 'Email này đã được sử dụng với phương thức đăng nhập khác (ví dụ: Mật khẩu hệ thống).',
      recommendation: 'Hệ thống bảo mật tuyệt đối không tự động gộp hồ sơ. Vui lòng đăng nhập bằng Mật khẩu với email này.',
    };
  }

  if (code === 'auth/unauthorized-domain') {
    return {
      code,
      message: 'Tên miền ứng dụng hiện tại chưa nằm trong danh sách được cấp phép (Authorized Domains).',
      recommendation: 'Quản trị viên cần mở Firebase Console > Authentication > Settings > Authorized domains và thêm domain hiện tại vào danh sách.',
    };
  }

  if (code === 'auth/network-request-failed') {
    return {
      code,
      message: 'Không thể kết nối đến máy chủ xác thực của Google hoặc Firebase.',
      recommendation: 'Vui lòng kiểm tra lại kết nối mạng Internet hoặc tường lửa và thử lại.',
    };
  }

  if (code === 'permission-denied') {
    return {
      code,
      message: 'Quy tắc bảo mật Firestore (Security Rules) hiện tại chưa cho phép ứng dụng khách đọc/ghi hồ sơ.',
      recommendation: 'Cần cập nhật rules trên Firebase Console theo cấu hình chuẩn để cho phép người dùng đọc và tạo hồ sơ cá nhân.',
    };
  }

  return {
    code: code || 'auth/unknown',
    message: rawMsg || 'Xảy ra lỗi trong quá trình xác thực với Google.',
    recommendation: 'Vui lòng thử lại hoặc đăng nhập bằng tài khoản/mật khẩu được cấp.',
  };
};

/**
 * Đăng nhập với Google bằng Popup (ưu tiên sử dụng trên Desktop)
 */
export const signInWithGooglePopup = async (): Promise<FirebaseUser> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    const status = getFirebaseStatus();
    throw new Error(
      `Firebase Authentication chưa sẵn sàng (Thiếu biến môi trường: ${status.missingKeys.join(', ')}). Vui lòng kiểm tra cấu hình.`
    );
  }

  const credential = await signInWithPopup(auth, googleAuthProvider);
  return credential.user;
};

/**
 * Đăng nhập với Google bằng Redirect (ưu tiên sử dụng khi Popup bị chặn hoặc trên di động)
 */
export const signInWithGoogleRedirect = async (): Promise<void> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    const status = getFirebaseStatus();
    throw new Error(
      `Firebase Authentication chưa sẵn sàng (Thiếu biến môi trường: ${status.missingKeys.join(', ')}). Vui lòng kiểm tra cấu hình.`
    );
  }

  await signInWithRedirect(auth, googleAuthProvider);
};

/**
 * Kiểm tra kết quả sau khi chuyển hướng Google (Redirect Result)
 */
export const checkGoogleRedirectResult = async (): Promise<FirebaseUser | null> => {
  const auth = getFirebaseAuth();
  if (!auth) return null;

  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return result.user;
    }
  } catch (err) {
    console.warn('[GoogleAuth] Lỗi xử lý kết quả redirect:', err);
    throw err;
  }
  return null;
};

/**
 * Tra cứu hồ sơ người dùng trong Firestore: users/{uid}
 * Tuân thủ yêu cầu: Kiểm tra hồ sơ thực tế từ Firestore, phân biệt lỗi permission-denied
 */
export const fetchFirestoreUserProfile = async (
  uid: string
): Promise<{
  exists: boolean;
  profile: User | null;
  firestoreAccessible: boolean;
  errorCode?: string;
  errorMessage?: string;
}> => {
  const db = getFirebaseDb();
  if (!db) {
    return {
      exists: false,
      profile: null,
      firestoreAccessible: false,
      errorCode: 'firestore-not-initialized',
      errorMessage: 'Cloud Firestore chưa được khởi tạo trong cấu hình ứng dụng.',
    };
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const profile: User = {
        id: uid,
        username: data.username || data.email?.split('@')[0] || uid,
        fullName: data.fullName || 'Người dùng Google',
        email: data.email || '',
        role: data.role === 'TEACHER' ? 'TEACHER' : 'STUDENT',
        permission: data.role === 'TEACHER' ? (data.permission === 'ADMIN' ? 'ADMIN' : 'STANDARD') : undefined,
        status: data.status || 'active',
        schoolName: data.schoolName || 'THPT GDPT 2018',
        phone: data.phone,
        teacherCode: data.teacherCode,
        teachingSubjects: data.teachingSubjects,
        assignedClassIds: data.assignedClassIds || [],
        createdAt: data.createdAt || new Date().toISOString(),
      };
      return { exists: true, profile, firestoreAccessible: true };
    }

    return { exists: false, profile: null, firestoreAccessible: true };
  } catch (error: unknown) {
    const formatted = formatGoogleAuthError(error);
    return {
      exists: false,
      profile: null,
      firestoreAccessible: false,
      errorCode: formatted.code,
      errorMessage: formatted.message,
    };
  }
};

/**
 * Hoàn tất đăng ký tài khoản mới:
 * 1. Kiểm tra tính toàn vẹn và ngăn chặn tự gán ADMIN
 * 2. Lưu hồ sơ vào Firestore (users/{uid})
 * 3. Đồng bộ với phiên làm việc của máy chủ backend (/api/auth/google-register)
 * 4. Nếu Firestore từ chối quyền ghi (permission-denied), báo lỗi minh bạch, KHÔNG báo thành công giả
 */
export const completeGoogleRegistration = async (
  payload: GoogleRegistrationPayload
): Promise<{
  success: boolean;
  user?: User;
  token?: string;
  firestoreSaved: boolean;
  firestoreError?: string;
  message?: string;
}> => {
  // BẢO VỆ PHÂN QUYỀN TUYỆT ĐỐI (Zero-Trust)
  if (payload.role !== 'TEACHER' && payload.role !== 'STUDENT') {
    throw new Error('Vai trò người dùng không hợp lệ. Chỉ chấp nhận TEACHER hoặc STUDENT.');
  }

  // Chuẩn hóa dữ liệu theo đặc tả:
  // - Giáo viên: role = TEACHER, permission = STANDARD, status = pending (chờ duyệt)
  // - Học sinh: role = STUDENT, status = active, không có permission ADMIN
  const isTeacherRole = payload.role === 'TEACHER';
  const role: 'TEACHER' | 'STUDENT' = isTeacherRole ? 'TEACHER' : 'STUDENT';
  const permission: TeacherPermission | undefined = isTeacherRole ? 'STANDARD' : undefined;
  const status: 'pending' | 'active' = isTeacherRole ? 'pending' : 'active';

  const sanitizedProfile: Record<string, any> = {
    id: payload.uid,
    email: payload.email.trim().toLowerCase(),
    fullName: payload.fullName.trim(),
    role,
    status,
    schoolName: (payload.schoolName || 'THPT GDPT 2018').trim(),
    phone: payload.phone?.trim() || '',
    createdAt: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  };

  if (isTeacherRole) {
    sanitizedProfile.permission = permission;
    sanitizedProfile.teacherCode = `GV${Math.floor(100 + Math.random() * 900)}`;
    sanitizedProfile.teachingSubjects = payload.teachingSubjects || ['TOAN_10', 'TOAN_11', 'TOAN_12'];
  } else {
    sanitizedProfile.studentCode = (payload.studentCode || `HS${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
    sanitizedProfile.gender = payload.gender || 'Nam';
  }

  let firestoreSaved = false;
  let firestoreError: string | undefined;

  // 1. Thử ghi vào Cloud Firestore
  const db = getFirebaseDb();
  if (db) {
    try {
      const userRef = doc(db, 'users', payload.uid);
      await setDoc(userRef, sanitizedProfile);
      firestoreSaved = true;
    } catch (err: unknown) {
      const parsed = formatGoogleAuthError(err);
      firestoreError = parsed.message;
      console.warn('[Firestore] Ghi hồ sơ người dùng thất bại:', parsed);
    }
  } else {
    firestoreError = 'Cloud Firestore chưa được cấu hình.';
  }

  // 2. Đồng bộ với Backend để cấp phiên làm việc chuẩn (Authoritative Server Session)
  try {
    const res = await fetch('/api/auth/google-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        role,
        permission,
        status,
        teacherCode: sanitizedProfile.teacherCode,
        studentCode: sanitizedProfile.studentCode,
      }),
    });

    const data = await res.json();

    if (res.ok && data.success && data.user) {
      return {
        success: true,
        user: data.user,
        token: data.token,
        firestoreSaved,
        firestoreError,
        message: data.message,
      };
    } else {
      return {
        success: false,
        firestoreSaved,
        firestoreError,
        message: data.message || 'Không thể tạo phiên làm việc trên máy chủ.',
      };
    }
  } catch (err) {
    console.error('[GoogleAuth] Lỗi kết nối API google-register:', err);
    return {
      success: false,
      firestoreSaved,
      firestoreError,
      message: 'Không thể kết nối đến máy chủ ứng dụng để cấp phiên làm việc.',
    };
  }
};

/**
 * Đăng nhập với tài khoản Google đã có hồ sơ
 */
export const loginExistingGoogleUser = async (
  firebaseUser: FirebaseUser
): Promise<{
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  isLocked?: boolean;
}> => {
  try {
    const res = await fetch('/api/auth/google-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      }),
    });

    const data = await res.json();

    if (res.status === 403) {
      return {
        success: false,
        isLocked: true,
        message: data.message || 'Tài khoản của bạn đã bị khóa.',
      };
    }

    if (res.ok && data.success && data.user) {
      return {
        success: true,
        user: data.user,
        token: data.token,
      };
    }

    return {
      success: false,
      message: data.message || 'Chưa tìm thấy hồ sơ liên kết với tài khoản Google này.',
    };
  } catch (err) {
    console.error('[GoogleAuth] Lỗi kết nối API google-login:', err);
    return {
      success: false,
      message: 'Lỗi mạng khi kết nối máy chủ xác thực.',
    };
  }
};

/**
 * Đăng xuất an toàn khỏi Firebase Auth
 */
export const signOutFirebase = async (): Promise<void> => {
  const auth = getFirebaseAuth();
  if (auth) {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.warn('[GoogleAuth] Lỗi khi đăng xuất Firebase:', err);
    }
  }
};
