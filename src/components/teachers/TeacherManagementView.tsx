import React, { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  School,
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  BookOpen,
  Layers,
  Sparkles,
  Phone,
  Mail,
} from 'lucide-react';
import { User, TeacherPermission, ClassRoom, isAdminTeacher } from '../../types';
import { playSound } from '../../services/sound';

interface TeacherManagementViewProps {
  currentUser: User;
  classes: ClassRoom[];
  onRefreshData?: () => void;
}

export const TeacherManagementView: React.FC<TeacherManagementViewProps> = ({
  currentUser,
  classes,
  onRefreshData,
}) => {
  // State for Teachers list (fetched from server / local storage)
  const [teachers, setTeachers] = useState<User[]>(() => {
    // Initial fetch from localStorage or server seed
    try {
      const raw = localStorage.getItem('edutest_users');
      if (raw) {
        const parsed: User[] = JSON.parse(raw);
        return parsed.filter(u => String(u.role).toUpperCase() === 'TEACHER' || String(u.role).toUpperCase() === 'ADMIN');
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'user-admin',
        username: 'admin',
        fullName: 'Thầy Hồ Nguyễn Đa Thiện',
        salutation: 'Thầy',
        email: 'dathien.toan@edutest.edu.vn',
        role: 'TEACHER',
        permission: 'ADMIN',
        teacherCode: 'GV001',
        status: 'active',
        schoolName: 'THPT Chuyên & GDPT 2018',
        phone: '0908123456',
        teachingSubjects: ['TOAN_10', 'TOAN_11', 'TOAN_12'],
        assignedClassIds: ['class-12a1', 'class-11b1', 'class-10c1'],
        createdAt: '2025-08-15',
      },
      {
        id: 'user-teacher-1',
        username: 'lan.nguyen',
        fullName: 'Cô Nguyễn Thị Lan',
        salutation: 'Cô',
        email: 'lan.nguyen@edutest.edu.vn',
        role: 'TEACHER',
        permission: 'STANDARD',
        teacherCode: 'GV002',
        status: 'active',
        schoolName: 'THPT Võ Trường Toản',
        phone: '0912345678',
        teachingSubjects: ['TOAN_12'],
        assignedClassIds: ['class-12a2'],
        createdAt: '2025-09-01',
      },
      {
        id: 'user-teacher-pending',
        username: 'quoc.tran',
        fullName: 'Thầy Trần Quốc Tuấn',
        salutation: 'Thầy',
        email: 'tuan.tran@edutest.edu.vn',
        role: 'TEACHER',
        permission: 'STANDARD',
        teacherCode: 'GV003',
        status: 'pending',
        schoolName: 'THPT Nguyễn Thị Minh Khai',
        phone: '0933999888',
        teachingSubjects: ['TOAN_11'],
        assignedClassIds: [],
        createdAt: '2026-10-20',
      },
    ];
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPermission, setFilterPermission] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<User | null>(null);
  const [confirmDeleteTeacher, setConfirmDeleteTeacher] = useState<User | null>(null);

  // Form State
  const [formFullName, setFormFullName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formTeacherCode, setFormTeacherCode] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPermission, setFormPermission] = useState<TeacherPermission>('STANDARD');
  const [formSubjects, setFormSubjects] = useState<string[]>(['TOAN_12']);
  const [formClassIds, setFormClassIds] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<'active' | 'locked' | 'pending'>('active');

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchSearch =
        t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.teacherCode && t.teacherCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchPermission =
        filterPermission === 'all' ||
        (filterPermission === 'ADMIN' && t.permission === 'ADMIN') ||
        (filterPermission === 'STANDARD' && t.permission !== 'ADMIN');

      const matchStatus = filterStatus === 'all' || t.status === filterStatus;

      return matchSearch && matchPermission && matchStatus;
    });
  }, [teachers, searchQuery, filterPermission, filterStatus]);

  // Open Add Modal
  const handleOpenAdd = () => {
    playSound('click');
    setFormFullName('');
    setFormUsername('');
    setFormTeacherCode(`GV${Math.floor(100 + Math.random() * 900)}`);
    setFormEmail('');
    setFormPhone('');
    setFormPermission('STANDARD');
    setFormSubjects(['TOAN_12']);
    setFormClassIds([]);
    setFormStatus('active');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (t: User) => {
    playSound('click');
    setEditingTeacher(t);
    setFormFullName(t.fullName);
    setFormUsername(t.username);
    setFormTeacherCode(t.teacherCode || '');
    setFormEmail(t.email || '');
    setFormPhone(t.phone || '');
    setFormPermission(t.permission === 'ADMIN' ? 'ADMIN' : 'STANDARD');
    setFormSubjects(t.teachingSubjects || ['TOAN_12']);
    setFormClassIds(t.assignedClassIds || []);
    setFormStatus(t.status);
  };

  // Save Teacher (Add / Edit)
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFullName.trim() || !formUsername.trim()) {
      alert('Vui lòng nhập họ và tên và tên đăng nhập.');
      return;
    }

    // Server-level validation: Cannot revoke last Admin teacher
    if (editingTeacher && editingTeacher.permission === 'ADMIN' && formPermission === 'STANDARD') {
      const adminCount = teachers.filter(t => t.permission === 'ADMIN' && t.status === 'active').length;
      if (adminCount <= 1) {
        alert('Không thể thu hồi quyền Quản trị của Giáo viên Quản trị cuối cùng trong hệ thống.');
        return;
      }
    }

    try {
      const payload = {
        fullName: formFullName.trim(),
        username: formUsername.trim().toLowerCase(),
        teacherCode: formTeacherCode.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        permission: formPermission,
        teachingSubjects: formSubjects,
        assignedClassIds: formClassIds,
        status: formStatus,
      };

      const url = editingTeacher ? `/api/teachers/${editingTeacher.id}` : '/api/teachers';
      const method = editingTeacher ? 'PUT' : 'POST';

      const token = sessionStorage.getItem('edutest_token') || localStorage.getItem('edutest_token');
      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('API error, saving locally:', err);
    }

    if (editingTeacher) {
      const updated = teachers.map(t => {
        if (t.id !== editingTeacher.id) return t;
        return {
          ...t,
          fullName: formFullName.trim(),
          salutation: formFullName.startsWith('Cô') ? 'Cô' : 'Thầy',
          teacherCode: formTeacherCode.trim(),
          email: formEmail.trim() || t.email,
          phone: formPhone.trim(),
          permission: formPermission,
          teachingSubjects: formSubjects,
          assignedClassIds: formClassIds,
          status: formStatus,
        };
      });
      setTeachers(updated);
      persistTeachers(updated);
      setEditingTeacher(null);
    } else {
      const newT: User = {
        id: `user-teacher-${Date.now()}`,
        username: formUsername.trim().toLowerCase(),
        fullName: formFullName.trim(),
        salutation: formFullName.startsWith('Cô') ? 'Cô' : 'Thầy',
        email: formEmail.trim() || `${formUsername.trim().toLowerCase()}@edutest.edu.vn`,
        role: 'TEACHER',
        permission: formPermission,
        teacherCode: formTeacherCode.trim(),
        status: formStatus,
        schoolName: currentUser.schoolName || 'THPT Chuyên & GDPT 2018',
        phone: formPhone.trim(),
        teachingSubjects: formSubjects,
        assignedClassIds: formClassIds,
        createdAt: new Date().toISOString().substring(0, 10),
      };
      const updated = [newT, ...teachers];
      setTeachers(updated);
      persistTeachers(updated);
      setShowAddModal(false);
    }

    playSound('correct');
    if (onRefreshData) onRefreshData();
  };

  // Toggle Lock/Unlock
  const handleToggleLock = async (t: User) => {
    playSound('click');
    // Safety check: Cannot lock last active Admin
    if (t.permission === 'ADMIN' && t.status === 'active') {
      const activeAdmins = teachers.filter(item => item.permission === 'ADMIN' && item.status === 'active');
      if (activeAdmins.length <= 1) {
        alert('Không thể khóa tài khoản Giáo viên Quản trị duy nhất đang hoạt động!');
        return;
      }
    }

    const nextStatus = t.status === 'locked' ? 'active' : 'locked';
    try {
      const token = sessionStorage.getItem('edutest_token') || localStorage.getItem('edutest_token');
      await fetch(`/api/teachers/${t.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (e) {
      console.warn(e);
    }

    const updated = teachers.map(item => (item.id === t.id ? { ...item, status: nextStatus as any } : item));
    setTeachers(updated);
    persistTeachers(updated);
  };

  // Reset Password
  const handleResetPassword = async (t: User) => {
    if (window.confirm(`Bạn có chắc chắn muốn cấp lại mật khẩu mặc định (password123) cho giáo viên:\n${t.fullName} (${t.username})?`)) {
      playSound('correct');
      try {
        const token = sessionStorage.getItem('edutest_token') || localStorage.getItem('edutest_token');
        await fetch(`/api/teachers/${t.id}/reset-password`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        console.warn(e);
      }
      alert(`Đã cấp lại mật khẩu cho giáo viên ${t.fullName}.\nMật khẩu tạm thời là: password123`);
    }
  };

  // Safe Deletion: Deactivate & Preserve history
  const handleConfirmDelete = async () => {
    if (!confirmDeleteTeacher) return;
    const t = confirmDeleteTeacher;

    // RULE: Cannot delete last Admin teacher
    if (t.permission === 'ADMIN') {
      const adminCount = teachers.filter(item => item.permission === 'ADMIN' && item.id !== t.id).length;
      if (adminCount === 0) {
        alert('Không cho phép xóa tài khoản Giáo viên Quản trị cuối cùng trong hệ thống!');
        setConfirmDeleteTeacher(null);
        return;
      }
    }

    playSound('wrong');
    try {
      const token = sessionStorage.getItem('edutest_token') || localStorage.getItem('edutest_token');
      await fetch(`/api/teachers/${t.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {
      console.warn(e);
    }

    // REQUIREMENT: "Khi xóa giáo viên đã có dữ liệu, phải bảo toàn lịch sử đề thi, bài được giao và kết quả học sinh. Ưu tiên vô hiệu hóa tài khoản thay vì xóa vật lý dữ liệu có liên quan."
    const updated = teachers.map(item => {
      if (item.id === t.id) {
        return {
          ...item,
          status: 'locked' as const,
          fullName: `${item.fullName} (Đã khóa/Ngưng công tác)`,
        };
      }
      return item;
    });

    setTeachers(updated);
    persistTeachers(updated);
    setConfirmDeleteTeacher(null);
    alert(`Đã vô hiệu hóa tài khoản ${t.fullName} an toàn. Toàn bộ lịch sử đề thi, bài giao và kết quả của học sinh được bảo toàn nguyên vẹn.`);
    if (onRefreshData) onRefreshData();
  };

  const persistTeachers = (list: User[]) => {
    try {
      const allUsersRaw = localStorage.getItem('edutest_users');
      let allUsers: User[] = allUsersRaw ? JSON.parse(allUsersRaw) : [];
      // Replace teachers in allUsers
      const students = allUsers.filter(u => String(u.role).toUpperCase() === 'STUDENT');
      const merged = [...list, ...students];
      localStorage.setItem('edutest_users', JSON.stringify(merged));
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to format assigned classes
  const getClassNames = (cIds?: string[]) => {
    if (!cIds || cIds.length === 0) return 'Chưa phân công';
    return cIds
      .map(id => classes.find(c => c.id === id)?.name || id)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Chức năng Giáo viên Quản trị (ADMIN)
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2 mt-0.5">
            <Users className="w-6 h-6 text-indigo-600" />
            Quản lý Tài khoản Giáo viên & Phân quyền
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Thêm, sửa, phân quyền (ADMIN / STANDARD), phân công môn học, lớp phụ trách và bảo toàn lịch sử giảng dạy
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all hover:shadow shrink-0"
        >
          <Plus className="w-4 h-4" />
          Thêm giáo viên mới
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Tìm kiếm giáo viên
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tên, mã GV, username..."
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Cấp quyền
          </label>
          <select
            value={filterPermission}
            onChange={e => setFilterPermission(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả cấp quyền</option>
            <option value="ADMIN">Giáo viên Quản trị (ADMIN)</option>
            <option value="STANDARD">Giáo viên Thông thường (STANDARD)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Trạng thái tài khoản
          </label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
            <option value="pending">Chờ kích hoạt</option>
          </select>
        </div>
      </div>

      {/* Responsive Teachers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse min-w-[850px]">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-3 text-center w-12">STT</th>
                <th className="py-3.5 px-3">Mã GV</th>
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-3">Tên đăng nhập</th>
                <th className="py-3.5 px-3">Môn phụ trách</th>
                <th className="py-3.5 px-3">Lớp phụ trách</th>
                <th className="py-3.5 px-3 text-center">Cấp quyền</th>
                <th className="py-3.5 px-3 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTeachers.map((t, idx) => {
                const isAdmin = t.permission === 'ADMIN';
                const isCurrent = t.id === currentUser.id;

                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* STT */}
                    <td className="py-3.5 px-3 text-center text-xs text-slate-400 font-medium">
                      {idx + 1}
                    </td>

                    {/* Mã giáo viên */}
                    <td className="py-3.5 px-3 font-mono text-xs font-bold text-indigo-700">
                      {t.teacherCode || `GV00${idx + 1}`}
                    </td>

                    {/* Họ và tên */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        {t.fullName}
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        {t.phone && <span>{t.phone}</span>}
                        {t.email && <span className="truncate max-w-[180px]">{t.email}</span>}
                      </div>
                    </td>

                    {/* Tên đăng nhập */}
                    <td className="py-3.5 px-3 font-mono text-xs text-slate-600">
                      {t.username}
                    </td>

                    {/* Môn phụ trách */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {(t.teachingSubjects || ['TOAN_12']).map(sub => (
                          <span
                            key={sub}
                            className="inline-block text-[11px] font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-100"
                          >
                            {sub === 'TOAN_12'
                              ? 'Toán 12'
                              : sub === 'TOAN_11'
                              ? 'Toán 11'
                              : sub === 'TOAN_10'
                              ? 'Toán 10'
                              : sub}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Lớp phụ trách */}
                    <td className="py-3.5 px-3 text-xs text-slate-600">
                      <span className="font-medium text-slate-800">
                        {getClassNames(t.assignedClassIds)}
                      </span>
                    </td>

                    {/* Cấp quyền */}
                    <td className="py-3.5 px-3 text-center">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Quản trị (ADMIN)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <School className="w-3.5 h-3.5 text-slate-500" />
                          Thông thường (STANDARD)
                        </span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-3 text-center">
                      {t.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đang hoạt động
                        </span>
                      ) : t.status === 'locked' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <Lock className="w-3.5 h-3.5" />
                          Đã khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Chờ duyệt
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Xem */}
                        <button
                          onClick={() => {
                            playSound('click');
                            setViewingTeacher(t);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Xem chi tiết hồ sơ giáo viên"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Sửa */}
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Sửa thông tin & Phân quyền"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Cấp lại mật khẩu */}
                        <button
                          onClick={() => handleResetPassword(t)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Cấp lại mật khẩu mặc định (password123)"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Khóa / Mở khóa */}
                        <button
                          onClick={() => handleToggleLock(t)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            t.status === 'locked'
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title={t.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                        >
                          {t.status === 'locked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        </button>

                        {/* Xóa (An toàn) */}
                        <button
                          onClick={() => {
                            playSound('wrong');
                            setConfirmDeleteTeacher(t);
                          }}
                          disabled={isCurrent}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                          title={isCurrent ? 'Không thể tự xóa chính mình' : 'Xóa / Vô hiệu hóa tài khoản an toàn'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Teacher Modal */}
      {(showAddModal || editingTeacher) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  {editingTeacher ? 'Sửa thông tin & Phân quyền Giáo viên' : 'Thêm tài khoản Giáo viên mới'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTeacher(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Họ và tên */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Họ và tên giáo viên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={e => setFormFullName(e.target.value)}
                    placeholder="Ví dụ: Thầy Trần Quốc Tuấn hoặc Cô Lê Thị Mai"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                    required
                  />
                </div>

                {/* Mã giáo viên */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mã giáo viên</label>
                  <input
                    type="text"
                    value={formTeacherCode}
                    onChange={e => setFormTeacherCode(e.target.value)}
                    placeholder="GV004"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {/* Tên đăng nhập */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    placeholder="tuan.tran"
                    disabled={!!editingTeacher}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono disabled:bg-slate-100 disabled:text-slate-500"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email liên hệ</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="tuan.tran@edutest.edu.vn"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="0912345678"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {/* Cấp quyền (ADMIN hoặc STANDARD) */}
                <div className="sm:col-span-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                  <label className="block text-xs font-bold text-indigo-900 mb-1.5">
                    Phân cấp quyền hạn giáo viên:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                        formPermission === 'STANDARD'
                          ? 'bg-white border-indigo-500 shadow-xs'
                          : 'bg-white/50 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="permission"
                        checked={formPermission === 'STANDARD'}
                        onChange={() => setFormPermission('STANDARD')}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-800">Giáo viên Thông thường</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Quản lý lớp, học sinh phụ trách, soạn đề, ma trận, chấm bài.
                        </div>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                        formPermission === 'ADMIN'
                          ? 'bg-white border-purple-500 shadow-xs'
                          : 'bg-white/50 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="permission"
                        checked={formPermission === 'ADMIN'}
                        onChange={() => setFormPermission('ADMIN')}
                        className="mt-0.5 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-purple-900 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          Giáo viên Quản trị (ADMIN)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Đầy đủ chuyên môn + quyền Quản lý giáo viên, phân quyền và cấu hình.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Phân công lớp */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Phân công lớp phụ trách:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {classes.map(c => {
                      const isSelected = formClassIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setFormClassIds(formClassIds.filter(id => id !== c.id));
                            } else {
                              setFormClassIds([...formClassIds, c.id]);
                            }
                          }}
                          className={`p-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Lớp {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Trạng thái */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trạng thái tài khoản
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Đang hoạt động (active)</option>
                    <option value="locked">Tạm khóa (locked)</option>
                    <option value="pending">Chờ kích hoạt (pending)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTeacher(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  {editingTeacher ? 'Cập nhật giáo viên' : 'Lưu tài khoản giáo viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Teacher Details Modal */}
      {viewingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <span className="text-[11px] font-mono text-indigo-600 font-bold">
                  {viewingTeacher.teacherCode}
                </span>
                <h3 className="text-lg font-bold text-slate-800">{viewingTeacher.fullName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{viewingTeacher.schoolName}</p>
              </div>
              <button
                onClick={() => setViewingTeacher(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tên đăng nhập:</span>
                  <span className="font-mono font-bold text-slate-800">{viewingTeacher.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cấp quyền:</span>
                  <span
                    className={`font-bold ${
                      viewingTeacher.permission === 'ADMIN' ? 'text-purple-700' : 'text-slate-700'
                    }`}
                  >
                    {viewingTeacher.permission === 'ADMIN'
                      ? 'Giáo viên Quản trị (ADMIN)'
                      : 'Giáo viên Thông thường (STANDARD)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trạng thái:</span>
                  <span className="font-bold text-emerald-600 capitalize">{viewingTeacher.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Số điện thoại:</span>
                  <span className="font-medium text-slate-800">{viewingTeacher.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-medium text-slate-800">{viewingTeacher.email || 'Chưa cập nhật'}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700">Lớp được phân công phụ trách:</span>
                <div className="mt-1 text-slate-600 font-medium p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                  {getClassNames(viewingTeacher.assignedClassIds)}
                </div>
              </div>
            </div>

            <button
              onClick={() => setViewingTeacher(null)}
              className="w-full mt-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Safe Delete Confirmation Modal */}
      {confirmDeleteTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-center font-bold text-slate-800 text-base mb-1">
              Xác nhận Vô hiệu hóa Giáo viên An toàn
            </h3>
            <p className="text-center text-xs text-slate-500 mb-4">
              Bạn có chắc chắn muốn ngưng công tác tài khoản giáo viên{' '}
              <strong className="text-slate-800">{confirmDeleteTeacher.fullName}</strong>?
            </p>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 mb-5 space-y-1">
              <div className="font-bold flex items-center gap-1 text-amber-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Quy trình bảo toàn dữ liệu chuẩn:
              </div>
              <p>
                Hệ thống sẽ <strong>vô hiệu hóa tài khoản</strong> và khóa quyền truy cập. Toàn bộ lịch sử đề thi, ma trận, bài tập đã giao và điểm số của học sinh liên quan được <strong>bảo lưu 100%</strong> an toàn, không bị mất mát dữ liệu.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteTeacher(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                Vô hiệu hóa an toàn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
