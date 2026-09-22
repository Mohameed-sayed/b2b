import React, { useState, useEffect } from 'react';
import { Game, Question, QuestionOption, QuestionType } from '../../types/game';
import { defaultGames } from '../../data/defaultGames';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { sound } from '../../utils/audio';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Download,
  Upload,
  BookOpen,
  CheckCircle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface AdminEditorProps {
  onBackToHost?: () => void;
}

export const AdminEditor: React.FC<AdminEditorProps> = ({ onBackToHost }) => {
  const [games, setGames] = useState<Game[]>(() => {
    try {
      const saved = localStorage.getItem('ischool_admin_games');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return defaultGames;
  });

  const [selectedGameId, setSelectedGameId] = useState<string>(games[0]?.id || 'game-1');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    games[0]?.questions[0]?.id || ''
  );
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const activeGame = games.find((g) => g.id === selectedGameId) || games[0];
  const activeQuestion =
    activeGame?.questions.find((q) => q.id === selectedQuestionId) || activeGame?.questions[0];

  // Save changes locally & sync
  const handleSaveAll = () => {
    sound.playPop();
    localStorage.setItem('ischool_admin_games', JSON.stringify(games));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);

    // Optional sync to backend API if available
    fetch('http://localhost:3001/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(games),
    }).catch(() => {
      // Backend not running, saved to localStorage
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all workshop games to default content? Any unsaved edits will be discarded.')) {
      sound.playPop();
      setGames(defaultGames);
      localStorage.removeItem('ischool_admin_games');
      setSelectedGameId(defaultGames[0].id);
      setSelectedQuestionId(defaultGames[0].questions[0].id);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(games, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'ischool_b2b_games.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          setGames(parsed);
          setSelectedGameId(parsed[0].id);
          setSelectedQuestionId(parsed[0].questions[0].id);
          sound.playCorrect();
        }
      } catch {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  // Update Game Meta
  const updateGameField = (field: keyof Game, value: any) => {
    setGames((prev) =>
      prev.map((g) => (g.id === selectedGameId ? { ...g, [field]: value } : g))
    );
  };

  // Update Question Field
  const updateQuestionField = (field: keyof Question, value: any) => {
    setGames((prev) =>
      prev.map((g) => {
        if (g.id !== selectedGameId) return g;
        return {
          ...g,
          questions: g.questions.map((q) =>
            q.id === selectedQuestionId ? { ...q, [field]: value } : q
          ),
        };
      })
    );
  };

  // Update Option
  const updateOptionText = (optId: string, text: string) => {
    if (!activeQuestion) return;
    const updatedOptions = activeQuestion.options.map((opt) =>
      opt.id === optId ? { ...opt, text } : opt
    );
    updateQuestionField('options', updatedOptions);
  };

  // Add Option
  const handleAddOption = () => {
    if (!activeQuestion) return;
    const nextChar = String.fromCharCode(65 + activeQuestion.options.length); // E, F...
    const newOption: QuestionOption = { id: nextChar, text: `New Option ${nextChar}` };
    updateQuestionField('options', [...activeQuestion.options, newOption]);
  };

  // Delete Option
  const handleDeleteOption = (optId: string) => {
    if (!activeQuestion || activeQuestion.options.length <= 2) return;
    updateQuestionField(
      'options',
      activeQuestion.options.filter((o) => o.id !== optId)
    );
  };

  // Add Question
  const handleAddQuestion = () => {
    const newQId = `q-${Date.now()}`;
    const newQ: Question = {
      id: newQId,
      type: 'multiple-choice',
      title: 'New Workshop Scenario',
      scenario: 'Enter situation details here...',
      options: [
        { id: 'A', text: 'Option A' },
        { id: 'B', text: 'Option B' },
        { id: 'C', text: 'Option C' },
        { id: 'D', text: 'Option D' },
      ],
      correctAnswer: 'B',
      points: 1000,
      timeLimit: 30,
      explanation: 'Explain why this choice builds instructor credibility.',
      learningObjective: 'Core workplace principle.',
      discussionQuestion: 'What would happen if you chose differently?',
    };

    setGames((prev) =>
      prev.map((g) =>
        g.id === selectedGameId ? { ...g, questions: [...g.questions, newQ] } : g
      )
    );
    setSelectedQuestionId(newQId);
  };

  // Delete Question
  const handleDeleteQuestion = (qId: string) => {
    if (!activeGame || activeGame.questions.length <= 1) {
      alert('A game must contain at least one question.');
      return;
    }
    const remaining = activeGame.questions.filter((q) => q.id !== qId);
    setGames((prev) =>
      prev.map((g) => (g.id === selectedGameId ? { ...g, questions: remaining } : g))
    );
    setSelectedQuestionId(remaining[0].id);
  };

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark font-sans p-6 md:p-10 max-w-7xl mx-auto pb-24">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-4">
          {onBackToHost && (
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={onBackToHost}
            >
              Host View
            </Button>
          )}
          <div className="w-10 h-10 rounded-2xl bg-brand-accent/20 text-orange-400 flex items-center justify-center font-bold">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-dark font-display flex items-center gap-2">
              Workshop Content Editor & Admin
              <Badge variant="orange" size="sm">ADMIN</Badge>
            </h1>
            <p className="text-xs text-brand-secondary">
              Customize scenarios, options, correct answers, time limits, and facilitator debrief notes
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={handleResetDefaults}
          >
            Reset Defaults
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportJSON}
          >
            Export JSON
          </Button>

          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-700 text-xs font-bold text-brand-dark transition-colors">
            <Upload className="w-4 h-4" />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>

          <Button
            variant="orange"
            size="md"
            icon={<Save className="w-4 h-4" />}
            onClick={handleSaveAll}
            className="shadow-lg shadow-brand-accent/20"
          >
            {saveSuccess ? 'Saved ✓' : 'Save Changes'}
          </Button>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 items-start">
        {/* Left Column: Games & Question Tree Navigation */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-3xl bg-brand-white border border-slate-200 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-secondary">
                Workshop Games ({games.length})
              </h3>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {games.map((g) => {
                const isSelected = g.id === selectedGameId;
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGameId(g.id);
                      setSelectedQuestionId(g.questions[0]?.id || '');
                    }}
                    className={`w-full text-left p-3 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between ${isSelected ? 'border-brand-accent bg-brand-accent/15 text-orange-300' : 'border-slate-200 bg-brand-light/60 text-brand-dark hover:bg-slate-100'}`}
                  >
                    <span className="truncate">{g.title}</span>
                    <span className="font-mono text-[10px] text-brand-secondary shrink-0 ml-2">
                      {g.questions.length} Qs
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question List within Selected Game */}
          <div className="rounded-3xl bg-brand-white border border-slate-200 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-secondary">
                Scenarios in "{activeGame?.title}"
              </h3>
              <Button
                variant="ghost"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddQuestion}
              >
                Add
              </Button>
            </div>

            <div className="space-y-2">
              {activeGame?.questions.map((q, idx) => {
                const isSelected = q.id === selectedQuestionId;
                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${isSelected ? 'border-brand-primary bg-brand-primary/15 text-blue-300 font-bold' : 'border-slate-200 bg-brand-light/60 text-brand-dark hover:bg-slate-850'}`}
                  >
                    <button
                      onClick={() => setSelectedQuestionId(q.id)}
                      className="flex-1 text-left truncate text-xs"
                    >
                      {idx + 1}. {q.title}
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="p-1 text-brand-secondary hover:text-rose-400 transition-colors ml-2"
                      title="Delete question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Question Editor Form */}
        <div className="lg:col-span-8">
          {activeQuestion ? (
            <div className="rounded-3xl bg-brand-white border border-slate-200 p-6 md:p-8 shadow-2xl space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <span className="text-[10px] font-mono font-bold text-orange-400 tracking-wider">
                    EDITING SCENARIO
                  </span>
                  <h2 className="text-xl font-black text-brand-dark">
                    {activeQuestion.title}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {/* Question Type */}
                  <select
                    value={activeQuestion.type}
                    onChange={(e) => updateQuestionField('type', e.target.value as QuestionType)}
                    className="rounded-xl bg-brand-light border border-slate-300 px-3 py-1.5 text-xs font-bold text-brand-dark focus:outline-none"
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="voting">WhatsApp Court (Voting)</option>
                    <option value="categorization">Triage (Own / Support / Escalate)</option>
                    <option value="rapid-response">Rapid Response</option>
                    <option value="reflection">Reflection</option>
                  </select>
                </div>
              </div>

              {/* Title & Timing / Points */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-secondary mb-1.5">
                    Scenario Title
                  </label>
                  <input
                    type="text"
                    value={activeQuestion.title}
                    onChange={(e) => updateQuestionField('title', e.target.value)}
                    className="w-full rounded-xl bg-brand-light border border-slate-300 px-4 py-2.5 text-sm font-bold text-brand-dark focus:border-brand-accent focus:outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-secondary mb-1.5">
                    Time Limit (sec)
                  </label>
                  <input
                    type="number"
                    value={activeQuestion.timeLimit}
                    onChange={(e) => updateQuestionField('timeLimit', parseInt(e.target.value) || 30)}
                    className="w-full rounded-xl bg-brand-light border border-slate-300 px-4 py-2.5 text-sm font-mono font-bold text-brand-dark focus:border-brand-accent focus:outline-none"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-secondary mb-1.5">
                    Points
                  </label>
                  <input
                    type="number"
                    value={activeQuestion.points}
                    onChange={(e) => updateQuestionField('points', parseInt(e.target.value) || 1000)}
                    className="w-full rounded-xl bg-brand-light border border-slate-300 px-4 py-2.5 text-sm font-mono font-bold text-brand-dark focus:border-brand-accent focus:outline-none"
                  />
                </div>
              </div>

              {/* Scenario Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-secondary mb-1.5">
                  Scenario Description & Workplace Context
                </label>
                <textarea
                  rows={4}
                  value={activeQuestion.scenario}
                  onChange={(e) => updateQuestionField('scenario', e.target.value)}
                  className="w-full rounded-xl bg-brand-light border border-slate-300 p-3.5 text-sm text-brand-dark font-medium leading-relaxed focus:border-brand-accent focus:outline-none"
                />
              </div>

              {/* Options & Correct Answer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-secondary">
                    Options & Correct Answer Selection
                  </label>
                  <Button variant="ghost" size="sm" onClick={handleAddOption}>
                    + Add Option
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {activeQuestion.options.map((opt) => {
                    const isCorrect = opt.id === activeQuestion.correctAnswer;
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${isCorrect ? 'border-green-600 bg-emerald-950/20' : 'border-slate-200 bg-brand-light'}`}
                      >
                        <button
                          type="button"
                          onClick={() => updateQuestionField('correctAnswer', opt.id)}
                          className={`w-9 h-9 rounded-xl font-mono font-black text-xs flex items-center justify-center transition-all ${isCorrect ? 'bg-green-600 text-brand-dark shadow-md' : 'bg-slate-100 text-brand-secondary hover:text-brand-dark'}`}
                          title={isCorrect ? 'Correct answer' : 'Click to set as correct answer'}
                        >
                          {opt.id}
                        </button>

                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => updateOptionText(opt.id, e.target.value)}
                          className="flex-1 bg-transparent border-none text-sm text-brand-dark focus:outline-none font-medium"
                        />

                        {isCorrect && (
                          <span className="text-[10px] font-black uppercase text-emerald-400 bg-green-600/15 px-2 py-0.5 rounded-full border border-green-600/30">
                            CORRECT
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteOption(opt.id)}
                          disabled={activeQuestion.options.length <= 2}
                          className="text-slate-600 hover:text-rose-400 disabled:opacity-20 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Rationale & Explanation */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-secondary mb-1.5">
                  Rationale & Explanation (Revealed after answers)
                </label>
                <textarea
                  rows={2}
                  value={activeQuestion.explanation}
                  onChange={(e) => updateQuestionField('explanation', e.target.value)}
                  className="w-full rounded-xl bg-brand-light border border-slate-300 p-3 text-sm text-brand-dark focus:border-brand-accent focus:outline-none"
                />
              </div>

              {/* Facilitator Debrief Section */}
              <div className="p-5 rounded-2xl bg-orange-950/20 border border-brand-accent/30 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-orange-400">
                  Facilitator Debrief Settings
                </h4>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-secondary mb-1">
                    Learning Objective
                  </label>
                  <input
                    type="text"
                    value={activeQuestion.learningObjective}
                    onChange={(e) => updateQuestionField('learningObjective', e.target.value)}
                    className="w-full rounded-xl bg-brand-light border border-slate-300 px-3 py-2 text-xs text-brand-dark focus:border-brand-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-secondary mb-1">
                    Discussion Question for the Room
                  </label>
                  <input
                    type="text"
                    value={activeQuestion.discussionQuestion || ''}
                    onChange={(e) => updateQuestionField('discussionQuestion', e.target.value)}
                    className="w-full rounded-xl bg-brand-light border border-slate-300 px-3 py-2 text-xs text-brand-dark focus:border-brand-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-secondary mb-1">
                    Facilitator Pro Tips (Notes for the host)
                  </label>
                  <input
                    type="text"
                    value={activeQuestion.facilitatorTips || ''}
                    onChange={(e) => updateQuestionField('facilitatorTips', e.target.value)}
                    className="w-full rounded-xl bg-brand-light border border-slate-300 px-3 py-2 text-xs text-brand-dark focus:border-brand-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-brand-secondary">
              Select a question from the left sidebar to edit its scenario and options.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

