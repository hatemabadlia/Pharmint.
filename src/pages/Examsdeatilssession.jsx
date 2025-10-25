// src/pages/client/ExamDetailPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "../firebase/config";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Howl } from "howler";
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme

export default function ExamDetailPage() {
  // 🔑 Get theme state
  const { theme } = useTheme();

  const { id } = useParams();
  const userId = auth.currentUser?.uid;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  const [notes, setNotes] = useState({});
  const [noteInput, setNoteInput] = useState("");
  const [reportMsg, setReportMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [notInterested, setNotInterested] = useState({});

  // 🕒 Timer states
  const [timeLeft, setTimeLeft] = useState(60 * 30); // default 30min
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const playSound = (type) => {
    const sound = new Howl({
      src: [
        type === "correct"
          ? "https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg"
          : "https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg",
      ],
    });
    // sound.play();
  };

  // Fetch session
  useEffect(() => {
    if (!userId || !id) return;

    const fetchSession = async () => {
      try {
        const ref = doc(db, "users", userId, "exams", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          let questions = [];

          if (data.courses?.[0]?.questions) {
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

          const initialTime =
            data.remainingTime || data.totalTime || 60 * 30;
          setTimeLeft(initialTime);
        }
      } catch (err) {
        console.error("Erreur:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [userId, id]);

  // Auto Timer effect
  useEffect(() => {
    if (finished) {
      clearInterval(timerRef.current);
      return;
    }

    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleFinishAuto();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [isPaused, finished]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // 🔑 Loading state color
  if (loading) return <p className={`text-center mt-10 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Chargement...</p>;
  if (!session) return <p className={`text-center mt-10 transition-colors ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>Session introuvable ❌</p>;


  const questions = session?.questions || [];
  const current = questions[currentQuestion];

  // Toggle selection (multi or single)
  const handleAnswer = (optionKey) => {
    const correct = Array.isArray(current.correct_answer)
      ? current.correct_answer
      : [current.correct_answer];

    setSelectedAnswers((prev) => {
      const prevSelected = prev[currentQuestion] || [];

      let newSelected = [];
      if (prevSelected.includes(optionKey)) {
        // unselect
        newSelected = prevSelected.filter((a) => a !== optionKey);
      } else {
        // add
        newSelected = [...prevSelected, optionKey];
      }

      return { ...prev, [currentQuestion]: newSelected };
    });
  };

  const handleNext = () => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion((q) => q + 1);
      setNoteInput(notes[currentQuestion + 1] || "");
      setReportMsg("");
    } else {
      handleFinishAuto();
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((q) => q - 1);
      setNoteInput(notes[currentQuestion - 1] || "");
      setReportMsg("");
    }
  };

  const computeScores = () => {
    let scoreToutRien = 0;
    let scorePartiel = 0;
    let scoreNegatif = 0;

    questions.forEach((q, i) => {
      const userAns = selectedAnswers[i] || [];
      const correct = Array.isArray(q.correct_answer)
        ? q.correct_answer
        : [q.correct_answer];

      const allCorrectSelected =
        correct.length === userAns.length &&
        correct.every((c) => userAns.includes(c));

      // Tout ou Rien
      if (allCorrectSelected) scoreToutRien += 1;

      // Partiel (fractional)
      const numCorrect = userAns.filter((a) => correct.includes(a)).length;
      const partial = numCorrect / correct.length;
      scorePartiel += partial;

      // Partiel Négatif
      const numWrong = userAns.filter((a) => !correct.includes(a)).length;
      const negative = Math.max(0, partial - 0.25 * numWrong);
      scoreNegatif += negative;
    });

    const total = questions.length;
    return {
      toutRien: ((scoreToutRien / total) * 20).toFixed(2),
      partiel: ((scorePartiel / total) * 20).toFixed(2),
      negatif: ((scoreNegatif / total) * 20).toFixed(2),
    };
  };

  const handleFinishAuto = async () => {
    setFinished(true);
    const finalScores = computeScores();

    try {
      const ref = doc(db, "users", userId, "exams", id);
      await updateDoc(ref, {
        finished: true,
        score_tout_rien: Number(finalScores.toutRien),
        score_partiel: Number(finalScores.partiel),
        score_negatif: Number(finalScores.negatif),
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("Erreur update finish:", err);
    }
  };

  const handleSaveNote = async () => {
    if (!noteInput.trim()) return alert("Écrivez une note.");
    try {
      const ref = doc(db, "users", userId, "exams", id);
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

      alert("✅ Note enregistrée !");
    } catch (err) {
      console.error("Erreur note:", err);
    }
  };

  const handleReport = async () => {
    if (!reportMsg.trim()) return alert("Écrivez un message pour le rapport.");
    try {
      const ref = doc(db, "users", userId, "exams", id);
      await updateDoc(ref, {
        reports: arrayUnion({
          questionId: currentQuestion,
          questionText: current.question_text,
          message: reportMsg,
          user: userId,
          timestamp: new Date().toISOString(),
        }),
      });
      alert("✅ Rapport envoyé !");
      setReportMsg("");
    } catch (err) {
      console.error("Erreur rapport:", err);
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

  const filteredQuestions = questions.filter((q) =>
    q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const finalScores = computeScores();

  // 💡 --- UI HELPER FUNCTIONS ---
  const getOptionButtonClass = (key) => {
    const selected = selectedAnswers[currentQuestion] || [];
    const isSelected = selected.includes(key);
    const isNotInterested = notInterested[currentQuestion]?.[key];

    // Options button style
    if (isSelected) {
      return theme === 'dark' 
        ? "bg-blue-700 text-white border-2 border-blue-500" 
        : "bg-blue-200 text-blue-800 border-2 border-blue-300";
    }

    if (isNotInterested) {
      return theme === 'dark' 
        ? "bg-gray-700 text-gray-500 opacity-50" 
        : "bg-gray-100 text-gray-400 opacity-50";
    }

    return theme === 'dark' 
      ? "bg-gray-700 hover:bg-gray-600 text-gray-200" 
      : "bg-green-50 hover:bg-green-100 text-gray-700";
  };
  // -----------------------------

  return (
    <div
      className="flex flex-col items-center min-h-screen p-6"
      // 🔑 Conditional background style
      style={{
        background: theme === 'dark' ? 'none' : 'linear-gradient(180deg, #ffffff 0%, #d4f8d4 100%)', 
      }}
    >
      {!finished && (
        <div className="mb-6 flex items-center gap-4">
          {/* 🔑 Timer Text Color */}
          <div className={`text-2xl font-bold transition-colors ${theme === 'dark' ? 'text-red-400' : 'text-green-700'}`}>
            ⏰ {formatTime(timeLeft)}
          </div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            // 🔑 Pause Button Styling
            className={`px-4 py-2 rounded-lg shadow transition-colors ${
              theme === 'dark' 
              ? 'bg-yellow-600 text-white hover:bg-yellow-500' 
              : 'bg-yellow-400 text-white hover:bg-yellow-500'
            }`}
          >
            {isPaused ? "▶️ Reprendre" : "⏸ Pause"}
          </button>
        </div>
      )}

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
            <div className={`w-full rounded-full h-3 mb-6 overflow-hidden transition-colors ${theme === 'dark' ? 'bg-gray-700' : 'bg-green-100'}`}>
              <motion.div
                className="h-3 bg-green-500"
                initial={{ width: "0%" }}
                animate={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <h1 className={`text-2xl font-bold mb-6 transition-colors ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
              {session.title || "Session sans titre"}
            </h1>

            {current.source && (
              <p className={`text-sm italic mb-2 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                📌 {current.source}
              </p>
            )}

            <h2 className={`text-xl font-semibold mb-4 transition-colors ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
              {currentQuestion + 1}. {current.question_text}
            </h2>

            {/* Options */}
            <div className="grid grid-cols-1 gap-3">
              {["A", "B", "C", "D", "E"].map((key) => {
                const val = current.options?.[key];
                if (!val) return null;
                
                return (
                  <motion.div key={key} className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className={`flex-1 py-3 px-5 rounded-xl text-lg font-semibold transition-all duration-300 shadow ${getOptionButtonClass(key)}`}
                      onClick={() => handleAnswer(key)}
                    >
                      {key}. {val}
                    </motion.button>

                    <button
                      onClick={() => toggleNotInterested(key)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        notInterested[currentQuestion]?.[key]
                          ? "bg-red-500 text-white" 
                          : (theme === 'dark' ? "bg-gray-600 text-gray-300 hover:bg-gray-500" : "bg-gray-200 text-gray-600 hover:bg-gray-300")
                      }`}
                    >
                      {notInterested[currentQuestion]?.[key] ? "Undo" : "Not Interested"}
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Next/Previous Controls */}
            <div className="flex justify-between mt-6">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handlePrev}
                disabled={currentQuestion === 0}
                className={`px-6 py-2 rounded-xl text-white font-semibold shadow transition-colors ${
                  currentQuestion === 0
                    ? (theme === 'dark' ? 'bg-gray-600 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed')
                    : (theme === 'dark' ? 'bg-green-600 hover:bg-green-500' : 'bg-green-500 hover:bg-green-600')
                }`}
              >
                ⬅ Précédent
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleNext}
                className="bg-green-500 px-6 py-2 rounded-xl text-white font-semibold shadow hover:bg-green-600"
              >
                {currentQuestion + 1 < questions.length
                  ? "Suivant ➡"
                  : "Terminer 🎉"}
              </motion.button>
            </div>

            <p className={`mt-6 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Question {currentQuestion + 1} / {questions.length}
            </p>
          </>
        ) : (
          // ✅ Finished View
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* 🔑 Result Title */}
            <h2 className={`text-3xl font-bold mb-4 transition-colors ${theme === 'dark' ? 'text-emerald-400' : 'text-gray-800'}`}>
              🎉 Session terminée !
            </h2>

            {/* 🔑 Result Scores */}
            <p className={`text-xl mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              🟢 Tout ou Rien:{" "}
              <span className="font-bold text-green-600 dark:text-green-400">
                {finalScores.toutRien} / 20
              </span>
            </p>

            <p className={`text-xl mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              🟡 Partiel:{" "}
              <span className="font-bold text-yellow-600 dark:text-yellow-400">
                {finalScores.partiel} / 20
              </span>
            </p>

            <p className={`text-xl mb-6 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              🔴 Partiel Négatif:{" "}
              <span className="font-bold text-red-600 dark:text-red-400">
                {finalScores.negatif} / 20
              </span>
            </p>

            {/* ✅ Show Correct Answers Review */}
            <div className={`text-left mt-6 space-y-4 p-4 rounded-xl border transition-colors ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className={`text-lg font-semibold mb-3 transition-colors ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                📋 Correction des réponses :
              </h3>
              {questions.map((q, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}
                >
                  <p className={`font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                    {i + 1}. {q.question_text}
                  </p>
                  {["A", "B", "C", "D", "E"].map((key) => {
                    const val = q.options?.[key];
                    if (!val) return null;
                    const correct = Array.isArray(q.correct_answer)
                      ? q.correct_answer
                      : [q.correct_answer];
                    const isCorrect = correct.includes(key);
                    const selected = selectedAnswers[i] || [];
                    const isSelected = selected.includes(key);

                    let textColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
                    if (isCorrect) textColor = 'text-green-600 dark:text-green-400 font-semibold';
                    else if (isSelected) textColor = 'text-red-500 dark:text-red-400';
                    
                    return (
                      <p
                        key={key}
                        className={`ml-4 ${textColor}`}
                      >
                        {key}. {val}
                      </p>
                    );
                  })}
                </div>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              className="bg-green-500 px-6 py-3 mt-8 rounded-xl text-lg font-semibold text-white shadow hover:bg-green-600"
              onClick={() => {
                setCurrentQuestion(0);
                setSelectedAnswers({});
                setFinished(false);
              }}
            >
              🔄 Recommencer
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* 🔍 Search results */}
      {searchTerm && (
        <div className={`w-full max-w-3xl mt-8 p-4 rounded-xl shadow border transition-colors ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`font-bold text-lg mb-3 transition-colors ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>Résultats :</h3>
          {filteredQuestions.length > 0 ? (
            <ul className="list-disc pl-6 text-left space-y-2">
              {filteredQuestions.map((q, i) => (
                <li
                  key={i}
                  className={`cursor-pointer transition-colors ${theme === 'dark' ? 'text-gray-300 hover:text-emerald-400' : 'text-gray-700 hover:text-green-600'}`}
                  onClick={() => {
                    setCurrentQuestion(i);
                    setNoteInput(notes[i] || "");
                    setReportMsg("");
                  }}
                >
                  {i + 1}. {q.question_text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Aucun résultat ❌</p>
          )}
        </div>
      )}
    </div>
  );
}