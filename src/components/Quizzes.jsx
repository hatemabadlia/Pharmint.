// src/pages/client/CreateSession.jsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase/config";
import { collection, getDocs, doc, getDoc, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { XCircle } from "lucide-react";

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

export default function CreateSession() {
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
  const [sessionTitle, setSessionTitle] = useState("");
  const [maxQuestions, setMaxQuestions] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  const navigate = useNavigate();

  const closeError = () => setErrorMessage(null);
  const displayError = (message) => {
    setErrorMessage(message);
    setTimeout(closeError, 5000);
  };

  const formatId = (id) => {
    if (!id) return "";
    return id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // ✅ FIXED: Process questions from course data
  const getCourseQuestions = (courseData) => {
    let questions = [];
    // Handle different question structures
    if (courseData.questions) questions = courseData.questions;
    else if (courseData.sémiologie_cutanée?.questions) questions = courseData.sémiologie_cutanée.questions;
    
    return questions || [];
  };

  // 📘 Charger modules (UNCHANGED)
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
          const sp = data.specialite === "Pharmacie" 
            ? "pharmacie" 
            : data.specialite === "Pharmacie Auxiliaire" 
            ? "pharmacie_auxiliaire" 
            : "pharmacie_industrielle";
          const yr = data.year.includes("1") ? "year_1" :
                    data.year.includes("2") ? "year_2" :
                    data.year.includes("3") ? "year_3" :
                    data.year.includes("4") ? "year_4" : "year_5";

          setSpeciality(sp);
          setYear(yr);

          const modulesRef = collection(db, "courses", sp, "years", yr, "modules");
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

  // ✅ FIXED: Charger cours + QUESTIONS
  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedModule || !speciality || !year) {
        setAvailableCourses([]);
        return;
      }
      setLoading(true);
      try {
        const coursesRef = collection(
          db, "courses", speciality, "years", year, "modules", selectedModule, "quizzes"
        );
        const snap = await getDocs(coursesRef);
        const courses = [];
        
        for (const courseDoc of snap.docs) {
          const data = courseDoc.data();
          const questions = getCourseQuestions(data);
          courses.push({
            id: courseDoc.id,
            name: data.title || formatId(courseDoc.id),
            title: data.title,
            questions, // ✅ INCLUDE QUESTIONS
            questionCount: questions.length // ✅ REAL COUNT
          });
        }
        setAvailableCourses(courses);
      } catch (err) {
        console.error("Erreur fetch courses:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [selectedModule, speciality, year]);

  // ✅ FIXED: Calculate max questions
  useEffect(() => {
    const total = selectedCourses.reduce((sum, c) => sum + (c.questionCount || 0), 0);
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

  // ✅ FIXED: Process questions by order + count
  const processQuestionsForSession = (allQuestions, orderMode, count) => {
    let questions = [...allQuestions];
    
    // Sort by year or randomize
    if (orderMode === "annee") {
      questions.sort((a, b) => (b.year || 0) - (a.year || 0));
    } else {
      // Random shuffle
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }
    }
    
    return questions.slice(0, count);
  };

  // ✅ FIXED: Save with PROCESSED questions
  const handleSaveSession = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return displayError("Utilisateur non connecté");
      if (!sessionTitle.trim()) return displayError("⚠️ Donnez un titre à la session");
      if (selectedCourses.length === 0) return displayError("⚠️ Sélectionnez au moins un cours");
      if (questionCount === 0) return displayError("⚠️ Choisissez un nombre de questions");

      // Get ALL questions from selected courses
      const allQuestions = [];
      selectedCourses.forEach(course => {
        allQuestions.push(...(course.questions || []));
      });

      // Process according to user settings
      const finalQuestions = processQuestionsForSession(allQuestions, order, questionCount);

      const sessionData = {
        title: sessionTitle,
        module: selectedModule,
        courses: selectedCourses.map(c => ({ id: c.id, name: c.name, questionCount: c.questionCount })),
        num_questions: Number(questionCount),
        order_mode: order,
        speciality,
        year,
        questions: finalQuestions, // ✅ SAVED PROCESSED QUESTIONS
        createdAt: Date.now(),
      };

      const ref = collection(db, "users", userId, "sessions");
      await addDoc(ref, sessionData);

      displayError(`✅ Session créée avec ${finalQuestions.length} questions !`);
      navigate("/home/sessions");
    } catch (err) {
      console.error("Erreur création session:", err);
      displayError("❌ Erreur lors de la création");
    }
  };

  // Your JSX remains EXACTLY THE SAME
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <AnimatePresence>
        {errorMessage && <ErrorMessage message={errorMessage} onClose={closeError} theme={theme} />}
      </AnimatePresence>

      <h1 className="text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-green-600 to-blue-600 text-transparent bg-clip-text">
        🚀 Création d'une nouvelle session
      </h1>

      {/* Session Title */}
      <div className="mb-6">
        <label className={`block font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          📝 Titre de la Session
        </label>
        <input
          type="text"
          value={sessionTitle}
          onChange={(e) => setSessionTitle(e.target.value)}
          placeholder="Ex: Révision Sémiologie cutanée"
          className={`w-full border p-3 rounded-lg shadow-sm outline-none transition-colors duration-300 ${
            theme === 'dark'
              ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
              : 'border-gray-300 focus:ring-2 focus:ring-green-500'
          }`}
        />
      </div>

      {/* Select Module */}
      <div className="mb-8">
        <label className={`block font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          📘 Choisir un Module
        </label>
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
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

      {/* Courses Selector - SAME JSX */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div>
          <h2 className={`font-semibold mb-3 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>📂 Liste des cours</h2>
          <div className={`border rounded-xl h-72 overflow-y-auto p-3 shadow-sm transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
            {loading ? (
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}>Chargement...</p>
            ) : availableCourses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-10">Aucun cours disponible</p>
            ) : (
              availableCourses.map((c) => (
                <div
                  key={c.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 shadow'
                      : 'bg-gray-50 hover:bg-green-100 hover:shadow text-gray-900'
                  }`}
                  onClick={() => handleAddCourse(c)}
                >
                  ➕ {c.name} ({c.questionCount || 0} qst)
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className={`font-semibold mb-3 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            ✅ Cours sélectionnés
          </h2>
          <div className={`border rounded-xl h-72 overflow-y-auto p-3 shadow-sm transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
            {selectedCourses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-10">Aucun cours sélectionné</p>
            ) : (
              selectedCourses.map((c) => (
                <div
                  key={c.id}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    theme === 'dark'
                      ? 'bg-emerald-900/70 hover:bg-red-800 text-white shadow'
                      : 'bg-green-200 hover:bg-red-200 hover:shadow text-gray-900'
                  }`}
                  onClick={() => handleRemoveCourse(c)}
                >
                  ❌ {c.name} ({c.questionCount || 0} qst)
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Options - FIXED RANGE SLIDER */}
      <div className="flex flex-wrap gap-10 items-center mb-8">
        <div className="w-full md:w-1/2">
          <label className={`block font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            🎯 Nombre de Questions (max {maxQuestions})
          </label>
          <input
            type="range"
            min="0"
            max={Math.max(maxQuestions, 1)}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full accent-green-600"
          />
          <div className="flex justify-between text-sm mt-2">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}>0</span>
            <span className={`font-semibold transition-colors ${theme === 'dark' ? 'text-emerald-400' : 'text-green-700'}`}>
              {questionCount} / {maxQuestions}
            </span>
          </div>
        </div>

        <div>
          <label className={`block font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            🔀 Ordre
          </label>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className={`border p-3 rounded-lg shadow-sm outline-none transition-colors duration-300 ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-gray-100'
                : 'border-gray-300'
            }`}
          >
            <option value="annee">Par année d'examen</option>
            <option value="aleatoire">Aléatoire</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveSession}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:opacity-90 transition disabled:opacity-50"
        >
          Créer la session ✅
        </button>
      </div>
    </div>
  );
}
