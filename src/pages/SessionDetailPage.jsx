// src/pages/client/SessionDetailPage.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // 🔑 Import AnimatePresence
import { Howl } from "howler";
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme
import { XCircle, AlertTriangle } from "lucide-react"; // 🔑 Import icons

// 💡 Custom Error/Message Box Component (replaces alert())
const ErrorMessage = ({ message, onClose, theme }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="fixed top-4 left-1/2 -translate-x-1/2 p-4 bg-red-600 text-white rounded-xl shadow-2xl flex items-center gap-3 z-50 max-w-sm w-11/12 sm:w-auto ring-4 ring-red-400"
  >
    <XCircle size={24} />
    <span className="font-medium text-sm">{message}</span>
    <button onClick={onClose} className="ml-auto p-1 rounded-full hover:bg-red-700 transition">
      <XCircle size={16} />
    </button>
  </motion.div>
);


export default function SessionDetailPage() {
  // 🔑 Get theme state
  const { theme } = useTheme();

  const { id } = useParams();
  const userId = auth.currentUser?.uid;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selected, setSelected] = useState(null);
  const [scoreNegative, setScoreNegative] = useState(0);
  const [scoreNormal, setScoreNormal] = useState(0);
  const [scorePartiel, setScorePartiel] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  const [notes, setNotes] = useState({});
  const [noteInput, setNoteInput] = useState("");
  const [reportMsg, setReportMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [notInterested, setNotInterested] = useState({});
  const [errorMessage, setErrorMessage] = useState(null); // 🔑 Error state

  const closeError = () => setErrorMessage(null);
  const displayError = (message) => {
    setErrorMessage(message);
    setTimeout(closeError, 5000); 
  };


  const playSound = (type) => {
    const sound = new Howl({
      src: [
        type === "correct"
          ? "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg"
          : "https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg",
      ],
    });
    sound.play();
  };

  useEffect(() => {
    if (!userId || !id) return;

    const fetchSession = async () => {
      try {
        const ref = doc(db, "users", userId, "sessions", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          let questions = [];

          if (data.courses && Array.isArray(data.courses) && data.courses[0]?.questions) {
            questions = data.courses[0].questions;
          }

          setSession({ ...data, questions });

          if (data.notes) {
            const map = {};
            data.notes.forEach((n) => {
              map[n.questionId] = n.note;
            });
            setNotes(map);
          }
        }
      } catch (err) {
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [userId, id]);

  // 🔑 Loading text color
  if (loading) return <p className={`text-center mt-10 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Chargement...</p>;
  if (!session) return <p className={`text-center mt-10 transition-colors ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Session introuvable ❌</p>;

  const questions = session?.questions || [];
  const current = questions[currentQuestion];

  // ✅ Allow change before showing response
  const handleAnswer = (optionKey) => {
    if (showResponse) return; // locked after showing
    setSelected(optionKey);
  };

  const handleShowResponse = () => {
    if (!selected || showResponse) return;
    setShowResponse(true);

    // **Scoring System**
    let newScoreNormal = scoreNormal;
    let newScorePartiel = scorePartiel;
    let newScoreNegative = scoreNegative;

    // Tout ou Rien (Normal)
    if (selected === current.correct_answer) {
      newScoreNormal += 1;
      playSound("correct");
    } else {
      playSound("wrong");
    }

    // Partiel (if question has multiple correct options)
    if (current.correct_options && Array.isArray(current.correct_options)) {
      // selected could be an array if multi-choice
      const userSelection = Array.isArray(selected) ? selected : [selected];
      const correctSelection = current.correct_options;
      const numCorrect = userSelection.filter((opt) => correctSelection.includes(opt)).length;
      const partialScore = numCorrect / correctSelection.length;
      newScorePartiel += partialScore;

      // Partiel négatif
      const numWrong = userSelection.filter((opt) => !correctSelection.includes(opt)).length;
      newScoreNegative += partialScore - 0.25 * numWrong;
    } else {
      // Tout ou Rien only (for Partiel and Negative scores)
      if (selected === current.correct_answer) {
          newScorePartiel += 1;
      } else {
          newScoreNegative -= 0.25;
      }
    }
    
    setScoreNormal(newScoreNormal);
    setScorePartiel(newScorePartiel);
    setScoreNegative(newScoreNegative);
  };

  const handleNext = async () => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion((q) => q + 1);
      setSelected(null);
      setNoteInput(notes[currentQuestion + 1] || "");
      setReportMsg("");
      setShowResponse(false);
    } else {
      setFinished(true);
      try {
        const ref = doc(db, "users", userId, "sessions", id);
        await updateDoc(ref, {
          finished: true,
          score: ((scoreNormal / questions.length) * 20).toFixed(2),
          updatedAt: new Date(),
        });
      } catch (err) {
        console.error("Erreur update finish:", err);
        displayError("Erreur lors de l'enregistrement du score final."); // ❌ Replaced alert
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((q) => q - 1);
      setSelected(null);
      setNoteInput(notes[currentQuestion - 1] || "");
      setReportMsg("");
      setShowResponse(false);
    }
  };

  const handleSaveNote = async () => {
    if (!noteInput.trim()) return displayError("Écrivez une note."); // ❌ Replaced alert()
    try {
      const ref = doc(db, "users", userId, "sessions", id);
      await updateDoc(ref, {
        notes: arrayUnion({
          questionId: currentQuestion,
          questionText: current.question_text,
          note: noteInput,
          user: userId,
          timestamp: new Date().toISOString(),
        }),
      });

      setNotes((prev) => ({
        ...prev,
        [currentQuestion]: noteInput,
      }));

      displayError("✅ Note enregistrée !"); // ❌ Replaced alert()
    } catch (err) {
      console.error("Erreur note:", err);
      displayError("Erreur lors de l'enregistrement de la note.");
    }
  };

  const handleReport = async () => {
    if (!reportMsg.trim()) return displayError("Écrivez un message pour le rapport."); // ❌ Replaced alert()
    try {
      const ref = doc(db, "users", userId, "sessions", id);
      await updateDoc(ref, {
        reports: arrayUnion({
          questionId: currentQuestion,
          questionText: current.question_text,
          message: reportMsg,
          user: userId,
          timestamp: new Date().toISOString(),
        }),
      });
      displayError("✅ Rapport envoyé !"); // ❌ Replaced alert()
      setReportMsg("");
    } catch (err) {
      console.error("Erreur rapport:", err);
      displayError("Erreur lors de l'envoi du rapport.");
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

  const finalScoreNormal = Math.max(0, ((scoreNormal / questions.length) * 20).toFixed(2));
  const finalScorePartiel = Math.max(0, ((scorePartiel / questions.length) * 20).toFixed(2));
  const finalScoreNegative = Math.max(0, ((scoreNegative / questions.length) * 20).toFixed(2));

  const filteredQuestions = questions.filter(
    (q) =>
      q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.year?.toString().includes(searchTerm)
  );

  return (
    // 🔑 Main background color removed (handled by Home.jsx)
    <div className="flex flex-col items-center min-h-screen p-6">
      
      {/* 🔑 Error Message Display */}
      <AnimatePresence>
        {errorMessage && <ErrorMessage message={errorMessage} onClose={closeError} theme={theme} />}
      </AnimatePresence>
      
      {/* 🔍 Search bar */}
      <div className="w-full max-w-3xl mb-6">
        <input
          type="text"
          placeholder="🔍 Rechercher une question..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          // 🔑 Input Styling
          className={`w-full p-3 rounded-xl border shadow outline-none transition-colors duration-300 ${
            theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
            : 'border-green-300 shadow'
          }`}
        />
      </div>

      <motion.div
        // 🔑 Quiz Card Styling
        className={`w-full max-w-3xl rounded-2xl shadow-xl p-8 text-center border transition-colors duration-300 ${
            theme === 'dark'
            ? 'bg-gray-800 border-gray-700 shadow-emerald-900/50'
            : 'bg-white border-green-200'
        }`}
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {!finished ? (
          <>
            {/* Progress Bar */}
            <div className={`w-full rounded-full h-4 mb-6 overflow-hidden relative ${theme === 'dark' ? 'bg-gray-700' : 'bg-green-100'}`}>
              <motion.div
                className="h-4 bg-green-500"
                initial={{ width: "0%" }}
                animate={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
              {/* 🔑 Progress Text Color */}
              <span className={`absolute inset-0 flex justify-center items-center text-xs font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-green-800'}`}>
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>

            <h1 className={`text-2xl font-bold mb-6 transition-colors ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
              {session.title || "Session sans titre"}
            </h1>

            {current.source && (
              <p className={`text-sm italic mb-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>📌 {current.source}</p>
            )}

            <h2 className={`text-xl font-semibold mb-4 transition-colors ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
              {currentQuestion + 1}. {current.question_text}
            </h2>

            {/* Options with hover + selectable style */}
            <div className="grid grid-cols-1 gap-3">
              {["A", "B", "C", "D", "E"].map((key) => {
                const val = current.options?.[key];
                if (!val) return null;
                const isNotInterested = notInterested[currentQuestion]?.[key];

                const getButtonClass = () => {
                  if (showResponse) {
                    if (key === current.correct_answer) return "bg-green-500 text-white";
                    if (key === selected && key !== current.correct_answer)
                      return "bg-red-500 text-white";
                    return theme === 'dark' ? "bg-gray-600 text-gray-200" : "bg-gray-200 text-gray-600";
                  }

                  if (selected === key)
                    return theme === 'dark' 
                        ? "bg-emerald-700 border-2 border-emerald-500 text-gray-50 shadow-md"
                        : "bg-emerald-200 border-2 border-emerald-400 text-gray-900";

                  return isNotInterested
                    ? (theme === 'dark' ? "bg-gray-700 text-gray-500 opacity-50" : "bg-gray-100 text-gray-400 opacity-50")
                    : (theme === 'dark' ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-green-50 hover:bg-green-100 text-gray-700 transition-colors");
                };

                return (
                  <motion.div key={key} className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      disabled={showResponse}
                      className={`flex-1 py-3 px-5 rounded-xl text-lg font-semibold transition-all duration-300 shadow ${getButtonClass()}`}
                      onClick={() => handleAnswer(key)}
                    >
                      {key}. {val}
                    </motion.button>

                    <button
                      onClick={() => toggleNotInterested(key)}
                      // 🔑 'Not Interested' button styling
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        isNotInterested
                          ? "bg-red-500 text-white"
                          : (theme === 'dark' ? "bg-gray-600 text-gray-300 hover:bg-gray-500" : "bg-gray-200 text-gray-600 hover:bg-gray-300")
                      }`}
                    >
                      {isNotInterested ? "Undo" : "Not Interested"}
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Show Response Button */}
            {selected && !showResponse && (
              <div className="mt-6">
                <button
                  onClick={handleShowResponse}
                  className="bg-blue-500 px-4 py-2 rounded-xl text-white font-semibold hover:bg-blue-600 shadow"
                >
                  📖 Afficher la réponse
                </button>
              </div>
            )}

            {/* 🟩 Justification, Notes, Report, Navigation (unchanged) */}
            {showResponse && selected && (
              <div className={`mt-6 p-4 rounded-xl border text-left transition-colors ${theme === 'dark' ? 'bg-gray-900 border-emerald-900' : 'bg-green-50 border-green-200'}`}>
                {/* 🔑 Justification Header */}
                <h3 className={`font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>📖 Justification :</h3>
                {current.justification_text ? (
                  <p className={`transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{current.justification_text}</p>
                ) : (
                  <p className="text-gray-500 italic">Pas de justification fournie.</p>
                )}
                {current.justification_image_url && (
                  <img
                    src={current.justification_image_url}
                    alt="Justification"
                    className="mt-4 rounded-lg max-h-64 mx-auto"
                  />
                )}

                {/* Notes */}
                <div className="mt-6">
                  <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="📝 Écrire une note sur cette question..."
                    // 🔑 Textarea Styling
                    className={`w-full p-3 rounded-xl border outline-none transition-colors ${
                      theme === 'dark' 
                      ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400'
                      : 'border-gray-300'
                    }`}
                  />
                  <button
                    onClick={handleSaveNote}
                    className="mt-2 bg-blue-500 px-4 py-2 rounded-xl text-white shadow hover:bg-blue-600"
                  >
                    💾 Sauvegarder Note
                  </button>
                  {notes[currentQuestion] && (
                    <p className={`text-sm mt-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Dernière note : {notes[currentQuestion]}
                    </p>
                  )}
                </div>

                {/* Report */}
                <div className="mt-6">
                  <textarea
                    value={reportMsg}
                    onChange={(e) => setReportMsg(e.target.value)}
                    placeholder="🚩 Signaler un problème..."
                    // 🔑 Report Textarea Styling
                    className={`w-full p-3 rounded-xl border transition-colors ${
                      theme === 'dark' 
                      ? 'bg-gray-800 border-red-700 text-gray-100 placeholder-gray-400'
                      : 'border-red-300'
                    }`}
                  />
                  <button
                    onClick={handleReport}
                    className="mt-2 bg-red-500 px-4 py-2 rounded-xl text-white shadow hover:bg-red-600"
                  >
                    🚨 Envoyer Rapport
                  </button>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                // 🔑 Previous Button Styling
                className={`px-6 py-2 rounded-xl font-semibold shadow transition-colors ${
                  currentQuestion === 0
                    ? (theme === 'dark' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-600 cursor-not-allowed')
                    : (theme === 'dark' ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-yellow-400 text-white hover:bg-yellow-500')
                }`}
              >
                ⬅ Précédent
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleNext}
                className="bg-green-500 px-6 py-2 rounded-xl text-white font-semibold shadow hover:bg-green-600"
              >
                {currentQuestion + 1 < questions.length ? "Suivant ➡" : "Terminer 🎉"}
              </motion.button>
            </div>
            
            {/* 🔑 Question Counter Text */}
            <p className={`mt-6 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Question {currentQuestion + 1} / {questions.length}
            </p>
          </>
        ) : (
          // ✅ Results Section
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* 🔑 Result Title */}
            <h2 className={`text-3xl font-bold mb-4 transition-colors ${theme === 'dark' ? 'text-emerald-400' : 'text-gray-800'}`}>🎉 Session terminée !</h2>

            {/* 🔑 Result Scores */}
            <p className={`text-xl mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              🔹 Tout ou Rien: <span className="font-bold text-green-600 dark:text-green-400">{finalScoreNormal} / 20</span>
            </p>

            <p className={`text-xl mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              🔹 Partiel: <span className="font-bold text-blue-600 dark:text-blue-400">{finalScorePartiel} / 20</span>
            </p>

            <p className={`text-xl mb-6 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              🔹 Partiel Négatif: <span className="font-bold text-red-600 dark:text-red-400">{finalScoreNegative} / 20</span>
            </p>

            <motion.button
              whileTap={{ scale: 0.9 }}
              className="bg-green-500 px-6 py-3 rounded-xl text-lg font-semibold text-white shadow hover:bg-green-600"
              onClick={() => {
                setCurrentQuestion(0);
                setScoreNegative(0);
                setScoreNormal(0);
                setScorePartiel(0);
                setFinished(false);
                setSelected(null);
                setNoteInput(notes[0] || "");
              }}
            >
              🔄 Recommencer
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}