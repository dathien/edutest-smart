import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  linkWithPopup,
  linkWithRedirect,
  unlink,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
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

  if (code === 'auth/credential-already-in-use') {
    return {
      code,
      message: 'Tài khoản Google này hiện đã được liên kết với một tài khoản người dùng khác trong hệ thống.',
      recommendation: 'Để bảo vệ an toàn dữ liệu, hệ thống không tự động gộp hoặc xóa tài khoản. Vui lòng sử dụng tài khoản Google khác hoặc đăng nhập bằng tài khoản Google đó.',
    };
  }

  if (code === 'auth/provider-already-linked') {
    return {
      code,
      message: 'Tài khoản của bạn đã được liên kết với Google từ trước.',
      recommendation: 'Bạn có thể sử dụng phương thức Đăng nhập bằng Google ngay lập tức.',
    };
  }

  if (code === 'auth/requires-recent-login') {
    return {
      code,
      message: 'Phiên đăng nhập đã quá thời hạn an toàn yêu cầu cho tác vụ nhạy cảm này.',
      recommendation: 'Vui lòng đăng xuất và đăng nhập lại bằng Mật khẩu trước khi liên kết tài khoản Google.',
    };
  }

  if (code === 'permission-denied') {
    return {
      code,
      message: 'Quy tắc bảo mật Firestore (Security Rules) hiện tại chưa cho phép ứng dụng khách đọc/ghi hồ sơ.',
      recommendation: 'Cần cập nhật rules trên Firebase Console theo cấu hình chuẩn để cho phép người dùng đọc và tạo hồ sơ cá nhân.',
    };
  }

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    return {
      code,
      message: 'Mật khẩu hoặc thông tin đăng nhập không chính xác.',
      recommendation: 'Vui lòng kiểm tra lại mật khẩu hoặc sử dụng chức năng quên mật khẩu.',
    };
  }

  if (code === 'auth/user-not-found') {
    return {
      code,
      message: 'Không tìm thấy tài khoản Firebase với email này.',
      recommendation: 'Vui lòng kiểm tra lại địa chỉ email hoặc đăng ký tài khoản mới.',
    };
  }

  if (code === 'auth/invalid-email') {
    return {
      code,
      message: 'Địa chỉ email không đúng định dạng.',
      recommendation: 'Vui lòng nhập đúng định dạng email (ví dụ: user@example.com).',
    };
  }

  if (code === 'auth/user-disabled') {
    return {
      code,
      message: 'Tài khoản Firebase này đã bị vô hiệu hóa.',
      recommendation: 'Vui lòng liên hệ quản trị viên để được hỗ trợ.',
    };
  }

  if (code === 'auth/too-many-requests') {
    return {
      code,
      message: 'Quá nhiều lần thử đăng nhập không thành công. Firebase đã tạm thời khóa quyền truy cập.',
      recommendation: 'Vui lòng chờ ít phút trước khi thử lại hoặc đặt lại mật khẩu.',
    };
  }

  return {
    code: code || 'auth/unknown',
    message: rawMsg || 'Xảy ra lỗi trong quá trình xác thực với hệ thống.',
    recommendation: 'Vui lòng thử lại hoặc đăng nhập bằng tài khoản/mật khẩu được cấp.',
  };
};

/**
 * Đăng nhập bằng Email và Mật khẩu qua Firebase Authentication
 */
export const signInWithFirebaseEmailPassword = async (email: string, pass: string): Promise<FirebaseUser> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    const status = getFirebaseStatus();
    throw new Error(
      `Firebase Authentication chưa sẵn sàng (Thiếu biến môi trường: ${status.missingKeys.join(', ')}). Vui lòng kiểm tra cấu hình.`
    );
  }

  const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return credential.user;
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

/**
 * Liên kết tài khoản Google với tài khoản hiện đang đăng nhập:
 * - Bảo toàn 100% UID, vai trò và dữ liệu
 * - Xử lý trường hợp Google đã thuộc về UID khác (auth/credential-already-in-use)
 * - Ngăn chặn tự gộp tài khoản chỉ vì trùng email
 */
