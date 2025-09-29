// src/pages/client/ExamSessionPage.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { PlusCircle } from "lucide-react";

export default function ExamSessionPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    const ref = collection(db, "users", userId, "exams"); // 🔥 exams collection
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
      setExams(data);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  // Timer render helper
  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return "00:00";
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          📝 Mes Examens
        </h1>
        <button
          onClick={() => navigate("/home/CreateExam")}
          className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition"
        >
          <PlusCircle className="w-5 h-5" />
          Nouvel Examen
        </button>
      </div>

      {/* Exams */}
      {loading ? (
        <p className="text-center text-gray-500">⏳ Chargement...</p>
      ) : exams.length === 0 ? (
        <div className="text-center text-gray-600 mt-20">
          <p className="mb-4">Vous n’avez pas encore créé d’examen.</p>
          <button
            onClick={() => navigate("/home/CreateExam")}
            className="px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
          >
            🚀 Créer votre premier examen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((e) => {
            const progress = e.num_questions
              ? ((e.currentIndex || 0) / e.num_questions) * 100
              : 0;

            return (
              <div
                key={e.id}
                onClick={() => navigate(`/home/exams/${e.id}`)}
                className="cursor-pointer rounded-xl shadow-md p-6 bg-white hover:shadow-lg transition flex flex-col justify-between"
              >
                {/* Title */}
                <h2 className="text-lg font-bold mb-2 text-gray-800">
                  {e.title || "Examen sans titre"}
                </h2>

                {/* Date */}
                <p className="text-sm text-gray-600">
                  📅 {e.createdAt ? e.createdAt.toLocaleString() : "Date inconnue"}
                </p>

                {/* Timer */}
                {e.finished ? (
                  <span className="mt-2 inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    ✅ Terminé — Score: {e.score}/20
                  </span>
                ) : (
                  <span className="mt-2 inline-block bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">
                    ⏳ Temps restant: {formatTime(e.remainingTime || e.totalTime)}
                  </span>
                )}

                {/* Progress */}
                <div className="mt-3">
                  {!e.finished && (
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-red-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
