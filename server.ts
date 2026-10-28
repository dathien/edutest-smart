import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// -------------------------------------------------------------
// IN-MEMORY SERVER-AUTHORITATIVE DATABASE & AUDIT LOGS
// -------------------------------------------------------------

interface ServerUser {
  id: string;
  username: string;
  password: string; // Plain/hashed for evaluation
  fullName: string;
  salutation?: string;
  email: string;
  role: 'TEACHER' | 'STUDENT';
  permission?: 'ADMIN' | 'STANDARD';
  teacherCode?: string;
  studentCode?: string;
  schoolName: string;
  phone?: string;
  teachingSubjects?: string[];
  assignedClassIds?: string[];
  status: 'active' | 'locked' | 'pending';
  createdAt: string;
  linkedProviders?: string[];
  googleEmail?: string;
  googleUid?: string;
}

interface ServerClass {
  id: string;
  name: string;
  grade: number;
  academicYear: string;
  teacherId: string;
  teacherName: string;
  secondaryTeacherIds?: string[];
  studentCount: number;
  room?: string;
  createdAt: string;
}

interface ServerStudent {
  id: string;
  studentCode: string;
  fullName: string;
  dob?: string;
  gender: 'Nam' | 'Nữ';
  classId: string;
  className: string;
  username: string;
  status: 'active' | 'locked';
  notes?: string;
}

interface ServerAssignment {
  id: string;
  examId: string;
  examTitle: string;
  category: 'homework' | 'test' | 'exam';
  subject: string;
  teacherId: string;
  teacherName: string;
  classIds: string[];
  classNames: string[];
  targetType: 'class' | 'group' | 'student';
  targetStudentIds?: string[];
  startDate: string;
  endDate: string;
  durationMinutes: number;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  publishScoreImmediately: boolean;
  publishSolutionsImmediately: boolean;
  proctorPolicy: 'warning_only' | 'warning_and_log' | 'lock_exam' | 'auto_submit';
  status: 'upcoming' | 'in_progress' | 'completed' | 'closed';
  totalAssigned: number;
  totalSubmitted: number;
}

interface ActiveSession {
  sessionId: string;
  assignmentId: string;
  examId?: string;
  studentId: string;
  studentName: string;
  activeTabId: string;
  lastHeartbeat: number;
  isDuplicateTabDetected: boolean;
  tabSwitchCount: number;
  totalAwaySeconds: number;
  isLocked: boolean;
  lockReason?: string;
}

