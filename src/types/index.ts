/**
 * EduTest Smart - Core Data Types & Relational Interfaces
 * Designed for High School Math (Toán 10, 11, 12 - GDPT 2018) and extensible to all subjects.
 */

export type Role = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  username: string;
  fullName: string;
  salutation?: string; // e.g. 'Thầy', 'Cô', 'Thầy giáo', 'Cô giáo'
  email: string;
  role: Role;
  avatarUrl?: string;
  status: 'active' | 'pending' | 'locked';
  schoolName: string;
  phone?: string;
  teachingSubjects?: string[]; // e.g. ['TOAN_10', 'TOAN_11', 'TOAN_12']
  createdAt: string;
}

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
  | 'multiple_choice' // Trắc nghiệm 4 lựa chọn (A, B, C, D)
  | 'true_false'       // Trắc nghiệm đúng/sai (ý a, b, c, d)
  | 'short_answer'     // Trả lời ngắn
  | 'essay';           // Tự luận

export interface TrueFalseOption {
  id: 'a' | 'b' | 'c' | 'd';
  text: string;
  isCorrect: boolean; // true = Đúng, false = Sai
  explanation?: string;
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
  trueFalseOptions?: TrueFalseOption[]; // For true_false
  rubricGuide?: string; // For essay: hướng dẫn chấm
  points: number; // Điểm câu hỏi
  solution: string; // Lời giải chi tiết
  diagramType?: 'geometry' | 'function_curve' | 'variation_table' | 'coordinate_system' | 'custom_svg';
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
}

export interface ExamAssignment {
  id: string;
  examId: string;
  examTitle: string;
  classIds: string[];
  classNames: string[];
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'closed';
  totalAssigned: number;
  totalSubmitted: number;
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
  selectedOption?: string; // A, B, C, D
  trueFalseAnswers?: { [key in 'a' | 'b' | 'c' | 'd']?: boolean };
  shortAnswerText?: string;
  essayContent?: string;
  isCorrect?: boolean;
  awardedPoints: number;
  teacherFeedback?: string;
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
