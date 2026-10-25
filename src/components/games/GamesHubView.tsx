import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  RotateCw,
  HelpCircle,
  Grid,
  Trophy,
  Users,
  CheckCircle,
  XCircle,
  Sparkles,
  Volume2,
  Clock,
  ArrowRight,
  Eye,
  Shuffle,
  RefreshCw,
} from 'lucide-react';
import { ClassRoom, Student, Question } from '../../types';
import { MathRenderer } from '../MathRenderer';
import { playSound } from '../../services/sound';

interface GamesHubViewProps {
  classes: ClassRoom[];
  students: Student[];
  questions: Question[];
}

export const GamesHubView: React.FC<GamesHubViewProps> = ({
  classes,
  students,
  questions,
}) => {
  const [activeGame, setActiveGame] = useState<'wheel' | 'question_wheel' | 'crossword' | 'arena'>('wheel');

  // ==========================================
  // GAME 1: Vòng quay gọi tên (Lucky Wheel)
  // ==========================================
  const [wheelClassId, setWheelClassId] = useState<string>(classes[0]?.id || '');
  const [remainingStudents, setRemainingStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [removeAfterCall, setRemoveAfterCall] = useState(true);

  // Sync remaining students when class changes
  useEffect(() => {
    const list = students.filter(s => s.classId === wheelClassId);
    setRemainingStudents(list);
    setSelectedStudent(null);
  }, [wheelClassId, students]);

  const handleSpinWheel = () => {
    if (remainingStudents.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setSelectedStudent(null);
    playSound('spin');

    const totalDegrees = 360 * 5 + Math.floor(Math.random() * 360);
    const newRotation = wheelRotation + totalDegrees;
    setWheelRotation(newRotation);

    setTimeout(() => {
      // Pick random
      const winnerIndex = Math.floor(Math.random() * remainingStudents.length);
      const winner = remainingStudents[winnerIndex];
      setSelectedStudent(winner);
      setIsSpinning(false);
      playSound('cheer');

      if (removeAfterCall) {
        setRemainingStudents(prev => prev.filter(s => s.id !== winner.id));
      }
    }, 3500);
  };

  const handleResetWheel = () => {
    const list = students.filter(s => s.classId === wheelClassId);
    setRemainingStudents(list);
    setSelectedStudent(null);
    playSound('click');
  };

  // ==========================================
  // GAME 2: Chiếc nón câu hỏi (Question Wheel)
  // ==========================================
  const [questionGrade, setQuestionGrade] = useState<number>(12);
  const [selectedRandomQuestion, setSelectedRandomQuestion] = useState<Question | null>(null);
  const [showQuestionAnswer, setShowQuestionAnswer] = useState(false);
  const [questionTimer, setQuestionTimer] = useState<number>(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && questionTimer > 0) {
      timer = setTimeout(() => setQuestionTimer(prev => prev - 1), 1000);
    } else if (questionTimer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      playSound('wrong');
    }
    return () => clearTimeout(timer);
  }, [isTimerRunning, questionTimer]);

  const handleSpinQuestion = () => {
    const pool = questions.filter(q => q.grade === questionGrade);
    if (pool.length === 0) return;

    playSound('spin');
    const randomQ = pool[Math.floor(Math.random() * pool.length)];
    setSelectedRandomQuestion(randomQ);
    setShowQuestionAnswer(false);
    setQuestionTimer(30);
    setIsTimerRunning(true);
  };

  // ==========================================
  // GAME 3: Ô chữ kiến thức (Crossword)
  // ==========================================
  // Mathematics crossword with Vietnamese accents:
  // Key word: "ĐẠO HÀM" (DAO HAM)
  const crosswordData = [
    { row: 1, clue: 'Đường thẳng mà khoảng cách từ đồ thị đến nó dần về 0 khi x tiến ra vô cực gọi là đường ... ?', word: 'TIEMCAN', hint: 'Gồm 7 chữ cái' },
    { row: 2, clue: 'Điểm mà tại đó đạo hàm đổi dấu từ dương sang âm là điểm cực ... ?', word: 'DAI', hint: 'Gồm 3 chữ cái' },
    { row: 3, clue: 'Phép toán ngược với đạo hàm là tìm nguyên ... ?', word: 'HAM', hint: 'Gồm 3 chữ cái' },
    { row: 4, clue: 'Hàm số f(x) có đạo hàm luôn dương trên khoảng K thì hàm số ... trên K ?', word: 'DONBIEN', hint: 'Gồm 7 chữ cái' },
  ];
  const [revealedRows, setRevealedRows] = useState<Set<number>>(new Set());

  const handleToggleRow = (row: number) => {
    const next = new Set(revealedRows);
    if (next.has(row)) next.delete(row);
    else {
      next.add(row);
      playSound('correct');
    }
    setRevealedRows(next);
  };

  // ==========================================
  // GAME 4: Đấu trường trắc nghiệm (Arena)
  // ==========================================
  const [arenaScore, setArenaScore] = useState(0);
  const [arenaStreak, setArenaStreak] = useState(0);
  const [arenaIndex, setArenaIndex] = useState(0);
  const [arenaSelectedOpt, setArenaSelectedOpt] = useState<string | null>(null);

  const arenaQuestions = questions.filter(q => q.type === 'multiple_choice');
  const currentArenaQ = arenaQuestions[arenaIndex % arenaQuestions.length];

  const handleAnswerArena = (letter: string) => {
    if (arenaSelectedOpt || !currentArenaQ) return;
    setArenaSelectedOpt(letter);

    if (letter === currentArenaQ.correctAnswer) {
      playSound('correct');
      const bonus = (arenaStreak + 1) * 100;
      setArenaScore(prev => prev + bonus);
      setArenaStreak(prev => prev + 1);
    } else {
      playSound('wrong');
      setArenaStreak(0);
    }

    setTimeout(() => {
      setArenaIndex(prev => prev + 1);
      setArenaSelectedOpt(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-800">Trò chơi học tập tương tác</h2>
            <span className="text-xs font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 4 Trò chơi GDPT 2018
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kết nối trực tiếp danh sách học sinh theo lớp và ngân hàng câu hỏi môn Toán.
          </p>
        </div>

        {/* Game Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto text-xs font-bold">
          <button
            onClick={() => { setActiveGame('wheel'); playSound('click'); }}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeGame === 'wheel' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" /> Vòng quay gọi tên
          </button>

          <button
            onClick={() => { setActiveGame('question_wheel'); playSound('click'); }}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeGame === 'question_wheel' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> Chiếc nón câu hỏi
          </button>

          <button
            onClick={() => { setActiveGame('crossword'); playSound('click'); }}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeGame === 'crossword' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid className="w-3.5 h-3.5" /> Ô chữ kiến thức
          </button>

          <button
            onClick={() => { setActiveGame('arena'); playSound('click'); }}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeGame === 'arena' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" /> Đấu trường trắc nghiệm
          </button>
        </div>
      </div>

      {/* =========================================
          GAME 1: VÒNG QUAY GỌI TÊN
         ========================================= */}
      {activeGame === 'wheel' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wheel Display (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center justify-center min-h-[420px] text-center relative overflow-hidden">
            {/* Class selector */}
            <div className="absolute top-4 left-4 flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Lớp:</span>
              <select
                value={wheelClassId}
                onChange={(e) => setWheelClassId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>Lớp {c.name}</option>
                ))}
              </select>
            </div>

            {/* Spinning Wheel Graphic / Canvas Effect */}
            <div className="relative my-6">
              {/* Pointer indicator */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-rose-600 filter drop-shadow-md" />

              {/* Rotating disk */}
              <div
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  transition: isSpinning ? 'transform 3.5s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
                }}
                className="w-64 h-64 sm:w-72 sm:h-72 rounded-full border-8 border-indigo-600 shadow-xl relative overflow-hidden flex items-center justify-center bg-gradient-to-tr from-purple-500 via-indigo-500 to-blue-500"
              >
                <div className="absolute inset-2 rounded-full border-4 border-dashed border-white/40 pointer-events-none" />
                <div className="w-20 h-20 rounded-full bg-white shadow-lg flex items-center justify-center font-black text-indigo-700 text-xs uppercase z-10">
                  EduTest
                </div>
              </div>
            </div>

            {/* Winner Announcement */}
            {selectedStudent ? (
              <div className="mt-2 p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl shadow-md animate-in zoom-in-95 max-w-sm w-full">
                <span className="text-[11px] font-bold uppercase tracking-wider block opacity-90">Học sinh được gọi</span>
                <h3 className="text-xl font-black mt-0.5">{selectedStudent.fullName}</h3>
                <p className="text-xs opacity-90 mt-0.5">Mã: {selectedStudent.studentCode} · Lớp: {selectedStudent.className}</p>
              </div>
            ) : (
              <div className="text-xs text-slate-400 mt-2 font-medium">
                {isSpinning ? 'Đang quay chọn học sinh ngẫu nhiên...' : 'Bấm nút "QUAY NGẪU NHIÊN" để gọi tên'}
              </div>
            )}

            {/* Spin Controls */}
            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleSpinWheel}
                disabled={isSpinning || remainingStudents.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white text-sm font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <RotateCw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
                {isSpinning ? 'Đang quay...' : 'QUAY NGẪU NHIÊN'}
              </button>

              <button
                onClick={handleResetWheel}
                className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                title="Khôi phục danh sách đầy đủ"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Student Pool List (1 col) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Danh sách chờ quay ({remainingStudents.length})
                </h4>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeAfterCall}
                    onChange={(e) => setRemoveAfterCall(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Loại sau khi gọi</span>
                </label>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 pt-2 text-xs">
                {remainingStudents.map((s, idx) => (
                  <div key={s.id} className="py-2 flex items-center justify-between">
                    <span className="text-slate-400 font-mono text-[11px] w-6">{idx + 1}</span>
                    <span className="font-semibold text-slate-800 flex-1">{s.fullName}</span>
                    <span className="font-mono text-slate-400 text-[11px]">{s.studentCode}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              * Dữ liệu tự động đồng bộ theo Lớp học đã tạo trong hệ thống.
            </p>
          </div>
        </div>
      )}

      {/* =========================================
          GAME 2: CHIẾC NÓN CÂU HỎI
         ========================================= */}
      {activeGame === 'question_wheel' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Chiếc Nón Câu Hỏi Toán Học</h3>
              <p className="text-xs text-slate-500">Quay ngẫu nhiên câu hỏi từ ngân hàng để kiểm tra bài cũ hoặc thảo luận nhóm</p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={questionGrade}
                onChange={(e) => setQuestionGrade(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700"
              >
                <option value={10}>Toán 10 GDPT 2018</option>
                <option value={11}>Toán 11 GDPT 2018</option>
                <option value={12}>Toán 12 GDPT 2018</option>
              </select>

              <button
                onClick={handleSpinQuestion}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Shuffle className="w-4 h-4" /> Bốc câu hỏi ngẫu nhiên
              </button>
            </div>
          </div>

          {selectedRandomQuestion ? (
            <div className="space-y-4 max-w-2xl mx-auto text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {selectedRandomQuestion.code} · {selectedRandomQuestion.topic}
                </span>

                {/* Countdown Timer */}
                <div className="flex items-center gap-1 font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Clock className="w-3.5 h-3.5" /> {questionTimer}s
                </div>
              </div>

              {/* Question Text */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-900 leading-relaxed">
                <MathRenderer content={selectedRandomQuestion.prompt} />
              </div>

              {/* Options if MC */}
              {selectedRandomQuestion.options && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedRandomQuestion.options.map((opt, i) => (
                    <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 flex items-center gap-2">
                      <span className="font-bold text-indigo-700">{['A', 'B', 'C', 'D'][i]}.</span>
                      <MathRenderer content={opt} />
                    </div>
                  ))}
                </div>
              )}

              {/* Solution reveal */}
              <div className="pt-2 text-center">
                {!showQuestionAnswer ? (
                  <button
                    onClick={() => {
                      setShowQuestionAnswer(true);
                      playSound('correct');
                    }}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Hiển thị đáp án & lời giải chi tiết
                  </button>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-left animate-in fade-in">
                    <span className="font-bold text-emerald-800 block mb-1">
                      Đáp án đúng: {selectedRandomQuestion.correctAnswer || 'Xem hướng dẫn'}
                    </span>
                    <MathRenderer content={selectedRandomQuestion.solution} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Bấm nút "Bốc câu hỏi ngẫu nhiên" để bắt đầu phần hỏi đáp nhanh.
            </div>
          )}
        </div>
      )}

      {/* =========================================
          GAME 3: Ô CHỮ KIẾN THỨC
         ========================================= */}
      {activeGame === 'crossword' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Ô Chữ Toán Học GDPT 2018</h3>
              <p className="text-xs text-slate-500">Mở từng hàng ngang để tìm ra Từ khóa trung tâm hàng dọc</p>
            </div>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
              Chủ đề: Khảo sát hàm số & Giải tích 12
            </span>
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            {crosswordData.map((item) => {
              const isRevealed = revealedRows.has(item.row);
              return (
                <div key={item.row} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-700">Hàng ngang #{item.row}</span>
                    <span className="text-slate-400 italic">{item.hint}</span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium">{item.clue}</p>

                  <div className="pt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 font-mono font-bold text-sm">
                      {item.word.split('').map((char, cIdx) => (
                        <div
                          key={cIdx}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                            isRevealed
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                              : 'bg-white text-transparent border-slate-300'
                          }`}
                        >
                          {isRevealed ? char : '?'}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleToggleRow(item.row)}
                      className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg"
                    >
                      {isRevealed ? 'Ẩn' : 'Mở ô'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================
          GAME 4: ĐẤU TRƯỜNG TRẮC NGHIỆM
         ========================================= */}
      {activeGame === 'arena' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 max-w-2xl mx-auto">
          {/* Header Scoreboard */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Điểm số hiện tại</span>
              <div className="text-2xl font-black text-indigo-700">{arenaScore} pts</div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Chuỗi đúng (Streak)</span>
              <div className="text-2xl font-black text-amber-500">🔥 x{arenaStreak}</div>
            </div>
          </div>

          {/* Current Question */}
          {currentArenaQ && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-slate-400">
                Câu hỏi #{arenaIndex + 1} · {currentArenaQ.topic}
              </div>

              <div className="text-sm font-semibold text-slate-900">
                <MathRenderer content={currentArenaQ.prompt} />
              </div>

              {/* Arena Option Buttons */}
              {currentArenaQ.options && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {currentArenaQ.options.map((opt, i) => {
                    const letter = ['A', 'B', 'C', 'D'][i];
                    const isSelected = arenaSelectedOpt === letter;
                    const isCorrect = currentArenaQ.correctAnswer === letter;

                    let btnStyle = 'bg-slate-50 hover:bg-indigo-50 border-slate-200 text-slate-700';
                    if (arenaSelectedOpt) {
                      if (isCorrect) btnStyle = 'bg-emerald-500 text-white border-emerald-600';
                      else if (isSelected) btnStyle = 'bg-rose-500 text-white border-rose-600';
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswerArena(letter)}
                        disabled={!!arenaSelectedOpt}
                        className={`p-4 rounded-xl border text-xs font-bold transition-all text-left flex items-start gap-2.5 ${btnStyle}`}
                      >
                        <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                          {letter}
                        </span>
                        <div className="flex-1">
                          <MathRenderer content={opt} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