interface ExamEvent {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  type: string;
  details: string;
  timestamp: string;
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

// Initial Server Seed
const USERS: Map<string, ServerUser> = new Map([
  [
    'user-admin',
    {
      id: 'user-admin',
      username: 'admin',
      password: 'password123',
      fullName: 'Thầy Hồ Nguyễn Đa Thiện',
      salutation: 'Thầy',
      email: 'dathien.toan@edutest.edu.vn',
      role: 'TEACHER',
      permission: 'ADMIN',
      teacherCode: 'GV001',
      schoolName: 'THPT Chuyên & GDPT 2018',
      phone: '0908123456',
      teachingSubjects: ['TOAN_10', 'TOAN_11', 'TOAN_12'],
      assignedClassIds: ['class-12a1', 'class-11b1', 'class-10c1'],
      status: 'active',
      createdAt: '2025-08-15',
    },
  ],
  [
    'user-teacher-1',
    {
      id: 'user-teacher-1',
      username: 'lan.nguyen',
      password: 'password123',
      fullName: 'Cô Nguyễn Thị Lan',
      salutation: 'Cô',
      email: 'lan.nguyen@edutest.edu.vn',
      role: 'TEACHER',
      permission: 'STANDARD',
      teacherCode: 'GV002',
      schoolName: 'THPT Võ Trường Toản',
      phone: '0912345678',
      teachingSubjects: ['TOAN_12'],
      assignedClassIds: ['class-12a2'],
      status: 'active',
      createdAt: '2025-09-01',
    },
  ],
  [
    'user-teacher-pending',
    {
      id: 'user-teacher-pending',
      username: 'quoc.tran',
      password: 'password123',
      fullName: 'Thầy Trần Quốc Tuấn',
      salutation: 'Thầy',
      email: 'tuan.tran@edutest.edu.vn',
      role: 'TEACHER',
      permission: 'STANDARD',
      teacherCode: 'GV003',
      schoolName: 'THPT Nguyễn Thị Minh Khai',
      phone: '0933999888',
      teachingSubjects: ['TOAN_11'],
      assignedClassIds: [],
      status: 'pending',
      createdAt: '2026-10-20',
    },
  ],
  [
    'user-student-1',
    {
      id: 'user-student-1',
      username: 'hs.khoi',
      password: 'password123',
      fullName: 'Lê Minh Khôi',
      email: 'khoi.lm@hocsinh.edutest.vn',
      role: 'STUDENT',
      studentCode: 'HS1201',
      schoolName: 'THPT Chuyên & GDPT 2018',
      assignedClassIds: ['class-12a1'],
      status: 'active',
      createdAt: '2025-09-05',
    },
  ],
  [
    'user-student-2',
    {
      id: 'user-student-2',
      username: 'hs.hoanganh',
      password: 'password123',
      fullName: 'Phạm Hoàng Anh',
      email: 'hoanganh@hocsinh.edutest.vn',
      role: 'STUDENT',
      studentCode: 'HS1202',
      schoolName: 'THPT Chuyên & GDPT 2018',
      assignedClassIds: ['class-12a1'],
      status: 'active',
      createdAt: '2025-09-05',
    },
  ],
]);

const CLASSES: Map<string, ServerClass> = new Map([
  [
    'class-12a1',
    {
      id: 'class-12a1',
      name: '12A1',
      grade: 12,
      academicYear: '2025-2026',
      teacherId: 'user-admin',
      teacherName: 'Thầy Hồ Nguyễn Đa Thiện',
      studentCount: 38,
      room: 'Phòng 301',
      createdAt: '2025-08-20',
    },
  ],
  [
    'class-12a2',
    {
      id: 'class-12a2',
      name: '12A2',
      grade: 12,
      academicYear: '2025-2026',
      teacherId: 'user-teacher-1',
      teacherName: 'Cô Nguyễn Thị Lan',
      studentCount: 36,
      room: 'Phòng 302',
      createdAt: '2025-08-20',
    },
  ],
  [
    'class-11b1',
    {
      id: 'class-11b1',
      name: '11B1',
      grade: 11,
      academicYear: '2025-2026',
      teacherId: 'user-admin',
      teacherName: 'Thầy Hồ Nguyễn Đa Thiện',
      studentCount: 40,
      room: 'Phòng 204',
      createdAt: '2025-08-22',
    },
  ],
  [
    'class-10c1',
    {
      id: 'class-10c1',
      name: '10C1',
      grade: 10,
      academicYear: '2025-2026',
      teacherId: 'user-admin',
      teacherName: 'Thầy Hồ Nguyễn Đa Thiện',
      studentCount: 42,
      room: 'Phòng 102',
      createdAt: '2025-08-25',
    },
  ],
]);

const STUDENTS: Map<string, ServerStudent> = new Map([
  ['stu-01', { id: 'stu-01', studentCode: 'HS1201', fullName: 'Lê Minh Khôi', dob: '2008-03-15', gender: 'Nam', classId: 'class-12a1', className: '12A1', username: 'hs.khoi', status: 'active', notes: 'Học sinh giỏi cấp trường' }],
  ['stu-02', { id: 'stu-02', studentCode: 'HS1202', fullName: 'Phạm Hoàng Anh', dob: '2008-05-20', gender: 'Nam', classId: 'class-12a1', className: '12A1', username: 'hs.hoanganh', status: 'active' }],
  ['stu-03', { id: 'stu-03', studentCode: 'HS1203', fullName: 'Nguyễn Diệu Linh', dob: '2008-11-08', gender: 'Nữ', classId: 'class-12a1', className: '12A1', username: 'hs.dieulinh', status: 'active' }],
  ['stu-04', { id: 'stu-04', studentCode: 'HS1204', fullName: 'Trần Bảo Ngọc', dob: '2008-01-24', gender: 'Nữ', classId: 'class-12a1', className: '12A1', username: 'hs.baongoc', status: 'active' }],
  ['stu-05', { id: 'stu-05', studentCode: 'HS1205', fullName: 'Đỗ Đức Thắng', dob: '2008-09-12', gender: 'Nam', classId: 'class-12a1', className: '12A1', username: 'hs.ducthang', status: 'active' }],
  ['stu-06', { id: 'stu-06', studentCode: 'HS1206', fullName: 'Vũ Thảo Vy', dob: '2008-07-03', gender: 'Nữ', classId: 'class-12a1', className: '12A1', username: 'hs.thaovy', status: 'active' }],
  ['stu-07', { id: 'stu-07', studentCode: 'HS1207', fullName: 'Ngô Gia Huy', dob: '2008-04-18', gender: 'Nam', classId: 'class-12a2', className: '12A2', username: 'hs.giahuy', status: 'active' }],
  ['stu-08', { id: 'stu-08', studentCode: 'HS1208', fullName: 'Bùi Phương Anh', dob: '2008-12-05', gender: 'Nữ', classId: 'class-12a2', className: '12A2', username: 'hs.phuonganh', status: 'active' }],
  ['stu-09', { id: 'stu-09', studentCode: 'HS1101', fullName: 'Hoàng Hải Nam', dob: '2009-02-14', gender: 'Nam', classId: 'class-11b1', className: '11B1', username: 'hs.hainam', status: 'active' }],
  ['stu-10', { id: 'stu-10', studentCode: 'HS1001', fullName: 'Đặng Mai Phương', dob: '2010-06-22', gender: 'Nữ', classId: 'class-10c1', className: '10C1', username: 'hs.maiphuong', status: 'active' }],
]);

const ASSIGNMENTS: Map<string, ServerAssignment> = new Map([
  [
    'asg-1',
    {
      id: 'asg-1',
      examId: 'exam-12-gki-01',
      examTitle: 'Đề kiểm tra Giữa học kỳ I - Toán 12 (Chuẩn CV 7991)',
      category: 'test',
      subject: 'Toán học',
      teacherId: 'user-admin',
      teacherName: 'Thầy Hồ Nguyễn Đa Thiện',
      classIds: ['class-12a1', 'class-12a2'],
      classNames: ['12A1', '12A2'],
      targetType: 'class',
      startDate: '2026-10-20T08:00',
      endDate: '2026-10-30T23:59',
      durationMinutes: 90,
      maxAttempts: 1,
      shuffleQuestions: true,
      shuffleAnswers: true,
      publishScoreImmediately: true,
      publishSolutionsImmediately: false,
      proctorPolicy: 'warning_and_log',
      status: 'in_progress',
      totalAssigned: 74,
      totalSubmitted: 68,
    },
  ],
  [
    'asg-2',
    {
      id: 'asg-2',
      examId: 'exam-12-hw-01',
      examTitle: 'Bài tập rèn luyện: Khảo sát hàm số & Cực trị nâng cao',
      category: 'homework',
      subject: 'Toán học',
      teacherId: 'user-admin',
      teacherName: 'Thầy Hồ Nguyễn Đa Thiện',
      classIds: ['class-12a1'],
      classNames: ['12A1'],
      targetType: 'class',
      startDate: '2026-10-22T08:00',
      endDate: '2026-11-05T23:59',
      durationMinutes: 45,
      maxAttempts: 3,
      shuffleQuestions: false,
      shuffleAnswers: false,
      publishScoreImmediately: true,
      publishSolutionsImmediately: true,
      proctorPolicy: 'warning_only',
      status: 'in_progress',
      totalAssigned: 38,
      totalSubmitted: 32,
    },
  ],
  [
    'asg-3',
    {
      id: 'asg-3',
      examId: 'exam-12-final-mock',
      examTitle: 'Bài thi thử Tốt nghiệp THPT 2026 - Môn Toán (Đợt 1)',
      category: 'exam',
      subject: 'Toán học',
      teacherId: 'user-admin',
      teacherName: 'Thầy Hồ Nguyễn Đa Thiện',
      classIds: ['class-12a1', 'class-12a2'],
      classNames: ['12A1', '12A2'],
      targetType: 'class',
      startDate: '2026-10-25T14:00',
      endDate: '2026-11-10T17:00',
      durationMinutes: 90,
      maxAttempts: 1,
      shuffleQuestions: true,
      shuffleAnswers: true,
      publishScoreImmediately: false,
      publishSolutionsImmediately: false,
      proctorPolicy: 'lock_exam',
      status: 'in_progress',
      totalAssigned: 74,
      totalSubmitted: 45,
    },
  ],
]);

const SESSIONS: Map<string, { userId: string; role: 'TEACHER' | 'STUDENT'; permission?: 'ADMIN' | 'STANDARD'; expiresAt: number }> = new Map();
const ACTIVE_EXAM_SESSIONS: Map<string, ActiveSession> = new Map(); // key: studentId:assignmentId
const EXAM_EVENTS: ExamEvent[] = [];
const AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-01',
    userId: 'user-admin',
    userName: 'Thầy Hồ Nguyễn Đa Thiện',
    action: 'KHỞI TẠO HỆ THỐNG',
    details: 'Thiết lập chuẩn phân quyền Giáo viên Quản trị & Học sinh',
    timestamp: new Date().toLocaleString('vi-VN'),
  },
];

function recordAudit(userId: string, userName: string, action: string, details: string) {
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    userName,
    action,
    details,
    timestamp: new Date().toLocaleString('vi-VN'),
  };
  AUDIT_LOGS.unshift(log);
}

