/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  RotateCcw, 
  Eye, 
  EyeOff,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  LayoutDashboard,
  Database,
  Trash2,
  Save,
  PlusCircle,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { QUESTIONS, Question, Answer } from './data/questions';
import { audioService } from './services/audioService';
import { cn } from './lib/utils';

// --- Types ---

interface Team {
  name: string;
  score: number;
  strikes: number;
}

// --- Components ---

const StrikeOverlay = ({ count, onComplete }: { count: number; onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-none"
    >
      <div className="flex gap-8">
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ rotate: -45, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: i * 0.2, type: 'spring' }}
          >
            <X className="w-48 h-48 text-red-600 drop-shadow-[0_0_30px_rgba(220,38,38,0.8)]" strokeWidth={4} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

interface AnswerCardProps {
  answer: Answer | null;
  index: number;
  isRevealed: boolean;
  onReveal: () => void;
}

const AnswerCard: React.FC<AnswerCardProps> = ({ 
  answer, 
  index, 
  isRevealed, 
  onReveal 
}) => {
  return (
    <div 
      className="relative h-16 w-full perspective-1000 cursor-pointer group"
      onClick={() => !isRevealed && answer && onReveal()}
    >
      <motion.div
        className="w-full h-full relative transition-all duration-500 preserve-3d"
        animate={{ rotateX: isRevealed ? 180 : 0 }}
        transition={{ type: 'spring', damping: 15 }}
      >
        {/* Front side (Hidden) */}
        <div className="absolute inset-0 backface-hidden bg-gradient-to-b from-blue-700 to-blue-900 border-2 border-blue-400 rounded-lg flex items-center justify-center shadow-lg group-hover:border-blue-300 transition-colors">
          <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-100 font-bold text-xl border border-blue-400/50">
            {index + 1}
          </div>
        </div>

        {/* Back side (Revealed) */}
        <div className="absolute inset-0 backface-hidden rotate-x-180 bg-gradient-to-b from-yellow-400 to-yellow-600 border-2 border-yellow-200 rounded-lg flex items-center px-4 shadow-lg">
          {answer ? (
            <div className="flex justify-between items-center w-full">
              <span className="text-blue-900 font-bold text-lg uppercase truncate pr-2">
                {answer.text}
              </span>
              <div className="h-10 w-12 bg-blue-900 rounded flex items-center justify-center text-yellow-400 font-black text-xl border border-yellow-300/50">
                {answer.points}
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-blue-900/20 rounded flex items-center justify-center">
              <div className="w-4 h-1 bg-blue-900/40 rounded" />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  // --- State ---
  const [view, setView] = useState<'game' | 'bank'>('game');
  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem('student-feud-questions');
    return saved ? JSON.parse(saved) : QUESTIONS;
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [revealedAnswers, setRevealedAnswers] = useState<Set<number>>(new Set());
  const [teamA, setTeamA] = useState<Team>({ name: 'Team Alpha', score: 0, strikes: 0 });
  const [teamB, setTeamB] = useState<Team>({ name: 'Team Beta', score: 0, strikes: 0 });
  const [activeTeam, setActiveTeam] = useState<'A' | 'B'>('A');
  const [showStrikes, setShowStrikes] = useState<number | null>(null);
  const [isHostMode, setIsHostMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Persistence
  useEffect(() => {
    localStorage.setItem('student-feud-questions', JSON.stringify(questions));
  }, [questions]);

  const currentQuestion = questions[currentQuestionIndex] || questions[0];

  // --- Handlers ---

  const handleReveal = useCallback((index: number) => {
    if (revealedAnswers.has(index)) return;
    
    const answer = currentQuestion.answers[index];
    if (!answer) return;

    if (!isMuted) audioService.playReveal();
    
    setRevealedAnswers(prev => new Set(prev).add(index));
    
    // Add points to active team
    if (activeTeam === 'A') {
      setTeamA(prev => ({ ...prev, score: prev.score + answer.points }));
    } else {
      setTeamB(prev => ({ ...prev, score: prev.score + answer.points }));
    }

    // Check if all answers revealed
    if (revealedAnswers.size + 1 === currentQuestion.answers.length) {
      setTimeout(() => {
        if (!isMuted) audioService.playWin();
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#fbbf24', '#3b82f6', '#ffffff']
        });
      }, 500);
    }
  }, [revealedAnswers, currentQuestion, activeTeam, isMuted]);

  const handleStrike = useCallback(() => {
    const team = activeTeam === 'A' ? teamA : teamB;
    const setTeam = activeTeam === 'A' ? setTeamA : setTeamB;

    if (team.strikes < 3) {
      if (!isMuted) audioService.playStrike();
      const newStrikes = team.strikes + 1;
      setTeam(prev => ({ ...prev, strikes: newStrikes }));
      setShowStrikes(newStrikes);
    }
  }, [activeTeam, teamA, teamB, isMuted]);

  const resetBoard = () => {
    setRevealedAnswers(new Set());
    setTeamA(prev => ({ ...prev, strikes: 0 }));
    setTeamB(prev => ({ ...prev, strikes: 0 }));
    setShowStrikes(null);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      resetBoard();
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      resetBoard();
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);

  // --- Question Bank Logic ---
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const saveQuestion = (q: Question) => {
    if (q.id === -1) {
      // New question
      const newQ = { ...q, id: Date.now() };
      setQuestions(prev => [...prev, newQ]);
    } else {
      // Update existing
      setQuestions(prev => prev.map(item => item.id === q.id ? q : item));
    }
    setEditingQuestion(null);
  };

  const deleteQuestion = (id: number) => {
    if (questions.length <= 1) {
      alert("You must have at least one question!");
      return;
    }
    setQuestions(prev => prev.filter(q => q.id !== id));
    if (currentQuestionIndex >= questions.length - 1) {
      setCurrentQuestionIndex(Math.max(0, questions.length - 2));
    }
  };

  // --- Render Helpers ---

  const renderGame = () => (
    <main className="relative z-10 max-w-7xl mx-auto px-6 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Team A Panel */}
      <div className="lg:col-span-3 order-2 lg:order-1">
        <motion.div 
          className={cn(
            "p-6 rounded-3xl border-2 transition-all duration-300",
            activeTeam === 'A' 
              ? "bg-blue-600/20 border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.15)] scale-105" 
              : "bg-white/5 border-white/10 opacity-60"
          )}
          onClick={() => setActiveTeam('A')}
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className={activeTeam === 'A' ? "text-blue-400" : "text-gray-500"} />
            <input 
              value={teamA.name}
              onChange={(e) => setTeamA(prev => ({ ...prev, name: e.target.value }))}
              className="bg-transparent border-none font-bold text-xl focus:ring-0 w-full p-0"
              placeholder="Team A Name"
            />
          </div>
          <div className="text-center py-8">
            <div className="text-sm uppercase tracking-widest text-blue-300/60 font-bold mb-1">Score</div>
            <div className="text-6xl font-black text-white tabular-nums">{teamA.score}</div>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all",
                  i < teamA.strikes ? "bg-red-600/20 border-red-500 text-red-500" : "bg-white/5 border-white/10 text-white/10"
                )}
              >
                <X size={24} strokeWidth={3} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Game Board */}
      <div className="lg:col-span-6 order-1 lg:order-2 space-y-8">
        {/* Question Display */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 rounded-3xl shadow-2xl border-b-4 border-blue-900 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
          <h2 className="text-2xl md:text-3xl font-bold leading-tight drop-shadow-md">
            "{currentQuestion?.question || "No Question Loaded"}"
          </h2>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full text-xs font-bold uppercase tracking-widest text-blue-200">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>

        {/* Answers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <AnswerCard 
              key={i}
              index={i}
              answer={currentQuestion?.answers[i] || null}
              isRevealed={revealedAnswers.has(i)}
              onReveal={() => handleReveal(i)}
            />
          ))}
        </div>

        {/* Game Controls */}
        <div className="flex justify-between items-center pt-4">
          <button 
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-20 transition-all border border-white/10"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex gap-4">
            <button 
              onClick={handleStrike}
              className="px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest shadow-lg shadow-red-900/40 transition-all active:scale-95 flex items-center gap-2"
            >
              <X size={24} strokeWidth={3} />
              Strike!
            </button>
            <button 
              onClick={() => setActiveTeam(activeTeam === 'A' ? 'B' : 'A')}
              className="px-8 py-4 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-black uppercase tracking-widest shadow-lg shadow-blue-900/40 transition-all active:scale-95 flex items-center gap-2"
            >
              <RotateCcw size={20} />
              Switch
            </button>
          </div>

          <button 
            onClick={nextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-20 transition-all border border-white/10"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Team B Panel */}
      <div className="lg:col-span-3 order-3">
        <motion.div 
          className={cn(
            "p-6 rounded-3xl border-2 transition-all duration-300",
            activeTeam === 'B' 
              ? "bg-blue-600/20 border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.15)] scale-105" 
              : "bg-white/5 border-white/10 opacity-60"
          )}
          onClick={() => setActiveTeam('B')}
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className={activeTeam === 'B' ? "text-blue-400" : "text-gray-500"} />
            <input 
              value={teamB.name}
              onChange={(e) => setTeamB(prev => ({ ...prev, name: e.target.value }))}
              className="bg-transparent border-none font-bold text-xl focus:ring-0 w-full p-0"
              placeholder="Team B Name"
            />
          </div>
          <div className="text-center py-8">
            <div className="text-sm uppercase tracking-widest text-blue-300/60 font-bold mb-1">Score</div>
            <div className="text-6xl font-black text-white tabular-nums">{teamB.score}</div>
          </div>
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-all",
                  i < teamB.strikes ? "bg-red-600/20 border-red-500 text-red-500" : "bg-white/5 border-white/10 text-white/10"
                )}
              >
                <X size={24} strokeWidth={3} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );

  const renderBank = () => (
    <main className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('game')}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-blue-400"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-3xl font-black uppercase tracking-tight">Question <span className="text-blue-400">Bank</span></h2>
        </div>
        <button 
          onClick={() => setEditingQuestion({ id: -1, question: '', answers: [{ text: '', points: 0 }] })}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20"
        >
          <PlusCircle size={20} />
          Add Question
        </button>
      </div>

      {editingQuestion ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6"
        >
          <div>
            <label className="block text-xs font-bold text-blue-300/60 uppercase tracking-widest mb-2">Question Text</label>
            <input 
              value={editingQuestion.question}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-xl font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="What is the question?"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold text-blue-300/60 uppercase tracking-widest">Answers (Max 8)</label>
            {editingQuestion.answers.map((ans, idx) => (
              <div key={idx} className="flex gap-3">
                <input 
                  value={ans.text}
                  onChange={(e) => {
                    const newAns = [...editingQuestion.answers];
                    newAns[idx].text = e.target.value;
                    setEditingQuestion({ ...editingQuestion, answers: newAns });
                  }}
                  className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
                  placeholder={`Answer ${idx + 1}`}
                />
                <input 
                  type="number"
                  value={ans.points}
                  onChange={(e) => {
                    const newAns = [...editingQuestion.answers];
                    newAns[idx].points = parseInt(e.target.value) || 0;
                    setEditingQuestion({ ...editingQuestion, answers: newAns });
                  }}
                  className="w-24 bg-black/20 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none text-center"
                  placeholder="Pts"
                />
                <button 
                  onClick={() => {
                    const newAns = editingQuestion.answers.filter((_, i) => i !== idx);
                    setEditingQuestion({ ...editingQuestion, answers: newAns });
                  }}
                  className="p-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {editingQuestion.answers.length < 8 && (
              <button 
                onClick={() => setEditingQuestion({ ...editingQuestion, answers: [...editingQuestion.answers, { text: '', points: 0 }] })}
                className="w-full py-3 border-2 border-dashed border-white/10 rounded-xl text-blue-300/40 hover:border-blue-500/40 hover:text-blue-400 transition-all font-bold text-sm"
              >
                + Add Answer Slot
              </button>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              onClick={() => saveQuestion(editingQuestion)}
              className="flex-1 py-4 bg-blue-500 hover:bg-blue-400 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} /> Save Question
            </button>
            <button 
              onClick={() => setEditingQuestion(null)}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-white/60 transition-all"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <motion.div 
              key={q.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between group hover:bg-white/10 transition-all"
            >
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">{q.question}</h3>
                <p className="text-xs text-blue-300/40 uppercase tracking-widest font-bold">
                  {q.answers.length} Answers &bull; {q.answers.reduce((acc, a) => acc + a.points, 0)} Total Points
                </p>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setEditingQuestion(q)}
                  className="p-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all"
                >
                  <Settings size={18} />
                </button>
                <button 
                  onClick={() => deleteQuestion(q.id)}
                  className="p-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );

  return (
    <div className="min-h-screen bg-[#0a192f] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-400/10 blur-[120px] rounded-full pointer-events-none" />

      <AnimatePresence>
        {showStrikes !== null && (
          <StrikeOverlay count={showStrikes} onComplete={() => setShowStrikes(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="relative z-10 px-6 py-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">
              Student <span className="text-blue-400">Feud</span>
            </h1>
            <p className="text-xs text-blue-300/60 font-medium tracking-widest uppercase">Campus Edition</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setView(view === 'game' ? 'bank' : 'game')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all",
              view === 'bank' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/40" : "bg-white/5 text-blue-300 hover:bg-white/10"
            )}
          >
            <Database size={16} />
            {view === 'bank' ? "Back to Game" : "Question Bank"}
          </button>
          <button 
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-white/5 transition-colors text-blue-300"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <button 
            onClick={() => setIsHostMode(!isHostMode)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all",
              isHostMode ? "bg-blue-500 text-white shadow-lg shadow-blue-500/40" : "bg-white/5 text-blue-300 hover:bg-white/10"
            )}
          >
            <Settings size={16} />
            {isHostMode ? "Host Mode Active" : "Host Mode"}
          </button>
        </div>
      </header>

      {view === 'game' ? renderGame() : renderBank()}

      {/* Host Controls Panel */}
      <AnimatePresence>
        {isHostMode && view === 'game' && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d213d] border-t-2 border-blue-500/30 p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
          >
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                  <Settings size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Host Controls</h3>
                  <p className="text-xs text-blue-300/60 uppercase tracking-wider">Manage game state manually</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/5">
                  <span className="text-xs font-bold px-2 text-blue-300/60">TEAM A</span>
                  <button onClick={() => setTeamA(p => ({ ...p, score: p.score + 5 }))} className="p-1 hover:bg-white/10 rounded"><Plus size={16}/></button>
                  <button onClick={() => setTeamA(p => ({ ...p, score: Math.max(0, p.score - 5) }))} className="p-1 hover:bg-white/10 rounded"><Minus size={16}/></button>
                  <button onClick={() => setTeamA(p => ({ ...p, strikes: Math.max(0, p.strikes - 1) }))} className="p-1 hover:bg-white/10 rounded text-red-400"><X size={16}/></button>
                </div>
                <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/5">
                  <span className="text-xs font-bold px-2 text-blue-300/60">TEAM B</span>
                  <button onClick={() => setTeamB(p => ({ ...p, score: p.score + 5 }))} className="p-1 hover:bg-white/10 rounded"><Plus size={16}/></button>
                  <button onClick={() => setTeamB(p => ({ ...p, score: Math.max(0, p.score - 5) }))} className="p-1 hover:bg-white/10 rounded"><Minus size={16}/></button>
                  <button onClick={() => setTeamB(p => ({ ...p, strikes: Math.max(0, p.strikes - 1) }))} className="p-1 hover:bg-white/10 rounded text-red-400"><X size={16}/></button>
                </div>
                <div className="h-10 w-px bg-white/10 mx-2" />
                <button 
                  onClick={() => setRevealedAnswers(new Set(currentQuestion.answers.map((_, i) => i)))}
                  className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-xl text-sm font-bold flex items-center gap-2 border border-blue-500/30 transition-all"
                >
                  <Eye size={16} /> Reveal All
                </button>
                <button 
                  onClick={resetBoard}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm font-bold flex items-center gap-2 border border-white/10 transition-all"
                >
                  <RotateCcw size={16} /> Reset Board
                </button>
                <button 
                  onClick={() => {
                    setTeamA(p => ({ ...p, score: 0, strikes: 0 }));
                    setTeamB(p => ({ ...p, score: 0, strikes: 0 }));
                    resetBoard();
                  }}
                  className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-500/20 transition-all"
                >
                  <Trophy size={16} /> Reset Game
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="relative z-10 py-12 text-center text-blue-300/30 text-xs uppercase tracking-[0.2em] font-medium">
        &copy; 2024 Student Feud &bull; Interactive Game Show Experience
      </footer>

      {/* Custom Styles for 3D Flip */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-x-180 {
          transform: rotateX(180deg);
        }
      `}</style>
    </div>
  );
}
