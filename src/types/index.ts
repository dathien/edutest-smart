/**
 * EduTest Smart - Core Data Types & Relational Interfaces
 * Designed for High School Math (Toán 10, 11, 12 - GDPT 2018) and extensible to all subjects.
 */

export type UserRole = 'TEACHER' | 'STUDENT';
export type TeacherPermission = 'ADMIN' | 'STANDARD';
export type Role = 'admin' | 'teacher' | 'student' | UserRole;

export interface User {
  id: string;
  username: string;
  fullName: string;
  teacherCode?: string; // e.g. "GV1201" for teachers
  salutation?: string; // e.g. 'Thầy', 'Cô'
  email: string;
  role: 'TEACHER' | 'STUDENT' | 'teacher' | 'student' | 'admin';
  permission?: 'ADMIN' | 'STANDARD'; // Only for TEACHER: ADMIN or STANDARD
  avatarUrl?: string;
  status: 'active' | 'pending' | 'locked';
  schoolName: string;
  phone?: string;
  teachingSubjects?: string[]; // e.g. ['TOAN_10', 'TOAN_11', 'TOAN_12']
  assignedClassIds?: string[]; // e.g. ['class-12a1', 'class-12a2']
  linkedProviders?: string[]; // e.g. ['password', 'google.com']
  googleEmail?: string;
  googleUid?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  teacherCode: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  permission: TeacherPermission;
  subjects: string[];
  assignedClassIds: string[];
  assignedClassNames: string[];
  status: 'active' | 'locked' | 'pending';
  createdAt: string;
}

export const isTeacher = (u?: User | null): boolean => {
  if (!u) return false;
  const r = String(u.role).toUpperCase();
  return r === 'TEACHER' || r === 'ADMIN';
};

export const isAdminTeacher = (u?: User | null): boolean => {
  if (!u) return false;
  if (!isTeacher(u)) return false;
  return u.permission === 'ADMIN' || String(u.role).toUpperCase() === 'ADMIN';
};

export const isStudent = (u?: User | null): boolean => {
  if (!u) return false;
  return String(u.role).toUpperCase() === 'STUDENT';
};

export interface Subject {
  id: string;
  code: string;
  name: string;
  gradeLevels: number[]; // e.g. [10, 11, 12]
  isActive: boolean;
  description: string;
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "12A1"
  grade: number; // 10, 11, 12
  academicYear: string; // e.g. "2025-2026"
  teacherId: string;
  teacherName: string;
  studentCount: number;
  room?: string;
  createdAt: string;
}

export interface Student {
  id: string; // UUID / Internal key
  studentCode: string; // School provided student ID e.g. "HS1201"
  fullName: string;
  dob?: string;
  gender: 'Nam' | 'Nữ';
  classId: string;
  className: string;
  username: string;
  status: 'active' | 'locked';
  notes?: string;
}

export type CognitiveLevel = 'nhan_biet' | 'thong_hieu' | 'van_dung' | 'van_dung_cao';

export type QuestionType = 
  | 'multiple_choice'    // 1. Trắc nghiệm 4 lựa chọn (A, B, C, D)
  | 'true_false_single' // 2. Đúng/Sai một mệnh đề (Đúng / Sai)
  | 'true_false'        // 3. Đúng/Sai nhiều mệnh đề (ý a, b, c, d - Công văn 7991)
  | 'short_answer'      // 4. Trả lời ngắn
  | 'numeric_answer'    // 5. Trả lời bằng số (sai số epsilon, phân số, đơn vị)
  | 'essay'             // 6. Tự luận (kèm rubric chấm từng bước)
  | 'fill_in_blank'     // 7. Điền vào chỗ trống
  | 'dropdown_choice'   // 8. Điền chọn Dropdown
  | 'matching'          // 9. Nối đôi (Cột A - Cột B)
  | 'ordering'          // 10. Sắp xếp thứ tự
  | 'multiple_select';  // 11. Chọn nhiều đáp án

export interface TrueFalseOption {
  id: 'a' | 'b' | 'c' | 'd';
  text: string;
  isCorrect: boolean; // true = Đúng, false = Sai
  explanation?: string;
}

