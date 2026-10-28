import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, MainTab } from './components/Sidebar';
import { Footer } from './components/Footer';

// Public Home Page & Auth
import { HomePage } from './components/home/HomePage';
import { LoginPage } from './components/auth/LoginPage';
import { StudentPortalView } from './components/student/StudentPortalView';
import { TeacherManagementView } from './components/teachers/TeacherManagementView';

// Teacher Views
import { DashboardView } from './components/dashboard/DashboardView';
import { ClassesView } from './components/classes/ClassesView';
import { QuestionBankView } from './components/questions/QuestionBankView';
import { MatrixLibraryView } from './components/matrix/MatrixLibraryView';
import { ExamRoomView } from './components/exam-room/ExamRoomView';
import { GradingView } from './components/grading/GradingView';
import { GamesHubView } from './components/games/GamesHubView';
import { SettingsView } from './components/settings/SettingsView';
import { MathLabView } from './components/math-lab/MathLabView';

// Data services & types
import { StorageService } from './services/storage';
import {
  User,
  ClassRoom,
  Student,
  Question,
  MatrixDocument,
  Exam,
  ExamAssignment,
  ExamSubmission,
  AuditLog,
  Subject,
  isStudent,
  isTeacher,
  isAdminTeacher,
} from './types';
import { playSound } from './services/sound';
import { signOutFirebase } from './services/googleAuth';

