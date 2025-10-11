import { useState, useEffect } from "react";
import { db, auth } from "../firebase/config";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import Confetti from "react-confetti";

export default function CourseTracker() {
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
    if (!newLesson.trim() || !user) return;
    const ref = collection(db, "users", user.uid, "courses");
    const newDoc = await addDoc(ref, {
      title: newLesson.trim(),
      c1: false,
      c2: false,
      c3: false,
      qcm: false,
    });
    setLessons([...lessons, { id: newDoc.id, title: newLesson.trim() }]);
    setNewLesson("");
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

  // ❌ Delete lesson with confirmation
  const handleDeleteLesson = async (lessonId) => {
    if (!window.confirm("❌ Supprimer ce cours ?")) return;
    const ref = doc(db, "users", user.uid, "courses", lessonId);
    await deleteDoc(ref);
    setLessons((prev) => prev.filter((l) => l.id !== lessonId));
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
  }, [progressPercent]);

  if (loading) return <div className="text-center p-6">Loading...</div>;

  return (
    <div className="p-6 relative">
      {showConfetti && <Confetti numberOfPieces={250} recycle={false} />}

      <h1 className="text-2xl font-bold text-green-700 mb-4">
        📖 Suivi des Cours
      </h1>

      {/* 🔥 Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm font-medium mb-2">
          <span className="text-gray-700">
            {completedLessons}/{totalLessons} cours complétés
          </span>
          <span className="text-green-700">{progressPercent}%</span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
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
          className="border rounded-lg p-2 flex-1 outline-none focus:ring-2 focus:ring-green-500"
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
        <table className="w-full border-collapse rounded-lg overflow-hidden shadow-md">
          <thead className="bg-green-600 text-white">
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
            {lessons.map((lesson) => (
              <tr
                key={lesson.id}
                className={`border-b hover:bg-green-50 transition ${
                  getStatus(lesson) === "Completed"
                    ? "bg-green-100"
                    : getStatus(lesson) === "In Progress"
                    ? "bg-yellow-50"
                    : "bg-white"
                }`}
              >
                <td className="p-3 font-medium">{lesson.title}</td>
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
                <td className="p-3 text-center font-semibold">
                  {getStatus(lesson) === "Completed" && (
                    <span className="text-green-700">✅ Completed</span>
                  )}
                  {getStatus(lesson) === "In Progress" && (
                    <span className="text-yellow-600">⏳ In Progress</span>
                  )}
                  {getStatus(lesson) === "Not Started" && (
                    <span className="text-gray-500">🚫 Not Started</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleDeleteLesson(lesson.id)}
                    className="text-red-600 hover:text-red-800 transition"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