// -------------------------------------------------------------
// AUTHENTICATION & AUTHORIZATION MIDDLEWARES (Server-Enforced)
// -------------------------------------------------------------

function getAuthUser(req: Request): ServerUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const session = SESSIONS.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    SESSIONS.delete(token);
    return null;
  }
  return USERS.get(session.userId) || null;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập hợp lệ để tiếp tục.' });
    return;
  }
  (req as any).user = user;
  next();
}

function requireTeacher(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as ServerUser;
  if (!user || user.role !== 'TEACHER') {
    res.status(403).json({ success: false, message: 'Quyền truy cập bị từ chối: Chỉ dành cho Giáo viên.' });
    return;
  }
  next();
}

function requireAdminTeacher(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as ServerUser;
  if (!user || user.role !== 'TEACHER' || user.permission !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Quyền truy cập bị từ chối: Chỉ dành cho Giáo viên có quyền Quản trị.',
    });
    return;
  }
  next();
}

// -------------------------------------------------------------
// API ROUTES: AUTHENTICATION
// -------------------------------------------------------------

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu.' });
    return;
  }

  const cleanUser = username.trim().toLowerCase();
  let matchedUser: ServerUser | null = null;

  for (const u of USERS.values()) {
    if (
      u.username.toLowerCase() === cleanUser ||
      u.email.toLowerCase() === cleanUser ||
      (u.teacherCode && u.teacherCode.toLowerCase() === cleanUser) ||
      (u.studentCode && u.studentCode.toLowerCase() === cleanUser)
    ) {
      matchedUser = u;
      break;
    }
  }

  if (!matchedUser) {
    res.status(401).json({ success: false, message: 'Tài khoản không tồn tại trên hệ thống.' });
    return;
  }

  if (matchedUser.status === 'locked') {
    res.status(403).json({
      success: false,
      message: 'Tài khoản đang bị khóa. Vui lòng liên hệ Giáo viên Quản trị để mở khóa.',
    });
    return;
  }

  // Password check (allow 'password123' or studentCode/123456)
  const isValidPass =
    matchedUser.password === password ||
    password === 'password123' ||
    password === '123456' ||
    (matchedUser.studentCode && password === matchedUser.studentCode);

  if (!isValidPass) {
    res.status(401).json({ success: false, message: 'Mật khẩu không chính xác.' });
    return;
  }

  // Generate Session Token
  const token = `token-${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;
  SESSIONS.set(token, {
    userId: matchedUser.id,
    role: matchedUser.role,
    permission: matchedUser.permission,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  recordAudit(
    matchedUser.id,
    matchedUser.fullName,
    'ĐĂNG NHẬP HỆ THỐNG',
    `Đăng nhập thành công với vai trò ${matchedUser.role} (${matchedUser.permission || 'Học sinh'})`
  );

  const { password: _, ...safeUser } = matchedUser;
  res.json({
    success: true,
    token,
    user: safeUser,
  });
});

// POST /api/auth/google-login
app.post('/api/auth/google-login', (req, res) => {
  const { uid, email } = req.body;
  if (!uid || !email) {
    res.status(400).json({ success: false, message: 'Thiếu thông tin nhận diện Google (UID, Email).' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Tìm kiếm chính xác theo UID hoặc googleUid đã liên kết an toàn
  let matchedUser: ServerUser | null = USERS.get(uid) || USERS.get(`google-${uid}`) || null;

  if (!matchedUser) {
    for (const u of USERS.values()) {
      if (u.id === uid || u.googleUid === uid) {
        matchedUser = u;
        break;
      }
    }
  }

  // 2. Nếu chưa liên kết UID, kiểm tra xem có tài khoản nào trùng Email nhưng chưa liên kết không
  if (!matchedUser) {
    let emailCollisionUser: ServerUser | null = null;
    for (const u of USERS.values()) {
      if (u.email.toLowerCase() === cleanEmail) {
        emailCollisionUser = u;
        break;
      }
    }

    if (emailCollisionUser) {
      // TUÂN THỦ NGHIÊM NGẶT YÊU CẦU: Không tự động liên kết hai tài khoản chỉ vì có cùng email!
      res.json({
        success: false,
        requiresManualLink: true,
        message: 'Email này đã tồn tại trong hệ thống dưới phương thức Email/Mật khẩu. Để bảo mật tài khoản, EduTest Smart không tự động liên kết tài khoản chỉ vì trùng email. Vui lòng đăng nhập bằng Email/Mật khẩu trước, sau đó vào Hồ sơ cá nhân để chọn "Liên kết tài khoản Google".',
      });
      return;
    }

    res.json({
      success: false,
      notRegistered: true,
      message: 'Tài khoản Google chưa được liên kết hồ sơ trên EduTest Smart. Vui lòng hoàn tất bước đăng ký.',
    });
    return;
  }

  if (matchedUser.status === 'locked') {
    res.status(403).json({
      success: false,
      message: 'Tài khoản đang bị khóa. Vui lòng liên hệ Giáo viên Quản trị để mở khóa.',
    });
    return;
  }

  // Cấp Session Token
  const token = `token-google-${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;
  SESSIONS.set(token, {
    userId: matchedUser.id,
    role: matchedUser.role,
    permission: matchedUser.permission,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  recordAudit(
    matchedUser.id,
    matchedUser.fullName,
    'ĐĂNG NHẬP GOOGLE',
    `Đăng nhập Google thành công với vai trò ${matchedUser.role} (${matchedUser.permission || (matchedUser.role === 'TEACHER' ? 'Chờ duyệt' : 'Học sinh')})`
  );

  const { password: _, ...safeUser } = matchedUser;
  res.json({
    success: true,
    token,
    user: safeUser,
  });
});

// POST /api/auth/google-register
app.post('/api/auth/google-register', (req, res) => {
  const {
    uid,
    email,
    fullName,
    role,
    schoolName,
    phone,
    teachingSubjects,
    studentCode,
    gender,
  } = req.body;

  if (!uid || !email || !fullName || !role) {
    res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin bắt buộc.' });
    return;
  }

  // BẢO VỆ PHÂN QUYỀN MÁY CHỦ: Không cho phép tự gán ADMIN
  if (role !== 'TEACHER' && role !== 'STUDENT') {
    res.status(400).json({ success: false, message: 'Vai trò đăng ký không hợp lệ.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  // Kiểm tra trùng UID
  if (USERS.has(uid) || USERS.has(`google-${uid}`)) {
    res.status(400).json({ success: false, message: 'Tài khoản Google này đã có hồ sơ trên hệ thống. Vui lòng chọn Đăng nhập.' });
    return;
  }

  // Xử lý email đã đăng ký bằng mật khẩu hệ thống trước đó
  for (const existingUser of USERS.values()) {
    if (existingUser.email.toLowerCase() === cleanEmail && existingUser.password) {
      res.status(409).json({
        success: false,
        isEmailConflict: true,
        message: 'Email này đã tồn tại trong hệ thống với mật khẩu riêng. Để bảo mật, vui lòng đăng nhập bằng Mật khẩu hoặc liên hệ Quản trị viên.',
      });
      return;
    }
  }

  const username = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '') || `user.${Date.now()}`;
  let newServerUser: ServerUser;

  if (role === 'TEACHER') {
    const code = `GV${Math.floor(100 + Math.random() * 900)}`;
    newServerUser = {
      id: uid,
      username: `gv.${username}`,
      password: '', // Xác thực qua Google, không lưu mật khẩu
      fullName: fullName.trim(),
      salutation: fullName.startsWith('Cô') ? 'Cô' : 'Thầy',
      email: cleanEmail,
      role: 'TEACHER',
      permission: 'STANDARD', // BẮT BUỘC STANDARD - Tuyệt đối không cấp ADMIN
      teacherCode: code,
      schoolName: (schoolName || 'THPT GDPT 2018').trim(),
      phone: phone?.trim(),
      teachingSubjects: Array.isArray(teachingSubjects) && teachingSubjects.length > 0 ? teachingSubjects : ['TOAN_10', 'TOAN_11', 'TOAN_12'],
      assignedClassIds: [],
      status: 'pending', // BẮT BUỘC PENDING - Giáo viên chờ duyệt
      createdAt: new Date().toISOString().substring(0, 10),
    };
  } else {
    // STUDENT
    const sCode = (studentCode || `HS${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();
    newServerUser = {
      id: uid,
      username: `hs.${username}`,
      password: '',
      fullName: fullName.trim(),
      email: cleanEmail,
      role: 'STUDENT',
      studentCode: sCode,
      schoolName: (schoolName || 'THPT GDPT 2018').trim(),
      assignedClassIds: [],
      status: 'active', // BẮT BUỘC ACTIVE - Học sinh kích hoạt ngay
      createdAt: new Date().toISOString().substring(0, 10),
    };

    // Đưa học sinh vào danh sách lớp/học sinh chung
    const studentRecord: ServerStudent = {
      id: `stu-${uid}`,
      studentCode: sCode,
      fullName: fullName.trim(),
      gender: gender === 'Nữ' ? 'Nữ' : 'Nam',
      classId: '',
      className: 'Chưa phân lớp',
      username: newServerUser.username,
      status: 'active',
      notes: 'Đăng ký trực tuyến qua tài khoản Google',
    };
    STUDENTS.set(studentRecord.id, studentRecord);
  }

  USERS.set(uid, newServerUser);

  // Cấp Session Token
  const token = `token-google-${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;
  SESSIONS.set(token, {
    userId: newServerUser.id,
    role: newServerUser.role,
    permission: newServerUser.permission,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  recordAudit(
    newServerUser.id,
    newServerUser.fullName,
    'ĐĂNG KÝ GOOGLE',
    `Đăng ký tài khoản mới bằng Google (${newServerUser.role} - ${newServerUser.status === 'pending' ? 'Chờ duyệt' : 'Kích hoạt ngay'})`
  );

  const { password: _, ...safeUser } = newServerUser;
  res.json({
    success: true,
    token,
    user: safeUser,
    message: role === 'TEACHER'
      ? 'Đăng ký thành công! Tài khoản Giáo viên đang ở trạng thái Chờ duyệt (PENDING) bởi Giáo viên Quản trị.'
      : 'Đăng ký thành công! Tài khoản Học sinh đã sẵn sàng hoạt động.',
  });
});

// GET /api/auth/me
app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    return;
  }
  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    SESSIONS.delete(token);
  }
  res.json({ success: true, message: 'Đăng xuất thành công.' });
});

// PUT /api/auth/profile (Update self profile)
app.put('/api/auth/profile', requireAuth, (req, res) => {
  const currentUser = (req as any).user as ServerUser;
  const { fullName, phone, email } = req.body;

  if (fullName) currentUser.fullName = fullName.trim();
  if (phone) currentUser.phone = phone.trim();
  if (email) currentUser.email = email.trim();

  // IMPORTANT: Users CANNOT self-grant ADMIN permission or change roles!
  USERS.set(currentUser.id, currentUser);
  recordAudit(currentUser.id, currentUser.fullName, 'CẬP NHẬT HỒ SƠ', 'Cập nhật thông tin liên hệ cá nhân');

  const { password: _, ...safeUser } = currentUser;
  res.json({ success: true, user: safeUser });
});

// POST /api/auth/link-google (Liên kết Google với tài khoản hiện tại)
app.post('/api/auth/link-google', requireAuth, (req, res) => {
  const currentUser = (req as any).user as ServerUser;
  const { googleUid, googleEmail } = req.body;

  if (!googleUid || !googleEmail) {
    res.status(400).json({ success: false, message: 'Thiếu thông tin tài khoản Google để liên kết.' });
    return;
  }

  const cleanGoogleEmail = googleEmail.trim().toLowerCase();

  // 1. Kiểm tra xem Google UID hoặc Google Email này đã thuộc về tài khoản khác chưa!
  // YÊU CẦU: "Nếu Google đã thuộc về UID khác, không tự gộp hoặc xóa tài khoản; thông báo rõ và yêu cầu xử lý an toàn."
  for (const u of USERS.values()) {
    if (u.id !== currentUser.id) {
      if (u.id === googleUid || u.googleUid === googleUid) {
        res.status(409).json({
          success: false,
          isAlreadyLinkedOther: true,
          message: `Tài khoản Google (${cleanGoogleEmail}) đã được liên kết với một tài khoản người dùng khác trong hệ thống. Để bảo vệ dữ liệu, hệ thống không tự động gộp hoặc xóa tài khoản. Vui lòng chọn tài khoản Google khác.`,
        });
        return;
      }
    }
  }

  // 2. Bảo toàn tuyệt đối: Không thay đổi vai trò (role), quyền (permission) hoặc trạng thái (status)!
  // YÊU CẦU: "Sau khi liên kết thành công, giữ nguyên UID, hồ sơ Firestore, vai trò và dữ liệu liên quan."
  // "Không cho phép thay đổi vai trò TEACHER/STUDENT hoặc tự cấp ADMIN thông qua liên kết tài khoản."
  const originalRole = currentUser.role;
  const originalPermission = currentUser.permission;
  const originalStatus = currentUser.status;
  const originalId = currentUser.id;

  currentUser.googleUid = googleUid;
  currentUser.googleEmail = cleanGoogleEmail;

  if (!currentUser.linkedProviders) {
    currentUser.linkedProviders = ['password'];
  }
  if (!currentUser.linkedProviders.includes('google.com')) {
    currentUser.linkedProviders.push('google.com');
  }

  // Đảm bảo không bị thay đổi vai trò
  currentUser.role = originalRole;
  currentUser.permission = originalPermission;
  currentUser.status = originalStatus;
  currentUser.id = originalId;

  USERS.set(currentUser.id, currentUser);

  recordAudit(
    currentUser.id,
    currentUser.fullName,
    'LIÊN KẾT GOOGLE',
    `Liên kết thành công tài khoản Google (${cleanGoogleEmail}) vào tài khoản hiện tại. Giữ nguyên 100% UID (${currentUser.id}) và vai trò ${currentUser.role}.`
  );

  const { password: _, ...safeUser } = currentUser;
  res.json({
    success: true,
    user: safeUser,
    message: 'Liên kết tài khoản Google thành công! Từ bây giờ bạn có thể đăng nhập bằng cả Email/Mật khẩu hoặc Google.',
  });
});

// POST /api/auth/unlink-google (Hủy liên kết Google an toàn)
app.post('/api/auth/unlink-google', requireAuth, (req, res) => {
  const currentUser = (req as any).user as ServerUser;

  // Bảo vệ: Chỉ cho phép hủy liên kết Google nếu tài khoản có mật khẩu dự phòng
  if (!currentUser.password) {
    res.status(400).json({
      success: false,
      message: 'Không thể hủy liên kết Google vì tài khoản này chưa thiết lập mật khẩu đăng nhập dự phòng.',
    });
    return;
  }

  currentUser.googleUid = undefined;
  currentUser.googleEmail = undefined;
  if (currentUser.linkedProviders) {
    currentUser.linkedProviders = currentUser.linkedProviders.filter((p) => p !== 'google.com');
  }

  USERS.set(currentUser.id, currentUser);

  recordAudit(
    currentUser.id,
    currentUser.fullName,
    'HỦY LIÊN KẾT GOOGLE',
    'Hủy liên kết tài khoản Google khỏi hồ sơ người dùng.'
  );

  const { password: _, ...safeUser } = currentUser;
  res.json({
    success: true,
    user: safeUser,
    message: 'Đã hủy liên kết tài khoản Google. Bạn vẫn có thể đăng nhập bình thường bằng Email/Mật khẩu.',
  });
});

// POST /api/auth/change-password
app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const currentUser = (req as any).user as ServerUser;
  const { oldPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
    return;
  }

  currentUser.password = newPassword;
  USERS.set(currentUser.id, currentUser);
  recordAudit(currentUser.id, currentUser.fullName, 'ĐỔI MẬT KHẨU', 'Đổi mật khẩu tài khoản thành công');
  res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
});

// -------------------------------------------------------------
// API ROUTES: QUẢN LÝ GIÁO VIÊN (ADMIN TEACHERS ONLY)
// -------------------------------------------------------------

// GET /api/teachers
app.get('/api/teachers', requireAuth, requireAdminTeacher, (req, res) => {
  const teachers: any[] = [];
  for (const u of USERS.values()) {
    if (u.role === 'TEACHER') {
      const { password: _, ...t } = u;
      teachers.push(t);
    }
  }
  res.json({ success: true, teachers });
});

// POST /api/teachers (Add new teacher)
app.post('/api/teachers', requireAuth, requireAdminTeacher, (req, res) => {
  const adminUser = (req as any).user as ServerUser;
  const { fullName, username, email, phone, teachingSubjects, assignedClassIds, permission, teacherCode } = req.body;

  if (!fullName || !username) {
    res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên và tên đăng nhập.' });
    return;
  }

  const cleanUser = username.trim().toLowerCase();
  for (const u of USERS.values()) {
    if (u.username.toLowerCase() === cleanUser) {
      res.status(400).json({ success: false, message: 'Tên đăng nhập đã được sử dụng.' });
      return;
    }
  }

  const teacherId = `user-teacher-${Date.now()}`;
  const code = teacherCode?.trim() || `GV${Math.floor(100 + Math.random() * 900)}`;

  const newTeacher: ServerUser = {
    id: teacherId,
    username: cleanUser,
    password: 'password123', // Initial password
    fullName: fullName.trim(),
    salutation: fullName.startsWith('Cô') ? 'Cô' : 'Thầy',
    email: email?.trim() || `${cleanUser}@edutest.edu.vn`,
    role: 'TEACHER',
    permission: permission === 'ADMIN' ? 'ADMIN' : 'STANDARD',
    teacherCode: code,
    schoolName: adminUser.schoolName || 'THPT GDPT 2018',
    phone: phone?.trim(),
    teachingSubjects: Array.isArray(teachingSubjects) ? teachingSubjects : ['TOAN_12'],
    assignedClassIds: Array.isArray(assignedClassIds) ? assignedClassIds : [],
    status: 'active',
    createdAt: new Date().toISOString().substring(0, 10),
  };

  USERS.set(teacherId, newTeacher);
  recordAudit(adminUser.id, adminUser.fullName, 'THÊM GIÁO VIÊN', `Thêm giáo viên ${newTeacher.fullName} (${newTeacher.permission})`);

  const { password: _, ...safe } = newTeacher;
  res.json({ success: true, teacher: safe });
});

// PUT /api/teachers/:id (Edit teacher)
app.put('/api/teachers/:id', requireAuth, requireAdminTeacher, (req, res) => {
  const adminUser = (req as any).user as ServerUser;
  const { id } = req.params;
  const target = USERS.get(id);

  if (!target || target.role !== 'TEACHER') {
    res.status(404).json({ success: false, message: 'Không tìm thấy giáo viên.' });
    return;
  }

  const { fullName, phone, teachingSubjects, assignedClassIds, permission, teacherCode } = req.body;

  // RULE: Cannot demote the last ADMIN teacher
  if (target.permission === 'ADMIN' && permission === 'STANDARD') {
    let adminCount = 0;
    for (const u of USERS.values()) {
      if (u.role === 'TEACHER' && u.permission === 'ADMIN' && u.status === 'active') {
        adminCount++;
      }
    }
    if (adminCount <= 1) {
      res.status(400).json({
        success: false,
        message: 'Không thể thu hồi quyền quản trị của Giáo viên Quản trị cuối cùng trong hệ thống.',
      });
      return;
    }
  }

  if (fullName) target.fullName = fullName.trim();
  if (phone !== undefined) target.phone = phone.trim();
  if (teacherCode) target.teacherCode = teacherCode.trim();
  if (Array.isArray(teachingSubjects)) target.teachingSubjects = teachingSubjects;
  if (Array.isArray(assignedClassIds)) target.assignedClassIds = assignedClassIds;
  if (permission === 'ADMIN' || permission === 'STANDARD') target.permission = permission;

  USERS.set(id, target);
  recordAudit(adminUser.id, adminUser.fullName, 'SỬA GIÁO VIÊN', `Cập nhật thông tin giáo viên ${target.fullName}`);

  const { password: _, ...safe } = target;
  res.json({ success: true, teacher: safe });
});

// PATCH /api/teachers/:id/status (Lock/Unlock teacher)
app.patch('/api/teachers/:id/status', requireAuth, requireAdminTeacher, (req, res) => {
  const adminUser = (req as any).user as ServerUser;
  const { id } = req.params;
  const { status } = req.body;
  const target = USERS.get(id);

  if (!target || target.role !== 'TEACHER') {
    res.status(404).json({ success: false, message: 'Không tìm thấy giáo viên.' });
    return;
  }

  // RULE: Cannot lock the last ADMIN teacher
  if (target.permission === 'ADMIN' && status === 'locked') {
    let activeAdminCount = 0;
    for (const u of USERS.values()) {
      if (u.role === 'TEACHER' && u.permission === 'ADMIN' && u.status === 'active') {
        activeAdminCount++;
      }
    }
    if (activeAdminCount <= 1) {
      res.status(400).json({
        success: false,
        message: 'Không thể khóa tài khoản Giáo viên Quản trị cuối cùng đang hoạt động.',
      });
      return;
    }
  }

  target.status = status;
  USERS.set(id, target);
  recordAudit(
    adminUser.id,
    adminUser.fullName,
    status === 'locked' ? 'KHÓA TÀI KHOẢN GV' : 'MỞ KHÓA TÀI KHOẢN GV',
    `${status === 'locked' ? 'Khóa' : 'Mở khóa'} tài khoản giáo viên ${target.fullName}`
  );

  res.json({ success: true, status: target.status });
});

// POST /api/teachers/:id/reset-password
app.post('/api/teachers/:id/reset-password', requireAuth, requireAdminTeacher, (req, res) => {
  const adminUser = (req as any).user as ServerUser;
  const { id } = req.params;
  const target = USERS.get(id);

  if (!target || target.role !== 'TEACHER') {
    res.status(404).json({ success: false, message: 'Không tìm thấy giáo viên.' });
    return;
  }

  target.password = 'password123';
  USERS.set(id, target);
  recordAudit(adminUser.id, adminUser.fullName, 'CẤP LẠI MẬT KHẨU', `Cấp lại mật khẩu mặc định cho giáo viên ${target.fullName}`);
  res.json({ success: true, message: 'Đã cấp lại mật khẩu mặc định: password123' });
});

// DELETE /api/teachers/:id (Safe Deletion with Data Preservation)
app.delete('/api/teachers/:id', requireAuth, requireAdminTeacher, (req, res) => {
  const adminUser = (req as any).user as ServerUser;
  const { id } = req.params;
  const target = USERS.get(id);

  if (!target || target.role !== 'TEACHER') {
    res.status(404).json({ success: false, message: 'Không tìm thấy giáo viên.' });
    return;
  }

  // RULE: Cannot delete last admin teacher
  if (target.permission === 'ADMIN') {
    let adminCount = 0;
    for (const u of USERS.values()) {
      if (u.role === 'TEACHER' && u.permission === 'ADMIN' && u.id !== id) {
        adminCount++;
      }
    }
    if (adminCount === 0) {
      res.status(400).json({
        success: false,
        message: 'Không được phép xóa tài khoản Giáo viên Quản trị cuối cùng trong hệ thống.',
      });
      return;
    }
  }

  // SAFE DELETION REQUIREMENT:
  // "Khi xóa giáo viên đã có dữ liệu, phải bảo toàn lịch sử đề thi, bài được giao và kết quả học sinh.
  // Ưu tiên vô hiệu hóa tài khoản thay vì xóa vật lý dữ liệu có liên quan."
  target.status = 'locked';
  target.fullName = `${target.fullName} (Đã ngưng công tác)`;
  USERS.set(id, target);

  recordAudit(
    adminUser.id,
    adminUser.fullName,
    'VÔ HIỆU HÓA AN TOÀN GV',
    `Vô hiệu hóa an toàn giáo viên ${target.fullName}, bảo toàn 100% lịch sử đề thi, bài giao và kết quả học sinh`
  );

  res.json({
    success: true,
    message: 'Tài khoản giáo viên đã được vô hiệu hóa an toàn. Toàn bộ lịch sử đề thi và bài làm học sinh được bảo toàn nguyên vẹn.',
  });
});

// -------------------------------------------------------------
// API ROUTES: CLASSES & STUDENTS
// -------------------------------------------------------------

// GET /api/classes
app.get('/api/classes', requireAuth, (req, res) => {
  res.json({ success: true, classes: Array.from(CLASSES.values()) });
});

// POST /api/classes
app.post('/api/classes', requireAuth, requireTeacher, (req, res) => {
  const teacher = (req as any).user as ServerUser;
  const { name, grade, academicYear, room } = req.body;

  if (!name) {
    res.status(400).json({ success: false, message: 'Vui lòng nhập tên lớp.' });
    return;
  }

  const classId = `class-${Date.now()}`;
  const newClass: ServerClass = {
    id: classId,
    name: name.trim(),
    grade: Number(grade) || 12,
    academicYear: academicYear || '2025-2026',
    teacherId: teacher.id,
    teacherName: teacher.fullName,
    studentCount: 0,
    room: room?.trim() || undefined,
    createdAt: new Date().toISOString().substring(0, 10),
  };

  CLASSES.set(classId, newClass);
  recordAudit(teacher.id, teacher.fullName, 'TẠO LỚP MỚI', `Tạo lớp học ${newClass.name} - Khối ${newClass.grade}`);
  res.json({ success: true, class: newClass });
});

// GET /api/students
app.get('/api/students', requireAuth, (req, res) => {
  res.json({ success: true, students: Array.from(STUDENTS.values()) });
});

// POST /api/students (Add or Link student)
app.post('/api/students', requireAuth, requireTeacher, (req, res) => {
  const teacher = (req as any).user as ServerUser;
  const { studentCode, fullName, dob, gender, classId } = req.body;

  if (!studentCode || !fullName || !classId) {
    res.status(400).json({ success: false, message: 'Vui lòng nhập đủ Mã học sinh, Họ tên và Lớp.' });
    return;
  }

  const targetClass = CLASSES.get(classId);
  if (!targetClass) {
    res.status(404).json({ success: false, message: 'Lớp học không tồn tại.' });
    return;
  }

  const cleanCode = studentCode.trim().toUpperCase();

  // Check if student already exists in STUDENTS map
  for (const s of STUDENTS.values()) {
    if (s.studentCode.toUpperCase() === cleanCode) {
      // REQUIREMENT: "Nếu học sinh đã tồn tại, cho phép liên kết vào lớp phù hợp thay vì tạo hồ sơ mới."
      s.classId = classId;
      s.className = targetClass.name;
      STUDENTS.set(s.id, s);
      recordAudit(teacher.id, teacher.fullName, 'LIÊN KẾT HỌC SINH', `Liên kết học sinh ${s.fullName} (${s.studentCode}) vào lớp ${targetClass.name}`);
      res.json({ success: true, student: s, isLinkedExisting: true });
      return;
    }
  }

  // Create new student
  const studentId = `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const username = `hs.${cleanCode.toLowerCase()}`;

  const newStudent: ServerStudent = {
    id: studentId,
    studentCode: cleanCode,
    fullName: fullName.trim(),
    dob: dob || undefined,
    gender: gender === 'Nữ' ? 'Nữ' : 'Nam',
    classId: targetClass.id,
    className: targetClass.name,
    username,
    status: 'active',
  };

  STUDENTS.set(studentId, newStudent);

  // Also create user credential in USERS table
  const studentUser: ServerUser = {
    id: `user-${studentId}`,
    username,
    password: 'password123',
    fullName: newStudent.fullName,
    email: `${username}@hocsinh.edutest.vn`,
    role: 'STUDENT',
    studentCode: cleanCode,
    schoolName: teacher.schoolName || 'THPT GDPT 2018',
    assignedClassIds: [targetClass.id],
    status: 'active',
    createdAt: new Date().toISOString().substring(0, 10),
  };
  USERS.set(studentUser.id, studentUser);

  // Update student count
  targetClass.studentCount = Array.from(STUDENTS.values()).filter(s => s.classId === targetClass.id).length;
  CLASSES.set(targetClass.id, targetClass);

  recordAudit(teacher.id, teacher.fullName, 'THÊM HỌC SINH', `Thêm mới học sinh ${newStudent.fullName} (${newStudent.studentCode}) vào lớp ${targetClass.name}`);
  res.json({ success: true, student: newStudent, isLinkedExisting: false });
});

// POST /api/students/import-excel
app.post('/api/students/import-excel', requireAuth, requireTeacher, (req, res) => {
  const teacher = (req as any).user as ServerUser;
  const { classId, rows } = req.body;

  if (!classId || !Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ success: false, message: 'Dữ liệu nhập danh sách không hợp lệ.' });
    return;
  }

  const targetClass = CLASSES.get(classId);
  if (!targetClass) {
    res.status(404).json({ success: false, message: 'Lớp học không tồn tại.' });
    return;
  }

  let importedCount = 0;
  let linkedCount = 0;

  for (const row of rows) {
    const code = String(row.studentCode || '').trim().toUpperCase();
    const name = String(row.fullName || '').trim();
    if (!code || !name) continue;

    let existingStudent: ServerStudent | null = null;
    for (const s of STUDENTS.values()) {
      if (s.studentCode.toUpperCase() === code) {
        existingStudent = s;
        break;
      }
    }

    if (existingStudent) {
      existingStudent.classId = classId;
      existingStudent.className = targetClass.name;
      STUDENTS.set(existingStudent.id, existingStudent);
      linkedCount++;
    } else {
      const studentId = `stu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const username = `hs.${code.toLowerCase()}`;
      const newStu: ServerStudent = {
        id: studentId,
        studentCode: code,
        fullName: name,
        dob: row.dob || undefined,
        gender: row.gender === 'Nữ' ? 'Nữ' : 'Nam',
        classId,
        className: targetClass.name,
        username,
        status: 'active',
      };
      STUDENTS.set(studentId, newStu);

      // Create login user
      const studentUser: ServerUser = {
        id: `user-${studentId}`,
        username,
        password: 'password123',
        fullName: name,
        email: `${username}@hocsinh.edutest.vn`,
        role: 'STUDENT',
        studentCode: code,
        schoolName: teacher.schoolName || 'THPT GDPT 2018',
        assignedClassIds: [classId],
        status: 'active',
        createdAt: new Date().toISOString().substring(0, 10),
      };
      USERS.set(studentUser.id, studentUser);
      importedCount++;
    }
  }

  targetClass.studentCount = Array.from(STUDENTS.values()).filter(s => s.classId === classId).length;
  CLASSES.set(classId, targetClass);

  recordAudit(
    teacher.id,
    teacher.fullName,
    'NHẬP EXCEL HỌC SINH',
    `Nhập Excel lớp ${targetClass.name}: ${importedCount} học sinh mới, ${linkedCount} học sinh liên kết lại`
  );

  res.json({
    success: true,
    message: `Đã nhập thành công ${importedCount} học sinh mới và liên kết ${linkedCount} học sinh đã có vào lớp ${targetClass.name}.`,
    importedCount,
    linkedCount,
  });
});

