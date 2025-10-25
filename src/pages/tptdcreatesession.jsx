// src/pages/client/CreateTDSession.jsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase/config";
import { collection, getDocs, doc, getDoc, addDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme

export default function CreateTDSession() {
  // 🔑 Get theme state
  const { theme } = useTheme();

  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [availableTDs, setAvailableTDs] = useState([]);
  const [selectedTDs, setSelectedTDs] = useState([]);
  const [tdCount, setTDCount] = useState(0);
  const [order, setOrder] = useState("annee");
  const [loading, setLoading] = useState(false);

  const [speciality, setSpeciality] = useState("");
  const [year, setYear] = useState("");
  const [sessionTitle, setSessionTitle] = useState("");
  const [maxTDs, setMaxTDs] = useState(0);

  const navigate = useNavigate(); // 👈 used for redirect

  const formatId = (id) => {
    if (!id) return "";
    return id.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // 🔹 Charger modules
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

  // 🔹 Charger TDs (depuis tptd)
  useEffect(() => {
    const fetchTDs = async () => {
      if (!selectedModule || !speciality || !year) {
        setAvailableTDs([]);
        return;
      }
      setLoading(true);
      try {
        const tptdRef = collection(
          db,
          "courses",
          speciality,
          "years",
          year,
          "modules",
          selectedModule,
          "td_tp"
        );
        const snap = await getDocs(tptdRef);
        const tds = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          questionCount: d.data().questions ? d.data().questions.length : 0,
        }));
        setAvailableTDs(tds);
      } catch (err) {
        console.error("Erreur fetch TD:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTDs();
  }, [selectedModule, speciality, year]);

  // 🔹 recalcul du total
  useEffect(() => {
    const total = selectedTDs.reduce(
      (sum, td) => sum + (td.questionCount || 0),
      0
    );
    setMaxTDs(total);
    if (tdCount > total) setTDCount(total);
  }, [selectedTDs]);

  const handleAddTD = (td) => {
    setSelectedTDs([...selectedTDs, td]);
    setAvailableTDs(availableTDs.filter((c) => c.id !== td.id));
  };

  const handleRemoveTD = (td) => {
    setAvailableTDs([...availableTDs, td]);
    setSelectedTDs(selectedTDs.filter((c) => c.id !== td.id));
  };

  // 🔹 Save TD Session (Original logic maintained)
  const handleSaveSession = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return alert("Utilisateur non connecté");

      if (!sessionTitle.trim())
        return alert("⚠️ Donnez un titre à la session TD");

      const ref = collection(db, "users", userId, "td_sessions");
      await addDoc(ref, {
        title: sessionTitle,
        module: selectedModule,
        tds: selectedTDs,
        num_questions: Number(tdCount),
        order_mode: order,
        speciality,
        year,
        createdAt: Date.now(),
      });

      // ✅ redirect after save
      alert("✅ Session TD créée avec succès !");
      navigate("/home/tdtp"); // 👈 redirect to sessions list
    } catch (err) {
      console.error("Erreur création session TD:", err);
      alert("❌ Erreur lors de la création de la session !");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8 text-center bg-gradient-to-r from-green-600 to-blue-600 text-transparent bg-clip-text">
        🧩 Création d'une Session TD
      </h1>

      {/* Session Title */}
      <div className="mb-6">
        {/* 🔑 Label Text Color */}
        <label className={`block font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          📝 Titre de la Session TD
        </label>
        <input
          type="text"
          value={sessionTitle}
          onChange={(e) => setSessionTitle(e.target.value)}
          placeholder="Ex: TD Bactériologie n°2"
          // 🔑 Input Styling
          className={`w-full border p-3 rounded-lg shadow-sm outline-none transition-colors duration-300 ${
            theme === 'dark'
            ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
            : 'border-gray-300 focus:ring-2 focus:ring-green-500'
          }`}
        />
      </div>

      {/* Select Module */}
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

      {/* TD Selector */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        {/* Available TDs */}
        <div>
          {/* 🔑 Header Text Color */}
          <h2 className={`font-semibold mb-3 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>📂 Liste des TD</h2>
          {/* 🔑 List Container Styling */}
          <div className={`border rounded-xl h-72 overflow-y-auto p-3 shadow-sm transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
            {loading ? (
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}>Chargement...</p>
            ) : availableTDs.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-10">
                Aucun TD disponible
              </p>
            ) : (
              availableTDs.map((td) => (
                <div
                  key={td.id}
                  // 🔑 TD Item Styling (Available)
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100 shadow'
                    : 'bg-gray-50 hover:bg-green-100 hover:shadow text-gray-900'
                  }`}
                  onClick={() => handleAddTD(td)}
                >
                  ➕ {td.name || formatId(td.id)} ({td.questionCount || 0} qst)
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected TDs */}
        <div>
          {/* 🔑 Header Text Color */}
          <h2 className={`font-semibold mb-3 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>✅ TD Sélectionnés</h2>
          {/* 🔑 List Container Styling */}
          <div className={`border rounded-xl h-72 overflow-y-auto p-3 shadow-sm transition-colors ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
            {selectedTDs.length === 0 ? (
              <p className="text-gray-400 text-sm text-center mt-10">
                Aucun TD sélectionné
              </p>
            ) : (
              selectedTDs.map((td) => (
                <div
                  key={td.id}
                  // 🔑 TD Item Styling (Selected)
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                    theme === 'dark'
                    ? 'bg-emerald-900/70 hover:bg-red-800 text-white shadow'
                    : 'bg-green-200 hover:bg-red-200 hover:shadow text-gray-900'
                  }`}
                  onClick={() => handleRemoveTD(td)}
                >
                  ❌ {td.name || formatId(td.id)} ({td.questionCount || 0} qst)
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-10 items-center mb-8">
        <div className="w-full md:w-1/2">
          {/* 🔑 Label Text Color */}
          <label className={`block font-semibold mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            🎯 Nombre de Questions (max {maxTDs})
          </label>
          <input
            type="range"
            min={0}
            max={maxTDs}
            value={tdCount}
            onChange={(e) => setTDCount(Number(e.target.value))}
            className="w-full accent-green-600"
          />
          <div className="flex justify-between text-sm mt-2">
            <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}>0</span>
            <span className={`font-semibold transition-colors ${theme === 'dark' ? 'text-emerald-400' : 'text-green-700'}`}>
              {tdCount} / {maxTDs}
            </span>
          </div>
        </div>

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
          Créer la session TD ✅
        </button>
      </div>
    </div>
  );
}