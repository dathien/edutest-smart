import {
  User,
  Role,
  Subject,
  ClassRoom,
  Student,
  Question,
  MatrixDocument,
  Exam,
  ExamAssignment,
  ExamSubmission,
  AuditLog,
  ViolationEvent,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'edutest_users',
  CURRENT_USER: 'edutest_current_user',
  SUBJECTS: 'edutest_subjects',
  CLASSES: 'edutest_classes',
  STUDENTS: 'edutest_students',
  QUESTIONS: 'edutest_questions',
  MATRICES: 'edutest_matrices',
  EXAMS: 'edutest_exams',
  ASSIGNMENTS: 'edutest_assignments',
  SUBMISSIONS: 'edutest_submissions',
  AUDIT_LOGS: 'edutest_audit_logs',
  VIOLATIONS: 'edutest_violations',
  API_CONFIG: 'edutest_gas_api_config',
};

// Initial Mock Users
const INITIAL_USERS: User[] = [
  {
    id: 'user-admin',
    username: 'admin',
    fullName: 'Thầy Hồ Nguyễn Đa Thiện',
    salutation: 'Thầy',
    email: 'dathien.toan@edutest.edu.vn',
    role: 'admin',
    status: 'active',
    schoolName: 'THPT Chuyên & GDPT 2018',
    phone: '0908123456',
    teachingSubjects: ['TOAN_10', 'TOAN_11', 'TOAN_12'],
    createdAt: '2025-08-15',
  },
  {
    id: 'user-teacher-1',
    username: 'lan.nguyen',
    fullName: 'Cô Nguyễn Thị Lan',
    salutation: 'Cô',
    email: 'lan.nguyen@edutest.edu.vn',
    role: 'teacher',
    status: 'active',
    schoolName: 'THPT Võ Trường Toản',
    phone: '0912345678',
    teachingSubjects: ['TOAN_12'],
    createdAt: '2025-09-01',
  },
  {
    id: 'user-teacher-pending',
    username: 'quoc.tran',
    fullName: 'Thầy Trần Quốc Tuấn',
    salutation: 'Thầy',
    email: 'tuan.tran@edutest.edu.vn',
    role: 'teacher',
    status: 'pending',
    schoolName: 'THPT Nguyễn Thị Minh Khai',
    phone: '0933999888',
    teachingSubjects: ['TOAN_11'],
    createdAt: '2026-10-20',
  },
  {
    id: 'user-student-1',
    username: 'hs.khoi',
    fullName: 'Lê Minh Khôi',
    email: 'khoi.lm@hocsinh.edutest.vn',
    role: 'student',
    status: 'active',
    schoolName: 'THPT Chuyên & GDPT 2018',
    createdAt: '2025-09-05',
  },
];

// Subjects list
const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub-toan', code: 'TOAN', name: 'Toán học', gradeLevels: [10, 11, 12], isActive: true, description: 'Phân hệ Toán THPT GDPT 2018 (Kết nối tri thức)' },
  { id: 'sub-ly', code: 'VAT_LY', name: 'Vật lí', gradeLevels: [10, 11, 12], isActive: false, description: 'Dự kiến kích hoạt Giai đoạn II' },
  { id: 'sub-hoa', code: 'HOA_HOC', name: 'Hóa học', gradeLevels: [10, 11, 12], isActive: false, description: 'Dự kiến kích hoạt Giai đoạn II' },
  { id: 'sub-sinh', code: 'SINH_HOC', name: 'Sinh học', gradeLevels: [10, 11, 12], isActive: false, description: 'Dự kiến kích hoạt Giai đoạn II' },
  { id: 'sub-tin', code: 'TIN_HOC', name: 'Tin học', gradeLevels: [10, 11, 12], isActive: false, description: 'Dự kiến kích hoạt Giai đoạn II' },
  { id: 'sub-van', code: 'NGU_VAN', name: 'Ngữ văn', gradeLevels: [10, 11, 12], isActive: false, description: 'Dự kiến kích hoạt Giai đoạn II' },
  { id: 'sub-anh', code: 'TIENG_ANH', name: 'Tiếng Anh', gradeLevels: [10, 11, 12], isActive: false, description: 'Dự kiến kích hoạt Giai đoạn II' },
  { id: 'sub-su', code: 'LICH_SU', name: 'Lịch sử', gradeLevels: [10, 11, 12], isActive: false, description: 'Dự kiến kích hoạt Giai đoạn II' },
  { id: 'sub-dia', code: 'DIA_LI', name: 'Địa lí', gradeLevels: [10, 11, 12], isActive: false, description: 'Dự kiến kích hoạt Giai đoạn II' },
];

// Initial Classes
const INITIAL_CLASSES: ClassRoom[] = [
  { id: 'class-12a1', name: '12A1', grade: 12, academicYear: '2025-2026', teacherId: 'user-admin', teacherName: 'Thầy Hồ Nguyễn Đa Thiện', studentCount: 38, room: 'Phòng 301', createdAt: '2025-08-20' },
  { id: 'class-12a2', name: '12A2', grade: 12, academicYear: '2025-2026', teacherId: 'user-teacher-1', teacherName: 'Cô Nguyễn Thị Lan', studentCount: 36, room: 'Phòng 302', createdAt: '2025-08-20' },
  { id: 'class-11b1', name: '11B1', grade: 11, academicYear: '2025-2026', teacherId: 'user-admin', teacherName: 'Thầy Hồ Nguyễn Đa Thiện', studentCount: 40, room: 'Phòng 204', createdAt: '2025-08-22' },
  { id: 'class-10c1', name: '10C1', grade: 10, academicYear: '2025-2026', teacherId: 'user-admin', teacherName: 'Thầy Hồ Nguyễn Đa Thiện', studentCount: 42, room: 'Phòng 102', createdAt: '2025-08-25' },
];

// Initial Students
const INITIAL_STUDENTS: Student[] = [
  { id: 'stu-01', studentCode: 'HS1201', fullName: 'Lê Minh Khôi', dob: '2008-03-15', gender: 'Nam', classId: 'class-12a1', className: '12A1', username: 'hs.khoi', status: 'active', notes: 'Học sinh giỏi cấp trường' },
  { id: 'stu-02', studentCode: 'HS1202', fullName: 'Phạm Hoàng Anh', dob: '2008-05-20', gender: 'Nam', classId: 'class-12a1', className: '12A1', username: 'hs.hoanganh', status: 'active' },
  { id: 'stu-03', studentCode: 'HS1203', fullName: 'Nguyễn Diệu Linh', dob: '2008-11-08', gender: 'Nữ', classId: 'class-12a1', className: '12A1', username: 'hs.dieulinh', status: 'active' },
  { id: 'stu-04', studentCode: 'HS1204', fullName: 'Trần Bảo Ngọc', dob: '2008-01-24', gender: 'Nữ', classId: 'class-12a1', className: '12A1', username: 'hs.baongoc', status: 'active' },
  { id: 'stu-05', studentCode: 'HS1205', fullName: 'Đỗ Đức Thắng', dob: '2008-09-12', gender: 'Nam', classId: 'class-12a1', className: '12A1', username: 'hs.ducthang', status: 'active' },
  { id: 'stu-06', studentCode: 'HS1206', fullName: 'Vũ Thảo Vy', dob: '2008-07-03', gender: 'Nữ', classId: 'class-12a1', className: '12A1', username: 'hs.thaovy', status: 'active' },
  { id: 'stu-07', studentCode: 'HS1207', fullName: 'Ngô Gia Huy', dob: '2008-04-18', gender: 'Nam', classId: 'class-12a2', className: '12A2', username: 'hs.giahuy', status: 'active' },
  { id: 'stu-08', studentCode: 'HS1208', fullName: 'Bùi Phương Anh', dob: '2008-12-05', gender: 'Nữ', classId: 'class-12a2', className: '12A2', username: 'hs.phuonganh', status: 'active' },
  { id: 'stu-09', studentCode: 'HS1101', fullName: 'Hoàng Hải Nam', dob: '2009-02-14', gender: 'Nam', classId: 'class-11b1', className: '11B1', username: 'hs.hainam', status: 'active' },
  { id: 'stu-10', studentCode: 'HS1001', fullName: 'Đặng Mai Phương', dob: '2010-06-22', gender: 'Nữ', classId: 'class-10c1', className: '10C1', username: 'hs.maiphuong', status: 'active' },
];

