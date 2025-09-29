// src/pages/client/CreateSession.jsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase/config";
import { collection, getDocs, doc, getDoc, addDoc } from "firebase/firestore";

export default function CreateSession() {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [order, setOrder] = useState("annee");
  const [loading, setLoading] = useState(false);

  const [speciality, setSpeciality] = useState("");
  const [year, setYear] = useState("");
  const [sessionTitle, setSessionTitle] = useState(""); // 👉 titre de la session
  const [maxQuestions, setMaxQuestions] = useState(0); // 👉 nombre max dynamique

  // format id en joli titre
  const formatId = (id) => {
    if (!id) return "";
    return id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Charger modules
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

  // Charger cours
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

  // recalcul du total des questions sélectionnées
  useEffect(() => {
    const total = selectedCourses.reduce(
      (sum, c) => sum + (c.questionCount || 0),
      0
    );
    setMaxQuestions(total);
    if (questionCount > total) setQuestionCount(total); // clamp
  }, [selectedCourses]);

  const handleAddCourse = (course) => {
    setSelectedCourses([...selectedCourses, course]);
    setAvailableCourses(availableCourses.filter((c) => c.id !== course.id));
  };

  const handleRemoveCourse = (course) => {
    setAvailableCourses([...availableCourses, course]);
    setSelectedCourses(selectedCourses.filter((c) => c.id !== course.id));
  };

  // Save session
  const handleSaveSession = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return alert("Utilisateur non connecté");

      if (!sessionTitle.trim()) return alert("⚠️ Donnez un titre à la session");

      const ref = collection(db, "users", userId, "sessions");
      await addDoc(ref, {
        title: sessionTitle,
        module: selectedModule,
        courses: selectedCourses,
        num_questions: Number(questionCount),
        order_mode: order,
        speciality,
        year,
        createdAt: Date.now(),
      });

      alert("✅ Session créée avec succès !");
      setSessionTitle("");
      setSelectedModule("");
      setSelectedCourses([]);
      setAvailableCourses([]);
      setQuestionCount(0);
      setOrder("annee");
    } catch (err) {
      console.error("Erreur création session:", err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-green-600 to-blue-600 text-transparent bg-clip-text">
        🚀 Création d'une nouvelle session
      </h1>

      {/* Session Title */}
      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2">
          📝 Titre de la Session
        </label>
        <input
          type="text"
          value={sessionTitle}
          onChange={(e) => setSessionTitle(e.target.value)}
          placeholder="Ex: Révision Sémiologie cutanée"
          className="w-full border p-3 rounded-lg shadow-sm"
        />
      </div>

      {/* Select Module */}
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

      {/* Courses Selector */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        {/* Available */}
        <div>
          <h2 className="font-semibold mb-3 text-gray-700">
            📂 Liste des cours
          </h2>
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
                  className="p-3 bg-gray-50 rounded-lg mb-2 cursor-pointer hover:bg-green-100 hover:shadow transition"
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
          <h2 className="font-semibold mb-3 text-gray-700">
            ✅ Cours sélectionnés
          </h2>
          <div className="border rounded-xl h-72 overflow-y-auto p-3 shadow-sm">
            {selectedCourses.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-10">
                Aucun cours sélectionné
              </p>
            ) : (
              selectedCourses.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-green-200 rounded-lg mb-2 cursor-pointer hover:bg-red-200 hover:shadow transition"
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
            className="w-full accent-green-600"
          />
          <div className="flex justify-between text-sm mt-2">
            <span>0</span>
            <span className="font-semibold text-green-700">
              {questionCount} / {maxQuestions}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-2">
            🔀 Ordre
          </label>
          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="border p-3 rounded-lg shadow-sm"
          >
            <option value="annee">Par année d'examen</option>
            <option value="aleatoire">Aléatoire</option>
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSession}
          className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-xl shadow-lg hover:opacity-90 transition"
        >
          Créer la session ✅
        </button>
      </div>
    </div>
  );
}