// 5. Trả lời bằng số
export interface NumericAnswerConfig {
  targetValue: number;
  tolerance?: number; // Sai số cho phép (vd: 0.01)
  unit?: string; // Đơn vị tính (vd: cm, m^2, rad)
  allowFractions?: boolean; // Cho phép nhập dạng phân số a/b
  displayAnswer?: string; // Hiển thị chuẩn vd: "3/4" hoặc "0.75"
}

// 7. Điền vào chỗ trống
export interface FillInBlankItem {
  id: string; // vd: "blank_1"
  label?: string; // vd: "(1)"
  correctAnswers: string[]; // Danh sách đáp án được chấp nhận
  caseSensitive?: boolean;
}

export interface FillInBlankConfig {
  template: string; // Đoạn văn bản chứa các placeholder vd: "Hàm số đồng biến trên khoảng [blank_1] và nghịch biến trên [blank_2]."
  blanks: FillInBlankItem[];
}

// 8. Điền chọn Dropdown
export interface DropdownChoiceItem {
  id: string; // vd: "dropdown_1"
  label?: string; // vd: "Lựa chọn (1)"
  options: string[]; // Các phương án trong dropdown
  correctOption: string;
}

export interface DropdownChoiceConfig {
  template: string; // Đoạn văn bản chứa placeholder vd: "Đồ thị hàm số có tiệm cận đứng là [dropdown_1] và tiệm cận ngang là [dropdown_2]."
  dropdowns: DropdownChoiceItem[];
}

// 9. Nối đôi
export interface MatchingItem {
  id: string; // vd: "A1", "A2" hoặc "B1", "B2"
  text: string;
}

export interface MatchingConfig {
  leftItems: MatchingItem[]; // Nhóm A (ví dụ: Tên hàm số)
  rightItems: MatchingItem[]; // Nhóm B (ví dụ: Tập xác định / Đạo hàm tương ứng)
  pairs: { leftId: string; rightId: string }[]; // Cặp ghép đúng
}

// 10. Sắp xếp thứ tự
export interface OrderingItem {
  id: string;
  text: string;
}

export interface OrderingConfig {
  items: OrderingItem[];
  correctOrder: string[]; // Mảng các ID theo thứ tự chính xác từ đầu đến cuối
}

// 11. Chọn nhiều đáp án
export interface MultipleSelectConfig {
  options: string[]; // Danh sách các lựa chọn [A, B, C, D, E...]
  correctAnswers: string[]; // Các lựa chọn đúng (vd: ["A", "C", "D"])
  partialScoring?: boolean; // Có tính điểm thành phần hay không
}

// Bảng biến thiên tùy chỉnh chi tiết
export interface CustomVariationTableData {
  xPoints: string[]; // vd: ["-\\infty", "-1", "2", "+\\infty"]
  yPrimeSigns: string[]; // vd: ["+", "0", "-", "||", "+"]
  yValues: string[]; // vd: ["-\\infty", "4", "-3", "+\\infty"]
  arrowDirections?: ('up' | 'down')[];
  title?: string;
  isFractionalUndefined?: boolean;
}

// Bảng xét dấu đạo hàm / tam thức
export interface SignTableData {
  label: string; // vd: "f'(x)" hoặc "x^2 - 4x + 3"
  xPoints: string[]; // vd: ["-\\infty", "1", "3", "+\\infty"]
  signs: string[]; // vd: ["+", "0", "-", "0", "+"]
}