export default function App() {
  // Safe initial route detection: default to '/' (Public Home Page)
  const getInitialRoute = (): string => {
    if (typeof window === 'undefined') return '/';
    const path = window.location.pathname;
    if (path === '/login') return '/login';
    if (path === '/student' || path === '/teacher' || path === '/workspace') return path;
    if (path === '/exam-room') return '/exam-room';
    if (path === '/math-lab') return '/math-lab';
    return '/';
  };

  const [currentRoute, setCurrentRoute] = useState<string>(getInitialRoute);

  // Authentication & Session State
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('edutest_token') || localStorage.getItem('edutest_token') || null;
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const hasToken = !!(sessionStorage.getItem('edutest_token') || localStorage.getItem('edutest_token'));
    const user = StorageService.getCurrentUser();
    return hasToken ? user : null;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return !!(sessionStorage.getItem('edutest_token') || localStorage.getItem('edutest_token'));
  });

  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Student active taking exam
  const [activeStudentExamAssignment, setActiveStudentExamAssignment] = useState<ExamAssignment | null>(null);

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

  // Safe navigation function with browser history sync
  const navigate = useCallback((path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setCurrentRoute(path);
  }, []);

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname || '/';
      setCurrentRoute(path);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Reload all data from Storage
  const refreshAllData = useCallback(() => {
    const updatedUsers = StorageService.getUsers();
    setUsers(updatedUsers);
    const curr = StorageService.getCurrentUser();
    if (curr && isLoggedIn) setCurrentUser(curr);
    setClasses(StorageService.getClasses());
    setStudents(StorageService.getStudents());
    setQuestions(StorageService.getQuestions());
    setMatrices(StorageService.getMatrices());
    setExams(StorageService.getExams());
    setAssignments(StorageService.getAssignments());
    setSubmissions(StorageService.getSubmissions());
    setLogs(StorageService.getLogs());
    setSubjects(StorageService.getSubjects());
  }, [isLoggedIn]);

  // Validate server session on mount if token exists without forcing redirect
  useEffect(() => {
    const storedToken = sessionStorage.getItem('edutest_token') || localStorage.getItem('edutest_token');
    if (storedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setCurrentUser(data.user);
            StorageService.setCurrentUser(data.user);
            setIsLoggedIn(true);
          } else {
            // Expired or invalid session
            sessionStorage.removeItem('edutest_token');
            localStorage.removeItem('edutest_token');
            setToken(null);
            setCurrentUser(null);
            setIsLoggedIn(false);
          }
        })
        .catch(() => {
          // If offline or network error, fallback to local storage
          const localUser = StorageService.getCurrentUser();
          if (localUser) {
            setCurrentUser(localUser);
            setIsLoggedIn(true);
          }
        });
    }
  }, []);

  // Guard against non-admin teachers entering 'teachers' tab
  useEffect(() => {
    if (currentUser && activeTab === 'teachers' && !isAdminTeacher(currentUser)) {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab]);

  // Handle Login Success
  const handleLoginSuccess = (user: User, userToken: string) => {
    sessionStorage.setItem('edutest_token', userToken);
    localStorage.setItem('edutest_token', userToken);
    setToken(userToken);
    setCurrentUser(user);
    StorageService.setCurrentUser(user);
    setIsLoggedIn(true);
    refreshAllData();

    // Route strictly based on verified user role
    if (isStudent(user)) {
      setActiveStudentExamAssignment(null);
      navigate('/student');
    } else {
      setActiveTab('dashboard');
      navigate('/teacher');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOutFirebase();
    } catch (e) {
      console.warn('Firebase signout warning:', e);
    }

    const currentToken = token || sessionStorage.getItem('edutest_token') || localStorage.getItem('edutest_token');
    if (currentToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    sessionStorage.removeItem('edutest_token');
    localStorage.removeItem('edutest_token');
    setToken(null);
    setCurrentUser(null);
    setIsLoggedIn(false);
    setActiveStudentExamAssignment(null);
    playSound('click');
    navigate('/');
  };

  // -------------------------------------------------------------------------
  // ROUTE 1: LOGIN PAGE ('/login')
  // -------------------------------------------------------------------------
  if (currentRoute === '/login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onBackToHome={() => navigate('/')}
      />
    );
  }

  // -------------------------------------------------------------------------
  // ROUTE 2: STUDENT PORTAL ('/student')
  // -------------------------------------------------------------------------
  if (currentRoute === '/student') {
    // Auth Guard: Require valid student session
    if (!isLoggedIn || !currentUser) {
      return (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={() => navigate('/')}
        />
      );
    }

    if (!isStudent(currentUser)) {
      // If a teacher tries to access /student, redirect to /teacher
      navigate('/teacher');
      return null;
    }

    // If currently taking an active exam
    if (activeStudentExamAssignment) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
          <main className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full">
            <ExamRoomView
              currentUser={currentUser}
              exams={exams}
              assignments={assignments}
              submissions={submissions}
              initialAssignmentToTake={activeStudentExamAssignment}
              onExitExamRoom={() => {
                setActiveStudentExamAssignment(null);
                refreshAllData();
              }}
              onRefreshData={refreshAllData}
            />
          </main>
          <Footer />
        </div>
      );
    }

    // Default Student Portal
    return (
      <StudentPortalView
        currentUser={currentUser}
        assignments={assignments}
        exams={exams}
        submissions={submissions}
        onStartExam={(assignment) => {
          setActiveStudentExamAssignment(assignment);
        }}
        onViewResult={() => {}}
        onLogout={handleLogout}
        onGoHome={() => navigate('/')}
        onOpenMathLab={() => navigate('/math-lab')}
      />
    );
  }

  // -------------------------------------------------------------------------
  // ROUTE: MATH LABORATORY ('/math-lab')
  // -------------------------------------------------------------------------
  if (currentRoute === '/math-lab') {
    if (!isLoggedIn || !currentUser) {
      return (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={() => navigate('/')}
        />
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
        <Header
          currentUser={currentUser}
          availableUsers={users}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          onLogout={handleLogout}
          onGoHome={() => navigate('/')}
          isHomePage={false}
        />
        <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
          <div className="mb-4">
            <button
              onClick={() => {
                if (isStudent(currentUser)) navigate('/student');
                else navigate('/teacher');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
            >
              ← Quay lại không gian {isStudent(currentUser) ? 'học sinh' : 'giáo viên'}
            </button>
          </div>
          <MathLabView
            currentUser={currentUser}
            classes={classes}
            onBackToPortal={() => {
              if (isStudent(currentUser)) navigate('/student');
              else navigate('/teacher');
            }}
          />
        </main>
        <Footer />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // ROUTE 3: TEACHER WORKSPACE ('/teacher' or '/workspace')
  // -------------------------------------------------------------------------
  if (currentRoute === '/teacher' || currentRoute === '/workspace') {
    // Auth Guard: Require valid teacher session
    if (!isLoggedIn || !currentUser) {
      return (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={() => navigate('/')}
        />
      );
    }

    if (isStudent(currentUser)) {
      // If a student tries to access teacher space, redirect to /student
      navigate('/student');
      return null;
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
        {/* Top Header */}
        <Header
          currentUser={currentUser}
          availableUsers={users}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
          onLogout={handleLogout}
          onGoHome={() => navigate('/')}
          isHomePage={false}
        />

        {/* Main Body with Sidebar */}
        <div className="flex-1 flex w-full">
          <Sidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            userRole={currentUser.role}
            currentUser={currentUser}
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

              {/* Teacher Management: Only visible to ADMIN teachers */}
              {activeTab === 'teachers' && isAdminTeacher(currentUser) && (
                <TeacherManagementView
                  currentUser={currentUser}
                  classes={classes}
                  onRefreshData={refreshAllData}
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

              {activeTab === 'math_lab' && (
                <MathLabView
                  currentUser={currentUser}
                  classes={classes}
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

        {/* Footer */}
        <Footer />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // ROUTE 4 (DEFAULT): PUBLIC HOME PAGE ('/')
  // -------------------------------------------------------------------------
  return (
    <HomePage
      currentUser={isLoggedIn ? currentUser : null}
      classes={classes}
      students={students}
      questions={questions}
      exams={exams}
      assignments={assignments}
      submissions={submissions}
      onLoginClick={() => navigate('/login')}
      onEnterWorkspace={() => {
        if (currentUser && isStudent(currentUser)) {
          navigate('/student');
        } else {
          navigate('/teacher');
        }
      }}
      onLogout={handleLogout}
      onNavigateTab={(tab: MainTab) => {
        if (!isLoggedIn || !currentUser) {
          navigate('/login');
          return;
        }
        if (tab === 'math_lab') {
          navigate('/math-lab');
          return;
        }
        if (isStudent(currentUser)) {
          navigate('/student');
        } else {
          setActiveTab(tab);
          navigate('/teacher');
        }
      }}
      onOpenMathLab={() => {
        if (!isLoggedIn || !currentUser) {
          navigate('/login');
          return;
        }
        navigate('/math-lab');
      }}
    />
  );
}
