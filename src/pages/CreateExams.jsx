// src/pages/client/CreateExam.jsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase/config";
import { collection, getDocs, doc, getDoc, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme
import { motion, AnimatePresence } from "framer-motion"; // For error message
import { XCircle } from "lucide-react"; // For error icon

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


export default function CreateExam() {
  // 🔑 Get theme state
  const { theme } = useTheme();

  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [order, setOrder] = useState("annee");
  const [loading, setLoading] = useState(false);

  const [speciality, setSpeciality] = useState("");
  const [year, setYear] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [maxQuestions, setMaxQuestions] = useState(0);
  const [examDuration, setExamDuration] = useState(3600); // default 1h
  
  const [errorMessage, setErrorMessage] = useState(null); // 🔑 Error state

  const navigate = useNavigate();

  const displayError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000); 
  };


  const formatId = (id) => {
    if (!id) return "";
    return id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // 🔹 Fetch modules
  useEffect(() => {
    const fetchModules = async () => {
      setLoading(true);
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          const sp =
            data.specialite === "Pharmacie"
              ? "pharmacie"
              : data.specialite === "Pharmacie Auxiliaire"
              ? "pharmacie_auxiliaire"
              : "pharmacie_industrielle";

          const yr = data.year.includes("1")
            ? "year_1"
            : data.year.includes("2")
            ? "year_2"
            : data.year.includes("3")
            ? "year_3"
            : data.year.includes("4")
            ? "year_4"
            : "year_5";

          setSpeciality(sp);
          setYear(yr);

          const modulesRef = collection(
            db,
            "courses",
            sp,
            "years",
            yr,
            "modules"
          );
          const snap = await getDocs(modulesRef);
          const mods = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setModules(mods);
        }
      } catch (err) {
        console.error("Erreur fetch modules:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  // 🔹 Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedModule || !speciality || !year) {
        setAvailableCourses([]);
        return;
      }
      setLoading(true);
      try {
        const coursesRef = collection(
          db,
          "courses",
          speciality,
          "years",
          year,
          "modules",
          selectedModule,
          "quizzes"
        );
        const snap = await getDocs(coursesRef);
        const crs = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          questionCount: d.data().questions ? d.data().questions.length : 0,
        }));
        setAvailableCourses(crs);
      } catch (err) {
        console.error("Erreur fetch courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [selectedModule, speciality, year]);

  // 🔹 Recalculate total questions
  useEffect(() => {
    const total = selectedCourses.reduce(
      (sum, c) => sum + (c.questionCount || 0),
      0
    );
    setMaxQuestions(total);
    if (questionCount > total) setQuestionCount(total);
  }, [selectedCourses]);

  const handleAddCourse = (course) => {
    setSelectedCourses([...selectedCourses, course]);
    setAvailableCourses(availableCourses.filter((c) => c.id !== course.id));
  };

  const handleRemoveCourse = (course) => {
    setAvailableCourses([...availableCourses, course]);
    setSelectedCourses(selectedCourses.filter((c) => c.id !== course.id));
  };

  // 🔹 Save exam + redirect
  const handleSaveExam = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return displayError("Utilisateur non connecté"); // ❌ Replaced alert()

      if (!examTitle.trim()) return displayError("⚠️ Donnez un titre à l’examen"); // ❌ Replaced alert()

      const ref = collection(db, "users", userId, "exams");
      await addDoc(ref, {
        title: examTitle,
        module: selectedModule,
        courses: selectedCourses,
        num_questions: Number(questionCount),
        order_mode: order,
        speciality,
        year,
        totalTime: examDuration,
        remainingTime: examDuration,
        finished: false,
        createdAt: Date.now(),
      });

      // ✅ Redirect to exam sessions after creation
      navigate("/home/examSession");
    } catch (err) {
      console.error("Erreur création examen:", err);
      displayError("❌ Une erreur est survenue lors de la création de l'examen"); // ❌ Replaced alert()
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* 🔑 Error Message Display */}
      <AnimatePresence>
        {errorMessage && <ErrorMessage message={errorMessage} onClose={closeError} theme={theme} />}
      </AnimatePresence>

      <h1 className="text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-red-600 to-orange-600 text-transparent bg-clip-text">
        🎓 Création d’un Examen
      </h1>

      {/* Exam Title */}
      <div className="mb-6">
        {/* 🔑 Label Text Color */}
        <label className={`block font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          📝 Titre de l’Examen
        </label>
        <input
          type="text"
          value={examTitle}
          onChange={(e) => setExamTitle(e.target.value)}
          placeholder="Ex: Examen Simulation Pathologie"
          // 🔑 Input Styling
          className={`w-full border p-3 rounded-lg shadow-sm outline-none transition-colors duration-300 ${
            theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-red-500'
            : 'border-gray-300 focus:ring-2 focus:ring-red-500'
          }`}
        />
      </div>

      {/* Module */}
      <div className="mb-8">
        {/* 🔑 Label Text Color */}
        <label className={`block font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          📘 Choisir un Module
        </label>
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          // 🔑 Select Styling
          className={`w-full border p-3 rounded-lg shadow-sm outline-none transition-colors duration-300 ${
            theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-100'
            : 'border-gray-300'
          }`}
        >
          <option value="">-- Sélectionnez un module --</option>
          {modules.map((mod) => (
            <option key={mod.id} value={mod.id}>
              {mod.name || formatId(mod.id)}
            </option>
          ))}
        </select>
      </div>

      {/* Courses */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        {/* Available */}
        <div>
          {/* 🔑 Header Text Color */}
          <h2 className={`font-semibold mb-3 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>📂 Liste des cours</h2>
          {/* 🔑 List Container Styling */}
          <div className={`border rounded-xl h-72 overflow-y-auto p-3 shadow-sm transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
            {loading ? (
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}>Chargement...</p>
            ) : availableCourses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-10">
                Aucun cours disponible
              </p>
            ) : (
              availableCourses.map((c) => (
                <div
                  key={c.id}
                  // 🔑 Course Item Styling (Available)
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 shadow'
                    : 'bg-gray-50 hover:bg-red-100 hover:shadow text-gray-900'
                  }`}
                  onClick={() => handleAddCourse(c)}
                >
                  ➕ {c.name || formatId(c.id)} ({c.questionCount || 0} qst)
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected */}
        <div>
          {/* 🔑 Header Text Color */}
          <h2 className={`font-semibold mb-3 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>✅ Cours sélectionnés</h2>
          {/* 🔑 List Container Styling */}
          <div className={`border rounded-xl h-72 overflow-y-auto p-3 shadow-sm transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
            {selectedCourses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-10">
                Aucun cours sélectionné
              </p>
            ) : (
              selectedCourses.map((c) => (
                <div
                  key={c.id}
                  // 🔑 Course Item Styling (Selected)
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    theme === 'dark'
                    ? 'bg-red-900/70 hover:bg-red-800 text-white shadow'
                    : 'bg-red-200 hover:bg-red-300 hover:shadow text-gray-900'
                  }`}
                  onClick={() => handleRemoveCourse(c)}
                >
                  ❌ {c.name || formatId(c.id)} ({c.questionCount || 0} qst)
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-10 items-center mb-8">
        {/* Question count */}
        <div className="w-full md:w-1/2">
          {/* 🔑 Label Text Color */}
          <label className={`block font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            🎯 Nombre de Questions (max {maxQuestions})
          </label>
          <input
            type="range"
            min={0}
            max={maxQuestions}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full accent-red-600"
          />
          <div className="flex justify-between text-sm mt-2">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}>0</span>
            <span className={`font-semibold transition-colors ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>
              {questionCount} / {maxQuestions}
            </span>
          </div>
        </div>

        {/* Order */}
        <div>
          {/* 🔑 Label Text Color */}
          <label className={`block font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            🔀 Ordre
          </label>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            // 🔑 Select Styling
            className={`border p-3 rounded-lg shadow-sm outline-none transition-colors duration-300 ${
              theme === 'dark'
              ? 'bg-gray-800 border-gray-700 text-gray-100'
              : 'border-gray-300'
            }`}
          >
            <option value="annee">Par année d’examen</option>
            <option value="aleatoire">Aléatoire</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          {/* 🔑 Label Text Color */}
          <label className={`block font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            ⏱️ Durée de l’Examen
          </label>
          <select
            value={examDuration}
            onChange={(e) => setExamDuration(Number(e.target.value))}
            // 🔑 Select Styling
            className={`border p-3 rounded-lg shadow-sm outline-none transition-colors duration-300 ${
              theme === 'dark'
              ? 'bg-gray-800 border-gray-700 text-gray-100'
              : 'border-gray-300'
            }`}
          >
            <option value={2700}>45 min</option>
            <option value={3600}>1 h</option>
            <option value={4500}>1 h 15 min</option>
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveExam}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:opacity-90 transition"
        >
          Créer l’examen ✅
        </button>
      </div>
    </div>
  );
}