export interface Question {
  id: string;
  code: string;
  subjectCode: string; // 'TOAN'
  grade: number; // 10, 11, 12
  topic: string; // e.g. "Ứng dụng đạo hàm khảo sát hàm số", "Vectơ và toạ độ không gian"
  lesson?: string; // e.g. "Tính đơn điệu của hàm số"
  cognitiveLevel: CognitiveLevel;
  type: QuestionType;
  prompt: string; // LaTeX + text supported
  options?: string[]; // For multiple_choice [A, B, C, D]
  correctAnswer?: string; // "A" | "B" | "C" | "D" or short answer string
  trueFalseOptions?: TrueFalseOption[]; // For true_false (4 items a,b,c,d)
  singleTrueFalseAnswer?: boolean; // For true_false_single (Đúng/Sai đơn)
  numericAnswerConfig?: NumericAnswerConfig; // For numeric_answer
  fillInBlankConfig?: FillInBlankConfig; // For fill_in_blank
  dropdownChoiceConfig?: DropdownChoiceConfig; // For dropdown_choice
  matchingConfig?: MatchingConfig; // For matching
  orderingConfig?: OrderingConfig; // For ordering
  multipleSelectConfig?: MultipleSelectConfig; // For multiple_select
  rubricGuide?: string; // For essay: hướng dẫn chấm
  points: number; // Điểm câu hỏi
  solution: string; // Lời giải chi tiết
  diagramType?: 'geometry' | 'function_curve' | 'variation_table' | 'coordinate_system' | 'custom_variation_table' | 'sign_table' | 'custom_svg';
  diagramData?: string;
  authorId: string;
  authorName: string;
  status: 'published' | 'draft';
  createdAt: string;
}

export interface MatrixCell {
  id: string;
  topic: string;
  learningOutcome: string; // Yêu cầu cần đạt
  cognitiveLevel: CognitiveLevel;
  questionType: QuestionType;
  questionCount: number;
  pointsPerQuestion: number;
  totalPoints: number;
}

export interface CognitiveRatioConfig {
  knowPct: number; // Nhận biết %
  compPct: number; // Thông hiểu %
  appPct: number;  // Vận dụng %
  isAutoBalanced?: boolean;
  presetId?: string;
  presetName?: string;
}

export interface CognitiveRatioPreset {
  id: string;
  name: string;
  knowPct: number;
  compPct: number;
  appPct: number;
  type: 'reference' | 'teacher_personal' | 'department_approved' | 'mandatory';
  description?: string;
  authorId?: string;
  authorName?: string;
  subject?: string;
  grade?: number;
  examType?: string;
  createdAt?: string;
}

export interface MatrixDocument {
  id: string;
  title: string;
  academicYear: '2025-2026' | '2026-2027';
  grade: 10 | 11 | 12;
  semester: 'GKI' | 'CKI' | 'GKII' | 'CKII';
  subject: string;
  curriculum: string; // 'Kết nối tri thức với cuộc sống'
  issuingUnit: string; // Trường / Đơn vị ban hành
  sourceDocument?: string; // Công văn / file nguồn
  isVerified: boolean; // Verified source vs Pending update
  durationMinutes: number;
  totalPoints: number;
  cells: MatrixCell[];
  cognitiveRatioConfig?: CognitiveRatioConfig;
  examType?: ExamType | string;
  authorName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  code: string;
  title: string;
  subjectCode: string;
  grade: number;
  academicYear: string;
  semester: string;
  durationMinutes: number;
  matrixId?: string;
  questions: Question[];
  totalPoints: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  proctoringMode: 'basic' | 'standard' | 'strict';
  showResultsImmediately: boolean;
  allowReviewSolutions: boolean;
  maxAttempts: number;
  createdById: string;
  createdByName: string;
  createdAt: string;
  status: 'draft' | 'published' | 'archived';
  version?: string; // e.g. 'v1.0', 'v1.1'
  variants?: ExamVariant[];
  auditStatus?: 'draft' | 'pending' | 'warning' | 'approved';
  essayRubrics?: { [questionId: string]: EssayRubricStep[] };
  examType?: ExamType | string;
  schoolHeader?: string;
  departmentHeader?: string;
}

export type AssignmentCategory = 'homework' | 'test' | 'exam'; // 1. Bài tập, 2. Bài kiểm tra, 3. Bài thi
export type AssignmentTargetType = 'class' | 'group' | 'student';
export type ProctorPolicy = 'warning_only' | 'warning_and_log' | 'lock_exam' | 'auto_submit';

export interface ExamAssignment {
  id: string;
  examId: string;
  examTitle: string;
  category?: AssignmentCategory; // 'homework' | 'test' | 'exam'
  subject?: string;
  teacherId?: string;
  teacherName?: string;
  classIds: string[];
  classNames: string[];
  targetType?: AssignmentTargetType;
  targetStudentIds?: string[]; // Specific students if targetType === 'student' or 'group'
  startDate: string;
  endDate: string;
  durationMinutes?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleAnswers?: boolean;
  publishScoreImmediately?: boolean;
  publishSolutionsImmediately?: boolean;
  proctorPolicy?: ProctorPolicy;
  status: 'upcoming' | 'in_progress' | 'completed' | 'closed';
  totalAssigned: number;
  totalSubmitted: number;
}

