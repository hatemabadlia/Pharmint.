import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

export default function TDTPPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Toutes");
  const navigate = useNavigate();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    const ref = collection(db, "users", userId, "td_sessions");
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          ...raw,
          createdAt:
            raw.createdAt?.toDate?.() ??
            (typeof raw.createdAt === "number" ? new Date(raw.createdAt) : new Date()),
        };
      });

      // Sort newest first
      data.sort((a, b) => b.createdAt - a.createdAt);
      setSessions(data);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  // Delete session
  const handleDelete = async (id) => {
    if (!window.confirm("⚠️ Voulez-vous vraiment supprimer cette session ? Cette action est irréversible."))
      return;

    try {
      await deleteDoc(doc(db, "users", userId, "td_sessions", id));
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert("Erreur : impossible de supprimer la session.");
    }
  };

  const renderCircle = (value, color, label) => (
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
            <Cell fill={color} />
            <Cell fill="#e5e7eb" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <span className="absolute text-sm font-bold text-gray-800">{label}</span>
    </div>
  );

  // Apply filter
  const filteredSessions = sessions.filter((s) => {
    if (filter === "Toutes") return true;
    if (filter === "En cours") return !s.finished;
    if (filter === "Terminées") return s.finished;
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">🧪 Mes TD / TP</h1>

        <div className="flex items-center gap-3">
          {/* Filter Bar */}
          <div className="flex bg-gray-100 rounded-lg overflow-hidden shadow-sm">
            {["Toutes", "En cours", "Terminées"].map((opt) => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  filter === opt ? "bg-indigo-600 text-white" : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Create Button */}
          <button
            onClick={() => navigate("/home/tdtp/create")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
          >
            <PlusCircle className="w-5 h-5" />
            Nouvelle Session
          </button>
        </div>
      </div>

      {/* Sessions */}
      {loading ? (
        <p className="text-center text-gray-500">⏳ Chargement...</p>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center text-gray-600 mt-20">
          <p className="mb-4">
            Aucune session {filter !== "Toutes" ? filter.toLowerCase() : ""} trouvée.
          </p>
          <button
            onClick={() => navigate("/home/tdtp/create")}
            className="px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
          >
            🚀 Créer votre première session TD/TP
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredSessions.map((s) => {
              const progress = s.num_questions
                ? ((s.currentIndex || 0) / s.num_questions) * 100
                : 0;

              return (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="relative cursor-pointer rounded-xl shadow-md p-6 bg-white hover:shadow-lg hover:scale-[1.02] transition flex flex-col items-center group"
                  onClick={() => navigate(`/home/tdtp/sessions/${s.id}`)}
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // prevent navigating when clicking delete
                      handleDelete(s.id);
                    }}
                    className="absolute top-3 right-3 p-2 text-red-500 hover:text-white hover:bg-red-600 rounded-full transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>

                  {/* Title */}
                  <h2 className="text-lg font-bold mb-2 text-gray-800 text-center">
                    {s.title || "Session TD/TP"}
                  </h2>

                  {/* Date */}
                  <p className="text-sm text-gray-600 mb-4">
                    📅 {s.createdAt ? s.createdAt.toLocaleString() : "Date inconnue"}
                  </p>

                  {/* Circle */}
                  {s.finished
                    ? renderCircle((s.score / 20) * 100, "#22c55e", `${s.score}/20`)
                    : renderCircle(progress, "#6366f1", `${Math.round(progress)}%`)}

                  {/* Status */}
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    {s.finished ? "✅ Terminé" : "⏳ En cours"}
                  </p>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
