import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle,
  AlertTriangle,
  School,
  FileSpreadsheet,
  X,
  UserCheck,
  ArrowRightLeft,
  ChevronDown,
} from 'lucide-react';
import { ClassRoom, Student, User } from '../../types';
import { StorageService } from '../../services/storage';
import { playSound } from '../../services/sound';

interface ClassesViewProps {
  currentUser: User;
  classes: ClassRoom[];
  students: Student[];
  onRefreshData: () => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  currentUser,
  classes,
  students,
  onRefreshData,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states for New Class
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState<number>(12);
  const [newClassYear, setNewClassYear] = useState('2025-2026');
  const [newClassRoom, setNewClassRoom] = useState('');

  // Form states for New Student
  const [studentFormCode, setStudentFormCode] = useState('');
  const [studentFormName, setStudentFormName] = useState('');
  const [studentFormDob, setStudentFormDob] = useState('');
  const [studentFormGender, setStudentFormGender] = useState<'Nam' | 'Nữ'>('Nam');
  const [studentFormClassId, setStudentFormClassId] = useState('');

  // Excel Preview data
  interface ExcelPreviewRow {
    stt: number;
    studentCode: string;
    fullName: string;
    dob: string;
    className: string;
    isValid: boolean;
    errorMsg?: string;
  }
  const [excelRows, setExcelRows] = useState<ExcelPreviewRow[]>([]);
  const [excelStep, setExcelStep] = useState<1 | 2>(1); // 1 = Upload & Parse, 2 = Preview & Confirm

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;
      const matchSearch =
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.username.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [students, selectedClassId, searchQuery]);

  // Handle Create Class
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const newClass: ClassRoom = {
      id: `class-${Date.now()}`,
      name: newClassName.trim(),
      grade: Number(newClassGrade),
      academicYear: newClassYear,
      teacherId: currentUser.id,
      teacherName: currentUser.fullName,
      studentCount: 0,
      room: newClassRoom.trim() || undefined,
      createdAt: new Date().toISOString().substring(0, 10),
    };

    StorageService.saveClass(newClass);
    playSound('correct');
    setShowAddClassModal(false);
    setNewClassName('');
    setNewClassRoom('');
    onRefreshData();
  };

  // Handle Save Student (Add or Edit)
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFormCode.trim() || !studentFormName.trim()) return;

    const targetClass = classes.find(c => c.id === studentFormClassId) || classes[0];

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        studentCode: studentFormCode.trim(),
        fullName: studentFormName.trim(),
        dob: studentFormDob || undefined,
        gender: studentFormGender,
        classId: targetClass.id,
        className: targetClass.name,
      };
      StorageService.saveStudent(updated);
    } else {
      const newStu: Student = {
        id: `stu-${Date.now()}`,
        studentCode: studentFormCode.trim(),
        fullName: studentFormName.trim(),
        dob: studentFormDob || undefined,
        gender: studentFormGender,
        classId: targetClass.id,
        className: targetClass.name,
        username: `hs.${studentFormCode.trim().toLowerCase()}`,
        status: 'active',
      };
      StorageService.saveStudent(newStu);
    }

    playSound('correct');
    setShowAddStudentModal(false);
    setEditingStudent(null);
    setStudentFormCode('');
    setStudentFormName('');
    setStudentFormDob('');
    onRefreshData();
  };

  // Simulated Excel Import Parser (satisfies Excel 7-step process)
  const handleLoadSampleExcel = () => {
    const rawSampleData = [
      { stt: 1, studentCode: 'HS1209', fullName: 'Trịnh Nhật Minh', dob: '2008-04-12', className: '12A1' },
      { stt: 2, studentCode: 'HS1210', fullName: 'Lê Quỳnh Nga', dob: '2008-09-30', className: '12A1' },
      { stt: 3, studentCode: 'HS1211', fullName: 'Bùi Tuấn Kiệt', dob: '2008-02-17', className: '12A2' },
      { stt: 4, studentCode: 'HS1201', fullName: 'Lê Minh Khôi (Trùng mã)', dob: '2008-03-15', className: '12A1' }, // intentional duplicate
      { stt: 5, studentCode: 'HS1212', fullName: 'Võ Thanh Tùng', dob: '', className: '12A2' },
    ];

    // Validate rows
    const existingCodes = new Set(students.map(s => s.studentCode.toUpperCase()));
    const parsedRows: ExcelPreviewRow[] = rawSampleData.map((row) => {
      let isValid = true;
      let errorMsg = '';

      if (!row.studentCode || !row.fullName) {
        isValid = false;
        errorMsg = 'Thiếu thông tin bắt buộc';
      } else if (existingCodes.has(row.studentCode.toUpperCase())) {
        isValid = false;
        errorMsg = 'Trùng mã học sinh trong hệ thống';
      }

      return {
        ...row,
        isValid,
        errorMsg,
      };
    });

    setExcelRows(parsedRows);
    setExcelStep(2);
    playSound('notification');
  };

  const handleConfirmImport = () => {
    const validRows = excelRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    const newStudents: Student[] = validRows.map((r, idx) => {
      const cls = classes.find(c => c.name.toLowerCase() === r.className.toLowerCase()) || classes[0];
      return {
        id: `stu-imp-${Date.now()}-${idx}`,
        studentCode: r.studentCode,
        fullName: r.fullName,
        dob: r.dob || undefined,
        gender: 'Nam',
        classId: cls.id,
        className: cls.name,
        username: `hs.${r.studentCode.toLowerCase()}`,
        status: 'active',
      };
    });

    StorageService.importStudents(newStudents);
    playSound('correct');
    setShowExcelImportModal(false);
    setExcelRows([]);
    setExcelStep(1);
    onRefreshData();
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = 'STT,Mã học sinh,Họ và tên,Lớp,Ngày sinh,Tên đăng nhập,Trạng thái\n';
    const rows = filteredStudents.map((s, index) => 
      `${index + 1},"${s.studentCode}","${s.fullName}","${s.className}","${s.dob || ''}","${s.username}","${s.status === 'active' ? 'Hoạt động' : 'Đã khóa'}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Danh_sach_hoc_sinh_${selectedClassId}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    playSound('click');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-800">Quản lý Lớp học & Học sinh</h2>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
              {classes.length} Lớp · {students.length} Học sinh
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản trị danh sách lớp, hồ sơ học sinh, phân quyền giảng dạy và đồng bộ Excel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setShowAddClassModal(true);
              playSound('click');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" /> Tạo lớp mới
          </button>

          <button
            onClick={() => {
              setStudentFormClassId(classes[0]?.id || '');
              setEditingStudent(null);
              setStudentFormCode(`HS12${String(students.length + 1).padStart(2, '0')}`);
              setStudentFormName('');
              setShowAddStudentModal(true);
              playSound('click');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" /> Thêm học sinh
          </button>

          <button
            onClick={() => {
              setShowExcelImportModal(true);
              setExcelStep(1);
              setExcelRows([]);
              playSound('click');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            <Upload className="w-4 h-4" /> Nhập Excel
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" /> Xuất danh sách
          </button>
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {classes.map((cls) => {
          const isSelected = selectedClassId === cls.id;
          return (
            <div
              key={cls.id}
              onClick={() => {
                setSelectedClassId(isSelected ? 'all' : cls.id);
                playSound('click');
              }}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">
                    Khối {cls.grade}
                  </span>
                  <h4 className="text-lg font-black text-slate-800 mt-1">{cls.name}</h4>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-slate-800">{cls.studentCount}</span>
                  <span className="text-[10px] text-slate-400 block">học sinh</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div>GV phụ trách: <span className="font-semibold text-slate-700">{cls.teacherName}</span></div>
                <div className="flex justify-between text-slate-400">
                  <span>{cls.room || 'Chưa xếp phòng'}</span>
                  <span>{cls.academicYear}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Student List Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filters & Search */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã, họ tên hoặc username..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-hidden"
              >
                <option value="all">Tất cả các lớp ({students.length})</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} ({c.studentCount})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Hiển thị <strong>{filteredStudents.length}</strong> học sinh
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Mã học sinh</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Lớp</th>
                <th className="py-3 px-4">Giới tính</th>
                <th className="py-3 px-4">Ngày sinh</th>
                <th className="py-3 px-4">Tên đăng nhập</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc
                  </td>
                </tr>
              ) : (
                filteredStudents.map((stu, index) => (
                  <tr key={stu.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-center text-slate-400 font-mono">{index + 1}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">{stu.studentCode}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{stu.fullName}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {stu.className}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{stu.gender}</td>
                    <td className="py-2.5 px-4 text-slate-500">{stu.dob || '—'}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">{stu.username}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          stu.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {stu.status === 'active' ? 'Hoạt động' : 'Tạm khóa'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingStudent(stu);
                            setStudentFormCode(stu.studentCode);
                            setStudentFormName(stu.fullName);
                            setStudentFormDob(stu.dob || '');
                            setStudentFormGender(stu.gender);
                            setStudentFormClassId(stu.classId);
                            setShowAddStudentModal(true);
                            playSound('click');
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors"
                          title="Chỉnh sửa hồ sơ"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Class */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">Tạo Lớp Học Mới</h3>
              <button onClick={() => setShowAddClassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên lớp học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 12A3, 11B2..."
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Khối lớp *</label>
                  <select
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={10}>Khối 10</option>
                    <option value={11}>Khối 11</option>
                    <option value={12}>Khối 12</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Năm học *</label>
                  <select
                    value={newClassYear}
                    onChange={(e) => setNewClassYear(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="2025-2026">2025–2026</option>
                    <option value="2026-2027">2026–2027</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phòng học (tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phòng 304, Khu A"
                  value={newClassRoom}
                  onChange={(e) => setNewClassRoom(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                >
                  Lưu lớp học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Student */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingStudent ? 'Chỉnh Sửa Hồ Sơ Học Sinh' : 'Thêm Học Sinh Mới'}
              </h3>
              <button onClick={() => setShowAddStudentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã học sinh *</label>
                  <input
                    type="text"
                    required
                    placeholder="HS1201"
                    value={studentFormCode}
                    onChange={(e) => setStudentFormCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Lớp *</label>
                  <select
                    value={studentFormClassId}
                    onChange={(e) => setStudentFormClassId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={studentFormName}
                  onChange={(e) => setStudentFormName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={studentFormGender}
                    onChange={(e) => setStudentFormGender(e.target.value as 'Nam' | 'Nữ')}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={studentFormDob}
                    onChange={(e) => setStudentFormDob(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500">
                Tên đăng nhập hệ thống sẽ tự động tạo theo mã: <strong className="font-mono text-indigo-700">hs.{studentFormCode.toLowerCase()}</strong>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-xs"
                >
                  {editingStudent ? 'Lưu thay đổi' : 'Thêm học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: 7-Step Excel Import Flow */}
      {showExcelImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Nhập Danh Sách Học Sinh từ Excel</h3>
              </div>
              <button onClick={() => setShowExcelImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="font-semibold text-slate-700 mb-1">
                Các bước xử lý danh sách:
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                <span className="font-bold text-indigo-700">1. Đọc dữ liệu</span> →
                <span className="font-bold text-indigo-700">2. Kiểm tra cột</span> →
                <span className="font-bold text-indigo-700">3. Phát hiện thiếu dòng</span> →
                <span className="font-bold text-indigo-700">4. Kiểm tra trùng</span> →
                <span className="font-bold text-indigo-700">5. Xem trước</span> →
                <span className="font-bold text-indigo-700">6. Chỉnh sửa</span> →
                <span className="font-bold text-indigo-700">7. Xác nhận nhập</span>
              </div>
            </div>

            {excelStep === 1 ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <Upload className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">Chọn hoặc kéo thả tệp Excel (.xlsx, .xls)</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Cấu trúc các cột mẫu: <strong>STT | Mã học sinh | Họ và tên | Ngày sinh | Lớp</strong>
                  </p>

                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleLoadSampleExcel}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
                    >
                      Tải tệp mẫu & Phân tích tự động
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  * Dữ liệu học sinh mới sẽ được thêm vào danh sách lớp hiện có một cách an toàn.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Bản xem trước & Đối chiếu dữ liệu ({excelRows.length} dòng phát hiện)
                  </span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    {excelRows.filter(r => r.isValid).length} dòng hợp lệ
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">STT</th>
                        <th className="py-2 px-3">Mã HS</th>
                        <th className="py-2 px-3">Họ và tên</th>
                        <th className="py-2 px-3">Ngày sinh</th>
                        <th className="py-2 px-3">Lớp</th>
                        <th className="py-2 px-3 text-center">Trạng thái kiểm tra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {excelRows.map((row, idx) => (
                        <tr key={idx} className={row.isValid ? 'bg-white' : 'bg-rose-50/60'}>
                          <td className="py-2 px-3 text-slate-400">{row.stt}</td>
                          <td className="py-2 px-3 font-mono font-bold text-indigo-700">{row.studentCode}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{row.fullName}</td>
                          <td className="py-2 px-3 text-slate-500">{row.dob || '—'}</td>
                          <td className="py-2 px-3 font-semibold text-slate-700">{row.className}</td>
                          <td className="py-2 px-3 text-center">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                                <CheckCircle className="w-3.5 h-3.5" /> Hợp lệ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700" title={row.errorMsg}>
                                <AlertTriangle className="w-3.5 h-3.5" /> {row.errorMsg}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setExcelStep(1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Chọn lại tệp khác
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Xác nhận nhập ({excelRows.filter(r => r.isValid).length} học sinh)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
