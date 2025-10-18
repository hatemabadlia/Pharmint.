// src/pages/client/TDSessionPage.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Howl } from "howler";

export default function TDSessionPage() {
  const { id } = useParams();
  const userId = auth.currentUser?.uid;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // selected can be string (single) or array (multi)
  const [selected, setSelected] = useState(null);

  // scoring accumulators
  const [scoreNegative, setScoreNegative] = useState(0); // for negative system
  const [scoreNormal, setScoreNormal] = useState(0); // tout ou rien
  const [scorePartiel, setScorePartiel] = useState(0); // partial positive

  const [finished, setFinished] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  // prevent double scoring if user revisits and clicks "Afficher la réponse" again
  const [answeredIndices, setAnsweredIndices] = useState(new Set());

  const [notes, setNotes] = useState({});
  const [noteInput, setNoteInput] = useState("");
  const [reportMsg, setReportMsg] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [notInterested, setNotInterested] = useState({});

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

    const fetchTDSession = async () => {
      try {
        const ref = doc(db, "users", userId, "td_sessions", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          let allQuestions = [];
          if (Array.isArray(data.tds)) {
            data.tds.forEach((td) => {
              if (Array.isArray(td.questions)) {
                allQuestions = [...allQuestions, ...td.questions];
              }
            });
          }

          setSession({ ...data, questions: allQuestions });

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

    fetchTDSession();
  }, [userId, id]);

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (!session) return <p className="text-center mt-10">Session TD introuvable ❌</p>;

  const questions = session?.questions || [];
  const current = questions[currentQuestion];

  // helper to know if current question expects multiple answers
  const isMulti = Array.isArray(current?.correct_answer);

  // Toggle/select answer(s). User can change freely until showResponse === true
  const handleAnswer = (optionKey) => {
    if (showResponse) return; // locked after revealing

    if (isMulti) {
      // ensure selected is an array
      const arr = Array.isArray(selected) ? [...selected] : [];
      const idx = arr.indexOf(optionKey);
      if (idx === -1) arr.push(optionKey);
      else arr.splice(idx, 1);
      setSelected(arr);
    } else {
      // single selection: set or toggle same selection
      setSelected((prev) => (prev === optionKey ? null : optionKey));
    }
  };

  // scoring when reveal is clicked
  const handleShowResponse = () => {
    if ((isMulti && (!selected || selected.length === 0)) || (!isMulti && !selected)) return;
    if (showResponse) return;

    // avoid double-scoring for same question
    if (answeredIndices.has(currentQuestion)) {
      setShowResponse(true);
      return;
    }

    // determine correct answers in uniform array form
    const correctArr = isMulti ? current.correct_answer : [current.correct_answer];

    // user's selection array
    const userArr = isMulti ? (Array.isArray(selected) ? selected : []) : [selected];

    // compute counts
    const numCorrectPicked = userArr.filter((opt) => correctArr.includes(opt)).length;
    const numWrongPicked = userArr.filter((opt) => !correctArr.includes(opt)).length;
    const totalCorrect = correctArr.length || 1;

    // ---------- Tout ou Rien ----------
    // full point if user picked exactly all correct and nothing else (set equality)
    const pickedSet = new Set(userArr);
    const correctSet = new Set(correctArr);
    let toutOuRienPoint = 0;
    if (pickedSet.size > 0 && pickedSet.size === correctSet.size) {
      // check equality
      const allMatch = [...correctSet].every((x) => pickedSet.has(x));
      if (allMatch) toutOuRienPoint = 1;
    }

    // ---------- Partiel (positive) ----------
    // fraction of correct answers picked (0..1)
    const partielPoint = totalCorrect ? numCorrectPicked / totalCorrect : 0;

    // ---------- Partiel Négatif ----------
    // start with same partial positive then subtract penalty per wrong pick
    const penaltyPerWrong = 0.25; // same penalty you used previously
    const partielNegPoint = Math.max(0, partielPoint - numWrongPicked * penaltyPerWrong);

    // ---------- single-answer fallback ----------
    if (!isMulti) {
      // single-answer logic consistent with earlier behavior:
      if (selected === current.correct_answer) {
        // correct
        // keep same: normal +1, partiel +1, negative unaffected
        setScoreNormal((s) => s + 1);
        setScorePartiel((s) => s + 1);
        setScoreNegative((s) => s + 1);
        playSound("correct");
      } else {
        // wrong
        setScoreNegative((s) => s - penaltyPerWrong);
        setScorePartiel((s) => s + 0); // no partial
        playSound("wrong");
      }
    } else {
      // multi-answer accumulators
      setScoreNormal((s) => s + toutOuRienPoint);
      setScorePartiel((s) => s + partielPoint);
      // for negative, accumulate partielNegPoint but also keep earlier "negative style"
      setScoreNegative((s) => s + partielNegPoint);
      // sound: play correct sound if there is at least one correct picked and no wrong picks OR full correct
      if (toutOuRienPoint === 1 || (numCorrectPicked > 0 && numWrongPicked === 0)) {
        playSound("correct");
      } else {
        playSound("wrong");
      }
    }

    // mark as answered to prevent double counting
    setAnsweredIndices((prev) => {
      const copy = new Set(prev);
      copy.add(currentQuestion);
      return copy;
    });

    setShowResponse(true);
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
        const ref = doc(db, "users", userId, "td_sessions", id);
        // Save three scoring styles to Firestore
        await updateDoc(ref, {
          finished: true,
          score_tout_ou_rien: ((scoreNormal / questions.length) * 20).toFixed(2),
          score_partiel: ((scorePartiel / questions.length) * 20).toFixed(2),
          score_partiel_negative: ((scoreNegative / questions.length) * 20).toFixed(2),
          updatedAt: new Date(),
        });
      } catch (err) {
        console.error("Erreur update finish:", err);
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
    if (!noteInput.trim()) return alert("Écrivez une note.");
    try {
      const ref = doc(db, "users", userId, "td_sessions", id);
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
      const ref = doc(db, "users", userId, "td_sessions", id);
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

  const finalScoreNormal = Math.max(
    0,
    ((scoreNormal / (questions.length || 1)) * 20).toFixed(2)
  );
  const finalScorePartiel = Math.max(
    0,
    ((scorePartiel / (questions.length || 1)) * 20).toFixed(2)
  );
  const finalScoreNegative = Math.max(
    0,
    ((scoreNegative / (questions.length || 1)) * 20).toFixed(2)
  );

  const filteredQuestions = questions.filter(
    (q) =>
      q.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.year?.toString().includes(searchTerm)
  );

  // UI button class logic (keeps your original style, but supports multi)
  const getButtonClass = (key) => {
    // when responses shown: highlight correct / incorrect
    if (showResponse) {
      const correctArr = isMulti ? current.correct_answer : [current.correct_answer];
      const isCorrect = correctArr.includes(key);
      const userPicked = isMulti
        ? Array.isArray(selected) && selected.includes(key)
        : selected === key;

      if (isCorrect) return "bg-green-500 text-white";
      if (userPicked && !isCorrect) return "bg-red-500 text-white";
      return "bg-gray-200 text-gray-600";
    }

    // before reveal: show selected differently
    if (isMulti) {
      const userSelected = Array.isArray(selected) && selected.includes(key);
      if (userSelected) return "bg-blue-200 text-gray-800 border-2 border-blue-300";
    } else {
      if (selected === key) return "bg-blue-200 text-gray-800 border-2 border-blue-300";
    }

    // notSelected and notInterested visuals
    const isNotInterested = notInterested[currentQuestion]?.[key];
    if (isNotInterested) return "bg-gray-100 text-gray-400 opacity-50";
    return "bg-green-50 hover:bg-green-100 text-gray-700 transition-colors";
  };

  return (
    <div
      className="flex flex-col items-center min-h-screen p-6"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #d4f8d4 100%)",
      }}
    >
      {/* 🔍 Search bar */}
      <div className="w-full max-w-3xl mb-6">
        <input
          type="text"
          placeholder="🔍 Rechercher une question TD..."
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
            {/* Progress bar */}
            <div className="w-full bg-green-100 rounded-full h-4 mb-6 overflow-hidden relative">
              <motion.div
                className="h-4 bg-green-500"
                initial={{ width: "0%" }}
                animate={{
                  width: `${((currentQuestion + 1) / (questions.length || 1)) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
              <span className="absolute inset-0 flex justify-center items-center text-xs font-semibold text-green-800">
                {currentQuestion + 1} / {questions.length}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-6">
              {session.title || "TD Session"}
            </h1>

            {current.source && (
              <p className="text-sm text-gray-500 italic mb-2">📘 {current.source}</p>
            )}

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
                      disabled={showResponse}
                      className={`flex-1 py-3 px-5 rounded-xl text-lg font-semibold transition-all duration-300 shadow ${getButtonClass(
                        key
                      )}`}
                      onClick={() => handleAnswer(key)}
                    >
                      {key}. {val}
                    </motion.button>

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

            {/* Button to show response */}
            {((isMulti && selected && selected.length > 0) || (!isMulti && selected)) && !showResponse && (
              <div className="mt-6">
                <button
                  onClick={handleShowResponse}
                  className="bg-blue-500 px-4 py-2 rounded-xl text-white font-semibold hover:bg-blue-600 shadow"
                >
                  📖 Afficher la réponse
                </button>
              </div>
            )}

            {/* ✅ Show correct answer + justification */}
            {showResponse && ((isMulti && selected && selected.length > 0) || (!isMulti && selected)) && (
              <div className="mt-6 bg-green-50 p-4 rounded-xl border border-green-200 text-left">
                <h3 className="text-gray-800 font-semibold mb-2">📘 Justification :</h3>
                {current.justification_text ? (
                  <p className="text-gray-700">{current.justification_text}</p>
                ) : (
                  <p className="text-gray-400 italic">Pas de justification fournie.</p>
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
                    <p className="text-sm text-gray-500 mt-2">Dernière note : {notes[currentQuestion]}</p>
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
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className={`px-6 py-2 rounded-xl font-semibold shadow ${
                  currentQuestion === 0
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-yellow-400 text-white hover:bg-yellow-500"
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
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">🎉 TD Terminé !</h2>

            <p className="text-gray-700 text-xl mb-2">
              🔹 Tout ou Rien:{" "}
              <span className="font-bold text-green-600">{finalScoreNormal} / 20</span>
            </p>

            <p className="text-gray-700 text-xl mb-2">
              🔹 Partiel: <span className="font-bold text-blue-600">{finalScorePartiel} / 20</span>
            </p>

            <p className="text-gray-700 text-xl mb-6">
              🔹 Partiel Négatif:{" "}
              <span className="font-bold text-red-600">{finalScoreNegative} / 20</span>
            </p>

            <div className="w-full bg-gray-200 rounded-full h-4 mb-6 overflow-hidden">
              <motion.div
                className={`h-4 ${finalScoreNegative >= 10 ? "bg-green-500" : "bg-red-500"}`}
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
                setScorePartiel(0);
                setFinished(false);
                setSelected(null);
                setNoteInput(notes[0] || "");
                setAnsweredIndices(new Set());
              }}
            >
              🔄 Recommencer
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Search results */}
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
                    setShowResponse(false);
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
