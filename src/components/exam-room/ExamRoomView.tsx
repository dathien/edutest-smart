import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Send,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Shield,
  Eye,
  Activity,
  UserCheck,
  Maximize2,
  CheckCircle,
  HelpCircle,
  Volume2,
  X,
} from 'lucide-react';
import { Exam, ExamAssignment, ExamSubmission, Question, User, SubmissionAnswer, ViolationEvent } from '../../types';
import { StorageService } from '../../services/storage';
import { MathRenderer } from '../MathRenderer';
import { GeometryDiagram } from '../GeometryDiagram';
import { playSound } from '../../services/sound';

interface ExamRoomViewProps {
  currentUser: User;
  exams: Exam[];
  assignments: ExamAssignment[];
  submissions: ExamSubmission[];
  onRefreshData: () => void;
}

export const ExamRoomView: React.FC<ExamRoomViewProps> = ({
  currentUser,
  exams,
  assignments,
  submissions,
  onRefreshData,
}) => {
  // If user is teacher/admin, show Proctoring Monitor + Student Test Simulator
  // If user is student, directly show Active Exams or Ongoing Exam
  const isStudent = currentUser.role === 'student';

  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<ExamAssignment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Student test-taking answers
  const [answers, setAnswers] = useState<{ [qId: string]: SubmissionAnswer }>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(45 * 60);
  const [autosaveTime, setAutosaveTime] = useState<string>('');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<ExamSubmission | null>(null);

  // Anti-cheat warning popup
  const [violationWarning, setViolationWarning] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState(0);

  // Teacher monitor selected assignment
  const [selectedMonitorAssignment, setSelectedMonitorAssignment] = useState<ExamAssignment | null>(
    assignments[0] || null
  );

  // Start exam session
  const handleStartExam = (assignment: ExamAssignment) => {
    const exam = exams.find(e => e.id === assignment.examId);
    if (!exam) return;

    setActiveExam(exam);
    setActiveAssignment(assignment);
    setTimeLeftSeconds(exam.durationMinutes * 60);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setFlaggedQuestions(new Set());
    setHasSubmitted(false);
    setViolationCount(0);
    setAutosaveTime(new Date().toLocaleTimeString());
    playSound('notification');
  };

  // Timer countdown
  useEffect(() => {
    if (!activeExam || hasSubmitted) return;

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        if (prev === 300) {
          playSound('timer'); // 5 minutes warning
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeExam, hasSubmitted]);

  // Anti-cheat detection: tab switch & blur events (Section 13)
  useEffect(() => {
    if (!activeExam || hasSubmitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = violationCount + 1;
        setViolationCount(newCount);
        playSound('wrong');

        // Log violation event
        const vEvent: ViolationEvent = {
          id: `vio-${Date.now()}`,
          studentId: currentUser.id,
          studentName: currentUser.fullName,
          submissionId: `subm-${currentUser.id}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'tab_switch',
          description: `Rời khỏi phòng thi (Chuyển tab / Mất tiêu điểm lần ${newCount})`,
        };
        StorageService.logViolation(vEvent);

        setViolationWarning(`Cảnh báo: Bạn vừa rời màn hình phòng thi! Lần vi phạm thứ ${newCount}. Sự kiện đã được ghi vào nhật ký giám sát.`);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeExam, hasSubmitted, violationCount]);

  // Answer handler for Multiple Choice
  const handleAnswerMC = (qId: string, optionLetter: string) => {
    const q = activeExam?.questions.find(item => item.id === qId);
    if (!q) return;

    const isCorrect = q.correctAnswer === optionLetter;
    const awarded = isCorrect ? q.points : 0;

    setAnswers(prev => ({
      ...prev,
      [qId]: {
        questionId: qId,
        type: 'multiple_choice',
        selectedOption: optionLetter,
        isCorrect,
        awardedPoints: awarded,
      },
    }));
    setAutosaveTime(new Date().toLocaleTimeString());
    playSound('click');
  };

  // Answer handler for True / False (GDPT 2018 CV 7991 scoring rule)
  const handleAnswerTF = (qId: string, subId: 'a' | 'b' | 'c' | 'd', val: boolean) => {
    const q = activeExam?.questions.find(item => item.id === qId);
    if (!q || !q.trueFalseOptions) return;

    const currentTfAnswers = answers[qId]?.trueFalseAnswers || {};
    const updatedTfAnswers = { ...currentTfAnswers, [subId]: val };

    // Calculate score per Circular 7991:
    // 1 correct: 0.1 pt
    // 2 correct: 0.25 pt
    // 3 correct: 0.5 pt
    // 4 correct: 1.0 pt
    let correctCount = 0;
    q.trueFalseOptions.forEach(opt => {
      if (updatedTfAnswers[opt.id] !== undefined && updatedTfAnswers[opt.id] === opt.isCorrect) {
        correctCount++;
      }
    });

    let awarded = 0;
    if (correctCount === 1) awarded = 0.1;
    else if (correctCount === 2) awarded = 0.25;
    else if (correctCount === 3) awarded = 0.5;
    else if (correctCount === 4) awarded = 1.0;

    setAnswers(prev => ({
      ...prev,
      [qId]: {
        questionId: qId,
        type: 'true_false',
        trueFalseAnswers: updatedTfAnswers,
        isCorrect: correctCount === 4,
        awardedPoints: awarded,
      },
    }));
    setAutosaveTime(new Date().toLocaleTimeString());
    playSound('click');
  };

  // Answer handler for Short Answer
  const handleAnswerShort = (qId: string, text: string) => {
    const q = activeExam?.questions.find(item => item.id === qId);
    if (!q) return;

    const normalizedUser = text.trim().replace(',', '.');
    const normalizedCorrect = (q.correctAnswer || '').trim().replace(',', '.');
    const isCorrect = normalizedUser === normalizedCorrect;
    const awarded = isCorrect ? q.points : 0;

    setAnswers(prev => ({
      ...prev,
      [qId]: {
        questionId: qId,
        type: 'short_answer',
        shortAnswerText: text,
        isCorrect,
        awardedPoints: awarded,
      },
    }));
    setAutosaveTime(new Date().toLocaleTimeString());
  };

  // Answer handler for Essay
  const handleAnswerEssay = (qId: string, content: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: {
        questionId: qId,
        type: 'essay',
        essayContent: content,
        awardedPoints: 0, // Pending teacher manual grading
      },
    }));
    setAutosaveTime(new Date().toLocaleTimeString());
  };

  // Answer handler for Single True / False
  const handleAnswerSingleTF = (qId: string, val: boolean) => {
    const q = activeExam?.questions.find(item => item.id === qId);
    if (!q) return;

    const isCorrect = q.singleTrueFalseAnswer === val;
    const awarded = isCorrect ? q.points : 0;

    setAnswers(prev => ({
      ...prev,
      [qId]: {
        questionId: qId,
        type: 'true_false_single',
        selectedOption: val ? 'true' : 'false',
        isCorrect,
        awardedPoints: awarded,
      },
    }));
    setAutosaveTime(new Date().toLocaleTimeString());
    playSound('click');
  };

  // Answer handler for Numeric Answer (with epsilon tolerance & fractions)
  const handleAnswerNumeric = (qId: string, valStr: string) => {
    const q = activeExam?.questions.find(item => item.id === qId);
    if (!q) return;

    let userNum: number | null = null;
    const trimmed = valStr.trim().replace(',', '.');

    // Parse fraction a/b
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1])) && Number(parts[1]) !== 0) {
        userNum = Number(parts[0]) / Number(parts[1]);
      }
    } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
      userNum = Number(trimmed);
    }

    let isCorrect = false;
    if (userNum !== null && q.numericAnswerConfig) {
      const target = q.numericAnswerConfig.targetValue;
      const tol = q.numericAnswerConfig.tolerance ?? 0.01;
      isCorrect = Math.abs(userNum - target) <= tol;
    }

    setAnswers(prev => ({
      ...prev,
      [qId]: {
        questionId: qId,
        type: 'numeric_answer',
        numericAnswer: valStr,
        isCorrect,
        awardedPoints: isCorrect ? q.points : 0,
      },
    }));
    setAutosaveTime(new Date().toLocaleTimeString());
  };

  // Answer handler for Fill in Blank
  const handleAnswerBlank = (qId: string, blankId: string, val: string) => {
    const q = activeExam?.questions.find(item => item.id === qId);
    if (!q || !q.fillInBlankConfig) return;

    const currentBlanks = answers[qId]?.blankAnswers || {};
    const updatedBlanks = { ...currentBlanks, [blankId]: val };

    let correctCount = 0;
    q.fillInBlankConfig.blanks.forEach(b => {
      const userText = (updatedBlanks[b.id] || '').trim().toLowerCase();
      const match = b.correctAnswers.some(ans => ans.trim().toLowerCase() === userText);
      if (match) correctCount++;
    });

    const isAllCorrect = correctCount === q.fillInBlankConfig.blanks.length;
    const awarded = Number(((correctCount / q.fillInBlankConfig.blanks.length) * q.points).toFixed(2));

    setAnswers(prev => ({
      ...prev,
      [qId]: {
        questionId: qId,
        type: 'fill_in_blank',
        blankAnswers: updatedBlanks,
        isCorrect: isAllCorrect,
        awardedPoints: awarded,
      },
    }));
    setAutosaveTime(new Date().toLocaleTimeString());
  };

  // Answer handler for Dropdown Choice
  const handleAnswerDropdown = (qId: string, dropdownId: string, val: string) => {
    const q = activeExam?.questions.find(item => item.id === qId);
    if (!q || !q.dropdownChoiceConfig) return;

    const currentDropdowns = answers[qId]?.dropdownAnswers || {};
    const updatedDropdowns = { ...currentDropdowns, [dropdownId]: val };

    let correctCount = 0;
    q.dropdownChoiceConfig.dropdowns.forEach(d => {
      if (updatedDropdowns[d.id] === d.correctOption) {
        correctCount++;
      }
    });

    const isAllCorrect = correctCount === q.dropdownChoiceConfig.dropdowns.length;
    const awarded = Number(((correctCount / q.dropdownChoiceConfig.dropdowns.length) * q.points).toFixed(2));

    setAnswers(prev => ({
      ...prev,
      [qId]: {
        questionId: qId,
        type: 'dropdown_choice',
        dropdownAnswers: updatedDropdowns,
        isCorrect: isAllCorrect,
        awardedPoints: awarded,
      },
    }));
    setAutosaveTime(new Date().toLocaleTimeString());
    playSound('click');
  };

  // Answer handler for Matching
  const handleAnswerMatching = (qId: string, leftId: string, rightId: string) => {
    const q = activeExam?.questions.find(item => item.id === qId);
    if (!q || !q.matchingConfig) return;

    const currentPairs = answers[qId]?.matchingPairs || {};
    const updatedPairs = { ...currentPairs, [leftId]: rightId };

    let correctCount = 0;
    q.matchingConfig.pairs.forEach(p => {
      if (updatedPairs[p.leftId] === p.rightId) {
        correctCount++;
      }
    });

    const isAllCorrect = correctCount === q.matchingConfig.pairs.length;
    const awarded = Number(((correctCount / q.matchingConfig.pairs.length) * q.points).toFixed(2));

    setAnswers(prev => ({
      ...prev,
      [qId]: {
        questionId: qId,
        type: 'matching',
        matchingPairs: updatedPairs,
        isCorrect: isAllCorrect,
        awardedPoints: awarded,
      },
    }));
    setAutosaveTime(new Date().toLocaleTimeString());
    playSound('click');
  };

  // Answer handler for Ordering
  const handleAnswerOrdering = (qId: string, newOrder: string[]) => {
    const q = activeExam?.questions.find(item => item.id === qId);
    if (!q || !q.orderingConfig) return;

    const correctOrder = q.orderingConfig.correctOrder;
    const isCorrect = JSON.stringify(newOrder) === JSON.stringify(correctOrder);

    setAnswers(prev => ({
      ...prev,
      [qId]: {
        questionId: qId,
        type: 'ordering',
        orderAnswer: newOrder,
        isCorrect,
        awardedPoints: isCorrect ? q.points : 0,
      },
    }));
    setAutosaveTime(new Date().toLocaleTimeString());
    playSound('click');
  };

  // Answer handler for Multiple Select
  const handleAnswerMultipleSelect = (qId: string, letter: string) => {
    const q = activeExam?.questions.find(item => item.id === qId);
    if (!q || !q.multipleSelectConfig) return;

    const currentSelected = answers[qId]?.multipleSelectAnswers || [];
    let updated: string[];
    if (currentSelected.includes(letter)) {
      updated = currentSelected.filter(l => l !== letter);
    } else {
      updated = [...currentSelected, letter];
    }

    const correctList = q.multipleSelectConfig.correctAnswers;
    const isExact = updated.length === correctList.length && updated.every(l => correctList.includes(l));

    // Partial scoring
    let matchCount = 0;
    updated.forEach(l => {
      if (correctList.includes(l)) matchCount++;
      else matchCount = Math.max(0, matchCount - 0.5);
    });
    const ratio = Math.max(0, Math.min(1, matchCount / correctList.length));
    const awarded = Number((ratio * q.points).toFixed(2));

    setAnswers(prev => ({
      ...prev,
      [qId]: {
        questionId: qId,
        type: 'multiple_select',
        multipleSelectAnswers: updated,
        isCorrect: isExact,
        awardedPoints: awarded,
      },
    }));
    setAutosaveTime(new Date().toLocaleTimeString());
    playSound('click');
  };

  // Toggle Flag Question
  const toggleFlagQuestion = (idx: number) => {
    const next = new Set(flaggedQuestions);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setFlaggedQuestions(next);
    playSound('click');
  };

  // Submit Handler
  const handleConfirmSubmit = () => {
    if (!activeExam || !activeAssignment) return;

    // Calculate auto scores
    let autoTotal = 0;
    let manualTotal = 0;
    let hasEssay = false;

    Object.values(answers).forEach((ans) => {
      if (ans.type === 'essay') {
        hasEssay = true;
      } else {
        autoTotal += ans.awardedPoints;
      }
    });

    const subm: ExamSubmission = {
      id: `subm-${Date.now()}`,
      assignmentId: activeAssignment.id,
      examId: activeExam.id,
      examTitle: activeExam.title,
      studentId: currentUser.id,
      studentCode: currentUser.username.toUpperCase(),
      studentName: currentUser.fullName,
      className: '12A1',
      startedAt: new Date(Date.now() - (activeExam.durationMinutes * 60 - timeLeftSeconds) * 1000).toLocaleTimeString(),
      submittedAt: new Date().toLocaleTimeString(),
      durationSeconds: activeExam.durationMinutes * 60 - timeLeftSeconds,
      answers,
      autoScore: Number(autoTotal.toFixed(2)),
      manualScore: 0,
      totalScore: Number(autoTotal.toFixed(2)),
      maxScore: activeExam.totalPoints,
      isGraded: !hasEssay,
      violationsCount: violationCount,
      status: hasEssay ? 'submitted' : 'graded',
    };

    StorageService.saveSubmission(subm);
    setSubmissionResult(subm);
    setHasSubmitted(true);
    setShowSubmitConfirm(false);
    playSound('cheer');
    onRefreshData();
  };

  const handleAutoSubmit = () => {
    handleConfirmSubmit();
  };

  // Current active question
  const currentQ = activeExam?.questions[currentQuestionIndex];

  // Format time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Unanswered count
  const unansweredCount = activeExam
    ? activeExam.questions.filter(q => !answers[q.id]).length
    : 0;

  // -------------------------------------------------------------
  // If exam is active and not finished, render student testing UI
  // -------------------------------------------------------------
  if (activeExam && !hasSubmitted) {
    return (
      <div className="space-y-4">
        {/* Top Floating Exam Header Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 sticky top-[65px] z-20">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-800 line-clamp-1">
                {activeExam.title}
              </span>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Môn Toán {activeExam.grade}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Thí sinh: <strong>{currentUser.fullName}</strong> · Tự động lưu lúc: <span className="text-slate-600 font-mono">{autosaveTime}</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Timer */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-black border ${
                timeLeftSeconds < 300
                  ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>

            {/* Submit Button */}
            <button
              onClick={() => {
                setShowSubmitConfirm(true);
                playSound('notification');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" /> Nộp bài thi
            </button>
          </div>
        </div>

        {/* Violation Warning Alert */}
        {violationWarning && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{violationWarning}</span>
            </div>
            <button onClick={() => setViolationWarning(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Exam Split Body */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Question Area (3 Cols) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            {currentQ && (
              <>
                {/* Question Info Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                      Câu {currentQuestionIndex + 1} / {activeExam.questions.length}
                    </span>
                    <span className="text-slate-400 font-mono">({currentQ.code})</span>
                    <span className="text-slate-500 font-medium">· {currentQ.points} điểm</span>
                  </div>

                  <button
                    onClick={() => toggleFlagQuestion(currentQuestionIndex)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      flaggedQuestions.has(currentQuestionIndex)
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    {flaggedQuestions.has(currentQuestionIndex) ? 'Đã đánh dấu xem lại' : 'Đánh dấu câu này'}
                  </button>
                </div>

                {/* Prompt with LaTeX */}
                <div className="question-prompt text-[18px] font-medium text-slate-900 leading-relaxed pt-2">
                  <MathRenderer content={currentQ.prompt} />
                </div>

                {/* Diagram if available */}
                {currentQ.diagramType && (
                  <div className="py-2.5">
                    <GeometryDiagram type={currentQ.diagramType} data={currentQ.diagramData} allowAdjust={false} />
                  </div>
                )}

                {/* Question Type Answers Inputs */}
                <div className="pt-4">
                  {/* Type 1: Multiple Choice */}
                  {currentQ.type === 'multiple_choice' && currentQ.options && (
                    <div className="space-y-3">
                      {currentQ.options.map((opt, oIdx) => {
                        const letter = ['A', 'B', 'C', 'D'][oIdx];
                        const isSelected = answers[currentQ.id]?.selectedOption === letter;
                        return (
                          <div
                            key={oIdx}
                            onClick={() => handleAnswerMC(currentQ.id, letter)}
                            className={`p-3.5 rounded-xl border text-[17px] leading-normal cursor-pointer flex items-start gap-3 transition-all ${
                              isSelected
                                ? 'bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-200 font-semibold text-indigo-950 shadow-xs'
                                : 'bg-white border-slate-200 hover:bg-slate-50/80 text-slate-800'
                            }`}
                          >
                            <span
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {letter}
                            </span>
                            <div className="flex-1 font-medium overflow-x-auto text-slate-900">
                              <MathRenderer content={opt} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Type 2: True / False (GDPT 2018 CV 7991) */}
                  {currentQ.type === 'true_false' && currentQ.trueFalseOptions && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Chọn Đúng (Đ) hoặc Sai (S) cho từng ý dưới đây:
                      </div>
                      <div className="space-y-2.5">
                        {currentQ.trueFalseOptions.map((item) => {
                          const currentVal = answers[currentQ.id]?.trueFalseAnswers?.[item.id];
                          return (
                            <div
                              key={item.id}
                              className="p-3.5 rounded-xl bg-slate-50/90 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[17px] leading-normal"
                            >
                              <div className="flex items-start gap-2.5 flex-1">
                                <span className="font-bold text-indigo-700 uppercase shrink-0">{item.id})</span>
                                <div className="text-slate-900 font-medium">
                                  <MathRenderer content={item.text} />
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleAnswerTF(currentQ.id, item.id, true)}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    currentVal === true
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50'
                                  }`}
                                >
                                  Đúng
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAnswerTF(currentQ.id, item.id, false)}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    currentVal === false
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-rose-50'
                                  }`}
                                >
                                  Sai
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Type 2B: Single True / False */}
                  {currentQ.type === 'true_false_single' && (
                    <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Khẳng định trên là Đúng hay Sai?
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => handleAnswerSingleTF(currentQ.id, true)}
                          className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer border ${
                            answers[currentQ.id]?.selectedOption === 'true'
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-200'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          ĐÚNG
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAnswerSingleTF(currentQ.id, false)}
                          className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer border ${
                            answers[currentQ.id]?.selectedOption === 'false'
                              ? 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-200'
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          SAI
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Type 3: Short Answer */}
                  {currentQ.type === 'short_answer' && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-700">
                        Nhập đáp án số hoặc biểu thức ngắn:
                      </label>
                      <input
                        type="text"
                        value={answers[currentQ.id]?.shortAnswerText || ''}
                        onChange={(e) => handleAnswerShort(currentQ.id, e.target.value)}
                        placeholder="Ví dụ: 4 hoặc 0.5 hoặc -2..."
                        className="w-full max-w-sm text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="text-[11px] text-slate-400">
                        * Nhập số nguyên hoặc số thập phân (dùng dấu chấm hoặc phẩy). Hệ thống tự động so khớp chuẩn toán học.
                      </p>
                    </div>
                  )}

                  {/* Type 5: Numeric Answer (with units & tolerance) */}
                  {currentQ.type === 'numeric_answer' && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-700">
                        Nhập kết quả số tính toán:
                      </label>
                      <div className="flex items-center gap-2 max-w-sm">
                        <input
                          type="text"
                          value={String(answers[currentQ.id]?.numericAnswer ?? '')}
                          onChange={(e) => handleAnswerNumeric(currentQ.id, e.target.value)}
                          placeholder="Ví dụ: 3.14 hoặc 7/4..."
                          className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                        />
                        {currentQ.numericAnswerConfig?.unit && (
                          <span className="px-3 py-2 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl shrink-0">
                            {currentQ.numericAnswerConfig.unit}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        * Chấp nhận số nguyên, số thập phân hoặc phân số (a/b). Sai số cho phép: ±{currentQ.numericAnswerConfig?.tolerance ?? 0.01}.
                      </p>
                    </div>
                  )}

                  {/* Type 6: Essay */}
                  {currentQ.type === 'essay' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">
                        Trình bày bài giải tự luận của bạn vào khung bên dưới:
                      </label>
                      <textarea
                        rows={6}
                        value={answers[currentQ.id]?.essayContent || ''}
                        onChange={(e) => handleAnswerEssay(currentQ.id, e.target.value)}
                        placeholder="Trình bày các bước lập luận, biến đổi toán học hoặc định lí áp dụng..."
                        className="w-full text-xs p-3.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  {/* Type 7: Fill in Blank */}
                  {currentQ.type === 'fill_in_blank' && currentQ.fillInBlankConfig && (
                    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Điền từ hoặc số thích hợp vào các ô trống dưới đây:
                      </div>
                      <div className="space-y-3">
                        {currentQ.fillInBlankConfig.blanks.map((b) => (
                          <div key={b.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="font-bold text-xs text-indigo-700 w-24 shrink-0">
                              {b.label || `Ô trống [${b.id}]`}:
                            </span>
                            <input
                              type="text"
                              value={answers[currentQ.id]?.blankAnswers?.[b.id] || ''}
                              onChange={(e) => handleAnswerBlank(currentQ.id, b.id, e.target.value)}
                              placeholder="Nhập câu trả lời cho ô này..."
                              className="flex-1 max-w-md px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Type 8: Dropdown Choice */}
                  {currentQ.type === 'dropdown_choice' && currentQ.dropdownChoiceConfig && (
                    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Chọn phương án đúng từ danh sách thả xuống:
                      </div>
                      <div className="space-y-3">
                        {currentQ.dropdownChoiceConfig.dropdowns.map((d) => (
                          <div key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="font-bold text-xs text-indigo-700 w-32 shrink-0">
                              {d.label || `Lựa chọn [${d.id}]`}:
                            </span>
                            <select
                              value={answers[currentQ.id]?.dropdownAnswers?.[d.id] || ''}
                              onChange={(e) => handleAnswerDropdown(currentQ.id, d.id, e.target.value)}
                              className="max-w-md px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">-- Chọn phương án --</option>
                              {d.options.map((opt, oIdx) => (
                                <option key={oIdx} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Type 9: Matching */}
                  {currentQ.type === 'matching' && currentQ.matchingConfig && (
                    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Ghép nối từng mục ở Cột A với mục tương ứng ở Cột B:
                      </div>
                      <div className="space-y-3">
                        {currentQ.matchingConfig.leftItems.map((left) => {
                          const currentRightId = answers[currentQ.id]?.matchingPairs?.[left.id] || '';
                          return (
                            <div
                              key={left.id}
                              className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded shrink-0">
                                  {left.id}
                                </span>
                                <div className="text-slate-800 font-medium">
                                  <MathRenderer content={left.text} inline />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-slate-400 font-bold">➔</span>
                                <select
                                  value={currentRightId}
                                  onChange={(e) => handleAnswerMatching(currentQ.id, left.id, e.target.value)}
                                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs font-medium text-slate-800"
                                >
                                  <option value="">-- Chọn mục tương ứng Cột B --</option>
                                  {currentQ.matchingConfig?.rightItems.map((right) => (
                                    <option key={right.id} value={right.id}>
                                      {right.id}: {right.text.replace(/[$]/g, '')}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Type 10: Ordering */}
                  {currentQ.type === 'ordering' && currentQ.orderingConfig && (
                    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Sắp xếp các bước giải theo thứ tự logic đúng (Dùng nút ▲ / ▼):
                      </div>
                      {(() => {
                        const currentOrder = answers[currentQ.id]?.orderAnswer || currentQ.orderingConfig.items.map(it => it.id);
                        return (
                          <div className="space-y-2">
                            {currentOrder.map((itemId, idx) => {
                              const item = currentQ.orderingConfig?.items.find(it => it.id === itemId);
                              if (!item) return null;
                              return (
                                <div
                                  key={itemId}
                                  className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                                      {idx + 1}
                                    </span>
                                    <div className="text-slate-800 font-medium">
                                      <MathRenderer content={item.text} inline />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => {
                                        if (idx > 0) {
                                          const next = [...currentOrder];
                                          const temp = next[idx - 1];
                                          next[idx - 1] = next[idx];
                                          next[idx] = temp;
                                          handleAnswerOrdering(currentQ.id, next);
                                        }
                                      }}
                                      className={`p-1.5 rounded-lg border text-xs font-bold ${
                                        idx === 0 ? 'text-slate-300 border-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                      }`}
                                      title="Lên trên"
                                    >
                                      ▲
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === currentOrder.length - 1}
                                      onClick={() => {
                                        if (idx < currentOrder.length - 1) {
                                          const next = [...currentOrder];
                                          const temp = next[idx + 1];
                                          next[idx + 1] = next[idx];
                                          next[idx] = temp;
                                          handleAnswerOrdering(currentQ.id, next);
                                        }
                                      }}
                                      className={`p-1.5 rounded-lg border text-xs font-bold ${
                                        idx === currentOrder.length - 1 ? 'text-slate-300 border-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                      }`}
                                      title="Xuống dưới"
                                    >
                                      ▼
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Type 11: Multiple Select */}
                  {currentQ.type === 'multiple_select' && currentQ.multipleSelectConfig && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Chọn tất cả các đáp án đúng (Checkbox chọn nhiều đáp án):
                      </div>
                      <div className="space-y-2.5">
                        {currentQ.multipleSelectConfig.options.map((opt, oIdx) => {
                          const letter = ['A', 'B', 'C', 'D', 'E', 'F'][oIdx] || `P${oIdx + 1}`;
                          const isChecked = (answers[currentQ.id]?.multipleSelectAnswers || []).includes(letter);
                          return (
                            <div
                              key={oIdx}
                              onClick={() => handleAnswerMultipleSelect(currentQ.id, letter)}
                              className={`p-3.5 rounded-xl border text-[17px] leading-normal cursor-pointer flex items-start gap-3 transition-all ${
                                isChecked
                                  ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-200 font-semibold text-indigo-950'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // handled by parent onClick
                                className="w-5 h-5 rounded text-indigo-600 mt-0.5 cursor-pointer"
                              />
                              <span className="font-bold text-xs w-5 shrink-0 mt-0.5">{letter}.</span>
                              <div className="flex-1 font-medium text-slate-900">
                                <MathRenderer content={opt} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      if (currentQuestionIndex > 0) {
                        setCurrentQuestionIndex(currentQuestionIndex - 1);
                        playSound('click');
                      }
                    }}
                    disabled={currentQuestionIndex === 0}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold ${
                      currentQuestionIndex === 0
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" /> Câu trước
                  </button>

                  <button
                    onClick={() => {
                      if (currentQuestionIndex < activeExam.questions.length - 1) {
                        setCurrentQuestionIndex(currentQuestionIndex + 1);
                        playSound('click');
                      }
                    }}
                    disabled={currentQuestionIndex === activeExam.questions.length - 1}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold ${
                      currentQuestionIndex === activeExam.questions.length - 1
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                  >
                    Câu tiếp theo <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Palette Navigator (1 Col) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Bảng câu hỏi ({activeExam.questions.length})
            </h4>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-600" />
                <span>Đã làm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-200" />
                <span>Chưa làm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span>Đánh dấu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full ring-2 ring-indigo-500" />
                <span>Đang chọn</span>
              </div>
            </div>

            {/* Palette Grid */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {activeExam.questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentQuestionIndex;
                const isFlagged = flaggedQuestions.has(idx);

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      playSound('click');
                    }}
                    className={`h-9 rounded-lg text-xs font-bold transition-all relative ${
                      isCurrent
                        ? 'ring-2 ring-indigo-600 ring-offset-2'
                        : ''
                    } ${
                      isAnswered
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-1 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Đã hoàn thành:</span>
                <strong className="text-indigo-700">{Object.keys(answers).length} / {activeExam.questions.length}</strong>
              </div>
              <div className="flex justify-between">
                <span>Chưa trả lời:</span>
                <strong className="text-rose-600">{unansweredCount} câu</strong>
              </div>
            </div>

            <button
              onClick={() => {
                setShowSubmitConfirm(true);
                playSound('notification');
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Nộp bài thi
            </button>
          </div>
        </div>

        {/* Modal: Confirmation Before Submit (Section 13) */}
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2 text-indigo-700 mb-3">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Xác nhận nộp bài thi</h3>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p>Bạn có chắc chắn muốn nộp bài kiểm tra này không?</p>
                {unansweredCount > 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                    <strong>Lưu ý:</strong> Bạn vẫn còn <span className="font-bold text-rose-600">{unansweredCount} câu chưa trả lời</span>.
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                    Bạn đã hoàn thành toàn bộ {activeExam.questions.length} câu hỏi.
                  </div>
                )}
                <p className="text-[11px] text-slate-400">
                  Sau khi nộp bài, hệ thống sẽ tiến hành chấm tự động các phần trắc nghiệm và khóa quyền chỉnh sửa câu trả lời.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Tiếp tục làm bài
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                >
                  Xác nhận nộp bài ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // If exam has just been submitted, show Result Screen
  // -------------------------------------------------------------
  if (hasSubmitted && submissionResult) {
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900">Nộp bài thành công!</h2>
          <p className="text-xs text-slate-500 mt-1">
            Đề: {submissionResult.examTitle} · Thí sinh: {submissionResult.studentName}
          </p>
        </div>

        {/* Score Card */}
        <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 inline-block w-full max-w-sm">
          <span className="text-xs font-bold text-slate-500 uppercase">Điểm số trắc nghiệm tự động</span>
          <div className="text-4xl font-black text-indigo-700 mt-1">
            {submissionResult.autoScore.toFixed(2)}{' '}
            <span className="text-base font-normal text-slate-400">/ {submissionResult.maxScore}</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {submissionResult.isGraded
              ? 'Đã hoàn tất chấm điểm toàn bộ bài thi.'
              : 'Phần câu hỏi tự luận đang chờ giáo viên chấm bổ sung.'}
          </div>
        </div>

        {/* Submission details */}
        <div className="grid grid-cols-3 gap-3 text-xs text-slate-600 border-t border-b border-slate-100 py-3">
          <div>
            Thời gian nộp: <strong className="text-slate-800">{submissionResult.submittedAt}</strong>
          </div>
          <div>
            Thời lượng: <strong className="text-slate-800">{Math.round(submissionResult.durationSeconds / 60)} phút</strong>
          </div>
          <div>
            Cảnh báo giám sát: <strong className="text-slate-800">{submissionResult.violationsCount} lần</strong>
          </div>
        </div>

        <button
          onClick={() => {
            setActiveExam(null);
            setHasSubmitted(false);
            setSubmissionResult(null);
            playSound('click');
          }}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          Trở về danh sách phòng thi
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Default Dashboard: Assigned Exams List + Teacher Proctoring Room
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-800">Phòng thi trực tuyến</h2>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-600" /> Hệ thống giám sát trực tiếp
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Học sinh tham gia làm bài an toàn; Giáo viên giám sát tiến độ và phát hiện hành vi rời tab.
          </p>
        </div>
      </div>

      {/* Available Exam Assignments */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-3">Bài kiểm tra được giao</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assignments.map((assign) => (
            <div
              key={assign.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition-all space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Đang diễn ra
                </span>
                <span className="text-slate-400 font-medium">
                  {assign.classNames.join(', ')}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">
                {assign.examTitle}
              </h4>

              <div className="text-xs text-slate-500 space-y-1">
                <div>Bắt đầu: <span className="font-semibold text-slate-700">{assign.startDate}</span></div>
                <div>Kết thúc: <span className="font-semibold text-slate-700">{assign.endDate}</span></div>
                <div>Đã nộp bài: <strong className="text-indigo-700">{assign.totalSubmitted} / {assign.totalAssigned}</strong> học sinh</div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleStartExam(assign)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  {isStudent ? 'Vào làm bài ngay' : 'Thử nghiệm làm bài (Học sinh)'}
                </button>

                {!isStudent && (
                  <button
                    onClick={() => {
                      setSelectedMonitorAssignment(assign);
                      playSound('click');
                    }}
                    className="p-2 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 text-xs font-semibold"
                  >
                    Mở giám sát
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teacher Proctoring Monitor Panel (Section 13) */}
      {!isStudent && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                Màn hình Giám sát Thi Trực Tuyến (Teacher Proctoring)
              </h3>
              <p className="text-xs text-slate-500">
                Theo dõi tiến độ theo thời gian thực và ghi nhận vi phạm chuyển tab / mất tiêu điểm
              </p>
            </div>
            <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-md">
              Chế độ giám sát: Tiêu chuẩn (GDPT 2018)
            </span>
          </div>

          {/* Submissions live grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Mã HS</th>
                  <th className="py-2.5 px-3">Họ và tên</th>
                  <th className="py-2.5 px-3">Lớp</th>
                  <th className="py-2.5 px-3">Bắt đầu</th>
                  <th className="py-2.5 px-3">Thời gian nộp</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3 text-center">Cảnh báo vi phạm</th>
                  <th className="py-2.5 px-3 text-right">Điểm trắc nghiệm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{s.studentCode}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{s.studentName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{s.className}</td>
                    <td className="py-2.5 px-3 text-slate-500">{s.startedAt}</td>
                    <td className="py-2.5 px-3 text-slate-500">{s.submittedAt || 'Đang làm bài...'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đã nộp bài
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {s.violationsCount > 0 ? (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {s.violationsCount} lần chuyển tab
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Không có</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-indigo-700 font-mono">
                      {s.totalScore.toFixed(2)} / {s.maxScore}
                    </td>
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
