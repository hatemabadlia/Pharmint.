// src/pages/client/CreateExam.jsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase/config";
import { collection, getDocs, doc, getDoc, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function CreateExam() {
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

  const navigate = useNavigate();

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
      if (!userId) return alert("Utilisateur non connecté");

      if (!examTitle.trim()) return alert("⚠️ Donnez un titre à l’examen");

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
      alert("❌ Une erreur est survenue lors de la création de l'examen");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-red-600 to-orange-600 text-transparent bg-clip-text">
        🎓 Création d’un Examen
      </h1>

      {/* Exam Title */}
      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2">
          📝 Titre de l’Examen
        </label>
        <input
          type="text"
          value={examTitle}
          onChange={(e) => setExamTitle(e.target.value)}
          placeholder="Ex: Examen Simulation Pathologie"
          className="w-full border p-3 rounded-lg shadow-sm"
        />
      </div>

      {/* Module */}
      <div className="mb-8">
        <label className="block text-gray-700 font-semibold mb-2">
          📘 Choisir un Module
        </label>
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="w-full border p-3 rounded-lg shadow-sm"
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
          <h2 className="font-semibold mb-3 text-gray-700">📂 Liste des cours</h2>
          <div className="border rounded-xl h-72 overflow-y-auto p-3 shadow-sm">
            {loading ? (
              <p>Chargement...</p>
            ) : availableCourses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-10">
                Aucun cours disponible
              </p>
            ) : (
              availableCourses.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-gray-50 rounded-lg mb-2 cursor-pointer hover:bg-red-100 hover:shadow transition"
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
          <h2 className="font-semibold mb-3 text-gray-700">✅ Cours sélectionnés</h2>
          <div className="border rounded-xl h-72 overflow-y-auto p-3 shadow-sm">
            {selectedCourses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-10">
                Aucun cours sélectionné
              </p>
            ) : (
              selectedCourses.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-red-200 rounded-lg mb-2 cursor-pointer hover:bg-red-300 hover:shadow transition"
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
          <label className="block text-gray-700 font-semibold mb-2">
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
            <span>0</span>
            <span className="font-semibold text-red-700">
              {questionCount} / {maxQuestions}
            </span>
          </div>
        </div>

        {/* Order */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            🔀 Ordre
          </label>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="border p-3 rounded-lg shadow-sm"
          >
            <option value="annee">Par année d’examen</option>
            <option value="aleatoire">Aléatoire</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            ⏱️ Durée de l’Examen
          </label>
          <select
            value={examDuration}
            onChange={(e) => setExamDuration(Number(e.target.value))}
            className="border p-3 rounded-lg shadow-sm"
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
