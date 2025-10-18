// src/pages/client/SessionsPage.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import { collection, doc, deleteDoc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const userId = auth.currentUser?.uid;

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

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // 🚫 Stop the click from triggering navigation
    if (
      !window.confirm(
        "⚠️ Voulez-vous vraiment supprimer cette session ? Cette action est irréversible."
      )
    )
      return;
    try {
      await deleteDoc(doc(db, "users", userId, "sessions", id));
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
      <span className="absolute text-sm font-bold text-gray-800">
        {label}
      </span>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          📚 Mes Sessions
        </h1>

        <div className="flex flex-wrap gap-3">
          {["all", "ongoing", "finished"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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

      {/* Sessions */}
      {loading ? (
        <p className="text-center text-gray-500">⏳ Chargement...</p>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center text-gray-600 mt-20">
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
                onClick={() => navigate(`/home/sessions/${s.id}`)} // ✅ works now
                className="relative cursor-pointer rounded-xl shadow-md p-6 bg-white hover:shadow-xl hover:-translate-y-1 transition flex flex-col items-center group"
              >
                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(s.id, e)} // ✅ e.stopPropagation inside
                  className="absolute top-3 right-3 p-2 text-red-500 hover:text-white hover:bg-red-600 rounded-full transition opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                {/* Title */}
                <h2 className="text-lg font-bold mb-2 text-gray-800 text-center">
                  {s.title || "Session sans titre"}
                </h2>

                {/* Date */}
                <p className="text-sm text-gray-600 mb-4">
                  📅{" "}
                  {s.createdAt
                    ? s.createdAt.toLocaleString("fr-FR")
                    : "Date inconnue"}
                </p>

                {/* Progress / Score */}
                {s.finished
                  ? renderCircle(
                      (s.score / 20) * 100,
                      "#22c55e",
                      `${s.score}/20`
                    )
                  : renderCircle(progress, "#facc15", `${Math.round(progress)}%`)}

                {/* Status */}
                <p className="mt-3 text-sm font-medium text-gray-700">
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