// Rich GDPT 2018 Math Question Bank (All 4 formats + Diagrams)
const INITIAL_QUESTIONS: Question[] = [
  // 1. Multiple Choice Grade 12 - Calculus
  {
    id: 'q-math-12-01',
    code: 'TOAN12-CD-001',
    subjectCode: 'TOAN',
    grade: 12,
    topic: 'Ứng dụng đạo hàm khảo sát hàm số',
    lesson: 'Tính đơn điệu và cực trị hàm số',
    cognitiveLevel: 'nhan_biet',
    type: 'multiple_choice',
    prompt: 'Cho hàm số $y = f(x)$ có bảng xét dấu đạo hàm như sau. Hàm số đã cho đồng biến trên khoảng nào dưới đây?',
    options: [
      '$(-\\infty; -1)$',
      '$(-1; 1)$',
      '$(0; 2)$',
      '$(-2; 0)$',
    ],
    correctAnswer: 'A',
    points: 0.25,
    solution: 'Dựa vào bảng biến thiên, đạo hàm mang dấu dương $y\' > 0$ trên các khoảng $(-\\infty; -1)$ và $(1; +\\infty)$. Do đó hàm số đồng biến trên $(-\\infty; -1)$. Phương án đúng là A.',
    diagramType: 'variation_table',
    diagramData: 'cubic_table',
    authorId: 'user-admin',
    authorName: 'Thầy Hồ Nguyễn Đa Thiện',
    status: 'published',
    createdAt: '2025-09-10',
  },
  // 2. Multiple Choice Grade 12 - Space Vectors
  {
    id: 'q-math-12-02',
    code: 'TOAN12-HH-002',
    subjectCode: 'TOAN',
    grade: 12,
    topic: 'Toạ độ trong không gian Oxyz',
    lesson: 'Hệ trục toạ độ và toạ độ vectơ',
    cognitiveLevel: 'thong_hieu',
    type: 'multiple_choice',
    prompt: 'Trong không gian $Oxyz$, cho hai điểm $A(1; 2; -3)$ và $B(3; -2; 1)$. Toạ độ trung điểm $M$ của đoạn thẳng $AB$ là:',
    options: [
      '$M(2; 0; -1)$',
      '$M(4; 0; -2)$',
      '$M(1; -2; 2)$',
      '$M(2; 0; 1)$',
    ],
    correctAnswer: 'A',
    points: 0.25,
    solution: 'Toạ độ trung điểm $M$ được tính theo công thức: $x_M = \\frac{x_A+x_B}{2} = \\frac{1+3}{2} = 2$, $y_M = \\frac{y_A+y_B}{2} = \\frac{2+(-2)}{2} = 0$, $z_M = \\frac{z_A+z_B}{2} = \\frac{-3+1}{2} = -1$. Vậy $M(2; 0; -1)$.',
    diagramType: 'coordinate_system',
    authorId: 'user-admin',
    authorName: 'Thầy Hồ Nguyễn Đa Thiện',
    status: 'published',
    createdAt: '2025-09-12',
  },
  // 3. True / False Grade 12 - GDPT 2018 Format
  {
    id: 'q-math-12-03',
    code: 'TOAN12-DS-003',
    subjectCode: 'TOAN',
    grade: 12,
    topic: 'Ứng dụng đạo hàm khảo sát hàm số',
    lesson: 'Giá trị lớn nhất và nhỏ nhất của hàm số',
    cognitiveLevel: 'thong_hieu',
    type: 'true_false',
    prompt: 'Cho hàm số $y = f(x) = x^3 - 3x^2 + 2$ xác định trên đoạn $[-1; 3]$. Xét tính đúng / sai của các mệnh đề sau:',
    trueFalseOptions: [
      { id: 'a', text: 'Đạo hàm của hàm số là $f\'(x) = 3x^2 - 6x$.', isCorrect: true, explanation: '$f\'(x) = 3x^2 - 6x$ là đạo hàm chuẩn xác.' },
      { id: 'b', text: 'Phương trình $f\'(x) = 0$ có hai nghiệm phân biệt $x_1 = 0$ và $x_2 = 2$.', isCorrect: true, explanation: '$3x(x - 2) = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$, cả hai nghiệm đều thuộc $[-1; 3]$.' },
      { id: 'c', text: 'Giá trị cực tiểu của hàm số trên đoạn $[-1; 3]$ là $y_{CT} = 2$.', isCorrect: false, explanation: '$y_{CT} = f(2) = 2^3 - 3(2)^2 + 2 = -2$, không phải 2.' },
      { id: 'd', text: 'Giá trị lớn nhất của hàm số trên đoạn $[-1; 3]$ bằng 2.', isCorrect: true, explanation: 'Ta có $f(-1) = -2$, $f(0) = 2$, $f(2) = -2$, $f(3) = 2$. Vậy $\\max_{[-1; 3]} f(x) = 2$.' },
    ],
    points: 1.0,
    solution: 'a) Đúng; b) Đúng; c) Sai; d) Đúng. Điểm được tính theo quy định CV 7991: đúng 1 ý = 0.1đ; đúng 2 ý = 0.25đ; đúng 3 ý = 0.5đ; đúng 4 ý = 1.0đ.',
    diagramType: 'function_curve',
    authorId: 'user-admin',
    authorName: 'Thầy Hồ Nguyễn Đa Thiện',
    status: 'published',
    createdAt: '2025-09-15',
  },
  // 4. Short Answer Grade 12
  {
    id: 'q-math-12-04',
    code: 'TOAN12-TLN-004',
    subjectCode: 'TOAN',
    grade: 12,
    topic: 'Ứng dụng đạo hàm khảo sát hàm số',
    lesson: 'Đường tiệm cận của đồ thị hàm số',
    cognitiveLevel: 'van_dung',
    type: 'short_answer',
    prompt: 'Tìm số đường tiệm cận (bao gồm cả tiệm cận đứng và tiệm cận ngang) của đồ thị hàm số $y = \\frac{2x - 1}{\\sqrt{x^2 - 4}}$.',
    correctAnswer: '4',
    points: 0.5,
    solution: 'Tập xác định: $D = (-\\infty; -2) \\cup (2; +\\infty)$. Tiệm cận đứng: $x = -2$ và $x = 2$ (2 đường). Tiệm cận ngang: $\\lim_{x \\to +\\infty} y = 2$ ($y = 2$), $\\lim_{x \\to -\\infty} y = -2$ ($y = -2$) (2 đường). Tổng cộng có 4 đường tiệm cận.',
    authorId: 'user-admin',
    authorName: 'Thầy Hồ Nguyễn Đa Thiện',
    status: 'published',
    createdAt: '2025-09-18',
  },
  // 5. Short Answer Grade 12 - Real world optimization
  {
    id: 'q-math-12-05',
    code: 'TOAN12-TLN-005',
    subjectCode: 'TOAN',
    grade: 12,
    topic: 'Ứng dụng đạo hàm khảo sát hàm số',
    lesson: 'Ứng dụng thực tế giá trị lớn nhất, nhỏ nhất',
    cognitiveLevel: 'van_dung',
    type: 'short_answer',
    prompt: 'Một người thợ gò một bể chứa nước hình hộp chữ nhật không nắp có thể tích $V = 4\\text{ m}^3$, đáy là hình vuông cạnh $x$ (mét). Để tốn ít vật liệu nhất (diện tích toàn phần không nắp nhỏ nhất), giá trị của $x$ bằng bao nhiêu mét? (Nhập kết quả là số nguyên)',
    correctAnswer: '2',
    points: 0.5,
    solution: 'Thể tích $V = x^2 h = 4 \\Rightarrow h = \\frac{4}{x^2}$. Diện tích vật liệu: $S(x) = x^2 + 4xh = x^2 + \\frac{16}{x}$. Khảo sát $S\'(x) = 2x - \\frac{16}{x^2} = 0 \\Leftrightarrow x^3 = 8 \\Leftrightarrow x = 2$. Vậy $x = 2\\text{ m}$.',
    authorId: 'user-admin',
    authorName: 'Thầy Hồ Nguyễn Đa Thiện',
    status: 'published',
    createdAt: '2025-09-20',
  },
  // 6. Essay Grade 12
  {
    id: 'q-math-12-06',
    code: 'TOAN12-TL-006',
    subjectCode: 'TOAN',
    grade: 12,
    topic: 'Khối đa diện và Thể tích khối đa diện',
    lesson: 'Thể tích khối chóp tứ giác đều',
    cognitiveLevel: 'van_dung',
    type: 'essay',
    prompt: 'Cho hình chóp tứ giác đều $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, các cạnh bên bằng $a\\sqrt{2}$. Gọi $O$ là tâm của đáy $ABCD$.\n1) Tính độ dài đường cao $SO$ của hình chóp theo $a$.\n2) Tính thể tích khối chóp $S.ABCD$ theo $a$.',
    rubricGuide: '1) Tính đúng đường chéo $AC = a\\sqrt{2} \\Rightarrow OA = \\frac{a\\sqrt{2}}{2}$ (0.5đ). Tính $SO = \\sqrt{SA^2 - OA^2} = \\sqrt{2a^2 - \\frac{a^2}{2}} = \\frac{a\\sqrt{6}}{2}$ (0.5đ).\n2) Diện tích đáy $S_{ABCD} = a^2$ (0.25đ). Thể tích $V = \\frac{1}{3} S_{ABCD} \\cdot SO = \\frac{1}{3} a^2 \\cdot \\frac{a\\sqrt{6}}{2} = \\frac{a^3\\sqrt{6}}{6}$ (0.75đ).',
    points: 2.0,
    solution: '1) Vì $S.ABCD$ là chóp tứ giác đều nên $SO \\perp (ABCD)$ với $O$ là tâm hình vuông $ABCD$. Ta có $AC = a\\sqrt{2} \\Rightarrow OA = \\frac{a\\sqrt{2}}{2}$. Trong tam giác vuông $SOA$: $SO = \\sqrt{SA^2 - OA^2} = \\sqrt{(a\\sqrt{2})^2 - (\\frac{a\\sqrt{2}}{2})^2} = \\frac{a\\sqrt{6}}{2}$.\n2) Thể tích khối chóp: $V = \\frac{1}{3} S_{ABCD} \\cdot SO = \\frac{1}{3} a^2 \\cdot \\frac{a\\sqrt{6}}{2} = \\frac{a^3\\sqrt{6}}{6}$.',
    diagramType: 'geometry',
    diagramData: 'pyramid',
    authorId: 'user-admin',
    authorName: 'Thầy Hồ Nguyễn Đa Thiện',
    status: 'published',
    createdAt: '2025-09-22',
  },
  // Grade 11 Question
  {
    id: 'q-math-11-01',
    code: 'TOAN11-LG-001',
    subjectCode: 'TOAN',
    grade: 11,
    topic: 'Hàm số lượng giác và Phương trình lượng giác',
    lesson: 'Phương trình lượng giác cơ bản',
    cognitiveLevel: 'thong_hieu',
    type: 'multiple_choice',
    prompt: 'Nghiệm của phương trình $\\cos x = -\\frac{\\sqrt{3}}{2}$ là:',
    options: [
      '$x = \\pm \\frac{5\\pi}{6} + k2\\pi, k \\in \\mathbb{Z}$',
      '$x = \\pm \\frac{\\pi}{6} + k2\\pi, k \\in \\mathbb{Z}$',
      '$x = \\pm \\frac{2\\pi}{3} + k2\\pi, k \\in \\mathbb{Z}$',
      '$x = \\pm \\frac{\\pi}{3} + k2\\pi, k \\in \\mathbb{Z}$',
    ],
    correctAnswer: 'A',
    points: 0.25,
    solution: 'Ta có $-\\frac{\\sqrt{3}}{2} = \\cos \\left(\\frac{5\\pi}{6}\\right)$. Do đó phương trình tương đương $x = \\pm \\frac{5\\pi}{6} + k2\\pi, k \\in \\mathbb{Z}$.',
    authorId: 'user-admin',
    authorName: 'Thầy Hồ Nguyễn Đa Thiện',
    status: 'published',
    createdAt: '2025-09-25',
  },
  // Grade 10 Question
  {
    id: 'q-math-10-01',
    code: 'TOAN10-TX-001',
    subjectCode: 'TOAN',
    grade: 10,
    topic: 'Mệnh đề và Tập hợp',
    lesson: 'Các phép toán trên tập hợp',
    cognitiveLevel: 'nhan_biet',
    type: 'multiple_choice',
    prompt: 'Cho hai tập hợp $A = [-2; 3]$ và $B = (1; 5]$. Giao của hai tập hợp $A \\cap B$ là khoảng/đoạn nào?',
    options: [
      '$(1; 3]$',
      '$[-2; 5]$',
      '$[-2; 1)$',
      '$(3; 5]$',
    ],
    correctAnswer: 'A',
    points: 0.25,
    solution: '$A \\cap B$ là tập hợp các phần tử thuộc cả $A$ và $B$. Vậy $A \\cap B = (1; 3]$.',
    authorId: 'user-admin',
    authorName: 'Thầy Hồ Nguyễn Đa Thiện',
    status: 'published',
    createdAt: '2025-09-26',
  },
];