export const linkGoogleToCurrentAccount = async (
  sessionToken: string,
  currentUser: User
): Promise<{
  success: boolean;
  user?: User;
  message?: string;
  isAlreadyLinkedOther?: boolean;
}> => {
  const auth = getFirebaseAuth();
  let googleUid = '';
  let googleEmail = '';
  let googleDisplayName = '';

  try {
    if (auth && auth.currentUser) {
      // Sử dụng linkWithPopup của Firebase Auth SDK
      const credential = await linkWithPopup(auth.currentUser, googleAuthProvider);
      googleUid = credential.user.uid;
      googleEmail = credential.user.email || '';
      googleDisplayName = credential.user.displayName || '';
    } else {
      // Trường hợp đăng nhập ban đầu bằng Email/Mật khẩu hệ thống
      const googleUser = await signInWithGooglePopup();
      googleUid = googleUser.uid;
      googleEmail = googleUser.email || '';
      googleDisplayName = googleUser.displayName || '';
    }

    if (!googleUid || !googleEmail) {
      return {
        success: false,
        message: 'Không nhận được thông tin xác thực Google.',
      };
    }

    // Gửi yêu cầu liên kết tới máy chủ authoritative
    const res = await fetch('/api/auth/link-google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({
        googleUid,
        googleEmail,
        googleDisplayName,
      }),
    });

    const data = await res.json();

    if (res.status === 409) {
      return {
        success: false,
        isAlreadyLinkedOther: true,
        message:
          data.message ||
          `Tài khoản Google (${googleEmail}) đã được liên kết với một tài khoản khác trong hệ thống. Để bảo vệ an toàn dữ liệu, hệ thống không tự động gộp hoặc xóa tài khoản. Vui lòng chọn tài khoản Google khác.`,
      };
    }

    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.message || 'Không thể liên kết tài khoản Google.',
      };
    }

    // Cập nhật tài liệu Firestore users/{uid} nếu có quyền ghi
    const db = getFirebaseDb();
    if (db && currentUser.id) {
      try {
        const userRef = doc(db, 'users', currentUser.id);
        const existingDoc = await getDoc(userRef);
        if (existingDoc.exists()) {
          const docData = existingDoc.data();
          const providers = Array.from(new Set([...(docData.linkedProviders || ['password']), 'google.com']));
          await setDoc(
            userRef,
            {
              ...docData,
              linkedProviders: providers,
              googleEmail,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (e) {
        console.warn('[Firestore] Cập nhật liên kết provider vào Firestore chưa hoàn tất:', e);
      }
    }

    return {
      success: true,
      user: data.user,
      message: data.message,
    };
  } catch (error: unknown) {
    const parsed = formatGoogleAuthError(error);
    return {
      success: false,
      message: parsed.message,
      isAlreadyLinkedOther: parsed.code === 'auth/credential-already-in-use',
    };
  }
};

/**
 * Hủy liên kết tài khoản Google khỏi hồ sơ hiện tại
 */
export const unlinkGoogleFromCurrentAccount = async (
  sessionToken: string
): Promise<{
  success: boolean;
  user?: User;
  message?: string;
}> => {
  try {
    const auth = getFirebaseAuth();
    if (auth && auth.currentUser) {
      try {
        await unlink(auth.currentUser, 'google.com');
      } catch (e) {
        console.warn('[Firebase Auth] Unlink warning:', e);
      }
    }

    const res = await fetch('/api/auth/unlink-google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`,
      },
    });

    const data = await res.json();

    if (res.ok && data.success && data.user) {
      return {
        success: true,
        user: data.user,
        message: data.message,
      };
    }

    return {
      success: false,
      message: data.message || 'Không thể hủy liên kết tài khoản Google.',
    };
  } catch (err) {
    console.error('[GoogleAuth] Lỗi hủy liên kết:', err);
    return {
      success: false,
      message: 'Lỗi mạng khi thực hiện hủy liên kết.',
    };
  }
};
