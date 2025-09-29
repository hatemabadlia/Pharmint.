// src/pages/client/SessionsPage.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    const ref = collection(db, "users", userId, "sessions");
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
              : null),
        };
      });
      setSessions(data);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          📚 Mes Sessions
        </h1>
        <button
          onClick={() => navigate("/home/quizzes")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700 transition"
        >
          <PlusCircle className="w-5 h-5" />
          Nouvelle Session
        </button>
      </div>

      {/* Sessions */}
      {loading ? (
        <p className="text-center text-gray-500">⏳ Chargement...</p>
      ) : sessions.length === 0 ? (
        <div className="text-center text-gray-600 mt-20">
          <p className="mb-4">Vous n’avez pas encore créé de session.</p>
          <button
            onClick={() => navigate("/home/quizzes")}
            className="px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
          >
            🚀 Créer votre première session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((s) => {
            const progress = s.num_questions
              ? ((s.currentIndex || 0) / s.num_questions) * 100
              : 0;

            return (
              <div
                key={s.id}
                onClick={() => navigate(`/home/sessions/${s.id}`)}
                className="cursor-pointer rounded-xl shadow-md p-6 bg-white hover:shadow-lg transition flex flex-col items-center"
              >
                {/* Title */}
                <h2 className="text-lg font-bold mb-2 text-gray-800 text-center">
                  {s.title || "Session sans titre"}
                </h2>

                {/* Date */}
                <p className="text-sm text-gray-600 mb-4">
                  📅 {s.createdAt ? s.createdAt.toLocaleString() : "Date inconnue"}
                </p>

                {/* Circle */}
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