// Matrix Library following Circular 7991/BGDĐT
const INITIAL_MATRICES: MatrixDocument[] = [
  // 1. Math 12 - Midterm 1 2025-2026 (Verified: THPT Võ Trường Toản)
  {
    id: 'matrix-12-gki-2526',
    title: 'Ma trận & Đặc tả Đề kiểm tra Giữa học kỳ I - Toán 12 (2025-2026)',
    academicYear: '2025-2026',
    grade: 12,
    semester: 'GKI',
    subject: 'Toán học',
    curriculum: 'Kết nối tri thức với cuộc sống (CV 7991/BGDĐT-GDTrH)',
    issuingUnit: 'THPT Võ Trường Toản – TP.HCM',
    sourceDocument: 'CV 7991/BGDĐT-GDTrH & Kế hoạch giáo dục tổ Toán THPT Võ Trường Toản',
    isVerified: true,
    durationMinutes: 90,
    totalPoints: 10.0,
    cells: [
      {
        id: 'cell-1',
        topic: '1. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
        learningOutcome: 'Nhận biết tính đơn điệu, cực trị, giá trị lớn nhất - nhỏ nhất, tiệm cận đồ thị hàm số',
        cognitiveLevel: 'nhan_biet',
        questionType: 'multiple_choice',
        questionCount: 8,
        pointsPerQuestion: 0.25,
        totalPoints: 2.0,
      },
      {
        id: 'cell-2',
        topic: '1. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
        learningOutcome: 'Thông hiểu bảng biến thiên, đồ thị hàm số bậc ba và hàm phân thức',
        cognitiveLevel: 'thong_hieu',
        questionType: 'multiple_choice',
        questionCount: 4,
        pointsPerQuestion: 0.25,
        totalPoints: 1.0,
      },
      {
        id: 'cell-3',
        topic: '1. Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
        learningOutcome: 'Phân tích tính chất của hàm số qua đạo hàm bậc nhất và bậc hai theo định dạng đúng/sai',
        cognitiveLevel: 'thong_hieu',
        questionType: 'true_false',
        questionCount: 2,
        pointsPerQuestion: 1.0,
        totalPoints: 2.0,
      },
      {
        id: 'cell-4',
        topic: '2. Toạ độ của vectơ trong không gian Oxyz',
        learningOutcome: 'Nhận biết toạ độ điểm, toạ độ vectơ, các phép toán toạ độ và tích vô hướng',
        cognitiveLevel: 'nhan_biet',
        questionType: 'true_false',
        questionCount: 1,
        pointsPerQuestion: 1.0,
        totalPoints: 1.0,
      },
      {
        id: 'cell-5',
        topic: '1. Ứng dụng đạo hàm trong thực tiễn',
        learningOutcome: 'Vận dụng giải bài toán tối ưu thực tiễn (kinh tế, hình học, vật lý)',
        cognitiveLevel: 'van_dung',
        questionType: 'short_answer',
        questionCount: 4,
        pointsPerQuestion: 0.5,
        totalPoints: 2.0,
      },
      {
        id: 'cell-6',
        topic: '2. Toạ độ vectơ và bài toán không gian thực tế',
        learningOutcome: 'Vận dụng hệ toạ độ không gian Oxyz để mô hình hoá bài toán thực tế',
        cognitiveLevel: 'van_dung',
        questionType: 'essay',
        questionCount: 1,
        pointsPerQuestion: 2.0,
        totalPoints: 2.0,
      },
    ],
    createdAt: '2025-09-01',
    updatedAt: '2025-09-05',
  },
  // 2. Math 12 - Final 1 2025-2026 (Verified: THPT Nguyễn Thị Minh Khai)
  {
    id: 'matrix-12-cki-2526',
    title: 'Ma trận & Đặc tả Đề kiểm tra Cuối học kỳ I - Toán 12 (2025-2026)',
    academicYear: '2025-2026',
    grade: 12,
    semester: 'CKI',
    subject: 'Toán học',
    curriculum: 'Kết nối tri thức với cuộc sống (CV 7991/BGDĐT-GDTrH)',
    issuingUnit: 'THPT Nguyễn Thị Minh Khai – TP.HCM',
    sourceDocument: 'Tài liệu sinh hoạt cụm chuyên môn Toán THPT TP.HCM',
    isVerified: true,
    durationMinutes: 90,
    totalPoints: 10.0,
    cells: [
      {
        id: 'cell-cki-1',
        topic: '1. Khảo sát hàm số & Nguyên hàm',
        learningOutcome: 'Khảo sát hàm số toàn diện và định nghĩa nguyên hàm',
        cognitiveLevel: 'nhan_biet',
        questionType: 'multiple_choice',
        questionCount: 12,
        pointsPerQuestion: 0.25,
        totalPoints: 3.0,
      },
      {
        id: 'cell-cki-2',
        topic: '2. Phương pháp toạ độ Oxyz',
        learningOutcome: 'Phương trình mặt cầu, mặt phẳng và toạ độ',
        cognitiveLevel: 'thong_hieu',
        questionType: 'true_false',
        questionCount: 3,
        pointsPerQuestion: 1.0,
        totalPoints: 3.0,
      },
      {
        id: 'cell-cki-3',
        topic: '3. Ứng dụng tích phân & mô hình toán',
        learningOutcome: 'Vận dụng tính diện tích, thể tích và bài toán thực tiễn',
        cognitiveLevel: 'van_dung',
        questionType: 'short_answer',
        questionCount: 4,
        pointsPerQuestion: 0.5,
        totalPoints: 2.0,
      },
      {
        id: 'cell-cki-4',
        topic: '4. Tự luận tích phân và không gian',
        learningOutcome: 'Trình bày lập luận toán học chặt chẽ',
        cognitiveLevel: 'van_dung',
        questionType: 'essay',
        questionCount: 1,
        pointsPerQuestion: 2.0,
        totalPoints: 2.0,
      },
    ],
    createdAt: '2025-11-20',
    updatedAt: '2025-11-25',
  },
  // 3. Math 11 - Midterm 1 2025-2026 (Verified: THPT Trần Nhân Tông)
  {
    id: 'matrix-11-gki-2526',
    title: 'Ma trận & Đặc tả Đề kiểm tra Giữa học kỳ I - Toán 11 (2025-2026)',
    academicYear: '2025-2026',
    grade: 11,
    semester: 'GKI',
    subject: 'Toán học',
    curriculum: 'Kết nối tri thức với cuộc sống',
    issuingUnit: 'THPT Trần Nhân Tông – Đắk Lắk',
    sourceDocument: 'Kế hoạch kiểm tra định kỳ năm học 2025-2026',
    isVerified: true,
    durationMinutes: 90,
    totalPoints: 10.0,
    cells: [
      {
        id: 'cell-11-1',
        topic: '1. Hàm số lượng giác và phương trình lượng giác',
        learningOutcome: 'Giá trị lượng giác, công thức biến đổi, phương trình lượng giác cơ bản',
        cognitiveLevel: 'nhan_biet',
        questionType: 'multiple_choice',
        questionCount: 12,
        pointsPerQuestion: 0.25,
        totalPoints: 3.0,
      },
      {
        id: 'cell-11-2',
        topic: '2. Dãy số, Cấp số cộng và Cấp số nhân',
        learningOutcome: 'Xác định số hạng tổng quát, tính tổng n số hạng đầu',
        cognitiveLevel: 'thong_hieu',
        questionType: 'true_false',
        questionCount: 2,
        pointsPerQuestion: 1.0,
        totalPoints: 2.0,
      },
      {
        id: 'cell-11-3',
        topic: '3. Quan hệ song song trong không gian',
        learningOutcome: 'Xác định giao tuyến, giao điểm, thiết diện',
        cognitiveLevel: 'thong_hieu',
        questionType: 'true_false',
        questionCount: 1,
        pointsPerQuestion: 1.0,
        totalPoints: 1.0,
      },
      {
        id: 'cell-11-4',
        topic: '4. Ứng dụng lượng giác & cấp số',
        learningOutcome: 'Bài toán thực tế về dao động điều hòa và lãi kép',
        cognitiveLevel: 'van_dung',
        questionType: 'short_answer',
        questionCount: 4,
        pointsPerQuestion: 0.5,
        totalPoints: 2.0,
      },
      {
        id: 'cell-11-5',
        topic: '5. Hình học không gian',
        learningOutcome: 'Chứng minh quan hệ song song và tìm thiết diện',
        cognitiveLevel: 'van_dung',
        questionType: 'essay',
        questionCount: 1,
        pointsPerQuestion: 2.0,
        totalPoints: 2.0,
      },
    ],
    createdAt: '2025-09-08',
    updatedAt: '2025-09-12',
  },
  // 4. Math 10 - Midterm 1 2025-2026 (Verified: THPT Nguyễn Tất Thành)
  {
    id: 'matrix-10-gki-2526',
    title: 'Ma trận & Đặc tả Đề kiểm tra Giữa học kỳ I - Toán 10 (2025-2026)',
    academicYear: '2025-2026',
    grade: 10,
    semester: 'GKI',
    subject: 'Toán học',
    curriculum: 'Kết nối tri thức với cuộc sống',
    issuingUnit: 'THPT Nguyễn Tất Thành – TP.HCM',
    sourceDocument: 'Kế hoạch dạy học và kiểm tra năm học 2025-2026',
    isVerified: true,
    durationMinutes: 90,
    totalPoints: 10.0,
    cells: [
      {
        id: 'cell-10-1',
        topic: '1. Mệnh đề và Tập hợp',
        learningOutcome: 'Mệnh đề phủ định, kéo theo; các phép toán giao, hợp, hiệu',
        cognitiveLevel: 'nhan_biet',
        questionType: 'multiple_choice',
        questionCount: 10,
        pointsPerQuestion: 0.25,
        totalPoints: 2.5,
      },
      {
        id: 'cell-10-2',
        topic: '2. Bất phương trình và hệ bất phương trình bậc nhất hai ẩn',
        learningOutcome: 'Biểu diễn miền nghiệm trên mặt phẳng toạ độ',
        cognitiveLevel: 'thong_hieu',
        questionType: 'multiple_choice',
        questionCount: 6,
        pointsPerQuestion: 0.25,
        totalPoints: 1.5,
      },
      {
        id: 'cell-10-3',
        topic: '3. Hệ thức lượng trong tam giác',
        learningOutcome: 'Định lí cosin, sin, diện tích và bán kính đường tròn',
        cognitiveLevel: 'thong_hieu',
        questionType: 'true_false',
        questionCount: 2,
        pointsPerQuestion: 1.0,
        totalPoints: 2.0,
      },
      {
        id: 'cell-10-4',
        topic: '2. Bài toán quy hoạch tuyến tính thực tế',
        learningOutcome: 'Tìm giá trị lớn nhất, nhỏ nhất của biểu thức F(x, y)',
        cognitiveLevel: 'van_dung',
        questionType: 'short_answer',
        questionCount: 4,
        pointsPerQuestion: 0.5,
        totalPoints: 2.0,
      },
      {
        id: 'cell-10-5',
        topic: '3. Ứng dụng hệ thức lượng giải tam giác',
        learningOutcome: 'Giải bài toán đo đạc thực tế (chiều cao tháp, khoảng cách hai điểm)',
        cognitiveLevel: 'van_dung',
        questionType: 'essay',
        questionCount: 1,
        pointsPerQuestion: 2.0,
        totalPoints: 2.0,
      },
    ],
    createdAt: '2025-09-15',
    updatedAt: '2025-09-18',
  },
  // 5. Math 12 - Midterm 1 2026-2027 (Pending official release: THPT Bình Chánh)
  {
    id: 'matrix-12-gki-2627',
    title: 'Ma trận & Đặc tả Đề kiểm tra Giữa học kỳ I - Toán 12 (2026-2027)',
    academicYear: '2026-2027',
    grade: 12,
    semester: 'GKI',
    subject: 'Toán học',
    curriculum: 'Kết nối tri thức với cuộc sống (Dự thảo)',
    issuingUnit: 'THPT Bình Chánh – TP.HCM',
    sourceDocument: 'Kế hoạch chuẩn bị năm học 2026-2027 (Chờ công bố chính thức)',
    isVerified: false, // "Chờ cập nhật tài liệu" as required by Section 8.2 & 8.3
    durationMinutes: 90,
    totalPoints: 10.0,
    cells: [
      {
        id: 'cell-2627-1',
        topic: '1. Khảo sát hàm số & Tối ưu hóa',
        learningOutcome: 'Chờ cập nhật văn bản phân phối chương trình chính thức',
        cognitiveLevel: 'nhan_biet',
        questionType: 'multiple_choice',
        questionCount: 12,
        pointsPerQuestion: 0.25,
        totalPoints: 3.0,
      },
      {
        id: 'cell-2627-2',
        topic: '2. Vectơ và Hệ toạ độ Oxyz',
        learningOutcome: 'Chờ cập nhật văn bản phân phối chương trình chính thức',
        cognitiveLevel: 'thong_hieu',
        questionType: 'true_false',
        questionCount: 4,
        pointsPerQuestion: 1.0,
        totalPoints: 4.0,
      },
      {
        id: 'cell-2627-3',
        topic: '3. Bài toán thực tế',
        learningOutcome: 'Chờ cập nhật văn bản phân phối chương trình chính thức',
        cognitiveLevel: 'van_dung',
        questionType: 'short_answer',
        questionCount: 6,
        pointsPerQuestion: 0.5,
        totalPoints: 3.0,
      },
    ],
    createdAt: '2026-06-01',
    updatedAt: '2026-06-01',
  },
  // 6. Math 11 - Midterm 1 2026-2027 (Pending: THPT số 1 Ngô Gia Tự)
  {
    id: 'matrix-11-gki-2627',
    title: 'Ma trận & Đặc tả Đề kiểm tra Giữa học kỳ I - Toán 11 (2026-2027)',
    academicYear: '2026-2027',
    grade: 11,
    semester: 'GKI',
    subject: 'Toán học',
    curriculum: 'Kết nối tri thức với cuộc sống (Dự thảo)',
    issuingUnit: 'THPT số 1 Ngô Gia Tự – Đắk Lắk',
    sourceDocument: 'Chờ cập nhật tài liệu',
    isVerified: false,
    durationMinutes: 90,
    totalPoints: 10.0,
    cells: [],
    createdAt: '2026-06-15',
    updatedAt: '2026-06-15',
  },
  // 7. Math 10 - Midterm 1 2026-2027 (Pending: THPT Nam Sài Gòn)
  {
    id: 'matrix-10-gki-2627',
    title: 'Ma trận & Đặc tả Đề kiểm tra Giữa học kỳ I - Toán 10 (2026-2027)',
    academicYear: '2026-2027',
    grade: 10,
    semester: 'GKI',
    subject: 'Toán học',
    curriculum: 'Kết nối tri thức với cuộc sống (Dự thảo)',
    issuingUnit: 'THPT Nam Sài Gòn – TP.HCM',
    sourceDocument: 'Chờ cập nhật tài liệu',
    isVerified: false,
    durationMinutes: 90,
    totalPoints: 10.0,
    cells: [],
    createdAt: '2026-06-20',
    updatedAt: '2026-06-20',
  },
];

