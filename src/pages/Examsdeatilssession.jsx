// src/pages/client/ExamDetailPage.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { db, auth } from "../firebase/config";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { XCircle, CheckCircle, Flag, StickyNote, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

// ─── Toast ─────────────────────────────────────────────────────────────────
const Toast = ({ message, type = "error", onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -24 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -24 }}
    transition={{ duration: 0.3 }}
    className={`fixed top-4 left-1/2 -translate-x-1/2 px-5 py-3 text-white rounded-2xl shadow-2xl flex items-center gap-3 z-[999] max-w-sm w-11/12 sm:w-auto ring-4 ${
      type === "success" ? "bg-emerald-600 ring-emerald-400" : "bg-red-600 ring-red-400"
    }`}
  >
    {type === "success" ? <CheckCircle size={20} /> : <XCircle size={20} />}
    <span className="font-medium text-sm flex-1">{message}</span>
    <button onClick={onClose} className="ml-1 p-0.5 rounded-full hover:opacity-75 transition">
      <XCircle size={15} />
    </button>
  </motion.div>
);

// ─── Confirm Dialog ─────────────────────────────────────────────────────────
const ConfirmDialog = ({ onConfirm, onCancel, unanswered, theme }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/60 z-[998] flex items-center justify-center p-4"
  >
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      className={`rounded-2xl p-6 shadow-2xl max-w-sm w-full ${
        theme === "dark" ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800"
      }`}
    >
      <h3 className="text-lg font-bold mb-2">⚠️ Terminer l'examen ?</h3>
      {unanswered > 0 && (
        <p className={`text-sm mb-4 ${theme === "dark" ? "text-orange-400" : "text-orange-600"}`}>
          Vous avez <strong>{unanswered}</strong> question(s) sans réponse.
        </p>
      )}
      <p className={`text-sm mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
        Cette action est irréversible. Êtes-vous sûr ?
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
            theme === "dark" ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          }`}
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
        >
          Terminer
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Question Navigator Mini-Map ────────────────────────────────────────────
const QuestionNav = ({ questions, currentQuestion, selectedAnswers, onJump, theme }) => (
  <div className={`w-full max-w-3xl mb-4 p-3 rounded-2xl border flex flex-wrap gap-2 ${
    theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-green-200"
  }`}>
    {questions.map((_, i) => {
      const answered = (selectedAnswers[i] || []).length > 0;
      const isCurrent = i === currentQuestion;
      return (
        <button
          key={i}
          onClick={() => onJump(i)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
            isCurrent
              ? "bg-green-500 text-white ring-2 ring-green-300 scale-110"
              : answered
              ? theme === "dark" ? "bg-emerald-700 text-white" : "bg-emerald-100 text-emerald-800"
              : theme === "dark" ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
          }`}
        >
          {i + 1}
        </button>
      );
    })}
  </div>
);

export default function ExamDetailPage() {
  const { theme }  = useTheme();
  const { id }     = useParams();
  const navigate   = useNavigate();
  const userId     = auth.currentUser?.uid;

  // ─── State ─────────────────────────────────────────────────────────────────
  const [session, setSession]                 = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [finished, setFinished]               = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [notes, setNotes]                     = useState({});
  const [noteInput, setNoteInput]             = useState("");
  const [reportMsg, setReportMsg]             = useState("");
  const [searchTerm, setSearchTerm]           = useState("");
  const [notInterested, setNotInterested]     = useState({});
  const [toast, setToast]                     = useState(null);
  const [showNavMap, setShowNavMap]           = useState(false);
  const [isSaving, setIsSaving]               = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(60 * 30);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef                = useRef(null);
  // Ref so timer closure always reads fresh answers
  const selectedAnswersRef      = useRef({});
  // Ref so finishExam closure reads fresh session
  const sessionRef              = useRef(null);

  // ─── Toast helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Keep refs in sync
  useEffect(() => { selectedAnswersRef.current = selectedAnswers; }, [selectedAnswers]);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // ─── Fetch + restore ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !id) return;

    const fetchSession = async () => {
      try {
        const ref  = doc(db, "users", userId, "exams", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) { setLoading(false); return; }

        const data      = snap.data();
        // Support both root-level questions and legacy courses[0].questions
        let questions   = data.questions || [];
        if (!questions.length && data.courses?.[0]?.questions) {
          questions = data.courses[0].questions;
        }

        const built = { ...data, questions };
        setSession(built);
        sessionRef.current = built;

        // Notes map
        const notesMap = {};
        (data.notes || []).forEach((n) => { notesMap[n.questionId] = n.note; });
        setNotes(notesMap);

        // Already finished — show review
        if (data.finished) {
          setFinished(true);
          const saved = data.progress?.selectedAnswers || {};
          setSelectedAnswers(saved);
          selectedAnswersRef.current = saved;
          setLoading(false);
          return;
        }

        // Restore timer (saved > totalTime fallback > 30 min)
        setTimeLeft(data.progress?.timeLeft ?? data.totalTime ?? 1800);

        // Restore question index + answers
        if (data.progress?.currentQuestion != null) {
          const idx    = data.progress.currentQuestion;
          const saved  = data.progress.selectedAnswers || {};
          setCurrentQuestion(idx);
          setSelectedAnswers(saved);
          selectedAnswersRef.current = saved;
          setNoteInput(notesMap[idx] || "");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        showToast("Erreur lors du chargement.");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [userId, id, showToast]);

  // ─── Timer ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (finished) { clearInterval(timerRef.current); return; }
    if (loading)  return; // don't start timer before data is ready

    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            // Use refs so closure has fresh data
            finishExam(selectedAnswersRef.current, sessionRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [isPaused, finished, loading]); // eslint-disable-line

  // Auto-save progress every 30 seconds while exam is running
  useEffect(() => {
    if (finished || loading || isPaused) return;
    const interval = setInterval(() => {
      saveProgress(currentQuestion, selectedAnswersRef.current, timeLeft);
    }, 30_000);
    return () => clearInterval(interval);
  }, [finished, loading, isPaused, currentQuestion, timeLeft]); // eslint-disable-line

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const timerColorClass = () => {
    if (timeLeft <= 60)  return "text-red-500 animate-pulse";
    if (timeLeft <= 300) return theme === "dark" ? "text-orange-400" : "text-orange-500";
    return theme === "dark" ? "text-emerald-400" : "text-green-700";
  };

  const unansweredCount = (qs) =>
    qs.filter((_, i) => (selectedAnswers[i] || []).length === 0).length;

  // ─── Save progress ─────────────────────────────────────────────────────────
  const saveProgress = useCallback(async (questionIndex, answers, time) => {
    if (!userId || !id) return;
    try {
      setIsSaving(true);
      await updateDoc(doc(db, "users", userId, "exams", id), {
        progress: {
          currentQuestion: questionIndex,
          selectedAnswers: answers,
          timeLeft:        time,
          savedAt:         new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  }, [userId, id]);

  // ─── Score computation ─────────────────────────────────────────────────────
  const computeScores = useCallback((answers, qs) => {
    if (!qs?.length) return { toutRien: "0.00", partiel: "0.00", negatif: "0.00" };

    let scoreTR = 0, scoreP = 0, scoreN = 0;

    qs.forEach((q, i) => {
      const userAns = answers[i] || [];
      const correct = Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer];

      // Tout ou Rien
      const allCorrect = correct.length === userAns.length && correct.every((c) => userAns.includes(c));
      if (allCorrect) scoreTR += 1;

      // Partiel
      const numCorrect = userAns.filter((a) => correct.includes(a)).length;
      const partial    = correct.length > 0 ? numCorrect / correct.length : 0;
      scoreP += partial;

      // Partiel Négatif (floor at 0 per question)
      const numWrong = userAns.filter((a) => !correct.includes(a)).length;
      scoreN += Math.max(0, partial - 0.25 * numWrong);
    });

    const n = qs.length;
    return {
      toutRien: ((scoreTR / n) * 20).toFixed(2),
      partiel:  ((scoreP  / n) * 20).toFixed(2),
      negatif:  ((scoreN  / n) * 20).toFixed(2),
    };
  }, []);

  // ─── Finish exam ───────────────────────────────────────────────────────────
  const finishExam = useCallback(async (answers, sess) => {
    setFinished(true);
    clearInterval(timerRef.current);

    const qs     = sess?.questions || [];
    const scores = computeScores(answers, qs);

    try {
      await updateDoc(doc(db, "users", userId, "exams", id), {
        finished:        true,
        score_tout_rien: Number(scores.toutRien),
        score_partiel:   Number(scores.partiel),
        score_negatif:   Number(scores.negatif),
        updatedAt:       new Date(),
        // keep answers for review, wipe navigation progress
        progress:        { selectedAnswers: answers },
      });
      setSelectedAnswers(answers);
      selectedAnswersRef.current = answers;
    } catch (err) {
      console.error("Finish error:", err);
      showToast("Erreur lors de l'enregistrement.");
    }
  }, [userId, id, computeScores, showToast]);

  // ─── Guards ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent" />
    </div>
  );

  if (!auth.currentUser) {
    navigate("/login");
    return null;
  }

  if (!session) return (
    <p className={`text-center mt-16 text-lg ${theme === "dark" ? "text-red-400" : "text-red-600"}`}>
      Session introuvable ❌
    </p>
  );

  const questions   = session.questions || [];

  if (questions.length === 0) return (
    <p className={`text-center mt-16 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
      Cette session ne contient aucune question.
    </p>
  );

  const current     = questions[currentQuestion];
  const finalScores = computeScores(selectedAnswers, questions);
  const isMulti     = Array.isArray(current?.correct_answer);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleAnswer = (optionKey) => {
    setSelectedAnswers((prev) => {
      const prevSel    = prev[currentQuestion] || [];
      const newSel     = prevSel.includes(optionKey)
        ? prevSel.filter((a) => a !== optionKey)
        : [...prevSel, optionKey];
      const next = { ...prev, [currentQuestion]: newSel };
      selectedAnswersRef.current = next;
      return next;
    });
  };

  const jumpToQuestion = async (idx) => {
    await saveProgress(idx, selectedAnswers, timeLeft);
    setCurrentQuestion(idx);
    setNoteInput(notes[idx] || "");
    setReportMsg("");
    setSearchTerm("");
    setShowNavMap(false);
  };

  const handleNext = async () => {
    if (currentQuestion + 1 < questions.length) {
      await jumpToQuestion(currentQuestion + 1);
    } else {
      setShowConfirm(true);
    }
  };

  const handlePrev = async () => {
    if (currentQuestion > 0) await jumpToQuestion(currentQuestion - 1);
  };

  const handleConfirmFinish = async () => {
    setShowConfirm(false);
    await finishExam(selectedAnswers, session);
  };

  const handleSaveNote = async () => {
    if (!noteInput.trim()) { showToast("Écrivez une note avant de sauvegarder."); return; }
    try {
      await updateDoc(doc(db, "users", userId, "exams", id), {
        notes: arrayUnion({
          questionId:   currentQuestion,
          questionText: current.question_text,
          note:         noteInput,
          user:         userId,
          timestamp:    new Date().toISOString(),
        }),
      });
      setNotes((prev) => ({ ...prev, [currentQuestion]: noteInput }));
      showToast("Note enregistrée ✅", "success");
    } catch (err) {
      console.error("Note error:", err);
      showToast("Erreur lors de l'enregistrement de la note.");
    }
  };

  const handleReport = async () => {
    if (!reportMsg.trim()) { showToast("Écrivez un message pour le rapport."); return; }
    try {
      await updateDoc(doc(db, "users", userId, "exams", id), {
        reports: arrayUnion({
          questionId:   currentQuestion,
          questionText: current.question_text,
          message:      reportMsg,
          user:         userId,
          timestamp:    new Date().toISOString(),
        }),
      });
      setReportMsg("");
      showToast("Rapport envoyé ✅", "success");
    } catch (err) {
      console.error("Report error:", err);
      showToast("Erreur lors de l'envoi du rapport.");
    }
  };

  const toggleNotInterested = (key) => {
    setNotInterested((prev) => ({
      ...prev,
      [currentQuestion]: {
        ...(prev[currentQuestion] || {}),
        [key]: !prev[currentQuestion]?.[key],
      },
    }));
  };

  const handleRestart = async () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    selectedAnswersRef.current = {};
    setFinished(false);
    setTimeLeft(session.totalTime ?? 1800);
    setNoteInput(notes[0] || "");
    setNotInterested({});
    try {
      await updateDoc(doc(db, "users", userId, "exams", id), {
        finished:        false,
        progress:        null,
        score_tout_rien: null,
        score_partiel:   null,
        score_negatif:   null,
      });
    } catch (err) {
      console.error("Restart error:", err);
    }
  };

  // ─── Option styling ────────────────────────────────────────────────────────
  const getOptionClass = (key) => {
    const sel      = selectedAnswers[currentQuestion] || [];
    const isNotInt = notInterested[currentQuestion]?.[key];

    if (isNotInt)           return theme === "dark" ? "bg-gray-700 text-gray-600 opacity-40 cursor-default" : "bg-gray-100 text-gray-400 opacity-40 cursor-default";
    if (sel.includes(key))  return theme === "dark" ? "bg-blue-700 border-2 border-blue-400 text-white" : "bg-blue-100 border-2 border-blue-400 text-blue-900";
    return theme === "dark" ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-green-50 hover:bg-green-100 text-gray-700";
  };

  // ─── Search ────────────────────────────────────────────────────────────────
  const filteredWithIndex = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) =>
      q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.source?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const answeredCount = Object.keys(selectedAnswers).filter((k) => selectedAnswers[k]?.length > 0).length;

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="flex flex-col items-center min-h-screen p-4 md:p-6 pb-10"
      style={{ background: theme === "dark" ? "none" : "linear-gradient(180deg, #ffffff 0%, #d4f8d4 100%)" }}
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      {/* Confirm dialog */}
      <AnimatePresence>
        {showConfirm && (
          <ConfirmDialog
            onConfirm={handleConfirmFinish}
            onCancel={() => setShowConfirm(false)}
            unanswered={unansweredCount(questions)}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* ── Timer bar ─────────────────────────────────────────────────────── */}
      {!finished && (
        <div className={`w-full max-w-3xl mb-4 flex items-center gap-3 p-3 rounded-2xl shadow ${
          theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-green-200"
        }`}>
          <span className={`text-xl font-bold tabular-nums min-w-[72px] ${timerColorClass()}`}>
            ⏰ {formatTime(timeLeft)}
          </span>

          {/* Progress bar for timer */}
          <div className={`flex-1 h-2 rounded-full overflow-hidden ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}>
            <motion.div
              className={`h-2 rounded-full transition-colors ${
                timeLeft <= 60 ? "bg-red-500" : timeLeft <= 300 ? "bg-orange-400" : "bg-green-500"
              }`}
              animate={{ width: `${(timeLeft / (session.totalTime ?? 1800)) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>

          {/* Auto-save indicator */}
          {isSaving && (
            <span className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
              💾 Sauvegarde...
            </span>
          )}

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium shadow transition-colors ${
              theme === "dark" ? "bg-yellow-600 hover:bg-yellow-500 text-white" : "bg-yellow-400 hover:bg-yellow-500 text-white"
            }`}
          >
            {isPaused ? "▶ Reprendre" : "⏸ Pause"}
          </button>

          {/* Finish early button */}
          <button
            onClick={() => setShowConfirm(true)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow transition-colors"
          >
            Terminer
          </button>
        </div>
      )}

      {/* ── Question Navigator toggle ────────────────────────────────────── */}
      {!finished && (
        <div className="w-full max-w-3xl mb-2 flex justify-between items-center">
          <button
            onClick={() => setShowNavMap(!showNavMap)}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              theme === "dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {showNavMap ? "▲ Masquer navigation" : "▼ Navigation des questions"}
          </button>
          <span className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            {answeredCount} / {questions.length} réponses
          </span>
        </div>
      )}

      <AnimatePresence>
        {showNavMap && !finished && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-3xl overflow-hidden mb-2"
          >
            <QuestionNav
              questions={questions}
              currentQuestion={currentQuestion}
              selectedAnswers={selectedAnswers}
              onJump={jumpToQuestion}
              theme={theme}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Search bar ────────────────────────────────────────────────────── */}
      <div className="w-full max-w-3xl mb-3 relative">
        <input
          type="text"
          placeholder="🔍 Rechercher une question ou source..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full p-3 rounded-xl border shadow-sm outline-none transition-colors ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
              : "border-green-200 bg-white"
          }`}
        />

        {/* Search results dropdown */}
        <AnimatePresence>
          {searchTerm && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className={`absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl border z-50 max-h-52 overflow-y-auto ${
                theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}
            >
              {filteredWithIndex.length > 0 ? filteredWithIndex.map(({ q, i }) => (
                <div
                  key={i}
                  onClick={() => jumpToQuestion(i)}
                  className={`px-4 py-2.5 cursor-pointer text-sm border-b last:border-b-0 transition-colors ${
                    theme === "dark"
                      ? "border-gray-700 text-gray-300 hover:bg-gray-700"
                      : "border-gray-100 text-gray-700 hover:bg-green-50"
                  }`}
                >
                  <span className="font-semibold mr-1 text-green-500">{i + 1}.</span>
                  {q.question_text.length > 80 ? q.question_text.slice(0, 80) + "…" : q.question_text}
                  {q.source && <span className={`ml-2 text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>({q.source})</span>}
                </div>
              )) : (
                <p className="px-4 py-3 text-sm text-gray-500">Aucun résultat ❌</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Main card ─────────────────────────────────────────────────────── */}
      <motion.div
        className={`w-full max-w-3xl rounded-2xl shadow-xl border transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-green-200"
        }`}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {!finished ? (
          // ─── EXAM IN PROGRESS ──────────────────────────────────────────
          <div className="p-6 md:p-8">
            {/* Progress bar */}
            <div className={`w-full rounded-full h-4 mb-2 overflow-hidden relative ${theme === "dark" ? "bg-gray-700" : "bg-green-100"}`}>
              <motion.div
                className="h-4 bg-green-500"
                animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
              <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${theme === "dark" ? "text-gray-100" : "text-green-900"}`}>
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>

            <h1 className={`text-xl font-bold mb-1 text-center ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>
              {session.title || "Examen"}
            </h1>

            {current?.source && (
              <p className={`text-xs italic text-center mb-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                📌 {current.source}
              </p>
            )}

            {/* Question image */}
            {current?.question_image_url && (
              <div className="mb-5">
                <img
                  src={current.question_image_url}
                  alt="Question"
                  className="max-h-64 w-full object-contain rounded-xl shadow mx-auto"
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              </div>
            )}

            {/* Statements */}
            {current?.statements?.length > 0 && (
              <div className={`mb-4 p-4 rounded-xl text-left ${theme === "dark" ? "bg-gray-900 border border-gray-700" : "bg-gray-50 border border-gray-200"}`}>
                <p className={`text-sm font-semibold mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>📋 Déclarations :</p>
                <ul className={`space-y-1 text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  {current.statements.map((s, i) => <li key={i}>• {s}</li>)}
                </ul>
              </div>
            )}

            {/* Multi-select badge */}
            {isMulti && (
              <p className={`text-xs mb-3 font-semibold ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}>
                ☑ Sélection multiple — {current.correct_answer.length} bonne(s) réponse(s)
              </p>
            )}

            <h2 className={`text-lg font-semibold mb-4 text-left leading-snug ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
              {currentQuestion + 1}. {current?.question_text}
            </h2>

            {/* Options */}
            <div className="grid grid-cols-1 gap-2.5 mb-5">
              {["A", "B", "C", "D", "E"].map((key) => {
                const val = current?.options?.[key];
                if (!val) return null;
                const isSelected = (selectedAnswers[currentQuestion] || []).includes(key);
                return (
                  <div key={key} className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleAnswer(key)}
                      disabled={!!notInterested[currentQuestion]?.[key]}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-left shadow-sm transition-all duration-200 ${getOptionClass(key)}`}
                    >
                      <span className="mr-2">{isSelected ? "☑" : "○"}</span>
                      {key}. {val}
                    </motion.button>
                    <button
                      onClick={() => toggleNotInterested(key)}
                      title="Exclure cette option"
                      className={`px-2.5 py-2 rounded-lg text-xs font-bold transition-colors ${
                        notInterested[currentQuestion]?.[key]
                          ? "bg-red-500 text-white"
                          : theme === "dark" ? "bg-gray-700 text-gray-400 hover:bg-gray-600" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {notInterested[currentQuestion]?.[key] ? "↩" : "✕"}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Notes & Report */}
            <div className={`p-4 rounded-xl border mb-5 ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              {/* Note */}
              <div className="flex items-center gap-2 mb-1">
                <StickyNote size={14} className={theme === "dark" ? "text-gray-400" : "text-gray-500"} />
                <p className={`text-xs font-semibold ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Ma note</p>
              </div>
              <textarea
                rows={2}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Ajouter une note sur cette question..."
                className={`w-full p-2 rounded-lg border outline-none resize-none text-sm transition-colors ${
                  theme === "dark" ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500" : "border-gray-200 bg-white"
                }`}
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleSaveNote}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg shadow transition-colors"
                >
                  💾 Sauvegarder
                </button>
                {notes[currentQuestion] && (
                  <span className={`text-xs truncate max-w-[200px] ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                    Note : {notes[currentQuestion]}
                  </span>
                )}
              </div>

              {/* Report */}
              <div className="mt-3 border-t pt-3 border-dashed">
                <div className="flex items-center gap-2 mb-1">
                  <Flag size={13} className="text-red-400" />
                  <p className={`text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Signaler un problème</p>
                </div>
                <textarea
                  rows={1}
                  value={reportMsg}
                  onChange={(e) => setReportMsg(e.target.value)}
                  placeholder="Décrivez le problème..."
                  className={`w-full p-2 rounded-lg border outline-none resize-none text-sm transition-colors ${
                    theme === "dark" ? "bg-gray-800 border-red-900 text-gray-100 placeholder-gray-600" : "border-red-200 bg-white"
                  }`}
                />
                <button
                  onClick={handleReport}
                  className="mt-1.5 bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg shadow transition-colors"
                >
                  🚨 Envoyer
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={handlePrev}
                disabled={currentQuestion === 0}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl font-semibold shadow transition-colors ${
                  currentQuestion === 0
                    ? theme === "dark" ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : theme === "dark" ? "bg-green-600 hover:bg-green-500 text-white" : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                <ChevronLeft size={18} /> Précédent
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={handleNext}
                className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2 rounded-xl shadow transition-colors"
              >
                {currentQuestion + 1 < questions.length ? (
                  <> Suivant <ChevronRight size={18} /></>
                ) : (
                  "Terminer 🎉"
                )}
              </motion.button>
            </div>
          </div>

        ) : (
          // ─── FINISHED / REVIEW ────────────────────────────────────────
          <motion.div
            className="p-6 md:p-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45 }}
          >
            <h2 className={`text-3xl font-bold mb-6 text-center ${theme === "dark" ? "text-emerald-400" : "text-gray-800"}`}>
              🎉 Examen terminé !
            </h2>

            {/* Score cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Tout ou Rien", value: finalScores.toutRien, col: "green"  },
                { label: "Partiel",      value: finalScores.partiel,  col: "yellow" },
                { label: "Partiel Nég.", value: finalScores.negatif,  col: "red"    },
              ].map(({ label, value, col }) => (
                <div key={label} className={`rounded-2xl p-5 text-center ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-50 border border-gray-200"
                }`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    {label}
                  </p>
                  <p className={`text-4xl font-extrabold text-${col}-500`}>{value}</p>
                  <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>/ 20</p>
                </div>
              ))}
            </div>

            {/* Stats summary */}
            <div className={`flex justify-around text-center p-4 rounded-xl mb-6 ${theme === "dark" ? "bg-gray-700" : "bg-gray-50 border border-gray-200"}`}>
              {[
                { label: "Correctes",    value: questions.filter((q, i) => { const c = Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]; const u = selectedAnswers[i] || []; return c.length === u.length && c.every(x => u.includes(x)); }).length, color: "text-green-500" },
                { label: "Incorrectes",  value: questions.filter((q, i) => { const c = Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer]; const u = selectedAnswers[i] || []; return u.length > 0 && !(c.length === u.length && c.every(x => u.includes(x))); }).length, color: "text-red-500" },
                { label: "Sans réponse", value: questions.filter((_, i) => (selectedAnswers[i] || []).length === 0).length, color: "text-gray-400" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p className={`text-2xl font-bold ${color}`}>{value}</p>
                  <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
                </div>
              ))}
            </div>

            {/* Full correction */}
            <div className={`text-left space-y-5 p-4 rounded-xl border ${theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
              <p className={`text-base font-bold ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>📋 Correction complète</p>

              {questions.map((q, i) => {
                const correct        = Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer];
                const userSelected   = selectedAnswers[i] || [];
                const isFullCorrect  = correct.length === userSelected.length && correct.every((c) => userSelected.includes(c));
                const noAnswer       = userSelected.length === 0;

                return (
                  <div key={i} className={`p-4 rounded-xl border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    {/* Status badge */}
                    <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full mb-2 ${
                      isFullCorrect ? "bg-green-500 text-white"
                      : noAnswer    ? "bg-gray-400 text-white"
                      :               "bg-red-500 text-white"
                    }`}>
                      {isFullCorrect ? "✅ Correct" : noAnswer ? "— Sans réponse" : "❌ Incorrect"}
                    </span>

                    {q.source && <p className={`text-xs italic mb-1 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>📌 {q.source}</p>}

                    {/* Image in review */}
                    {q.question_image_url && (
                      <img
                        src={q.question_image_url} alt=""
                        className="max-h-40 object-contain rounded-lg mb-3 mx-auto"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}

                    {/* Statements in review */}
                    {q.statements?.length > 0 && (
                      <div className={`mb-2 p-2 rounded-lg text-xs ${theme === "dark" ? "bg-gray-900 text-gray-400" : "bg-gray-50 text-gray-500"}`}>
                        {q.statements.map((s, si) => <p key={si}>• {s}</p>)}
                      </div>
                    )}

                    <p className={`font-semibold mb-2 text-sm ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>
                      {i + 1}. {q.question_text}
                    </p>

                    {/* Options with result coloring */}
                    <div className="space-y-1 mb-2">
                      {["A", "B", "C", "D", "E"].map((key) => {
                        const val        = q.options?.[key];
                        if (!val) return null;
                        const isCorrect  = correct.includes(key);
                        const isSelected = userSelected.includes(key);

                        let cls  = theme === "dark" ? "text-gray-500" : "text-gray-400";
                        let icon = "  ";
                        if (isCorrect && isSelected)  { cls = "text-green-500 font-semibold"; icon = "✅"; }
                        else if (isCorrect)            { cls = "text-green-500 font-semibold"; icon = "✅"; }
                        else if (isSelected)           { cls = "text-red-500";                 icon = "❌"; }

                        return (
                          <p key={key} className={`ml-3 text-sm ${cls}`}>{icon} {key}. {val}</p>
                        );
                      })}
                    </div>

                    {/* Justification */}
                    {(q.justification_text || q.justification_image_url) && (
                      <div className={`mt-3 p-3 rounded-xl border-l-4 border-emerald-500 ${theme === "dark" ? "bg-gray-900" : "bg-emerald-50"}`}>
                        <p className={`text-xs font-semibold mb-1 ${theme === "dark" ? "text-emerald-400" : "text-emerald-700"}`}>📖 Justification</p>
                        {q.justification_text && (
                          <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>{q.justification_text}</p>
                        )}
                        {q.justification_image_url && (
                          <img src={q.justification_image_url} alt="" className="mt-2 max-h-40 rounded-lg" onError={(e) => { e.target.style.display = "none"; }} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRestart}
              className="mt-8 w-full sm:w-auto flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-xl shadow text-base transition-colors"
            >
              <RotateCcw size={18} /> Recommencer l'examen
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}