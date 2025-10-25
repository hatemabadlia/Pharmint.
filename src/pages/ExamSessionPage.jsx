// src/pages/ExamSessionPage.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Trash2, XCircle, AlertTriangle } from "lucide-react"; // 🔑 Added icons for modals
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme

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

// 💡 Custom Confirmation Modal (replaces window.confirm())
const ConfirmModal = ({ message, onConfirm, onCancel, theme }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className={`rounded-xl shadow-xl w-full max-w-sm ${
        theme === 'dark' ? 'bg-gray-800 text-gray-100 ring-1 ring-gray-700' : 'bg-white'
      }`}
    >
      <div className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mt-1">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>
          </div>
        </div>
      </div>
      <div className={`px-6 py-4 flex justify-end gap-3 rounded-b-xl ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
        <button
          onClick={onCancel}
          className={`px-4 py-2 rounded-lg font-semibold transition ${
            theme === 'dark' ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
          }`}
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition"
        >
          Supprimer
        </button>
      </div>
    </motion.div>
  </motion.div>
);

export default function ExamSessionPage() {
  // 🔑 Get theme state
  const { theme } = useTheme();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Toutes");
  
  // 🔑 Error/Modal State
  const [errorMessage, setErrorMessage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, title }

  const navigate = useNavigate();
  const userId = auth.currentUser?.uid;

  const displayError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000); 
  };


  useEffect(() => {
    if (!userId) return;

    const ref = collection(db, "users", userId, "exams");
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          ...raw,
          createdAt:
            raw.createdAt?.toDate?.() ??
            (typeof raw.createdAt === "number"
              ? new Date(raw.createdAt)
              : new Date()),
        };
      });

      data.sort((a, b) => b.createdAt - a.createdAt);
      setExams(data);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ❌ Updated flow to show modal
  const requestDelete = (e, examId, examTitle) => {
    e.stopPropagation();
    setConfirmDelete({ id: examId, title: examTitle });
  };
  
  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    const { id: examId } = confirmDelete;

    try {
      await deleteDoc(doc(db, "users", userId, "exams", examId));
      displayError("✅ Examen supprimé avec succès !"); // ❌ Replaced alert
    } catch (err) {
      console.error("Erreur suppression examen:", err);
      displayError("❌ Erreur lors de la suppression de l’examen."); // ❌ Replaced alert
    } finally {
        setConfirmDelete(null);
    }
  };


  const filteredExams = exams.filter((e) => {
    if (filter === "Toutes") return true;
    if (filter === "En cours") return !e.finished;
    if (filter === "Terminées") return e.finished;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      
      {/* 🔑 Modals and Errors */}
      <AnimatePresence>
        {errorMessage && <ErrorMessage message={errorMessage} onClose={() => setErrorMessage(null)} theme={theme} />}
      </AnimatePresence>
      <AnimatePresence>
        {confirmDelete && (
          <ConfirmModal
            message={`Voulez-vous vraiment supprimer l'examen "${confirmDelete.title}" ?`}
            onConfirm={confirmDeleteAction}
            onCancel={() => setConfirmDelete(null)}
            theme={theme}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        {/* 🔑 Title Text Color */}
        <h1 className={`text-2xl md:text-3xl font-bold transition-colors ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
          📝 Mes Examens
        </h1>

        <div className="flex items-center gap-3">
          {/* Filter */}
          {/* 🔑 Filter Container Styling */}
          <div className={`rounded-lg overflow-hidden shadow-sm transition-colors ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {["Toutes", "En cours", "Terminées"].map((opt) => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  filter === opt
                    ? "bg-red-600 text-white" // Red active color maintained
                    : (theme === 'dark' ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-200')
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Create button */}
          <button
            onClick={() => navigate("/home/CreateExam")}
            className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition"
          >
            <PlusCircle className="w-5 h-5" />
            Nouvel Examen
          </button>
        </div>
      </div>

      {/* Exam List */}
      {loading ? (
        <p className={`text-center transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>⏳ Chargement...</p>
      ) : filteredExams.length === 0 ? (
        <div className={`text-center mt-20 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="mb-4">
            Aucune session {filter !== "Toutes" ? filter.toLowerCase() : ""} trouvée.
          </p>
          <button
            onClick={() => navigate("/home/CreateExam")}
            className="px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
          >
            🚀 Créer votre premier examen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredExams.map((e) => {
              const progress = e.num_questions
                ? ((e.currentIndex || 0) / e.num_questions) * 100
                : 0;

              return (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => navigate(`/home/exams/${e.id}`)}
                  // 🔑 Exam Card Styling
                  className={`cursor-pointer rounded-xl shadow-md p-6 transition flex flex-col justify-between relative ring-1 ${
                    theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700 ring-gray-700'
                    : 'bg-white hover:shadow-lg hover:scale-[1.02] ring-gray-200'
                  }`}
                >
                  {/* Delete Button */}
                  <button
                    onClick={(event) => requestDelete(event, e.id, e.title)} // ❌ Using new requestDelete function
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition dark:hover:text-red-300"
                    title="Supprimer l'examen"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  {/* Title */}
                  <h2 className={`text-lg font-bold mb-2 pr-8 transition-colors ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                    {e.title || "Examen sans titre"}
                  </h2>

                  {/* Date */}
                  <p className={`text-sm transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    📅 {e.createdAt ? e.createdAt.toLocaleString() : "Date inconnue"}
                  </p>

                  {/* Status */}
                  {e.finished ? (
                    <span className="mt-3 inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium dark:bg-emerald-900 dark:text-emerald-300">
                      ✅ Terminé — Score: {e.score}/20
                    </span>
                  ) : (
                    <span className="mt-3 inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium dark:bg-amber-900 dark:text-amber-300">
                      ⏳ Temps restant: {formatTime(e.remainingTime || e.totalTime)}
                    </span>
                  )}

                  {/* Progress */}
                  {!e.finished && (
                    <div className="mt-3">
                      {/* 🔑 Progress Bar Styling */}
                      <div className={`w-full h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                          className="h-2 bg-red-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}