// Initial Exams
const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-01',
    code: 'DE-TOAN12-GKI-01',
    title: 'Đề kiểm tra Giữa học kỳ I - Toán 12 (Chuẩn cấu trúc CV 7991)',
    subjectCode: 'TOAN',
    grade: 12,
    academicYear: '2025-2026',
    semester: 'GKI',
    durationMinutes: 45,
    matrixId: 'matrix-12-gki-2526',
    questions: [
      INITIAL_QUESTIONS[0], // MC
      INITIAL_QUESTIONS[1], // MC
      INITIAL_QUESTIONS[2], // True/False
      INITIAL_QUESTIONS[3], // Short answer
      INITIAL_QUESTIONS[4], // Short answer
      INITIAL_QUESTIONS[5], // Essay
    ],
    totalPoints: 4.5,
    shuffleQuestions: true,
    shuffleOptions: true,
    proctoringMode: 'standard',
    showResultsImmediately: true,
    allowReviewSolutions: true,
    maxAttempts: 1,
    createdById: 'user-admin',
    createdByName: 'Thầy Hồ Nguyễn Đa Thiện',
    createdAt: '2025-09-25',
    status: 'published',
  },
  {
    id: 'exam-02',
    code: 'DE-TOAN12-ON-02',
    title: 'Đề luyện tập chuyên đề: Khảo sát hàm số & Tối ưu hoá',
    subjectCode: 'TOAN',
    grade: 12,
    academicYear: '2025-2026',
    semester: 'GKI',
    durationMinutes: 30,
    questions: [
      INITIAL_QUESTIONS[0],
      INITIAL_QUESTIONS[2],
      INITIAL_QUESTIONS[4],
    ],
    totalPoints: 2.25,
    shuffleQuestions: false,
    shuffleOptions: false,
    proctoringMode: 'basic',
    showResultsImmediately: true,
    allowReviewSolutions: true,
    maxAttempts: 3,
    createdById: 'user-admin',
    createdByName: 'Thầy Hồ Nguyễn Đa Thiện',
    createdAt: '2025-10-02',
    status: 'published',
  },
];