export interface ActiveExamSession {
  sessionId: string;
  assignmentId: string;
  examId: string;
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

export interface ExamEvent {
  id: string;
  sessionId?: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  type: 'tab_switch' | 'window_blur' | 'dual_tab_detected' | 'fullscreen_exit' | 'offline' | 'lock_enforced';
  details: string;
  timestamp: string;
}

export interface ViolationEvent {
  id: string;
  studentId: string;
  studentName: string;
  submissionId: string;
  timestamp: string;
  type: 'tab_switch' | 'window_blur' | 'fullscreen_exit' | 'network_disconnect';
  description: string;
}

export interface SubmissionAnswer {
  questionId: string;
  type: QuestionType;
  selectedOption?: string; // A, B, C, D (for multiple_choice, true_false_single)
  trueFalseAnswers?: { [key in 'a' | 'b' | 'c' | 'd']?: boolean }; // For true_false
  shortAnswerText?: string; // For short_answer
  numericAnswer?: string | number; // For numeric_answer
  essayContent?: string; // For essay
  blankAnswers?: { [blankId: string]: string }; // For fill_in_blank
  dropdownAnswers?: { [dropdownId: string]: string }; // For dropdown_choice
  matchingPairs?: { [leftId: string]: string }; // For matching: leftId -> rightId
  orderAnswer?: string[]; // For ordering: array of item IDs in chosen order
  multipleSelectAnswers?: string[]; // For multiple_select: array of chosen options
  isCorrect?: boolean;
  awardedPoints: number;
  teacherFeedback?: string;
}

export interface ExamDossier {
  id: string;
  code: string;
  title: string;
  subject: string;
  grade: number;
  academicYear: string;
  semester: string;
  examType: ExamType | string;
  matrixId: string;
  matrixTitle: string;
  specificationId?: string;
  specificationTitle?: string;
  examId: string;
  examTitle: string;
  rubricGuideAvailable: boolean;
  authorName: string;
  issuingUnit: string;
  auditStatus: 'draft' | 'under_review' | 'needs_revision' | 'approved' | 'published';
  createdAt: string;
  updatedAt: string;
}

export interface ExamSubmission {
  id: string;
  assignmentId: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  className: string;
  startedAt: string;
  submittedAt?: string;
  durationSeconds: number;
  answers: { [questionId: string]: SubmissionAnswer };
  autoScore: number;
  manualScore: number;
  totalScore: number;
  maxScore: number;
  isGraded: boolean;
  violationsCount: number;
  status: 'in_progress' | 'submitted' | 'graded';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export type ExamType =
  | 'kiem_tra_thuong_xuyen'
  | 'giua_ky_1'
  | 'cuoi_ky_1'
  | 'giua_ky_2'
  | 'cuoi_ky_2'
  | 'on_tap'
  | 'chu_de';

export interface EssayRubricStep {
  id: string;
  stepNumber: number;
  description: string;
  points: number;
}

export interface ExamVariant {
  code: string; // e.g. "101", "102", "103", "104"
  questions: Question[];
  answerKeyMap: { [questionId: string]: string };
}

export interface SpecificationRow {
  id: string;
  matrixCellId?: string;
  topic: string; // Chủ đề / Mạch kiến thức
  knowledgeUnit: string; // Đơn vị kiến thức / Kỹ năng
  learningOutcomes: string; // Chuẩn kiến thức, kỹ năng cần kiểm tra (Yêu cầu cần đạt)
  cognitiveLevel: CognitiveLevel;
  questionType: QuestionType;
  questionCount: number;
  questionCodes?: string; // Ví dụ: "Câu 1, Câu 2"
}

export interface SpecificationDocument {
  id: string;
  matrixId: string;
  title: string;
  subject: string;
  grade: number;
  academicYear: string;
  semester: string;
  issuingUnit?: string;
  rows: SpecificationRow[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditCriterionResult {
  id: number;
  title: string;
  category: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
  detail?: string;
  required: boolean;
}

