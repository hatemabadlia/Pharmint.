import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExamSessionPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Toutes");
  const navigate = useNavigate();
  const userId = auth.currentUser?.uid;

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

  const handleDelete = async (e, examId, examTitle) => {
    e.stopPropagation(); // prevent opening exam when clicking delete
    const confirmDelete = window.confirm(
      `🗑️ Voulez-vous vraiment supprimer l'examen "${examTitle}" ?`
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "users", userId, "exams", examId));
      alert("✅ Examen supprimé avec succès !");
    } catch (err) {
      console.error("Erreur suppression examen:", err);
      alert("❌ Erreur lors de la suppression de l’examen.");
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          📝 Mes Examens
        </h1>

        <div className="flex items-center gap-3">
          {/* Filter */}
          <div className="flex bg-gray-100 rounded-lg overflow-hidden shadow-sm">
            {["Toutes", "En cours", "Terminées"].map((opt) => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  filter === opt
                    ? "bg-red-600 text-white"
                    : "text-gray-700 hover:bg-gray-200"
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
        <p className="text-center text-gray-500">⏳ Chargement...</p>
      ) : filteredExams.length === 0 ? (
        <div className="text-center text-gray-600 mt-20">
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
                  className="cursor-pointer rounded-xl shadow-md p-6 bg-white hover:shadow-lg hover:scale-[1.02] transition flex flex-col justify-between relative"
                >
                  {/* Delete Button */}
                  <button
                    onClick={(event) => handleDelete(event, e.id, e.title)}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition"
                    title="Supprimer l'examen"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  {/* Title */}
                  <h2 className="text-lg font-bold mb-2 text-gray-800 pr-8">
                    {e.title || "Examen sans titre"}
                  </h2>

                  {/* Date */}
                  <p className="text-sm text-gray-600">
                    📅 {e.createdAt ? e.createdAt.toLocaleString() : "Date inconnue"}
                  </p>

                  {/* Status */}
                  {e.finished ? (
                    <span className="mt-3 inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      ✅ Terminé — Score: {e.score}/20
                    </span>
                  ) : (
                    <span className="mt-3 inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                      ⏳ Temps restant: {formatTime(e.remainingTime || e.totalTime)}
                    </span>
                  )}

                  {/* Progress */}
                  {!e.finished && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
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
