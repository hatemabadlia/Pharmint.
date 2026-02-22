// src/pages/client/SessionDetailPage.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { db, auth } from "../firebase/config";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";
import { useTheme } from "../context/ThemeContext";
import { XCircle, CheckCircle } from "lucide-react";

// ─── Toast Notification (replaces alert + error) ───────────────────────────
const Toast = ({ message, type = "error", onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 text-white rounded-xl shadow-2xl flex items-center gap-3 z-50 max-w-sm w-11/12 sm:w-auto ring-4 ${
      type === "success"
        ? "bg-emerald-600 ring-emerald-400"
        : "bg-red-600 ring-red-400"
    }`}
  >
    {type === "success" ? <CheckCircle size={22} /> : <XCircle size={22} />}
    <span className="font-medium text-sm">{message}</span>
    <button onClick={onClose} className="ml-auto p-1 rounded-full hover:opacity-75 transition">
      <XCircle size={16} />
    </button>
  </motion.div>
);

// ─── Sounds ────────────────────────────────────────────────────────────────
const correctSound = new Howl({ src: ["https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg"] });
const wrongSound   = new Howl({ src: ["https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg"] });

export default function SessionDetailPage() {
  const { theme } = useTheme();
  const { id } = useParams();
  const userId = auth.currentUser?.uid;

  const [session, setSession]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selected, setSelected]             = useState([]);
  const [scoreNormal, setScoreNormal]       = useState(0);
  const [scorePartiel, setScorePartiel]     = useState(0);
  const [scoreNegative, setScoreNegative]   = useState(0);
  const [finished, setFinished]             = useState(false);
  const [showResponse, setShowResponse]     = useState(false);
  const [notes, setNotes]                   = useState({});
  const [noteInput, setNoteInput]           = useState("");
  const [reportMsg, setReportMsg]           = useState("");
  const [searchTerm, setSearchTerm]         = useState("");
  const [notInterested, setNotInterested]   = useState({});
  const [toast, setToast]                   = useState(null); // { message, type }

  // Use refs to always have fresh score values inside async callbacks
  const scoreNormalRef   = useRef(0);
  const scorePartielRef  = useRef(0);
  const scoreNegativeRef = useRef(0);

  const showToast = useCallback((message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ─── Fetch session + restore progress ────────────────────────────────────
  useEffect(() => {
    if (!userId || !id) return;

    const fetchSession = async () => {
      try {
        const ref  = doc(db, "users", userId, "sessions", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) { setLoading(false); return; }

        const data = snap.data();
        let questions = data.questions || [];
        if (!questions.length && data.courses?.[0]?.questions) {
          questions = data.courses[0].questions;
        }
        setSession({ ...data, questions });

        const notesMap = {};
        (data.notes || []).forEach((n) => { notesMap[n.questionId] = n.note; });
        setNotes(notesMap);

        if (data.finished) { setFinished(true); return; }

        if (data.progress?.currentQuestion != null) {
          const idx = data.progress.currentQuestion;
          const sN  = data.progress.scoreNormal   ?? 0;
          const sP  = data.progress.scorePartiel  ?? 0;
          const sNg = data.progress.scoreNegative ?? 0;

          setCurrentQuestion(idx);
          setScoreNormal(sN);   scoreNormalRef.current   = sN;
          setScorePartiel(sP);  scorePartielRef.current  = sP;
          setScoreNegative(sNg); scoreNegativeRef.current = sNg;
          setNoteInput(notesMap[idx] || "");
        }
      } catch (err) {
        console.error("Erreur fetch:", err);
        showToast("Erreur lors du chargement de la session.");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [userId, id, showToast]);

  // ─── Persist progress (uses refs so always fresh) ─────────────────────────
  const saveProgress = useCallback(async (questionIndex) => {
    try {
      const ref = doc(db, "users", userId, "sessions", id);
      await updateDoc(ref, {
        progress: {
          currentQuestion: questionIndex,
          scoreNormal:   scoreNormalRef.current,
          scorePartiel:  scorePartielRef.current,
          scoreNegative: scoreNegativeRef.current,
          savedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error("Erreur sauvegarde:", err);
    }
  }, [userId, id]);

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent" />
    </div>
  );
  if (!session) return (
    <p className={`text-center mt-10 ${theme === "dark" ? "text-red-400" : "text-red-600"}`}>
      Session introuvable ❌
    </p>
  );

  const questions = session.questions || [];

  // Guard: empty session
  if (questions.length === 0) return (
    <p className={`text-center mt-10 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
      Cette session ne contient aucune question.
    </p>
  );

  const current       = questions[currentQuestion];
  const isMultiSelect = Array.isArray(current?.correct_answer);
  const correctAnswers = isMultiSelect ? current.correct_answer : [current?.correct_answer];

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleAnswer = (optionKey) => {
    if (showResponse) return;
    setSelected((prev) =>
      prev.includes(optionKey) ? prev.filter((k) => k !== optionKey) : [...prev, optionKey]
    );
  };

  const handleShowResponse = () => {
    if (selected.length === 0 || showResponse) return;
    setShowResponse(true);

    const allCorrect =
      selected.length === correctAnswers.length &&
      selected.every((opt) => correctAnswers.includes(opt));

    const numCorrect  = selected.filter((opt) => correctAnswers.includes(opt)).length;
    const numWrong    = selected.filter((opt) => !correctAnswers.includes(opt)).length;
    const partial     = numCorrect / correctAnswers.length;

    const newNormal   = scoreNormalRef.current   + (allCorrect ? 1 : 0);
    const newPartiel  = scorePartielRef.current  + partial;
    const newNegative = scoreNegativeRef.current + (partial - 0.25 * numWrong);

    // Update refs first (so saveProgress always reads fresh values)
    scoreNormalRef.current   = newNormal;
    scorePartielRef.current  = newPartiel;
    scoreNegativeRef.current = newNegative;

    setScoreNormal(newNormal);
    setScorePartiel(newPartiel);
    setScoreNegative(newNegative);

    if (allCorrect) correctSound.play();
    else wrongSound.play();
  };

  const handleNext = async () => {
    if (!showResponse) {
      showToast("Veuillez afficher la réponse avant de continuer.", "error");
      return;
    }

    if (currentQuestion + 1 < questions.length) {
      const nextIdx = currentQuestion + 1;
      setCurrentQuestion(nextIdx);
      setSelected([]);
      setShowResponse(false);
      setNoteInput(notes[nextIdx] || "");
      setReportMsg("");
      await saveProgress(nextIdx);
    } else {
      // Finish
      setFinished(true);
      try {
        const ref = doc(db, "users", userId, "sessions", id);
        await updateDoc(ref, {
          finished: true,
          score: ((scoreNormalRef.current / questions.length) * 20).toFixed(2),
          updatedAt: new Date(),
          progress: null,
        });
      } catch (err) {
        console.error("Erreur finish:", err);
        showToast("Erreur lors de l'enregistrement du score.");
      }
    }
  };

  const handlePrevious = async () => {
    if (currentQuestion > 0) {
      const prevIdx = currentQuestion - 1;
      setCurrentQuestion(prevIdx);
      setSelected([]);
      setShowResponse(false); // ← BUG FIX: always reset on navigation
      setNoteInput(notes[prevIdx] || "");
      setReportMsg("");
      await saveProgress(prevIdx);
    }
  };

  const handleSaveNote = async () => {
    if (!noteInput.trim()) { showToast("Écrivez une note avant de sauvegarder."); return; }
    try {
      const ref = doc(db, "users", userId, "sessions", id);
      await updateDoc(ref, {
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
      console.error("Erreur note:", err);
      showToast("Erreur lors de l'enregistrement de la note.");
    }
  };

  const handleReport = async () => {
    if (!reportMsg.trim()) { showToast("Écrivez un message pour le rapport."); return; }
    try {
      const ref = doc(db, "users", userId, "sessions", id);
      await updateDoc(ref, {
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
      console.error("Erreur rapport:", err);
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
    setSelected([]);
    setShowResponse(false);
    setScoreNormal(0);   scoreNormalRef.current   = 0;
    setScorePartiel(0);  scorePartielRef.current  = 0;
    setScoreNegative(0); scoreNegativeRef.current = 0;
    setFinished(false);
    setNoteInput(notes[0] || "");
    try {
      const ref = doc(db, "users", userId, "sessions", id);
      await updateDoc(ref, { finished: false, progress: null, score: null });
    } catch (err) { console.error("Erreur reset:", err); }
  };

  // ─── Scores ───────────────────────────────────────────────────────────────
  const finalScoreNormal   = Math.max(0, ((scoreNormalRef.current / questions.length) * 20)).toFixed(2);
  const finalScorePartiel  = Math.max(0, ((scorePartielRef.current / questions.length) * 20)).toFixed(2);
  const finalScoreNegative = Math.max(0, ((scoreNegativeRef.current / questions.length) * 20)).toFixed(2);

  // ─── Option button class ─────────────────────────────────────────────────
  const getButtonClass = (key) => {
    if (showResponse) {
      if (correctAnswers.includes(key))
        return "bg-green-500 text-white border-2 border-green-400";
      if (selected.includes(key))
        return "bg-red-500 text-white border-2 border-red-400";
      return theme === "dark" ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500";
    }
    const isSelected = selected.includes(key);
    const isNotInt   = notInterested[currentQuestion]?.[key];
    if (isNotInt)   return theme === "dark" ? "bg-gray-700 text-gray-500 opacity-40" : "bg-gray-100 text-gray-400 opacity-40";
    if (isSelected) return theme === "dark" ? "bg-emerald-600 border-2 border-emerald-500 text-white" : "bg-emerald-400 border-2 border-emerald-500 text-gray-900";
    return theme === "dark" ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-green-50 hover:bg-green-100 text-gray-700";
  };

  // ─── Search: map back to real question indices ─────────────────────────
  const filteredWithIndex = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) =>
      q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.year?.toString().includes(searchTerm)
    );

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col items-center min-h-screen p-6">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      {/* Search bar */}
      <div className="w-full max-w-3xl mb-4">
        <input
          type="text"
          placeholder="🔍 Rechercher une question..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full p-3 rounded-xl border shadow outline-none transition-colors ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400"
              : "border-green-300"
          }`}
        />
      </div>

      {/* Search results dropdown */}
      <AnimatePresence>
        {searchTerm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`w-full max-w-3xl mb-4 p-4 rounded-xl shadow border ${
              theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}
          >
            {filteredWithIndex.length > 0 ? (
              <ul className="space-y-1 text-left max-h-48 overflow-y-auto">
                {filteredWithIndex.map(({ q, i }) => (
                  <li
                    key={i}
                    onClick={() => {
                      setCurrentQuestion(i);
                      setSelected([]);
                      setShowResponse(false);
                      setNoteInput(notes[i] || "");
                      setReportMsg("");
                      setSearchTerm("");
                    }}
                    className={`cursor-pointer px-3 py-2 rounded-lg transition-colors text-sm ${
                      theme === "dark"
                        ? "text-gray-300 hover:bg-gray-700 hover:text-emerald-400"
                        : "text-gray-700 hover:bg-green-50 hover:text-green-700"
                    }`}
                  >
                    <span className="font-semibold mr-1">{i + 1}.</span> {q.question_text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">Aucun résultat ❌</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main card */}
      <motion.div
        className={`w-full max-w-3xl rounded-2xl shadow-xl p-8 text-center border transition-colors duration-300 ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700 shadow-emerald-900/50"
            : "bg-white border-green-200"
        }`}
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {!finished ? (
          <>
            {/* Progress bar */}
            <div className={`w-full rounded-full h-4 mb-6 overflow-hidden relative ${theme === "dark" ? "bg-gray-700" : "bg-green-100"}`}>
              <motion.div
                className="h-4 bg-green-500"
                animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
              <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${theme === "dark" ? "text-gray-100" : "text-green-900"}`}>
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>

            <h1 className={`text-2xl font-bold mb-4 ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>
              {session.title || "Session sans titre"}
            </h1>

            {current?.source && (
              <p className={`text-sm italic mb-3 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
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
                <p className={`font-semibold mb-2 ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>📋 Déclarations :</p>
                <ul className={`space-y-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  {current.statements.map((s, i) => (
                    <li key={i}>• {s}</li>
                  ))}
                </ul>
              </div>
            )}

            <h2 className={`text-xl font-semibold mb-3 text-left ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>
              {currentQuestion + 1}. {current?.question_text}
            </h2>

            {isMultiSelect && (
              <p className={`text-sm mb-4 font-medium ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}>
                ☑ Sélection multiple — {correctAnswers.length} bonne(s) réponse(s)
              </p>
            )}

            {/* Options */}
            <div className="grid grid-cols-1 gap-3 mb-4">
              {["A", "B", "C", "D", "E"].map((key) => {
                const val    = current?.options?.[key];
                if (!val) return null;
                const isNotInt = notInterested[currentQuestion]?.[key];
                return (
                  <div key={key} className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      disabled={showResponse}
                      onClick={() => handleAnswer(key)}
                      className={`flex-1 py-3 px-5 rounded-xl text-base font-semibold text-left transition-all duration-200 shadow ${getButtonClass(key)}`}
                    >
                      <span className="mr-2">{selected.includes(key) ? "✅" : "○"}</span>
                      {key}. {val}
                    </motion.button>
                    <button
                      onClick={() => toggleNotInterested(key)}
                      title="Marquer comme non pertinent"
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isNotInt
                          ? "bg-red-500 text-white"
                          : theme === "dark"
                          ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      {isNotInt ? "↩ Undo" : "✕ Skip"}
                    </button>
                  </div>
                );
              })}
            </div>

            {selected.length > 0 && !showResponse && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleShowResponse}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded-xl shadow transition-colors"
              >
                📖 Voir la réponse
              </motion.button>
            )}

            {/* Response / Justification panel */}
            <AnimatePresence>
              {showResponse && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-5 p-5 rounded-xl border text-left ${
                    theme === "dark" ? "bg-gray-900 border-emerald-900" : "bg-green-50 border-green-200"
                  }`}
                >
                  {/* Result badge */}
                  <div className="mb-3">
                    {selected.every((o) => correctAnswers.includes(o)) && selected.length === correctAnswers.length ? (
                      <span className="inline-flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">✅ Correct !</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">❌ Incorrect</span>
                    )}
                  </div>

                  <p className={`font-semibold mb-2 ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>📖 Justification :</p>
                  {current.justification_text ? (
                    <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                      {current.justification_text}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic text-sm">Pas de justification fournie.</p>
                  )}
                  {current.justification_image_url && (
                    <img
                      src={current.justification_image_url}
                      alt="Justification"
                      className="mt-3 rounded-lg max-h-64 mx-auto"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />
                  )}

                  {/* Note */}
                  <div className="mt-5 border-t pt-4 border-gray-600/30">
                    <p className={`text-sm font-semibold mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>📝 Ma note :</p>
                    <textarea
                      rows={3}
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Écrire une note sur cette question..."
                      className={`w-full p-3 rounded-xl border outline-none resize-none text-sm transition-colors ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500"
                          : "border-gray-300 bg-white"
                      }`}
                    />
                    <button
                      onClick={handleSaveNote}
                      className="mt-2 bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-xl shadow transition-colors"
                    >
                      💾 Sauvegarder
                    </button>
                    {notes[currentQuestion] && (
                      <p className={`text-xs mt-2 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
                        Dernière note : {notes[currentQuestion]}
                      </p>
                    )}
                  </div>

                  {/* Report */}
                  <div className="mt-4 border-t pt-4 border-gray-600/30">
                    <p className={`text-sm font-semibold mb-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>🚩 Signaler un problème :</p>
                    <textarea
                      rows={2}
                      value={reportMsg}
                      onChange={(e) => setReportMsg(e.target.value)}
                      placeholder="Décrire le problème..."
                      className={`w-full p-3 rounded-xl border outline-none resize-none text-sm transition-colors ${
                        theme === "dark"
                          ? "bg-gray-800 border-red-800 text-gray-100 placeholder-gray-500"
                          : "border-red-200 bg-white"
                      }`}
                    />
                    <button
                      onClick={handleReport}
                      className="mt-2 bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-2 rounded-xl shadow transition-colors"
                    >
                      🚨 Envoyer le rapport
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-7">
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className={`px-6 py-2 rounded-xl font-semibold shadow transition-colors ${
                  currentQuestion === 0
                    ? theme === "dark" ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : theme === "dark" ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-yellow-400 hover:bg-yellow-500 text-white"
                }`}
              >
                ⬅ Précédent
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={handleNext}
                className={`px-6 py-2 rounded-xl font-semibold shadow transition-colors ${
                  !showResponse
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 text-white"
                }`}
              >
                {currentQuestion + 1 < questions.length ? "Suivant ➡" : "Terminer 🎉"}
              </motion.button>
            </div>
          </>
        ) : (
          // ─── Finished screen ──────────────────────────────────────────────
          <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
            <h2 className={`text-3xl font-bold mb-6 ${theme === "dark" ? "text-emerald-400" : "text-gray-800"}`}>
              🎉 Session terminée !
            </h2>

            {/* Score cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Tout ou Rien", value: finalScoreNormal,   color: "green"  },
                { label: "Partiel",       value: finalScorePartiel,  color: "blue"   },
                { label: "Partiel Nég.",  value: finalScoreNegative, color: "red"    },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-xl p-4 ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-50 border border-gray-200"
                }`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}>{label}</p>
                  <p className={`text-3xl font-bold text-${color}-500`}>{value}</p>
                  <p className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>/ 20</p>
                </div>
              ))}
            </div>

            {/* Full correction review */}
            <div className={`text-left space-y-5 p-4 rounded-xl border ${
              theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"
            }`}>
              <p className={`text-lg font-bold ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>
                📋 Correction complète
              </p>
              {questions.map((q, i) => {
                const corrects     = Array.isArray(q.correct_answer) ? q.correct_answer : [q.correct_answer];
                return (
                  <div key={i} className={`p-4 rounded-xl border ${
                    theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}>
                    {q.source && <p className={`text-xs italic mb-1 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>📌 {q.source}</p>}
                    {q.question_image_url && (
                      <img src={q.question_image_url} alt="" className="max-h-40 object-contain rounded-lg mb-3" onError={(e) => { e.target.style.display = "none"; }} />
                    )}
                    {q.statements?.length > 0 && (
                      <div className={`mb-2 p-2 rounded-lg text-sm ${theme === "dark" ? "bg-gray-900 text-gray-300" : "bg-gray-50 text-gray-600"}`}>
                        {q.statements.map((s, si) => <p key={si}>• {s}</p>)}
                      </div>
                    )}
                    <p className={`font-semibold mb-2 ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>{i + 1}. {q.question_text}</p>
                    {["A","B","C","D","E"].map((key) => {
                      const val = q.options?.[key];
                      if (!val) return null;
                      const isCorrect = corrects.includes(key);
                      let cls = theme === "dark" ? "text-gray-500" : "text-gray-400";
                      let icon = "  ";
                      if (isCorrect) { cls = "text-green-500 font-semibold"; icon = "✅"; }
                      return <p key={key} className={`ml-3 text-sm ${cls}`}>{icon} {key}. {val}</p>;
                    })}
                    {(q.justification_text || q.justification_image_url) && (
                      <div className={`mt-3 p-3 rounded-lg border-l-4 border-emerald-500 ${theme === "dark" ? "bg-gray-900" : "bg-emerald-50"}`}>
                        <p className={`text-xs font-semibold mb-1 ${theme === "dark" ? "text-emerald-400" : "text-emerald-700"}`}>📖 Justification</p>
                        {q.justification_text && <p className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>{q.justification_text}</p>}
                        {q.justification_image_url && <img src={q.justification_image_url} alt="" className="mt-2 max-h-40 rounded-lg" onError={(e) => { e.target.style.display = "none"; }} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRestart}
              className="mt-8 bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-xl shadow text-lg transition-colors"
            >
              🔄 Recommencer
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}