import React, { useState, useEffect, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar, MainTab } from './components/Sidebar';
import { Footer } from './components/Footer';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { ClassesView } from './components/classes/ClassesView';
import { QuestionBankView } from './components/questions/QuestionBankView';
import { MatrixLibraryView } from './components/matrix/MatrixLibraryView';
import { ExamRoomView } from './components/exam-room/ExamRoomView';
import { GradingView } from './components/grading/GradingView';
import { GamesHubView } from './components/games/GamesHubView';
import { SettingsView } from './components/settings/SettingsView';

// Data services & types
import { StorageService } from './services/storage';
import { User, ClassRoom, Student, Question, MatrixDocument, Exam, ExamAssignment, ExamSubmission, AuditLog, Subject } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>(StorageService.getCurrentUser());
  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Data States
  const [classes, setClasses] = useState<ClassRoom[]>(StorageService.getClasses());
  const [students, setStudents] = useState<Student[]>(StorageService.getStudents());
  const [questions, setQuestions] = useState<Question[]>(StorageService.getQuestions());
  const [matrices, setMatrices] = useState<MatrixDocument[]>(StorageService.getMatrices());
  const [exams, setExams] = useState<Exam[]>(StorageService.getExams());
  const [assignments, setAssignments] = useState<ExamAssignment[]>(StorageService.getAssignments());
  const [submissions, setSubmissions] = useState<ExamSubmission[]>(StorageService.getSubmissions());
  const [logs, setLogs] = useState<AuditLog[]>(StorageService.getLogs());
  const [subjects, setSubjects] = useState<Subject[]>(StorageService.getSubjects());

  // Reload all data from Storage
  const refreshAllData = useCallback(() => {
    const updatedUsers = StorageService.getUsers();
    setUsers(updatedUsers);
    setCurrentUser(StorageService.getCurrentUser());
    setClasses(StorageService.getClasses());
    setStudents(StorageService.getStudents());
    setQuestions(StorageService.getQuestions());
    setMatrices(StorageService.getMatrices());
    setExams(StorageService.getExams());
    setAssignments(StorageService.getAssignments());
    setSubmissions(StorageService.getSubmissions());
    setLogs(StorageService.getLogs());
    setSubjects(StorageService.getSubjects());
  }, []);

  // Handle User change
  const handleSelectUser = (user: User) => {
    StorageService.setCurrentUser(user);
    setCurrentUser(user);
    // If student switch, switch to exam room or dashboard
    if (user.role === 'student' && ['classes', 'questions', 'matrix'].includes(activeTab)) {
      setActiveTab('exam_room');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header with integrated Mobile Drawer toggle */}
      <Header
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        availableUsers={users}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex w-full">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          userRole={currentUser.role}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full flex flex-col justify-between">
          <div className="w-full">
            {activeTab === 'dashboard' && (
              <DashboardView
                currentUser={currentUser}
                onNavigate={setActiveTab}
                classes={classes}
                students={students}
                questions={questions}
                exams={exams}
                assignments={assignments}
                submissions={submissions}
              />
            )}

            {activeTab === 'classes' && (
              <ClassesView
                currentUser={currentUser}
                classes={classes}
                students={students}
                onRefreshData={refreshAllData}
              />
            )}

            {activeTab === 'questions' && (
              <QuestionBankView
                currentUser={currentUser}
                questions={questions}
                subjects={subjects}
                onRefreshData={refreshAllData}
              />
            )}

            {activeTab === 'matrix' && (
              <MatrixLibraryView
                currentUser={currentUser}
                matrices={matrices}
                questions={questions}
                classes={classes}
                exams={exams}
                onRefreshData={refreshAllData}
                onNavigateExamRoom={() => setActiveTab('exam_room')}
              />
            )}

            {activeTab === 'exam_room' && (
              <ExamRoomView
                currentUser={currentUser}
                exams={exams}
                assignments={assignments}
                submissions={submissions}
                onRefreshData={refreshAllData}
              />
            )}

            {activeTab === 'grading' && (
              <GradingView
                currentUser={currentUser}
                submissions={submissions}
                exams={exams}
                questions={questions}
                classes={classes}
                onRefreshData={refreshAllData}
              />
            )}

            {activeTab === 'games' && (
              <GamesHubView
                classes={classes}
                students={students}
                questions={questions}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                currentUser={currentUser}
                users={users}
                logs={logs}
                onRefreshData={refreshAllData}
              />
            )}
          </div>
        </main>
      </div>

      {/* Footer at bottom of application (Not inside sidebar) */}
      <Footer />
    </div>
  );
}
