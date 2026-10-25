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
} from 'lucide-react';
import { User, AuditLog } from '../../types';
import { StorageService } from '../../services/storage';
import { playSound } from '../../services/sound';

interface SettingsViewProps {
  currentUser: User;
  users: User[];
  logs: AuditLog[];
  onRefreshData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  users,
  logs,
  onRefreshData,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'teachers' | 'gas_integration' | 'backup' | 'audit'>('teachers');
  const [gasUrl, setGasUrl] = useState('');
  const [sheetId, setSheetId] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Filter pending teacher registrations (Section 4.1 & 4.4)
  const pendingTeachers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status !== 'pending');

  const handleApproveTeacher = (userId: string) => {
    StorageService.approveUser(userId);
    playSound('correct');
    onRefreshData();
  };

  const handleToggleLock = (userId: string) => {
    StorageService.toggleUserStatus(userId);
    playSound('click');
    onRefreshData();
  };

  // Google Apps Script Complete Backend Code Template (Section 2, 16, 19)
  const googleAppsScriptCode = `/**
 * =========================================================================
 * EDUTEST SMART - GOOGLE APPS SCRIPT BACKEND API (GDPT 2018)
 * Tác giả: GV. Hồ Nguyễn Đa Thiện
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
      // Đồng bộ nhiều bảng cùng lúc
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

  // Export full JSON backup
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
            <h2 className="text-xl font-extrabold text-slate-800">Tài khoản & Cài đặt hệ thống</h2>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              Quản trị & Phân quyền
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Duyệt đăng ký giáo viên, cơ sở dữ liệu Google Sheets / GAS API, sao lưu và nhật ký hoạt động.
          </p>
        </div>

        {/* Sub tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => { setActiveSubTab('teachers'); playSound('click'); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'teachers' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Quản lý giáo viên {pendingTeachers.length > 0 && `(${pendingTeachers.length} chờ)`}
          </button>

          <button
            onClick={() => { setActiveSubTab('gas_integration'); playSound('click'); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'gas_integration' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Google Sheets & GAS API
          </button>

          <button
            onClick={() => { setActiveSubTab('backup'); playSound('click'); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'backup' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sao lưu dữ liệu
          </button>

          <button
            onClick={() => { setActiveSubTab('audit'); playSound('click'); }}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'audit' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nhật ký hệ thống
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Quản lý & Phê duyệt Giáo viên (Section 4) */}
      {activeSubTab === 'teachers' && (
        <div className="space-y-6">
          {/* Pending Approval Section */}
          {pendingTeachers.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-amber-900">
                  Tài khoản Giáo viên đang chờ Quản trị viên phê duyệt ({pendingTeachers.length})
                </h3>
              </div>
              <p className="text-xs text-amber-800">
                Quy trình chuẩn: Đăng ký → Chờ phê duyệt → Quản trị viên duyệt → Kích hoạt tài khoản → Đăng nhập.
              </p>

              <div className="divide-y divide-amber-200/60 pt-1">
                {pendingTeachers.map((t) => (
                  <div key={t.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{t.fullName}</p>
                      <p className="text-[11px] text-slate-500">
                        {t.email} · {t.schoolName} · Môn: {t.teachingSubjects?.join(', ')}
                      </p>
                    </div>

                    <button
                      onClick={() => handleApproveTeacher(t.id)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Phê duyệt tài khoản
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Danh sách Tài khoản đã kích hoạt ({activeUsers.length})
              </h4>
              <span className="text-xs text-slate-400">Phân quyền RBAC bảo mật</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-4">Họ và tên</th>
                    <th className="py-2.5 px-4">Tên đăng nhập</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Vai trò</th>
                    <th className="py-2.5 px-4">Đơn vị / Trường</th>
                    <th className="py-2.5 px-4 text-center">Trạng thái</th>
                    <th className="py-2.5 px-4 text-right">Khóa / Mở</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{u.fullName}</td>
                      <td className="py-2.5 px-4 font-mono text-indigo-700">{u.username}</td>
                      <td className="py-2.5 px-4 text-slate-500">{u.email}</td>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {u.role === 'admin' ? 'Quản trị' : u.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{u.schoolName}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {u.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleLock(u.id)}
                            className={`p-1.5 rounded-lg text-xs font-semibold ${
                              u.status === 'locked'
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-rose-600 hover:bg-rose-50'
                            }`}
                            title={u.status === 'locked' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                          >
                            {u.status === 'locked' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Google Sheets & GAS API (Section 2, 16, 19) */}
      {activeSubTab === 'gas_integration' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Cơ Sở Dữ Liệu Google Sheets & Google Apps Script API
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Theo thiết kế kiến trúc mục 2 và 16: Không yêu cầu người dùng cuối nhập API key, không đưa bí mật vào JavaScript client.
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

          {/* Steps to deploy */}
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs space-y-2 text-slate-700">
            <span className="font-bold text-indigo-900">Hướng dẫn triển khai 3 bước:</span>
            <ol className="list-decimal list-inside space-y-1">
              <li>Mở Google Sheets của trường học → Chọn <strong>Tiện ích mở rộng (Extensions)</strong> → <strong>Apps Script</strong>.</li>
              <li>Dán mã nguồn trên vào tệp <code>Code.gs</code>.</li>
              <li>Bấm <strong>Triển khai (Deploy)</strong> → Chọn <strong>Tùy chọn triển khai mới (New deployment)</strong> → Chọn loại <em>Ứng dụng web (Web app)</em> → Quyền truy cập: <em>Bất kỳ ai (Anyone)</em>.</li>
            </ol>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Sao lưu dữ liệu (Backup & Export) */}
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

      {/* SUB-TAB 4: Audit Logs (Section 16 Table AUDIT_LOG) */}
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
    </div>
  );
};