// -------------------------------------------------------------
// API ROUTES: ASSIGNMENTS & STUDENT PORTAL
// -------------------------------------------------------------

// GET /api/assignments (Role-Filtered)
app.get('/api/assignments', requireAuth, (req, res) => {
  const user = (req as any).user as ServerUser;
  const allAssignments = Array.from(ASSIGNMENTS.values());

  if (user.role === 'TEACHER') {
    // Teachers see all assignments or their managed assignments
    res.json({ success: true, assignments: allAssignments });
  } else {
    // Student: ONLY see assignments targeting this student or student's class
    const student = Array.from(STUDENTS.values()).find(s => s.username === user.username) || {
      id: user.id,
      classId: user.assignedClassIds?.[0] || 'class-12a1',
    };

    const studentAssignments = allAssignments.filter(a => {
      if (a.targetType === 'student') {
        return a.targetStudentIds?.includes(student.id);
      }
      return a.classIds.includes(student.classId);
    });

    res.json({ success: true, assignments: studentAssignments });
  }
});

// POST /api/assignments (Teacher Assigns Exam)
app.post('/api/assignments', requireAuth, requireTeacher, (req, res) => {
  const teacher = (req as any).user as ServerUser;
  const {
    examId,
    examTitle,
    category,
    classIds,
    targetType,
    targetStudentIds,
    startDate,
    endDate,
    durationMinutes,
    maxAttempts,
    shuffleQuestions,
    shuffleAnswers,
    publishScoreImmediately,
    publishSolutionsImmediately,
    proctorPolicy,
  } = req.body;

  if (!examId || !examTitle || !classIds?.length) {
    res.status(400).json({ success: false, message: 'Vui lòng chọn đề kiểm tra và lớp học.' });
    return;
  }

  const asgId = `asg-${Date.now()}`;
  const classNames = classIds.map((cid: string) => CLASSES.get(cid)?.name || cid);

  let totalAssigned = 0;
  if (targetType === 'student' && Array.isArray(targetStudentIds)) {
    totalAssigned = targetStudentIds.length;
  } else {
    totalAssigned = Array.from(STUDENTS.values()).filter(s => classIds.includes(s.classId)).length;
  }

  const newAssignment: ServerAssignment = {
    id: asgId,
    examId,
    examTitle,
    category: category || 'test',
    subject: 'Toán học',
    teacherId: teacher.id,
    teacherName: teacher.fullName,
    classIds,
    classNames,
    targetType: targetType || 'class',
    targetStudentIds: targetStudentIds || [],
    startDate: startDate || new Date().toISOString(),
    endDate: endDate || new Date(Date.now() + 7 * 86400000).toISOString(),
    durationMinutes: Number(durationMinutes) || 90,
    maxAttempts: Number(maxAttempts) || 1,
    shuffleQuestions: Boolean(shuffleQuestions),
    shuffleAnswers: Boolean(shuffleAnswers),
    publishScoreImmediately: publishScoreImmediately !== false,
    publishSolutionsImmediately: Boolean(publishSolutionsImmediately),
    proctorPolicy: proctorPolicy || 'warning_and_log',
    status: 'in_progress',
    totalAssigned,
    totalSubmitted: 0,
  };

  ASSIGNMENTS.set(asgId, newAssignment);
  recordAudit(
    teacher.id,
    teacher.fullName,
    'GIAO BÀI KIỂM TRA',
    `Giao bài "${newAssignment.examTitle}" cho lớp ${newAssignment.classNames.join(', ')} (${newAssignment.totalAssigned} học sinh)`
  );

  res.json({ success: true, assignment: newAssignment });
});

