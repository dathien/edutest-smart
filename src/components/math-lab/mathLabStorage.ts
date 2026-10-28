import { SavedLabState, LabAssignment, StudentLabSubmission } from './types';

const LAB_STORAGE_KEYS = {
  SAVED_STATES: 'edutest_math_lab_saved_states',
  ASSIGNMENTS: 'edutest_math_lab_assignments',
  SUBMISSIONS: 'edutest_math_lab_submissions',
};

// Default initial assignments for Grade 10, 11, 12
const INITIAL_ASSIGNMENTS: LabAssignment[] = [
  {
    id: 'assign-10-parabola',
    labId: 'act-parabola',
    labTitle: 'LAB 01 – Parabol Động y = ax² + bx + c',
    simulationType: 'parabola_2d',
    grade: 10,
    assignedByTeacherId: 't-math-01',
    assignedByTeacherName: 'Thầy Nguyễn Văn An (Tổ Toán)',
    classIds: ['c1', 'c2'],
    classNames: ['10A1', '10A2'],
    instructions: 'Khảo sát tọa độ đỉnh I của hàm số y = x² - 2x - 5 và xác định các khoảng đồng biến, nghịch biến.',
    assignedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    deadline: new Date(Date.now() + 86400000 * 5).toISOString(),
    status: 'active',
    submissionCount: 1,
  },
  {
    id: 'assign-12-cubic',
    labId: 'act-cubic',
    labTitle: 'LAB 02 – Khảo Sát Hàm Bậc Ba & Tiếp Tuyến Động',
    simulationType: 'cubic_function_2d',
    grade: 12,
    assignedByTeacherId: 't-math-01',
    assignedByTeacherName: 'Cô Trần Thị Bình (Tổ Toán)',
    classIds: ['c4'],
    classNames: ['12A1'],
    instructions: 'Khảo sát y = x³ - 3x + 1, tìm 2 điểm cực trị và viết phương trình tiếp tuyến tại hoành độ x₀ = 0.',
    assignedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
    status: 'active',
    submissionCount: 0,
  },
  {
    id: 'assign-12-oxyz',
    labId: 'act-oxyz',
    labTitle: 'LAB 05 – Hệ Trục Tọa Độ Không Gian Oxyz 3D',
    simulationType: 'coordinate_system_3d',
    grade: 12,
    assignedByTeacherId: 't-math-01',
    assignedByTeacherName: 'Thầy Lê Minh Cường (Tổ Toán)',
    classIds: ['c4'],
    classNames: ['12A1'],
    instructions: 'Thiết lập điểm M(2, 3, 4) và ghi lại tọa độ 3 hình chiếu vuông góc lên các mặt phẳng tọa độ Oxy, Oxz, Oyz.',
    assignedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
    status: 'active',
    submissionCount: 1,
  },
];

export const MathLabStorage = {
  // 1. Saved States (Khám phá tự do & bài thực hành cá nhân đã lưu)
  getSavedStates(userId?: string): SavedLabState[] {
    try {
      const data = localStorage.getItem(LAB_STORAGE_KEYS.SAVED_STATES);
      const list: SavedLabState[] = data ? JSON.parse(data) : [];
      if (userId) {
        return list.filter((s) => s.userId === userId);
      }
      return list;
    } catch {
      return [];
    }
  },

  saveState(state: Omit<SavedLabState, 'id' | 'savedAt'>): SavedLabState {
    const existing = this.getSavedStates();
    const newState: SavedLabState = {
      ...state,
      id: `saved-lab-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      savedAt: new Date().toISOString(),
    };
    const updated = [newState, ...existing];
    try {
      localStorage.setItem(LAB_STORAGE_KEYS.SAVED_STATES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save lab state to localStorage', e);
    }
    return newState;
  },

  deleteSavedState(id: string): void {
    const existing = this.getSavedStates();
    const updated = existing.filter((s) => s.id !== id);
    try {
      localStorage.setItem(LAB_STORAGE_KEYS.SAVED_STATES, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete saved lab state', e);
    }
  },

  // 2. Lab Assignments (Giáo viên giao bài)
  getAssignments(): LabAssignment[] {
    try {
      const data = localStorage.getItem(LAB_STORAGE_KEYS.ASSIGNMENTS);
      if (!data) {
        localStorage.setItem(LAB_STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
        return INITIAL_ASSIGNMENTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_ASSIGNMENTS;
    }
  },

  createAssignment(
    assignment: Omit<LabAssignment, 'id' | 'assignedAt' | 'submissionCount'>
  ): LabAssignment {
    const existing = this.getAssignments();
    const newAssignment: LabAssignment = {
      ...assignment,
      id: `assign-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      assignedAt: new Date().toISOString(),
      submissionCount: 0,
    };
    const updated = [newAssignment, ...existing];
    try {
      localStorage.setItem(LAB_STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save lab assignment', e);
    }
    return newAssignment;
  },

  deleteAssignment(id: string): void {
    const existing = this.getAssignments();
    const updated = existing.filter((a) => a.id !== id);
    try {
      localStorage.setItem(LAB_STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete lab assignment', e);
    }
  },

  // 3. Student Submissions (Học sinh nộp bài)
  getSubmissions(assignmentId?: string, studentId?: string): StudentLabSubmission[] {
    try {
      const data = localStorage.getItem(LAB_STORAGE_KEYS.SUBMISSIONS);
      let list: StudentLabSubmission[] = data ? JSON.parse(data) : [];
      if (assignmentId) list = list.filter((s) => s.assignmentId === assignmentId);
      if (studentId) list = list.filter((s) => s.studentId === studentId);
      return list;
    } catch {
      return [];
    }
  },

  submitWork(
    sub: Omit<StudentLabSubmission, 'id' | 'submittedAt'>
  ): StudentLabSubmission {
    const existing = this.getSubmissions();
    const newSub: StudentLabSubmission = {
      ...sub,
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      submittedAt: new Date().toISOString(),
    };
    const updated = [newSub, ...existing];
    try {
      localStorage.setItem(LAB_STORAGE_KEYS.SUBMISSIONS, JSON.stringify(updated));

      // Update submission count on assignment
      const assignments = this.getAssignments();
      const targetAssign = assignments.find((a) => a.id === sub.assignmentId);
      if (targetAssign) {
        targetAssign.submissionCount += 1;
        localStorage.setItem(LAB_STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
      }
    } catch (e) {
      console.error('Failed to save student submission', e);
    }
    return newSub;
  },
};
