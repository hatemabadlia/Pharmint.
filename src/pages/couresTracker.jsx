// src/components/CourseTracker.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { db, auth } from "../firebase/config";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme

export default function CourseTracker() {
  // 🔑 Get theme state
  const { theme } = useTheme();

  const [lessons, setLessons] = useState([]);
  const [newLesson, setNewLesson] = useState("");
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const user = auth.currentUser;

  // 🔄 Load lessons from Firestore
  useEffect(() => {
    if (!user) return;
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const ref = collection(db, "users", user.uid, "courses");
        const snapshot = await getDocs(ref);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLessons(data);
      } catch (error) {
        console.error("Error loading courses:", error);
      }
      setLoading(false);
    };
    fetchCourses();
  }, [user]);

  // ➕ Add new lesson
  const handleAddLesson = async () => {
    if (!newLesson.trim() || !user) return alert("Veuillez entrer un titre de cours."); // Original alert restored
    
    const ref = collection(db, "users", user.uid, "courses");
    try {
        const newDoc = await addDoc(ref, {
            title: newLesson.trim(),
            c1: false,
            c2: false,
            c3: false,
            qcm: false,
        });
        setLessons([...lessons, { id: newDoc.id, title: newLesson.trim() }]);
        setNewLesson("");
    } catch (error) {
        alert("Erreur lors de l'ajout du cours.");
    }
  };

  // ✅ Toggle checkbox + save to Firestore
  const toggleCheckbox = async (lessonId, field, currentValue) => {
    const ref = doc(db, "users", user.uid, "courses", lessonId);
    await updateDoc(ref, { [field]: !currentValue });
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId ? { ...l, [field]: !currentValue } : l
      )
    );
  };

  // ❌ Delete lesson with confirmation (Original flow restored)
  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("❌ Supprimer ce cours ?")) return;
    const ref = doc(db, "users", user.uid, "courses", lessonId);
    try {
        await deleteDoc(ref);
        setLessons((prev) => prev.filter((l) => l.id !== lessonId));
    } catch (err) {
        console.error("Delete error:", err);
        alert("Erreur lors de la suppression.");
    }
  };

  const getStatus = (lesson) => {
    const total = ["c1", "c2", "c3", "qcm"];
    const completed = total.filter((f) => lesson[f]).length;

    if (completed === 0) return "Not Started";
    if (completed < total.length) return "In Progress";
    return "Completed";
  };

  // 📊 Calculate progress percentage
  const totalLessons = lessons.length;
  const completedLessons = lessons.filter(
    (lesson) => getStatus(lesson) === "Completed"
  ).length;
  const progressPercent =
    totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

  // 🎉 Trigger confetti when 100% progress
  useEffect(() => {
    if (progressPercent === 100 && totalLessons > 0) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [progressPercent, totalLessons]);

  // 🔑 Loading state color
  if (loading) return <div className={`text-center p-6 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Loading...</div>;

  return (
    <div className="p-6 relative">
      {showConfetti && <Confetti numberOfPieces={250} recycle={false} />}

      {/* 🔑 Title Text */}
      <h1 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-emerald-400' : 'text-green-700'}`}>
        📖 Suivi des Cours
      </h1>

      {/* 🔥 Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm font-medium mb-2">
          {/* 🔑 Progress Text */}
          <span className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {completedLessons}/{totalLessons} cours complétés
          </span>
          <span className={`${theme === 'dark' ? 'text-emerald-400' : 'text-green-700'}`}>{progressPercent}%</span>
        </div>
        <div className={`w-full h-4 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <div
            className="h-4 bg-gradient-to-r from-green-400 to-green-700 transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Add Lesson Input */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={newLesson}
          onChange={(e) => setNewLesson(e.target.value)}
          placeholder="Ajouter un cours..."
          // 🔑 Input Styling
          className={`rounded-lg p-2 flex-1 outline-none transition-colors duration-300 ${
            theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500 border'
            : 'border focus:ring-2 focus:ring-green-500'
          }`}
        />
        <button
          onClick={handleAddLesson}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          ➕ Ajouter
        </button>
      </div>

      {/* Lessons Table */}
      <div className="overflow-x-auto">
        <table className={`w-full border-collapse rounded-lg overflow-hidden shadow-md ${theme === 'dark' ? 'border border-gray-700' : ''}`}>
          {/* 🔑 Table Header */}
          <thead className={theme === 'dark' ? 'bg-emerald-900 text-gray-100' : 'bg-green-600 text-white'}>
            <tr>
              <th className="p-3 text-left">Lesson Title</th>
              <th className="p-3 text-center">Couche 1</th>
              <th className="p-3 text-center">Couche 2</th>
              <th className="p-3 text-center">Couche 3</th>
              <th className="p-3 text-center">QCM</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((lesson) => {
              const status = getStatus(lesson);
              
              // 🔑 Conditional Row Styling
              let rowClasses = 'border-b transition-colors';
              if (theme === 'dark') {
                  if (status === 'Completed') rowClasses += ' bg-emerald-900/50 border-emerald-700 hover:bg-emerald-900/70';
                  else if (status === 'In Progress') rowClasses += ' bg-gray-800 border-gray-700 hover:bg-gray-700';
                  else rowClasses += ' bg-gray-800 border-gray-700 hover:bg-gray-700';
              } else {
                  if (status === 'Completed') rowClasses += ' bg-green-100 hover:bg-green-50';
                  else if (status === 'In Progress') rowClasses += ' bg-yellow-50 hover:bg-green-50';
                  else rowClasses += ' bg-white hover:bg-green-50';
              }

              return (
                <tr key={lesson.id} className={rowClasses}>
                  {/* 🔑 Title Text Color */}
                  <td className={`p-3 font-medium ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{lesson.title}</td>
                  {["c1", "c2", "c3", "qcm"].map((field) => (
                    <td key={field} className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={lesson[field] || false}
                        onChange={() =>
                          toggleCheckbox(lesson.id, field, lesson[field])
                        }
                        className="w-5 h-5 accent-green-600" 
                      />
                    </td>
                  ))}
                  <td className="p-3 text-center font-semibold whitespace-nowrap">
                    {/* 🔑 Status Text Colors */}
                    {status === "Completed" && (
                      <span className={theme === 'dark' ? 'text-emerald-400' : 'text-green-700'}>✅ Completed</span>
                    )}
                    {status === "In Progress" && (
                      <span className={theme === 'dark' ? 'text-amber-400' : 'text-yellow-600'}>⏳ In Progress</span>
                    )}
                    {status === "Not Started" && (
                      <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}>🚫 Not Started</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {/* 🔑 Delete Button Color */}
                    <button
                      onClick={() => handleDeleteLesson(lesson.id)}
                      className={theme === 'dark' ? 'text-red-400 hover:text-red-300 transition' : 'text-red-600 hover:text-red-800 transition'}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}