// -------------------------------------------------------------
// API ROUTES: PROCTORING & ANTI-CHEAT (Dual-tab & Tab-switch)
// -------------------------------------------------------------

// POST /api/exam-session/join
app.post('/api/exam-session/join', requireAuth, (req, res) => {
  const user = (req as any).user as ServerUser;
  const { assignmentId, examId, tabId } = req.body;

  if (!assignmentId || !tabId) {
    res.status(400).json({ success: false, message: 'Thiếu thông tin phiên làm bài.' });
    return;
  }

  const sessionKey = `${user.id}:${assignmentId}`;
  const now = Date.now();
  const existing = ACTIVE_EXAM_SESSIONS.get(sessionKey);

  // DUAL-TAB DETECTION CHECK:
  // If an active session exists with a DIFFERENT tabId, and heartbeat was received within last 20 seconds:
  if (existing && existing.activeTabId !== tabId && now - existing.lastHeartbeat < 20000) {
    existing.isDuplicateTabDetected = true;
    ACTIVE_EXAM_SESSIONS.set(sessionKey, existing);

    const event: ExamEvent = {
      id: `evt-${Date.now()}`,
      assignmentId,
      studentId: user.id,
      studentName: user.fullName,
      type: 'dual_tab_detected',
      details: `Phát hiện học sinh mở đồng thời 2 tab bài thi (Tab hiện hành: ${existing.activeTabId}, Tab mới: ${tabId})`,
      timestamp: new Date().toLocaleTimeString('vi-VN'),
    };
    EXAM_EVENTS.unshift(event);
    recordAudit(user.id, user.fullName, 'CẢNH BÁO GIAN LẬN', event.details);

    res.json({
      success: true,
      isDuplicateTab: true,
      message: 'CẢNH BÁO: Phát hiện bạn đang mở bài thi trên 2 tab hoặc cửa sổ cùng lúc! Tab phụ này bị khóa ghi dữ liệu để bảo vệ kết quả thi của bạn.',
      session: existing,
    });
    return;
  }

  // Create or refresh session with this tabId
  const session: ActiveSession = {
    sessionId: `sess-${user.id}-${Date.now()}`,
    assignmentId,
    examId,
    studentId: user.id,
    studentName: user.fullName,
    activeTabId: tabId,
    lastHeartbeat: now,
    isDuplicateTabDetected: false,
    tabSwitchCount: existing?.tabSwitchCount || 0,
    totalAwaySeconds: existing?.totalAwaySeconds || 0,
    isLocked: existing?.isLocked || false,
    lockReason: existing?.lockReason,
  };
  ACTIVE_EXAM_SESSIONS.set(sessionKey, session);

  res.json({ success: true, isDuplicateTab: false, session });
});

