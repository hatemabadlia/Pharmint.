// src/pages/client/SessionsPage.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import { collection, doc, deleteDoc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Trash2, AlertTriangle, XCircle } from "lucide-react"; // 🔑 Added icon imports
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme
import { motion, AnimatePresence } from "framer-motion"; // 🔑 Import motion

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


export default function SessionsPage() {
  // 🔑 Get theme state
  const { theme } = useTheme();

  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // ID of session to delete

  const navigate = useNavigate();
  const userId = auth.currentUser?.uid;

  const closeError = () => setErrorMessage(null);
  const displayError = (message) => {
    setErrorMessage(message);
    setTimeout(closeError, 5000); 
  };


  useEffect(() => {
    if (!userId) return;

    const ref = collection(db, "users", userId, "sessions");
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.docs.map((d) => {
        const raw = d.data();
        const createdAt =
          raw.createdAt?.toDate?.() ??
          (typeof raw.createdAt === "number"
            ? new Date(raw.createdAt)
            : null);
        return { id: d.id, ...raw, createdAt };
      });

      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setSessions(data);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  useEffect(() => {
    let filtered = sessions;
    if (filter === "finished") filtered = sessions.filter((s) => s.finished);
    if (filter === "ongoing") filtered = sessions.filter((s) => !s.finished);
    setFilteredSessions(filtered);
  }, [filter, sessions]);


  // ❌ Replaced old handleDelete flow
  const requestDelete = (id, e) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };
  
  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteDoc(doc(db, "users", userId, "sessions", confirmDeleteId));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      displayError("Erreur : impossible de supprimer la session."); // ❌ Replaced alert()
      setConfirmDeleteId(null);
    }
  };


  // 💡 Chart renderer now uses theme colors
  const renderCircle = (value, color, label) => {
    const trackColor = theme === 'dark' ? '#374151' : '#e5e7eb'; // Gray-700 or Gray-200
    const arcColor = color; // Dynamic score/progress color

    return (
      <div className="relative w-28 h-28 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={[
                { name: "Value", value },
                { name: "Rest", value: 100 - value },
              ]}
              dataKey="value"
              innerRadius={40}
              outerRadius={55}
              startAngle={90}
              endAngle={-270}
            >
              <Cell fill={arcColor} />
              <Cell fill={trackColor} />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <span className={`absolute text-sm font-bold transition-colors ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 🔑 Modals and Errors */}
      <AnimatePresence>
        {errorMessage && <ErrorMessage message={errorMessage} onClose={closeError} theme={theme} />}
      </AnimatePresence>
      <AnimatePresence>
        {confirmDeleteId && (
          <ConfirmModal
            message="Voulez-vous vraiment supprimer cette session ? Cette action est irréversible."
            onConfirm={confirmDelete}
            onCancel={() => setConfirmDeleteId(null)}
            theme={theme}
          />
        )}
      </AnimatePresence>


      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        {/* 🔑 Title Text Color */}
        <h1 className={`text-2xl md:text-3xl font-bold transition-colors ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
          📚 Mes Sessions
        </h1>

        <div className="flex flex-wrap gap-3">
          {["all", "ongoing", "finished"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              // 🔑 Filter Button Styling
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? "bg-green-600 text-white shadow-md"
                  : (theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
              }`}
            >
              {f === "all"
                ? "Toutes"
                : f === "ongoing"
                ? "En cours"
                : "Terminées"}
            </button>
          ))}

          <button
            onClick={() => navigate("/home/quizzes")}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-500 text-white rounded-lg flex items-center gap-2 hover:opacity-90 shadow-md transition"
          >
            <PlusCircle className="w-5 h-5" />
            Nouvelle Session
          </button>
        </div>
      </div>

      {/* Sessions List */}
      {loading ? (
        <p className={`text-center transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>⏳ Chargement...</p>
      ) : filteredSessions.length === 0 ? (
        <div className={`text-center mt-20 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <p className="mb-4">
            {filter === "finished"
              ? "Aucune session terminée."
              : filter === "ongoing"
              ? "Aucune session en cours."
              : "Vous n’avez pas encore créé de session."}
          </p>
          {filter === "all" && (
            <button
              onClick={() => navigate("/home/quizzes")}
              className="px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
            >
              🚀 Créer votre première session
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((s) => {
            const progress = s.num_questions
              ? ((s.currentIndex || 0) / s.num_questions) * 100
              : 0;

            return (
              <div
                key={s.id}
                onClick={() => navigate(`/home/sessions/${s.id}`)}
                // 🔑 Session Card Styling
                className={`relative cursor-pointer rounded-xl shadow-md p-6 transition flex flex-col items-center group ring-1 ${
                    theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700 ring-gray-700'
                    : 'bg-white hover:shadow-xl hover:-translate-y-1 ring-gray-200'
                }`}
              >
                {/* Delete button */}
                <button
                  onClick={(e) => requestDelete(s.id, e)} // ❌ Use new requestDelete function
                  className="absolute top-3 right-3 p-2 text-red-500 hover:text-white bg-transparent hover:bg-red-600 rounded-full transition opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                {/* Title */}
                <h2 className={`text-lg font-bold mb-2 text-center transition-colors ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                  {s.title || "Session sans titre"}
                </h2>

                {/* Date */}
                <p className={`text-sm mb-4 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  📅{" "}
                  {s.createdAt
                    ? s.createdAt.toLocaleString("fr-FR")
                    : "Date inconnue"}
                </p>

                {/* Progress / Score */}
                {s.finished
                  ? renderCircle(
                      (s.score / 20) * 100,
                      "#22c55e", // Green for finished score
                      `${s.score}/20`
                    )
                  : renderCircle(progress, "#facc15", `${Math.round(progress)}%`)} // Yellow for ongoing progress

                {/* Status */}
                <p className={`mt-3 text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {s.finished ? "✅ Terminé" : `⏳ En cours`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}