// src/pages/client/ExamDetailPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "../firebase/config"; 
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Howl } from "howler";

export default function ExamDetailPage() {
  const { id } = useParams();
  const userId = auth.currentUser?.uid;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selected, setSelected] = useState(null);
  const [scoreNegative, setScoreNegative] = useState(0);
  const [scoreNormal, setScoreNormal] = useState(0);
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
    sound.play();
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

          // si session a déjà time, sinon par défaut 30min
          const initialTime =
            data.remainingTime || data.totalTime || 60 * 30; 
            
          // 🔥 You need to call setTimeLeft to update the state!
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
            handleFinishAuto(); // ⏰ auto finish
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

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (!session) return <p className="text-center mt-10">Session introuvable ❌</p>;

  const questions = session?.questions || [];
  const current = questions[currentQuestion];

  const handleAnswer = (optionKey) => {
    if (selected) return;
    setSelected(optionKey);

    if (optionKey === current.correct_answer) {
      setScoreNegative((s) => s + 1);
      setScoreNormal((s) => s + 1);
      playSound("correct");
    } else {
      setScoreNegative((s) => s - 0.25);
      playSound("wrong");
    }
  };

  const handleNext = async () => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion((q) => q + 1);
      setSelected(null);
      setNoteInput(notes[currentQuestion + 1] || "");
      setReportMsg("");
    } else {
      handleFinishAuto();
    }
  };

  const handleFinishAuto = async () => {
    setFinished(true);
    try {
const ref = doc(db, "users", userId, "exams", id);
      await updateDoc(ref, {
        finished: true,
        score: ((scoreNormal / questions.length) * 20).toFixed(2),
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

  const finalScoreNegative = Math.max(
    0,
    ((scoreNegative / questions.length) * 20).toFixed(2)
  );
  const finalScoreNormal = Math.max(
    0,
    ((scoreNormal / questions.length) * 20).toFixed(2)
  );

  return (
    <div
      className="flex flex-col items-center min-h-screen p-6"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #d4f8d4 100%)",
      }}
    >
      {/* Timer */}
      {!finished && (
        <div className="mb-6 flex items-center gap-4">
          <div className="text-2xl font-bold text-green-700">
            ⏰ {formatTime(timeLeft)}
          </div>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-4 py-2 bg-yellow-400 text-white rounded-lg shadow hover:bg-yellow-500"
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
              className="w-full p-3 rounded-xl border border-green-300 shadow"
            />
          </div>
    
          <motion.div
            className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 text-center border border-green-200"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {!finished ? (
              <>
                {/* Progress Bar */}
                <div className="w-full bg-green-100 rounded-full h-3 mb-6 overflow-hidden">
                  <motion.div
                    className="h-3 bg-green-500"
                    initial={{ width: "0%" }}
                    animate={{
                      width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
    
                <h1 className="text-2xl font-bold text-gray-800 mb-6">
                  {session.title || "Session sans titre"}
                </h1>
    
                {/* ✅ Source */}
                {current.source && (
                  <p className="text-sm text-gray-500 italic mb-2">
                    📌 {current.source}
                  </p>
                )}
    
                {/* Question */}
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  {currentQuestion + 1}. {current.question_text}
                </h2>
    
                {/* Options */}
                <div className="grid grid-cols-1 gap-3">
                  {["A", "B", "C", "D", "E"].map((key) => {
                    const val = current.options?.[key];
                    if (!val) return null;
                    const isNotInterested = notInterested[currentQuestion]?.[key];
                    return (
                      <motion.div key={key} className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          disabled={!!selected}
                          className={`flex-1 py-3 px-5 rounded-xl text-lg font-semibold transition-all duration-300 shadow ${
                            selected
                              ? key === current.correct_answer
                                ? "bg-green-500 text-white"
                                : key === selected
                                ? "bg-red-500 text-white"
                                : "bg-gray-200 text-gray-600"
                              : isNotInterested
                              ? "bg-gray-100 text-gray-400 opacity-50"
                              : "bg-green-50 hover:bg-green-100 text-gray-700"
                          }`}
                          onClick={() => handleAnswer(key)}
                        >
                          {key}. {val}
                        </motion.button>
    
                        {/* ❌ Not Interested toggle */}
                        <button
                          onClick={() => toggleNotInterested(key)}
                          className={`px-3 py-1 rounded-lg text-sm ${
                            isNotInterested
                              ? "bg-red-200 text-red-700"
                              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          }`}
                        >
                          {isNotInterested ? "Undo" : "Not Interested"}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
    
                {/* Justification + Notes + Report */}
                {selected && (
                  <div className="mt-6 bg-green-50 p-4 rounded-xl border border-green-200 text-left">
                    <h3 className="text-gray-800 font-semibold mb-2">
                      📖 Justification :
                    </h3>
                    {current.justification_text ? (
                      <p className="text-gray-700">{current.justification_text}</p>
                    ) : (
                      <p className="text-gray-400 italic">
                        Pas de justification fournie.
                      </p>
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
                        className="w-full p-3 rounded-xl border border-gray-300"
                      />
                      <button
                        onClick={handleSaveNote}
                        className="mt-2 bg-blue-500 px-4 py-2 rounded-xl text-white shadow hover:bg-blue-600"
                      >
                        💾 Sauvegarder Note
                      </button>
                      {notes[currentQuestion] && (
                        <p className="text-sm text-gray-500 mt-2">
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
                        className="w-full p-3 rounded-xl border border-red-300"
                      />
                      <button
                        onClick={handleReport}
                        className="mt-2 bg-red-500 px-4 py-2 rounded-xl text-white shadow hover:bg-red-600"
                      >
                        🚨 Envoyer Rapport
                      </button>
                    </div>
    
                    <div className="flex justify-end mt-4">
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
                  </div>
                )}
    
                <p className="text-gray-600 mt-6">
                  Question {currentQuestion + 1} / {questions.length}
                </p>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  🎉 Session terminée !
                </h2>
    
                <p className="text-gray-700 text-xl mb-2">
                  Note système normal:{" "}
                  <span className="font-bold text-green-600">
                    {finalScoreNormal} / 20
                  </span>
                </p>
                <p className="text-gray-700 text-xl mb-6">
                  Note système négatif:{" "}
                  <span className="font-bold text-red-600">
                    {finalScoreNegative} / 20
                  </span>
                </p>
    
                <div className="w-full bg-gray-200 rounded-full h-4 mb-6 overflow-hidden">
                  <motion.div
                    className={`h-4 ${
                      finalScoreNegative >= 10 ? "bg-green-500" : "bg-red-500"
                    }`}
                    initial={{ width: "0%" }}
                    animate={{ width: `${(finalScoreNegative / 20) * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
    
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="bg-green-500 px-6 py-3 rounded-xl text-lg font-semibold text-white shadow hover:bg-green-600"
                  onClick={() => {
                    setCurrentQuestion(0);
                    setScoreNegative(0);
                    setScoreNormal(0);
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
    
          {/* 🔍 Search results */}
          {searchTerm && (
            <div className="w-full max-w-3xl mt-8 bg-white p-4 rounded-xl shadow border">
              <h3 className="font-bold text-lg mb-3">Résultats :</h3>
              {filteredQuestions.length > 0 ? (
                <ul className="list-disc pl-6 text-left space-y-2">
                  {filteredQuestions.map((q, i) => (
                    <li
                      key={i}
                      className="cursor-pointer hover:text-green-600"
                      onClick={() => {
                        setCurrentQuestion(i);
                        setSelected(null);
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