// POST /api/exam-session/heartbeat
app.post('/api/exam-session/heartbeat', requireAuth, (req, res) => {
  const user = (req as any).user as ServerUser;
  const { assignmentId, tabId } = req.body;
  const sessionKey = `${user.id}:${assignmentId}`;
  const session = ACTIVE_EXAM_SESSIONS.get(sessionKey);

  if (!session) {
    res.json({ success: true, active: false });
    return;
  }

  if (session.activeTabId !== tabId) {
    // Another tab has taken active control
    res.json({
      success: true,
      active: true,
      isDuplicateTab: true,
      message: 'Tab này đã bị thay thế bởi một tab bài thi khác.',
    });
    return;
  }

  session.lastHeartbeat = Date.now();
  ACTIVE_EXAM_SESSIONS.set(sessionKey, session);

  res.json({
    success: true,
    active: true,
    isDuplicateTab: session.isDuplicateTabDetected,
    isLocked: session.isLocked,
    lockReason: session.lockReason,
  });
});

// POST /api/exam-session/event (Tab Switch / Blur Events)
app.post('/api/exam-session/event', requireAuth, (req, res) => {
  const user = (req as any).user as ServerUser;
  const { assignmentId, type, details, awaySeconds } = req.body;
  const sessionKey = `${user.id}:${assignmentId}`;
  const session = ACTIVE_EXAM_SESSIONS.get(sessionKey);
  const assignment = ASSIGNMENTS.get(assignmentId);

  if (session) {
    if (type === 'tab_switch' || type === 'window_blur') {
      session.tabSwitchCount += 1;
      session.totalAwaySeconds += Number(awaySeconds) || 1;
    }

    // Apply teacher's configured proctor policy
    const policy = assignment?.proctorPolicy || 'warning_and_log';
    if (policy === 'lock_exam' && session.tabSwitchCount >= 3) {
      session.isLocked = true;
      session.lockReason = `Hệ thống đã khóa bài do vi phạm chuyển tab ${session.tabSwitchCount} lần (Chính sách: Khóa bài khi rời màn hình quá 3 lần).`;
    }

    ACTIVE_EXAM_SESSIONS.set(sessionKey, session);
  }

  const event: ExamEvent = {
    id: `evt-${Date.now()}`,
    assignmentId,
    studentId: user.id,
    studentName: user.fullName,
    type: type || 'tab_switch',
    details: details || `Rời màn hình bài thi (Lần ${session?.tabSwitchCount || 1})`,
    timestamp: new Date().toLocaleTimeString('vi-VN'),
  };
  EXAM_EVENTS.unshift(event);

  res.json({
    success: true,
    tabSwitchCount: session?.tabSwitchCount || 1,
    isLocked: session?.isLocked || false,
    lockReason: session?.lockReason,
  });
});

// GET /api/audit-logs
app.get('/api/audit-logs', requireAuth, requireAdminTeacher, (req, res) => {
  res.json({ success: true, logs: AUDIT_LOGS });
});

// GET /api/exam-events
app.get('/api/exam-events', requireAuth, requireTeacher, (req, res) => {
  res.json({ success: true, events: EXAM_EVENTS });
});

// -------------------------------------------------------------
// VITE DEV SERVER MOUNT & STATIC SERVING
// -------------------------------------------------------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[EduTest Smart] Vite middleware mounted in development mode.');
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EduTest Smart] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[EduTest Smart] Failed to start server:', err);
  process.exit(1);
});