// Initial Assignments
const INITIAL_ASSIGNMENTS: ExamAssignment[] = [
  {
    id: 'assign-01',
    examId: 'exam-01',
    examTitle: 'Đề kiểm tra Giữa học kỳ I - Toán 12 (Chuẩn cấu trúc CV 7991)',
    classIds: ['class-12a1', 'class-12a2'],
    classNames: ['12A1', '12A2'],
    startDate: '2026-10-24 07:00',
    endDate: '2026-10-30 23:59',
    status: 'in_progress',
    totalAssigned: 74,
    totalSubmitted: 48,
  },
];

// Initial Submissions
const INITIAL_SUBMISSIONS: ExamSubmission[] = [
  {
    id: 'subm-01',
    assignmentId: 'assign-01',
    examId: 'exam-01',
    examTitle: 'Đề kiểm tra Giữa học kỳ I - Toán 12 (Chuẩn cấu trúc CV 7991)',
    studentId: 'stu-01',
    studentCode: 'HS1201',
    studentName: 'Lê Minh Khôi',
    className: '12A1',
    startedAt: '2026-10-24 08:00',
    submittedAt: '2026-10-24 08:42',
    durationSeconds: 2520,
    answers: {
      'q-math-12-01': { questionId: 'q-math-12-01', type: 'multiple_choice', selectedOption: 'A', isCorrect: true, awardedPoints: 0.25 },
      'q-math-12-02': { questionId: 'q-math-12-02', type: 'multiple_choice', selectedOption: 'A', isCorrect: true, awardedPoints: 0.25 },
      'q-math-12-03': {
        questionId: 'q-math-12-03',
        type: 'true_false',
        trueFalseAnswers: { a: true, b: true, c: false, d: true },
        isCorrect: true,
        awardedPoints: 1.0,
      },
      'q-math-12-04': { questionId: 'q-math-12-04', type: 'short_answer', shortAnswerText: '4', isCorrect: true, awardedPoints: 0.5 },
      'q-math-12-05': { questionId: 'q-math-12-05', type: 'short_answer', shortAnswerText: '2', isCorrect: true, awardedPoints: 0.5 },
      'q-math-12-06': {
        questionId: 'q-math-12-06',
        type: 'essay',
        essayContent: '1) Ta có AC = a√2 => OA = a√2/2. Tam giác SOA vuông tại O => SO = √(SA^2 - OA^2) = a√6/2.\n2) Diện tích ABCD = a^2. Thể tích V = 1/3 * a^2 * a√6/2 = a^3√6/6.',
        awardedPoints: 2.0,
        teacherFeedback: 'Bài làm xuất sắc, lập luận chặt chẽ!',
      },
    },
    autoScore: 2.5,
    manualScore: 2.0,
    totalScore: 4.5,
    maxScore: 4.5,
    isGraded: true,
    violationsCount: 0,
    status: 'graded',
  },
  {
    id: 'subm-02',
    assignmentId: 'assign-01',
    examId: 'exam-01',
    examTitle: 'Đề kiểm tra Giữa học kỳ I - Toán 12 (Chuẩn cấu trúc CV 7991)',
    studentId: 'stu-02',
    studentCode: 'HS1202',
    studentName: 'Phạm Hoàng Anh',
    className: '12A1',
    startedAt: '2026-10-24 09:10',
    submittedAt: '2026-10-24 09:44',
    durationSeconds: 2040,
    answers: {
      'q-math-12-01': { questionId: 'q-math-12-01', type: 'multiple_choice', selectedOption: 'A', isCorrect: true, awardedPoints: 0.25 },
      'q-math-12-02': { questionId: 'q-math-12-02', type: 'multiple_choice', selectedOption: 'B', isCorrect: false, awardedPoints: 0 },
      'q-math-12-03': {
        questionId: 'q-math-12-03',
        type: 'true_false',
        trueFalseAnswers: { a: true, b: true, c: true, d: true },
        isCorrect: false,
        awardedPoints: 0.5, // 3 out of 4 correct = 0.5 pt
      },
      'q-math-12-04': { questionId: 'q-math-12-04', type: 'short_answer', shortAnswerText: '2', isCorrect: false, awardedPoints: 0 },
      'q-math-12-05': { questionId: 'q-math-12-05', type: 'short_answer', shortAnswerText: '2', isCorrect: true, awardedPoints: 0.5 },
      'q-math-12-06': {
        questionId: 'q-math-12-06',
        type: 'essay',
        essayContent: 'Đường cao SO = a√6/2. Thể tích V = a^3√6/6.',
        awardedPoints: 1.5,
        teacherFeedback: 'Cần trình bày rõ các bước áp dụng định lí Pitago trong tam giác SOA.',
      },
    },
    autoScore: 1.25,
    manualScore: 1.5,
    totalScore: 2.75,
    maxScore: 4.5,
    isGraded: true,
    violationsCount: 1,
    status: 'graded',
  },
];

