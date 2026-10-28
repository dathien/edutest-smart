import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  UserCheck,
  Lock,
  Unlock,
  Key,
  Database,
  Cloud,
  FileCode,
  Copy,
  Check,
  Download,
  Upload,
  AlertTriangle,
  History,
  FileSpreadsheet,
  Server,
  Layers,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  School,
  User as UserIcon,
  BookOpen,
  Flame,
} from 'lucide-react';
import { User, AuditLog, Role } from '../../types';
import { StorageService } from '../../services/storage';
import { playSound } from '../../services/sound';
import { getFirebaseStatus } from '../../services/firebase';
import { LinkedAccountsCard } from '../auth/LinkedAccountsCard';

interface SettingsViewProps {
  currentUser: User;
  users: User[];
  logs: AuditLog[];
  onRefreshData: () => void;
  onUserUpdated?: (user: User) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  users,
  logs,
  onRefreshData,
  onUserUpdated,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'teachers' | 'profile' | 'gas_integration' | 'backup' | 'audit' | 'firebase'>('teachers');
  const [copiedCode, setCopiedCode] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<User | null>(null);
  const [viewingTeacher, setViewingTeacher] = useState<User | null>(null);
  const [deletingTeacher, setDeletingTeacher] = useState<User | null>(null);

  // Form states for Add Teacher
  const [addFullName, setAddFullName] = useState('');
  const [addSalutation, setAddSalutation] = useState<'Thầy' | 'Cô' | 'Thầy giáo' | 'Cô giáo'>('Thầy');
  const [addUsername, setAddUsername] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addSchool, setAddSchool] = useState('THPT Chuyên & GDPT 2018');
  const [addRole, setAddRole] = useState<Role>('teacher');
  const [addStatus, setAddStatus] = useState<'active' | 'pending' | 'locked'>('active');
  const [addSubjects, setAddSubjects] = useState<string[]>(['TOAN_12']);
  const [addPhone, setAddPhone] = useState('');
  const [addError, setAddError] = useState('');

  // Form states for Edit Teacher
  const [editFullName, setEditFullName] = useState('');
  const [editSalutation, setEditSalutation] = useState<string>('Thầy');
  const [editEmail, setEditEmail] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editRole, setEditRole] = useState<Role>('teacher');
  const [editStatus, setEditStatus] = useState<'active' | 'pending' | 'locked'>('active');
  const [editSubjects, setEditSubjects] = useState<string[]>([]);
  const [editPhone, setEditPhone] = useState('');
  const [editError, setEditError] = useState('');

  // Personal Profile form state (for logged-in teacher / admin)
  const [selfFullName, setSelfFullName] = useState(currentUser.fullName);
  const [selfSalutation, setSelfSalutation] = useState(currentUser.salutation || 'Thầy');
  const [selfEmail, setSelfEmail] = useState(currentUser.email);
  const [selfSchool, setSelfSchool] = useState(currentUser.schoolName);
  const [selfPhone, setSelfPhone] = useState(currentUser.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [selfSuccess, setSelfSuccess] = useState('');

  const isAdmin = currentUser.role === 'admin';
  const pendingTeachers = users.filter((u) => u.status === 'pending');
  const activeTeachers = users.filter((u) => u.status !== 'pending');

  // Show transient notification message
  const showNotification = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // 1. Handle Add Teacher
  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');

    if (!addFullName.trim() || !addUsername.trim() || !addEmail.trim()) {
      setAddError('Vui lòng điền đầy đủ các thông tin bắt buộc (*).');
      return;
    }

    const res = StorageService.createTeacher({
      fullName: addFullName.trim(),
      salutation: addSalutation,
      username: addUsername.trim(),
      email: addEmail.trim(),
      schoolName: addSchool.trim(),
      role: addRole,
      status: addStatus,
      teachingSubjects: addSubjects,
      phone: addPhone.trim(),
    });

    if (!res.success) {
      setAddError(res.message);
      playSound('wrong');
      return;
    }

    playSound('correct');
    showNotification('success', res.message);
    setShowAddModal(false);
    // Reset form
    setAddFullName('');
    setAddUsername('');
    setAddEmail('');
    setAddPhone('');
    onRefreshData();
  };

  // 2. Open Edit Modal
  const openEditModal = (t: User) => {
    setEditingTeacher(t);
    setEditFullName(t.fullName);
    setEditSalutation(t.salutation || 'Thầy');
    setEditEmail(t.email);
    setEditSchool(t.schoolName);
    setEditRole(t.role);
    setEditStatus(t.status);
    setEditSubjects(t.teachingSubjects || ['TOAN_12']);
    setEditPhone(t.phone || '');
    setEditError('');
    playSound('click');
  };

  // 3. Save Edit Teacher
  const handleSaveEditTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setEditError('');

    if (!editFullName.trim() || !editEmail.trim()) {
      setEditError('Họ và tên và Email không được để trống.');
      return;
    }

    // Check email conflict with other users
    const duplicateEmail = users.find(
      (u) => u.id !== editingTeacher.id && u.email.toLowerCase() === editEmail.trim().toLowerCase()
    );
    if (duplicateEmail) {
      setEditError(`Email "${editEmail}" đang được sử dụng bởi tài khoản khác.`);
      playSound('wrong');
      return;
    }

    const updated: User = {
      ...editingTeacher,
      fullName: editFullName.trim(),
      salutation: editSalutation.trim(),
      email: editEmail.trim(),
      schoolName: editSchool.trim(),
      role: editRole,
      status: editStatus,
      teachingSubjects: editSubjects,
      phone: editPhone.trim(),
    };

    StorageService.updateUser(updated);
    playSound('correct');
    showNotification('success', `Đã cập nhật thành công hồ sơ của ${updated.fullName}!`);
    setEditingTeacher(null);
    onRefreshData();
  };

  // 4. Handle Delete Teacher
  const handleConfirmDelete = () => {
    if (!deletingTeacher) return;

    const res = StorageService.deleteTeacher(deletingTeacher.id);
    if (!res.success) {
      playSound('wrong');
      showNotification('error', res.message);
      setDeletingTeacher(null);
      return;
    }

    playSound('correct');
    showNotification('success', res.message);
    setDeletingTeacher(null);
    onRefreshData();
  };

  // 5. Handle Toggle Lock Status
  const handleToggleLock = (userId: string) => {
    const res = StorageService.toggleUserStatus(userId);
    if (!res.success) {
      playSound('wrong');
      showNotification('error', res.message);
    } else {
      playSound('click');
      showNotification('success', res.message);
    }
    onRefreshData();
  };

  // 6. Handle Approve Pending Teacher
  const handleApproveTeacher = (userId: string) => {
    StorageService.approveUser(userId);
    playSound('correct');
    showNotification('success', 'Đã phê duyệt và kích hoạt tài khoản giáo viên.');
    onRefreshData();
  };

  // 7. Save Personal Profile
  const handleSaveSelfProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfFullName.trim() || !selfEmail.trim()) return;

    const updated: User = {
      ...currentUser,
      fullName: selfFullName.trim(),
      salutation: selfSalutation.trim(),
      email: selfEmail.trim(),
      schoolName: selfSchool.trim(),
      phone: selfPhone.trim(),
    };

    StorageService.updateUser(updated);
    playSound('correct');
    setSelfSuccess('Thông tin hồ sơ cá nhân đã được cập nhật thành công!');
    setTimeout(() => setSelfSuccess(''), 3000);
    onRefreshData();
  };

  // Copy Google Apps Script code
  const googleAppsScriptCode = `/**
 * =========================================================================
 * EDUTEST SMART - GOOGLE APPS SCRIPT BACKEND API (GDPT 2018)
 * Tác giả: Thầy Hồ Nguyễn Đa Thiện
 * Cơ sở dữ liệu: Google Sheets (20 Bảng Quan Hệ)
 * =========================================================================
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// Danh mục 20 bảng cơ sở dữ liệu quan hệ
const TABLES = [
  'USERS', 'SUBJECTS', 'CLASSES', 'STUDENTS', 'ENROLLMENTS',
  'TEACHER_ASSIGNMENTS', 'QUESTION_BANK', 'EXAMS', 'EXAM_ITEMS',
  'ASSIGNMENTS', 'SUBMISSIONS', 'ANSWERS', 'RESULTS', 'VIOLATIONS',
  'MATRIX_LIBRARY', 'MATRIX_CELLS', 'SPECIFICATIONS', 'MATRIX_SOURCES',
  'MATRIX_VERSIONS', 'AUDIT_LOG'
];

function doGet(e) {
  const action = e.parameter.action || 'ping';
  const table = e.parameter.table || 'USERS';

  try {
    if (action === 'ping') {
      return jsonResponse({ status: 'ok', serverTime: new Date().toISOString(), system: 'EduTest Smart GAS API' });
    }

    if (action === 'readTable') {
      const data = readSheetData(table);
      return jsonResponse({ status: 'success', table: table, records: data });
    }

    return jsonResponse({ status: 'error', message: 'Action not supported' });
  } catch (err) {
    return jsonResponse({ status: 'error', error: err.toString() });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'saveRecord') {
      const result = appendOrUpdateRecord(body.table, body.record);
      return jsonResponse({ status: 'success', result: result });
    }

    if (action === 'batchSync') {
      return jsonResponse({ status: 'success', syncedAt: new Date().toISOString() });
    }

    return jsonResponse({ status: 'error', message: 'Invalid action' });
  } catch (err) {
    return jsonResponse({ status: 'error', error: err.toString() });
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function readSheetData(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  const headers = rows[0];
  return rows.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(googleAppsScriptCode);
    setCopiedCode(true);
    playSound('click');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportFullBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EduTest_Backup_GDPT2018_${new Date().toISOString().substring(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    playSound('correct');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-800">Tài khoản & Quản trị Hệ thống</h2>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Phân quyền RBAC
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý danh sách giáo viên, hồ sơ cá nhân, kết nối Google Sheets & Google Apps Script API.
          </p>
        </div>

        {/* Sub tabs Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => {
              setActiveSubTab('teachers');
              playSound('click');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'teachers' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Quản lý giáo viên {pendingTeachers.length > 0 && `(${pendingTeachers.length} chờ duyệt)`}
          </button>

          <button
            onClick={() => {
              setActiveSubTab('profile');
              playSound('click');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'profile' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hồ sơ cá nhân & Cách xưng hô
          </button>

          <button
            onClick={() => {
              setActiveSubTab('gas_integration');
              playSound('click');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'gas_integration' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Google Sheets & GAS API
          </button>

          <button
            onClick={() => {
              setActiveSubTab('backup');
              playSound('click');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'backup' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sao lưu dữ liệu
          </button>

          <button
            onClick={() => {
              setActiveSubTab('audit');
              playSound('click');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'audit' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nhật ký hệ thống
          </button>

          <button
            onClick={() => {
              setActiveSubTab('firebase');
              playSound('click');
            }}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'firebase' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Firebase Spark</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 1: QUẢN LÝ GIÁO VIÊN (Yêu cầu 2)
         ======================================================== */}
      {activeSubTab === 'teachers' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <School className="w-5 h-5 text-indigo-600" />
                QUẢN LÝ GIÁO VIÊN
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Danh sách đội ngũ giáo viên, phân quyền môn học và quản trị trạng thái tài khoản.
              </p>
            </div>

            {isAdmin ? (
              <button
                onClick={() => {
                  setAddFullName('');
                  setAddUsername('');
                  setAddEmail('');
                  setAddPhone('');
                  setAddError('');
                  setShowAddModal(true);
                  playSound('click');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" /> Thêm giáo viên mới
              </button>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                Chế độ xem giáo viên (Chỉ Quản trị viên có quyền thêm / chỉnh sửa / xóa)
              </div>
            )}
          </div>

          {/* Pending Approval Section */}
          {pendingTeachers.length > 0 && (
            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h4 className="text-sm font-bold text-amber-900">
                    Tài khoản Giáo viên chờ Quản trị viên duyệt ({pendingTeachers.length})
                  </h4>
                </div>
                <span className="text-[11px] font-semibold text-amber-700 bg-white px-2 py-0.5 rounded border border-amber-200">
                  Quy trình: Đăng ký → Chờ duyệt → Duyệt → Kích hoạt
                </span>
              </div>

              <div className="divide-y divide-amber-200/70 pt-1">
                {pendingTeachers.map((t) => (
                  <div key={t.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {t.salutation || 'Thầy/Cô'} {t.fullName}
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Tài khoản: <span className="font-mono font-semibold text-indigo-700">{t.username}</span> · {t.email} · {t.schoolName} · Môn: {t.teachingSubjects?.join(', ')}
                      </p>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleApproveTeacher(t.id)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-center"
                      >
                        <Check className="w-4 h-4" /> Phê duyệt & Kích hoạt
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Teachers List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Danh sách Giáo viên trong hệ thống ({users.length})
              </h4>
              <span className="text-xs text-slate-400">Tự động đồng bộ tên mới trên mọi phân hệ</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Cách xưng hô & Họ tên</th>
                    <th className="py-3 px-4">Tên đăng nhập</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Môn giảng dạy</th>
                    <th className="py-3 px-4">Đơn vị / Trường</th>
                    <th className="py-3 px-4 text-center">Vai trò</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser.id;
                    const canEdit = isAdmin || isSelf;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {u.fullName.split(' ').slice(-1)[0][0]}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">
                                {u.fullName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Cách gọi: <strong className="text-slate-600">{u.salutation || 'Thầy'}</strong>
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-indigo-700">{u.username}</td>
                        <td className="py-3 px-4 text-slate-500">{u.email}</td>
                        <td className="py-3 px-4 text-slate-700">
                          {u.teachingSubjects && u.teachingSubjects.length > 0 ? (
                            <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                              {u.teachingSubjects.join(', ')}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Tất cả môn</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{u.schoolName}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'teacher'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {u.role === 'admin' ? 'Quản trị viên' : u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : u.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {u.status === 'active' ? 'Hoạt động' : u.status === 'pending' ? 'Chờ duyệt' : 'Đã khóa'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* View Profile */}
                            <button
                              onClick={() => {
                                setViewingTeacher(u);
                                playSound('click');
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Xem hồ sơ chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Edit Teacher (Admin or Self) */}
                            {canEdit && (
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Chỉnh sửa thông tin"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}

                            {/* Lock/Unlock (Admin only) */}
                            {isAdmin && (
                              <button
                                onClick={() => handleToggleLock(u.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  u.status === 'locked'
                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                    : 'text-amber-600 hover:bg-amber-50'
                                }`}
                                title={u.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                              >
                                {u.status === 'locked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </button>
                            )}

                            {/* Delete Teacher (Admin only) */}
                            {isAdmin && u.id !== currentUser.id && (
                              <button
                                onClick={() => {
                                  setDeletingTeacher(u);
                                  playSound('click');
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                title="Xóa tài khoản"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: HỒ SƠ CÁ NHÂN & CÁCH XƯNG HÔ (Yêu cầu 1)
         ======================================================== */}
      {activeSubTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Hồ sơ cá nhân & Cách xưng hô</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tùy chỉnh họ tên và cách xưng hô hiển thị trên Header, Dashboard và các báo cáo học tập.
            </p>
          </div>

          {selfSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{selfSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveSelfProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cách xưng hô *</label>
                <select
                  value={selfSalutation}
                  onChange={(e) => setSelfSalutation(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  <option value="Thầy">Thầy</option>
                  <option value="Cô">Cô</option>
                  <option value="Thầy giáo">Thầy giáo</option>
                  <option value="Cô giáo">Cô giáo</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên hiển thị *</label>
                <input
                  type="text"
                  required
                  value={selfFullName}
                  onChange={(e) => setSelfFullName(e.target.value)}
                  placeholder="Ví dụ: Thầy Hồ Nguyễn Đa Thiện"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={selfEmail}
                  onChange={(e) => setSelfEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={selfPhone}
                  onChange={(e) => setSelfPhone(e.target.value)}
                  placeholder="0908xxxxxx"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trường học / Đơn vị</label>
              <input
                type="text"
                value={selfSchool}
                onChange={(e) => setSelfSchool(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Đổi mật khẩu mới (tùy chọn)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Để trống nếu không đổi mật khẩu"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Lưu thay đổi hồ sơ
              </button>
            </div>
          </form>

          {/* QUẢN LÝ PHƯƠNG THỨC ĐĂNG NHẬP ĐÃ LIÊN KẾT (GOOGLE SIGN-IN & EMAIL) */}
          <div className="pt-4 border-t border-slate-200">
            <LinkedAccountsCard
              currentUser={currentUser}
              onUserUpdated={(updatedUser) => {
                StorageService.setCurrentUser(updatedUser);
                onUserUpdated?.(updatedUser);
                onRefreshData();
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: GOOGLE SHEETS & GAS API
         ======================================================== */}
      {activeSubTab === 'gas_integration' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Cơ Sở Dữ Liệu Google Sheets & Google Apps Script API
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kết nối cơ sở dữ liệu đồng bộ đám mây an toàn, bảo mật thông tin giáo viên và học sinh.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              Môi trường thử nghiệm an toàn
            </span>
          </div>

          {/* 20 Relational Tables Schema List */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-800">
              Cấu trúc 20 Bảng Quan Hệ Chuẩn Bị Sẵn Cho Google Sheets:
            </span>
            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono text-indigo-700">
              {[
                '1.USERS', '2.SUBJECTS', '3.CLASSES', '4.STUDENTS', '5.ENROLLMENTS',
                '6.TEACHER_ASSIGNMENTS', '7.QUESTION_BANK', '8.EXAMS', '9.EXAM_ITEMS',
                '10.ASSIGNMENTS', '11.SUBMISSIONS', '12.ANSWERS', '13.RESULTS',
                '14.VIOLATIONS', '15.MATRIX_LIBRARY', '16.MATRIX_CELLS', '17.SPECIFICATIONS',
                '18.MATRIX_SOURCES', '19.MATRIX_VERSIONS', '20.AUDIT_LOG'
              ].map((tbl, i) => (
                <span key={i} className="bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                  {tbl}
                </span>
              ))}
            </div>
          </div>

          {/* Code Viewer with Copy Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-indigo-600" />
                Mã nguồn Backend Google Apps Script (Code.gs):
              </span>

              <button
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Đã sao chép!' : 'Sao chép mã nguồn Code.gs'}
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto max-h-56 leading-relaxed">
              {googleAppsScriptCode}
            </pre>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 4: SAO LƯU DỮ LIỆU
         ======================================================== */}
      {activeSubTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Sao Lưu & Khôi Phục Dữ Liệu</h3>
            <p className="text-xs text-slate-500">Xuất bản sao lưu toàn bộ ngân hàng câu hỏi, ma trận và dữ liệu học sinh</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Xuất tệp sao lưu hệ thống</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tải về tệp JSON chứa toàn bộ người dùng, lớp học, học sinh, ma trận và đề kiểm tra đã biên soạn.
              </p>
              <button
                onClick={handleExportBackup}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> Tải về tệp sao lưu JSON
              </button>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Phục hồi dữ liệu từ bản sao lưu</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Khôi phục trạng thái hệ thống khi chuyển giao cho trường học hoặc thiết bị giáo viên mới.
              </p>
              <button
                onClick={() => {
                  alert('Chức năng nhập sao lưu JSON sẵn sàng. Bạn có thể chọn tệp JSON đã tải về trước đó.');
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" /> Chọn tệp JSON khôi phục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 5: NHẬT KÝ HỆ THỐNG
         ======================================================== */}
      {activeSubTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Nhật Ký Hoạt Động Hệ Thống (Audit Logs)
            </h4>
            <span className="text-xs text-slate-400">Ghi vết bảo mật mọi thao tác đọc/ghi</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-4">Thời gian</th>
                  <th className="py-2.5 px-4">Người thực hiện</th>
                  <th className="py-2.5 px-4">Hành động</th>
                  <th className="py-2.5 px-4">Chi tiết thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-500 font-mono">{log.timestamp}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{log.userName}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 6: FIREBASE SPARK (KẾT NỐI KỸ THUẬT)
         ======================================================== */}
      {activeSubTab === 'firebase' && (() => {
        const fbStatus = getFirebaseStatus();
        return (
          <div className="space-y-6 animate-in fade-in">
            {/* Overview Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center ring-1 ring-amber-500/20">
                    <Flame className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">Tích Hợp Kỹ Thuật Firebase Spark</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {fbStatus.plan}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Kết nối module Firebase Modular SDK, Firebase Authentication & Cloud Firestore (default)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    fbStatus.isConfigured
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${fbStatus.isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {fbStatus.isConfigured ? 'SDK Đã Kết Nối Sẵn Sàng' : 'Chờ Nhập Config từ Firebase Console'}
                  </span>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PROJECT ID</span>
                  <span className="text-xs font-mono font-bold text-indigo-700 mt-1 block">{fbStatus.projectId}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Cố định từ Firebase Project</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">AUTH DOMAIN</span>
                  <span className="text-xs font-mono font-bold text-slate-800 mt-1 block truncate" title={fbStatus.authDomain}>
                    {fbStatus.authDomain}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">Email / Password Auth</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CLOUD FIRESTORE</span>
                  <span className="text-xs font-mono font-bold text-slate-800 mt-1 block">{fbStatus.databaseId}</span>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">Cơ sở dữ liệu mặc định</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">QUY CHẾ BẢO MẬT</span>
                  <span className="text-xs font-bold text-rose-700 mt-1 block">Chặn đọc/ghi client</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">read, write: if false</span>
                </div>
              </div>

              {/* Non-destructive notice */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200/70 rounded-xl text-xs text-indigo-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Tuân thủ nguyên tắc kết nối an toàn (Zero Breaking Changes):</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-indigo-900/80 pl-1">
                  <li>Chỉ triển khai giai đoạn kết nối kỹ thuật Firebase SDK; chưa chuyển đổi dữ liệu và chưa thay thế hệ thống tài khoản hiện hành.</li>
                  <li>Không đưa Service Account hoặc mã khóa bí mật quản trị vào mã nguồn frontend.</li>
                  <li>Không tự động xóa hoặc ghi đè dữ liệu Google Sheets / Apps Script đang hoạt động.</li>
                  <li>Giữ nguyên giao diện, slideshow, header, footer và toàn bộ chức năng thi, chấm điểm, ma trận.</li>
                </ul>
              </div>
            </div>

            {/* Environment Variables & Configuration Checklist */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Danh Mục Biến Môi Trường (Vite / Vercel Environment Variables)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Các biến phải có tiền tố <code className="font-mono text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">VITE_</code> để Vite và Vercel nạp vào ứng dụng khách.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-400">.env / Vercel Project Settings</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {[
                  {
                    key: 'VITE_FIREBASE_PROJECT_ID',
                    val: fbStatus.projectId,
                    status: 'Có sẵn (Mặc định)',
                    desc: 'Mã định danh dự án Firebase (edutest-smart)',
                    required: true,
                  },
                  {
                    key: 'VITE_FIREBASE_AUTH_DOMAIN',
                    val: fbStatus.authDomain,
                    status: 'Có sẵn (Mặc định)',
                    desc: 'Tên miền xác thực Firebase Authentication (edutest-smart.firebaseapp.com)',
                    required: true,
                  },
                  {
                    key: 'VITE_FIREBASE_API_KEY',
                    val: fbStatus.providedKeys.includes('VITE_FIREBASE_API_KEY') ? '••••••••••••••••••••' : '(Chưa cấu hình)',
                    status: fbStatus.providedKeys.includes('VITE_FIREBASE_API_KEY') ? 'Đã nạp' : 'Cần lấy từ Firebase Console',
                    desc: 'Khóa API Web của ứng dụng Firebase (Lấy từ Firebase Console > Project Settings > General)',
                    required: true,
                  },
                  {
                    key: 'VITE_FIREBASE_APP_ID',
                    val: fbStatus.providedKeys.includes('VITE_FIREBASE_APP_ID') ? '••••••••••••••••••••' : '(Chưa cấu hình)',
                    status: fbStatus.providedKeys.includes('VITE_FIREBASE_APP_ID') ? 'Đã nạp' : 'Cần lấy từ Firebase Console',
                    desc: 'Mã định danh ứng dụng web Firebase (dạng 1:xxx:web:xxx)',
                    required: true,
                  },
                  {
                    key: 'VITE_FIREBASE_STORAGE_BUCKET',
                    val: 'edutest-smart.appspot.com',
                    status: 'Có sẵn (Mặc định)',
                    desc: 'Tên miền lưu trữ Cloud Storage (mặc định edutest-smart.appspot.com)',
                    required: false,
                  },
                  {
                    key: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
                    val: fbStatus.providedKeys.includes('VITE_FIREBASE_MESSAGING_SENDER_ID') ? '••••••••' : '(Tùy chọn)',
                    status: fbStatus.providedKeys.includes('VITE_FIREBASE_MESSAGING_SENDER_ID') ? 'Đã nạp' : 'Lấy từ Firebase Console',
                    desc: 'Số dự án Firebase (Project Number)',
                    required: false,
                  },
                ].map((item) => (
                  <div key={item.key} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                          {item.key}
                        </code>
                        {item.required ? (
                          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Bắt buộc</span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Khuyên dùng</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-slate-600 text-xs">{item.val}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        item.status.includes('Đã nạp') || item.status.includes('Có sẵn')
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps Guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>1. Thao tác trên Firebase Console</span>
                </div>
                <ol className="list-decimal list-inside text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li>Truy cập <strong className="text-slate-800">console.firebase.google.com</strong> và chọn dự án <code className="font-mono text-indigo-700">edutest-smart</code>.</li>
                  <li>Vào <strong className="text-slate-800">Project settings</strong> (biểu tượng bánh răng) $\rightarrow$ thẻ <strong className="text-slate-800">General</strong>.</li>
                  <li>Tại mục <strong className="text-slate-800">Your apps</strong>, nếu chưa có ứng dụng Web, bấm <strong className="text-slate-800">Add app</strong> $\rightarrow$ chọn biểu tượng Web <code className="font-mono text-xs">&lt;/&gt;</code> để đăng ký.</li>
                  <li>Sao chép các giá trị <code className="font-mono text-slate-800">apiKey</code>, <code className="font-mono text-slate-800">appId</code>, <code className="font-mono text-slate-800">messagingSenderId</code>.</li>
                </ol>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <Server className="w-4 h-4 text-indigo-600" />
                  <span>2. Thao tác trên Vercel Dashboard</span>
                </div>
                <ol className="list-decimal list-inside text-xs text-slate-600 space-y-2 leading-relaxed">
                  <li>Truy cập <strong className="text-slate-800">vercel.com</strong> và chọn dự án <code className="font-mono text-indigo-700">edutest-smart</code>.</li>
                  <li>Vào mục <strong className="text-slate-800">Settings</strong> $\rightarrow$ chọn thẻ <strong className="text-slate-800">Environment Variables</strong>.</li>
                  <li>Thêm các biến:
                    <ul className="list-disc list-inside pl-3 pt-1 text-[11px] font-mono text-slate-700 space-y-0.5">
                      <li>VITE_FIREBASE_PROJECT_ID = edutest-smart</li>
                      <li>VITE_FIREBASE_AUTH_DOMAIN = edutest-smart.firebaseapp.com</li>
                      <li>VITE_FIREBASE_API_KEY = (giá trị từ Console)</li>
                      <li>VITE_FIREBASE_APP_ID = (giá trị từ Console)</li>
                      <li>VITE_FIREBASE_STORAGE_BUCKET = edutest-smart.appspot.com</li>
                    </ul>
                  </li>
                  <li>Redeploy để áp dụng cấu hình biến môi trường trên Vercel.</li>
                </ol>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================
          MODAL 1: THÊM GIÁO VIÊN MỚI (Yêu cầu 2)
         ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Thêm Giáo Viên Mới</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddTeacher} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cách xưng hô *</label>
                  <select
                    value={addSalutation}
                    onChange={(e) => setAddSalutation(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Thầy">Thầy</option>
                    <option value="Cô">Cô</option>
                    <option value="Thầy giáo">Thầy giáo</option>
                    <option value="Cô giáo">Cô giáo</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên giáo viên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Trần Văn Bình"
                    value={addFullName}
                    onChange={(e) => setAddFullName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tên đăng nhập (username) *</label>
                  <input
                    type="text"
                    required
                    placeholder="binh.tran"
                    value={addUsername}
                    onChange={(e) => setAddUsername(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email liên hệ *</label>
                  <input
                    type="email"
                    required
                    placeholder="binh.tran@edutest.edu.vn"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trường học / Đơn vị *</label>
                  <input
                    type="text"
                    required
                    value={addSchool}
                    onChange={(e) => setAddSchool(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="0912xxxxxx"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vai trò hệ thống</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as Role)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="teacher">Giáo viên</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái tài khoản</label>
                  <select
                    value={addStatus}
                    onChange={(e) => setAddStatus(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="active">Hoạt động ngay</option>
                    <option value="pending">Chờ phê duyệt</option>
                    <option value="locked">Tạm khóa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Môn giảng dạy (Toán THPT GDPT 2018)</label>
                <div className="flex gap-3 text-xs">
                  {['TOAN_10', 'TOAN_11', 'TOAN_12'].map((subj) => (
                    <label key={subj} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addSubjects.includes(subj)}
                        onChange={(e) => {
                          if (e.target.checked) setAddSubjects([...addSubjects, subj]);
                          else setAddSubjects(addSubjects.filter((s) => s !== subj));
                        }}
                        className="rounded text-indigo-600"
                      />
                      <span>{subj === 'TOAN_10' ? 'Toán 10' : subj === 'TOAN_11' ? 'Toán 11' : 'Toán 12'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                >
                  Thêm giáo viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: CHỈNH SỬA THÔNG TIN GIÁO VIÊN (Yêu cầu 2)
         ======================================================== */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Chỉnh Sửa Hồ Sơ: {editingTeacher.fullName}
                </h3>
              </div>
              <button onClick={() => setEditingTeacher(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditTeacher} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cách xưng hô *</label>
                  <select
                    value={editSalutation}
                    onChange={(e) => setEditSalutation(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Thầy">Thầy</option>
                    <option value="Cô">Cô</option>
                    <option value="Thầy giáo">Thầy giáo</option>
                    <option value="Cô giáo">Cô giáo</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Trường học / Đơn vị công tác</label>
                <input
                  type="text"
                  value={editSchool}
                  onChange={(e) => setEditSchool(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {isAdmin && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Vai trò</label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as Role)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="teacher">Giáo viên</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Trạng thái</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="active">Hoạt động</option>
                      <option value="pending">Chờ phê duyệt</option>
                      <option value="locked">Tạm khóa</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Môn giảng dạy phân công</label>
                <div className="flex gap-3 text-xs">
                  {['TOAN_10', 'TOAN_11', 'TOAN_12'].map((subj) => (
                    <label key={subj} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editSubjects.includes(subj)}
                        onChange={(e) => {
                          if (e.target.checked) setEditSubjects([...editSubjects, subj]);
                          else setEditSubjects(editSubjects.filter((s) => s !== subj));
                        }}
                        className="rounded text-indigo-600"
                      />
                      <span>{subj === 'TOAN_10' ? 'Toán 10' : subj === 'TOAN_11' ? 'Toán 11' : 'Toán 12'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl text-[11px] text-slate-600">
                * Tên mới sẽ được cập nhật đồng bộ ngay lập tức trên các lớp học, đề thi và bảng điều khiển.
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                >
                  Lưu cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: XEM HỒ SƠ CHI TIẾT
         ======================================================== */}
      {viewingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Hồ Sơ Giáo Viên</h3>
              </div>
              <button onClick={() => setViewingTeacher(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center text-lg font-bold">
                  {viewingTeacher.fullName.split(' ').slice(-1)[0][0]}
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">{viewingTeacher.fullName}</h4>
                  <p className="text-slate-500 font-mono text-[11px]">{viewingTeacher.username} · {viewingTeacher.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-semibold">CÁCH XƯNG HÔ</span>
                  <span className="font-bold text-slate-800">{viewingTeacher.salutation || 'Thầy'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-semibold">VAI TRÒ</span>
                  <span className="font-bold text-indigo-700">
                    {viewingTeacher.role === 'admin' ? 'Quản trị viên' : 'Giáo viên'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-semibold">ĐƠN VỊ CÔNG TÁC</span>
                  <span className="font-bold text-slate-800">{viewingTeacher.schoolName}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg">
                  <span className="text-[10px] text-slate-400 block font-semibold">TRẠNG THÁI</span>
                  <span className="font-bold text-emerald-700">
                    {viewingTeacher.status === 'active' ? 'Đang hoạt động' : 'Tạm khóa'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-lg text-slate-600">
                <span className="text-[10px] text-slate-400 block font-semibold">MÔN PHÂN CÔNG GIẢNG DẠY</span>
                <span className="font-semibold text-slate-800">
                  {viewingTeacher.teachingSubjects?.join(', ') || 'Toàn bộ chuyên đề Toán'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingTeacher(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: XÁC NHẬN XÓA TÀI KHOẢN (Yêu cầu 2)
         ======================================================== */}
      {deletingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-2 text-rose-600 pb-2 border-b border-slate-100">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Xác Nhận Xóa Giáo Viên</h3>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Bạn có chắc chắn muốn xóa tài khoản của{' '}
                <strong className="text-slate-900">{deletingTeacher.fullName}</strong> (
                <span className="font-mono text-indigo-700">{deletingTeacher.username}</span>)?
              </p>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
                <span className="font-bold">Chính sách bảo toàn dữ liệu:</span>
                <p>
                  Toàn bộ lớp học, học sinh, đề kiểm tra và điểm số đã chấm của giáo viên này sẽ được{' '}
                  <strong>bảo lưu nguyên vẹn</strong> trong hệ thống.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingTeacher(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
              >
                Xác nhận xóa tài khoản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
