import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * Cấu hình Firebase Web App cho EduTest Smart (Gói Firebase Spark)
 * Chỉ sử dụng 2 dịch vụ cốt lõi: Firebase Authentication và Cloud Firestore
 * Không sử dụng Google Analytics (không yêu cầu VITE_FIREBASE_MEASUREMENT_ID)
 */
export interface EduTestFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface FirebaseConnectionStatus {
  isConfigured: boolean;
  isInitialized: boolean;
  projectId: string;
  authDomain: string;
  databaseId: string;
  plan: 'Spark (Miễn phí)';
  services: string[];
  missingKeys: string[];
  providedKeys: string[];
  authReady: boolean;
  firestoreReady: boolean;
  securityNotice: string;
}

// 6 biến cấu hình Firebase tiêu chuẩn đọc từ biến môi trường Vite (tiền tố VITE_)
const rawApiKey = (import.meta.env.VITE_FIREBASE_API_KEY || '').trim();
const rawAuthDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim();
const rawProjectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim();
const rawStorageBucket = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim();
const rawMessagingSenderId = (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim();
const rawAppId = (import.meta.env.VITE_FIREBASE_APP_ID || '').trim();

// Tên miền và storage bucket chuẩn với fallback an toàn dựa trên Project ID
const effectiveProjectId = rawProjectId || 'edutest-smart';
const effectiveAuthDomain = rawAuthDomain || `${effectiveProjectId}.firebaseapp.com`;
const effectiveStorageBucket = rawStorageBucket || `${effectiveProjectId}.firebasestorage.app`;

export const firebaseConfig: EduTestFirebaseConfig = {
  apiKey: rawApiKey,
  authDomain: effectiveAuthDomain,
  projectId: effectiveProjectId,
  storageBucket: effectiveStorageBucket,
  messagingSenderId: rawMessagingSenderId,
  appId: rawAppId,
};

// Theo dõi 6 biến cấu hình chính thức từ import.meta.env
const missingConfigKeys: string[] = [];
const providedConfigKeys: string[] = [];

if (rawApiKey) providedConfigKeys.push('VITE_FIREBASE_API_KEY');
else missingConfigKeys.push('VITE_FIREBASE_API_KEY');

if (rawAuthDomain) providedConfigKeys.push('VITE_FIREBASE_AUTH_DOMAIN');
else missingConfigKeys.push('VITE_FIREBASE_AUTH_DOMAIN');

if (rawProjectId) providedConfigKeys.push('VITE_FIREBASE_PROJECT_ID');
else missingConfigKeys.push('VITE_FIREBASE_PROJECT_ID');

if (rawStorageBucket) providedConfigKeys.push('VITE_FIREBASE_STORAGE_BUCKET');
else missingConfigKeys.push('VITE_FIREBASE_STORAGE_BUCKET');

if (rawMessagingSenderId) providedConfigKeys.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
else missingConfigKeys.push('VITE_FIREBASE_MESSAGING_SENDER_ID');

if (rawAppId) providedConfigKeys.push('VITE_FIREBASE_APP_ID');
else missingConfigKeys.push('VITE_FIREBASE_APP_ID');

// Biến lưu trữ instance
let firebaseAppInstance: FirebaseApp | null = null;
let firebaseAuthInstance: Auth | null = null;
let firebaseFirestoreInstance: Firestore | null = null;
let initializationError: string | null = null;

// Khởi tạo an toàn: Chỉ khởi tạo khi có đủ apiKey, appId và projectId hợp lệ
const isConfigSufficient = !!(rawApiKey && rawAppId && effectiveProjectId);

if (isConfigSufficient) {
  try {
    const apps = getApps();
    if (apps.length === 0) {
      firebaseAppInstance = initializeApp(firebaseConfig);
    } else {
      firebaseAppInstance = getApp();
    }
    // Chỉ khởi tạo Firebase Authentication và Cloud Firestore (không dùng Analytics)
    firebaseAuthInstance = getAuth(firebaseAppInstance);
    firebaseFirestoreInstance = getFirestore(firebaseAppInstance);
  } catch (err: unknown) {
    initializationError = err instanceof Error ? err.message : String(err);
    console.warn('[Firebase] Khởi tạo không thành công:', initializationError);
  }
}

/**
 * Trả về Firebase App instance (hoặc null nếu chưa có cấu hình đầy đủ)
 */
export const getFirebaseApp = (): FirebaseApp | null => firebaseAppInstance;

/**
 * Trả về Firebase Auth instance (hoặc null nếu chưa có cấu hình đầy đủ)
 */
export const getFirebaseAuth = (): Auth | null => firebaseAuthInstance;

/**
 * Trả về Cloud Firestore instance (hoặc null nếu chưa có cấu hình đầy đủ)
 */
export const getFirebaseDb = (): Firestore | null => firebaseFirestoreInstance;

/**
 * Kiểm tra trạng thái kết nối kỹ thuật Firebase
 */
export const getFirebaseStatus = (): FirebaseConnectionStatus => {
  return {
    isConfigured: isConfigSufficient && !initializationError,
    isInitialized: !!firebaseAppInstance,
    projectId: effectiveProjectId,
    authDomain: effectiveAuthDomain,
    databaseId: '(default)',
    plan: 'Spark (Miễn phí)',
    services: ['Firebase Authentication', 'Cloud Firestore (default)'],
    missingKeys: missingConfigKeys,
    providedKeys: providedConfigKeys,
    authReady: !!firebaseAuthInstance,
    firestoreReady: !!firebaseFirestoreInstance,
    securityNotice: 'Firestore Security Rules: Chặn toàn bộ quyền đọc/ghi từ client (read/write: if false). Không ảnh hưởng hệ thống hiện hành.',
  };
};

export { firebaseAppInstance as app, firebaseAuthInstance as auth, firebaseFirestoreInstance as db };