// Initial Audit Logs
const INITIAL_LOGS: AuditLog[] = [
  { id: 'log-1', userId: 'user-admin', userName: 'Thầy Hồ Nguyễn Đa Thiện', action: 'Tạo ma trận', details: 'Khởi tạo Ma trận Giữa học kỳ I Toán 12 theo CV 7991/BGDĐT', timestamp: '2025-09-01 08:30:00' },
  { id: 'log-2', userId: 'user-admin', userName: 'Thầy Hồ Nguyễn Đa Thiện', action: 'Giao bài thi', details: 'Giao Đề kiểm tra GKI Toán 12 cho lớp 12A1, 12A2', timestamp: '2026-10-24 07:00:00' },
  { id: 'log-3', userId: 'user-teacher-1', userName: 'Cô Nguyễn Thị Lan', action: 'Chấm tự luận', details: 'Hoàn tất chấm tự luận cho học sinh HS1201', timestamp: '2026-10-24 10:15:20' },
];

export class StorageService {
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable
    }
  }

  // Users
  static getUsers(): User[] {
    const users = this.getItem<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    let changed = false;
    const migrated = users.map(u => {
      // Auto-migrate legacy name and ensure salutation
      if (u.id === 'user-admin' && (u.fullName === 'GV. Hồ Nguyễn Đa Thiện' || !u.salutation)) {
        changed = true;
        return { ...u, fullName: 'Thầy Hồ Nguyễn Đa Thiện', salutation: 'Thầy' };
      }
      if (u.id === 'user-teacher-1' && !u.salutation) {
        changed = true;
        return { ...u, salutation: 'Cô' };
      }
      if (u.id === 'user-teacher-pending' && !u.salutation) {
        changed = true;
        return { ...u, salutation: 'Thầy' };
      }
      return u;
    });
    if (changed) {
      this.saveUsers(migrated);
    }
    return migrated;
  }

  static saveUsers(users: User[]): void {
    this.setItem(STORAGE_KEYS.USERS, users);
  }

  static getCurrentUser(): User {
    const users = this.getUsers();
    const stored = this.getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (stored) {
      const found = users.find(u => u.id === stored.id);
      if (found) return found;
    }
    return users[0]; // Default to admin
  }

  static setCurrentUser(user: User): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  static updateUser(updated: User): void {
    const users = this.getUsers().map(u => u.id === updated.id ? updated : u);
    this.saveUsers(users);

    // Sync current user if updating self
    const curr = this.getItem<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (curr && curr.id === updated.id) {
      this.setCurrentUser(updated);
    }

    // Sync teacherName across assigned classes
    const classes = this.getClasses().map(c => {
      if (c.teacherId === updated.id) {
        return { ...c, teacherName: updated.fullName };
      }
      return c;
    });
    this.setItem(STORAGE_KEYS.CLASSES, classes);

    this.addLog('Cập nhật hồ sơ giáo viên', `Đã cập nhật hồ sơ: ${updated.fullName} (${updated.username})`);
  }

  static createTeacher(teacherData: {
    fullName: string;
    salutation?: string;
    username: string;
    email: string;
    teachingSubjects?: string[];
    schoolName: string;
    role: Role;
    status: 'active' | 'pending' | 'locked';
    phone?: string;
  }): { success: boolean; message: string; user?: User } {
    const users = this.getUsers();

    // Check duplicate username
    const normalizedUsername = teacherData.username.trim().toLowerCase();
    if (users.some(u => u.username.toLowerCase() === normalizedUsername)) {
      return { success: false, message: `Tên đăng nhập "${teacherData.username}" đã tồn tại. Vui lòng chọn tên khác.` };
    }

    // Check duplicate email
    const normalizedEmail = teacherData.email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, message: `Địa chỉ email "${teacherData.email}" đã được đăng ký trong hệ thống.` };
    }

    const newUser: User = {
      id: `user-teacher-${Date.now()}`,
      username: normalizedUsername,
      fullName: teacherData.fullName.trim(),
      salutation: teacherData.salutation?.trim() || 'Thầy',
      email: normalizedEmail,
      role: teacherData.role || 'teacher',
      status: teacherData.status || 'active',
      schoolName: teacherData.schoolName.trim() || 'THPT Chuyên & GDPT 2018',
      phone: teacherData.phone?.trim() || '',
      teachingSubjects: teacherData.teachingSubjects || ['TOAN_12'],
      createdAt: new Date().toISOString().substring(0, 10),
    };

    users.push(newUser);
    this.saveUsers(users);
    this.addLog('Thêm giáo viên mới', `Quản trị viên đã tạo tài khoản: ${newUser.fullName} (${newUser.username})`);
    return { success: true, message: 'Thêm tài khoản giáo viên thành công!', user: newUser };
  }

  static deleteTeacher(userId: string): { success: boolean; message: string } {
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'Không tìm thấy tài khoản giáo viên cần xóa.' };
    }

    // Protection rule: Do NOT delete the last admin account
    if (target.role === 'admin') {
      const activeAdmins = users.filter(u => u.role === 'admin' && u.status === 'active');
      if (activeAdmins.length <= 1) {
        return { success: false, message: 'Không thể xóa tài khoản Quản trị viên cuối cùng của hệ thống!' };
      }
    }

    // Delete user from list while preserving all classes, students, exams, and logs
    const updatedUsers = users.filter(u => u.id !== userId);
    this.saveUsers(updatedUsers);

    // If current logged-in user was deleted, switch to admin
    const curr = this.getCurrentUser();
    if (curr.id === userId) {
      this.setCurrentUser(updatedUsers[0]);
    }

    this.addLog('Xóa tài khoản', `Đã xóa tài khoản: ${target.fullName} (${target.username}). Dữ liệu lớp học, đề thi được bảo lưu.`);
    return {
      success: true,
      message: `Đã xóa thành công tài khoản ${target.fullName}. Toàn bộ lớp học, học sinh và kết quả học tập liên quan vẫn được bảo lưu an toàn.`,
    };
  }

  static approveUser(userId: string): void {
    const users = this.getUsers().map(u => u.id === userId ? { ...u, status: 'active' as const } : u);
    this.saveUsers(users);
    this.addLog('Phê duyệt tài khoản', `Quản trị viên đã phê duyệt tài khoản ID: ${userId}`);
  }

  static toggleUserStatus(userId: string): { success: boolean; message: string } {
    const users = this.getUsers();
    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'Không tìm thấy tài khoản.' };
    }

    // Protection: Cannot lock last active admin
    if (target.role === 'admin' && target.status === 'active') {
      const activeAdmins = users.filter(u => u.role === 'admin' && u.status === 'active');
      if (activeAdmins.length <= 1) {
        return { success: false, message: 'Không thể khóa tài khoản Quản trị viên duy nhất đang hoạt động!' };
      }
    }

    const nextStatus = target.status === 'locked' ? 'active' : 'locked';
    const updatedUsers = users.map(u => u.id === userId ? { ...u, status: nextStatus as 'active' | 'locked' } : u);
    this.saveUsers(updatedUsers);
    this.addLog(nextStatus === 'locked' ? 'Khóa tài khoản' : 'Mở khóa tài khoản', `${target.fullName} (${target.username})`);
    return { success: true, message: nextStatus === 'locked' ? `Đã tạm khóa tài khoản ${target.fullName}` : `Đã mở khóa tài khoản ${target.fullName}` };
  }

  // Subjects
  static getSubjects(): Subject[] {
    return this.getItem<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
  }

  // Classes
  static getClasses(): ClassRoom[] {
    return this.getItem<ClassRoom[]>(STORAGE_KEYS.CLASSES, INITIAL_CLASSES);
  }

  static saveClass(cl: ClassRoom): void {
    const classes = this.getClasses();
    const existingIdx = classes.findIndex(c => c.id === cl.id);
    if (existingIdx >= 0) {
      classes[existingIdx] = cl;
    } else {
      classes.unshift(cl);
    }
    this.setItem(STORAGE_KEYS.CLASSES, classes);
    this.addLog('Cập nhật lớp học', `Lớp: ${cl.name} (Khối ${cl.grade})`);
  }

  static deleteClass(classId: string): void {
    const classes = this.getClasses().filter(c => c.id !== classId);
    this.setItem(STORAGE_KEYS.CLASSES, classes);
  }

  // Students
  static getStudents(): Student[] {
    return this.getItem<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
  }

  static saveStudent(student: Student): void {
    const students = this.getStudents();
    const existingIdx = students.findIndex(s => s.id === student.id);
    if (existingIdx >= 0) {
      students[existingIdx] = student;
    } else {
      students.unshift(student);
    }
    this.setItem(STORAGE_KEYS.STUDENTS, students);
    // update class student count
    this.recalculateClassCounts();
  }

  static importStudents(newStudents: Student[]): void {
    const current = this.getStudents();
    const updated = [...newStudents, ...current];
    // Deduplicate by studentCode
    const uniqueMap = new Map<string, Student>();
    updated.forEach(s => {
      if (!uniqueMap.has(s.studentCode)) {
        uniqueMap.set(s.studentCode, s);
      }
    });
    this.setItem(STORAGE_KEYS.STUDENTS, Array.from(uniqueMap.values()));
    this.recalculateClassCounts();
    this.addLog('Nhập danh sách học sinh', `Đã nhập thành công ${newStudents.length} học sinh từ Excel`);
  }

  static recalculateClassCounts(): void {
    const students = this.getStudents();
    const classes = this.getClasses().map(c => {
      const count = students.filter(s => s.classId === c.id).length;
      return { ...c, studentCount: count };
    });
    this.setItem(STORAGE_KEYS.CLASSES, classes);
  }

  // Questions
  static getQuestions(): Question[] {
    return this.getItem<Question[]>(STORAGE_KEYS.QUESTIONS, INITIAL_QUESTIONS);
  }

  static saveQuestion(q: Question): void {
    const questions = this.getQuestions();
    const idx = questions.findIndex(item => item.id === q.id);
    if (idx >= 0) {
      questions[idx] = q;
    } else {
      questions.unshift(q);
    }
    this.setItem(STORAGE_KEYS.QUESTIONS, questions);
    this.addLog('Lưu câu hỏi', `Mã câu hỏi: ${q.code} - ${q.topic}`);
  }

  static deleteQuestion(id: string): void {
    const questions = this.getQuestions().filter(q => q.id !== id);
    this.setItem(STORAGE_KEYS.QUESTIONS, questions);
  }

  // Matrices
  static getMatrices(): MatrixDocument[] {
    return this.getItem<MatrixDocument[]>(STORAGE_KEYS.MATRICES, INITIAL_MATRICES);
  }

  static saveMatrix(matrix: MatrixDocument): void {
    const matrices = this.getMatrices();
    const idx = matrices.findIndex(m => m.id === matrix.id);
    if (idx >= 0) {
      matrices[idx] = matrix;
    } else {
      matrices.unshift(matrix);
    }
    this.setItem(STORAGE_KEYS.MATRICES, matrices);
    this.addLog('Lưu ma trận & đặc tả', `Ma trận: ${matrix.title}`);
  }

  // Exams
  static getExams(): Exam[] {
    return this.getItem<Exam[]>(STORAGE_KEYS.EXAMS, INITIAL_EXAMS);
  }

  static saveExam(exam: Exam): void {
    const exams = this.getExams();
    const idx = exams.findIndex(e => e.id === exam.id);
    if (idx >= 0) {
      exams[idx] = exam;
    } else {
      exams.unshift(exam);
    }
    this.setItem(STORAGE_KEYS.EXAMS, exams);
    this.addLog('Lưu đề kiểm tra', `Đề: ${exam.title} (Mã: ${exam.code})`);
  }

  // Assignments
  static getAssignments(): ExamAssignment[] {
    return this.getItem<ExamAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, INITIAL_ASSIGNMENTS);
  }

  static saveAssignment(assignment: ExamAssignment): void {
    const assignments = this.getAssignments();
    const idx = assignments.findIndex(a => a.id === assignment.id);
    if (idx >= 0) {
      assignments[idx] = assignment;
    } else {
      assignments.unshift(assignment);
    }
    this.setItem(STORAGE_KEYS.ASSIGNMENTS, assignments);
    this.addLog('Giao bài kiểm tra', `Đề: ${assignment.examTitle} đến ${assignment.classNames.join(', ')}`);
  }

  // Submissions
  static getSubmissions(): ExamSubmission[] {
    return this.getItem<ExamSubmission[]>(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
  }

  static saveSubmission(subm: ExamSubmission): void {
    const subms = this.getSubmissions();
    const idx = subms.findIndex(s => s.id === subm.id);
    if (idx >= 0) {
      subms[idx] = subm;
    } else {
      subms.unshift(subm);
    }
    this.setItem(STORAGE_KEYS.SUBMISSIONS, subms);
  }

  // Violations
  static logViolation(violation: ViolationEvent): void {
    const list = this.getItem<ViolationEvent[]>(STORAGE_KEYS.VIOLATIONS, []);
    list.unshift(violation);
    this.setItem(STORAGE_KEYS.VIOLATIONS, list);
  }

  static getViolations(submissionId?: string): ViolationEvent[] {
    const list = this.getItem<ViolationEvent[]>(STORAGE_KEYS.VIOLATIONS, []);
    if (submissionId) {
      return list.filter(v => v.submissionId === submissionId);
    }
    return list;
  }

  // Audit Logs
  static getLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, INITIAL_LOGS);
  }

  static addLog(action: string, details: string): void {
    const user = this.getCurrentUser();
    const logs = this.getLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      userId: user.id,
      userName: user.fullName,
      action,
      details,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    logs.unshift(newLog);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 100)); // keep last 100
  }

  // Export / Import Full Database Backup
  static exportFullBackupJSON(): string {
    const backup = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      source: 'EduTest Smart GDPT 2018',
      data: {
        users: this.getUsers(),
        subjects: this.getSubjects(),
        classes: this.getClasses(),
        students: this.getStudents(),
        questions: this.getQuestions(),
        matrices: this.getMatrices(),
        exams: this.getExams(),
        assignments: this.getAssignments(),
        submissions: this.getSubmissions(),
        logs: this.getLogs(),
      },
    };
    return JSON.stringify(backup, null, 2);
  }

  static importFullBackupJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.data) {
        if (parsed.data.users) this.setItem(STORAGE_KEYS.USERS, parsed.data.users);
        if (parsed.data.classes) this.setItem(STORAGE_KEYS.CLASSES, parsed.data.classes);
        if (parsed.data.students) this.setItem(STORAGE_KEYS.STUDENTS, parsed.data.students);
        if (parsed.data.questions) this.setItem(STORAGE_KEYS.QUESTIONS, parsed.data.questions);
        if (parsed.data.matrices) this.setItem(STORAGE_KEYS.MATRICES, parsed.data.matrices);
        if (parsed.data.exams) this.setItem(STORAGE_KEYS.EXAMS, parsed.data.exams);
        if (parsed.data.assignments) this.setItem(STORAGE_KEYS.ASSIGNMENTS, parsed.data.assignments);
        if (parsed.data.submissions) this.setItem(STORAGE_KEYS.SUBMISSIONS, parsed.data.submissions);
        this.addLog('Phục hồi dữ liệu', 'Đã khôi phục dữ liệu từ tệp sao lưu JSON');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Google Apps Script API Connection Config
  static getGasApiConfig(): { gasUrl: string; sheetId: string; lastSync?: string } {
    return this.getItem(STORAGE_KEYS.API_CONFIG, {
      gasUrl: '',
      sheetId: '',
      lastSync: undefined,
    });
  }

  static setGasApiConfig(config: { gasUrl: string; sheetId: string; lastSync?: string }): void {
    this.setItem(STORAGE_KEYS.API_CONFIG, config);
  }
}
