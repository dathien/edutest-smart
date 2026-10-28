/**
 * Types & Data Definitions for PHÒNG LAB TOÁN HỌC 10-11-12
 * Chương trình GDPT 2018 - SGK Kết nối tri thức với cuộc sống
 */

export type LabGrade = 10 | 11 | 12 | 'all';

export type LabCategory = 
  | 'algebra'       // Đại số & Giải tích
  | 'geometry_2d'   // Hình học phẳng 2D
  | 'geometry_3d'   // Hình học không gian 3D
  | 'trigonometry'  // Lượng giác
  | 'calculus'      // Đạo hàm & Tích phân
  | 'statistics';   // Xác suất & Thống kê

export type LabSimulationType =
  | 'parabola_2d'            // LAB 01 – Parabol động
  | 'cubic_function_2d'      // LAB 02 – Hàm số bậc ba & tiếp tuyến
  | 'trig_exponential_2d'    // LAB 03 – Hàm lượng giác, hàm mũ & logarit
  | 'linear_inequalities_2d' // LAB 04 – Miền nghiệm hệ BPT bậc nhất 2 ẩn
  | 'coordinate_system_3d'   // LAB 05 – Hệ tọa độ Oxyz 3D
  | 'lines_planes_3d'        // LAB 06 – Đường thẳng và mặt phẳng 3D
  | 'pyramid_polyhedra_3d'   // LAB 07 – Hình chóp xoay 3D & lăng trụ
  | 'cross_section_3d';      // LAB 08 – Thiết diện động 3D

export type LabInteractionMode = 'explore' | 'guided' | 'assigned';

export interface CurriculumMappingItem {
  id: string;
  code: string;           // Mã bài: e.g. "T10-CH3-B02"
  grade: 10 | 11 | 12;
  semester: 1 | 2;
  chapter: string;        // Tên chương: e.g. "Chương III: Hàm số và đồ thị"
  lessonName: string;     // Tên bài học SGK
  knowledgeTopic: string; // Đơn vị kiến thức
  mathProblemType: string;// Dạng toán
  simulationType: LabSimulationType;
  status: 'active' | 'in_progress';
  description: string;
}

export interface LabParameter {
  id: string;
  name: string;
  symbol: string;         // Ký hiệu toán học: e.g. "a", "b", "c", "x_0"
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  description?: string;
}

export interface LabTask {
  id: string;
  question: string;
  hint: string;
  expectedResultFormula?: string;
  checkCondition?: (params: Record<string, number>) => boolean;
}

export interface LabActivity {
  id: string;
  simulationType: LabSimulationType;
  title: string;
  grade: 10 | 11 | 12;
  category: LabCategory;
  curriculumCode: string;
  curriculumLesson: string;
  description: string;
  defaultParams: Record<string, number>;
  parameters: LabParameter[];
  formulaLatex: string;
  tasks: LabTask[];
  guideSteps: string[];
}

export interface SavedLabState {
  id: string;
  labId: string;
  simulationType: LabSimulationType;
  title: string;
  grade: 10 | 11 | 12;
  userId: string;
  userName: string;
  params: Record<string, number>;
  notes: string;
  savedAt: string;
}

export interface LabAssignment {
  id: string;
  labId: string;
  labTitle: string;
  simulationType: LabSimulationType;
  grade: 10 | 11 | 12;
  assignedByTeacherId: string;
  assignedByTeacherName: string;
  classIds: string[];
  classNames: string[];
  targetStudentIds?: string[];
  instructions: string;
  assignedAt: string;
  deadline: string;
  status: 'active' | 'closed';
  submissionCount: number;
}

export interface StudentLabSubmission {
  id: string;
  assignmentId: string;
  labId: string;
  studentId: string;
  studentName: string;
  className: string;
  params: Record<string, number>;
  answers: Record<string, string>;
  submittedAt: string;
  teacherFeedback?: string;
  score?: number;
}
