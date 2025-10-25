// src/pages/CoursesUser.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { auth } from "../firebase/config";
import ModuleLessons from "./ModuleLessons";
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme

export default function CoursesUser() {
  // 🔑 Get theme state
  const { theme } = useTheme();

  const [userYear, setUserYear] = useState(null);
  const [userSpecialty, setUserSpecialty] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);

  // 🟢 جلب بيانات المستخدم (specialite + year)
  useEffect(() => {
    const fetchUserData = async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          setUserSpecialty(data.specialite.toLowerCase());
          // ✅ تأكد باللي `year` موجود
          if (data.year) {
            const yearMatch = data.year.match(/\d+/);
            const yearIndex = yearMatch ? parseInt(yearMatch[0]) : null;
            setUserYear(yearIndex);
          } else {
            console.warn("⚠️ Aucun champ 'year' trouvé pour l'utilisateur");
            setUserYear(null);
          }
        }
      } catch (err) {
        console.error("Erreur récupération année/spécialité utilisateur :", err);
      }
    };

    fetchUserData();
  }, []);

  // 🟢 جلب الموديلز بناءً على spécialité + année
  useEffect(() => {
    if (!userYear || !userSpecialty) return;

    const fetchModules = async () => {
      setLoading(true);
      try {
        const modulesRef = collection(
          db,
          "courses",
          userSpecialty,
          "years",
          `year_${userYear}`,
          "modules"
        );
        const modulesSnap = await getDocs(modulesRef);
        const modulesData = modulesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setModules(modulesData);
        setLoading(false);
      } catch (err) {
        console.error("Erreur récupération modules :", err);
        setLoading(false);
      }
    };

    fetchModules();
  }, [userYear, userSpecialty]);

  // 🔑 Loading state based on theme
  if (loading) return <p className={`text-center mt-10 p-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Chargement des modules...</p>;

  if (selectedModule) {
    return (
      <ModuleLessons
        module={selectedModule}
        userYear={userYear}
        userSpecialty={userSpecialty} // 🟢 نبعث التخصص أيضًا
        goBack={() => setSelectedModule(null)}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Top description */}
      <div className="mb-8 text-center">
        {/* 🔑 Title Text Color */}
        <h1 className={`text-3xl font-bold mb-2 transition-colors ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
          📚 Mes Modules - {userSpecialty} - Année {userYear}
        </h1>
        {/* 🔑 Subtitle Text Color */}
        <p className={`text-lg transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Découvrez vos modules et explorez leurs leçons. Cliquez sur un module pour commencer !
        </p>
      </div>

      {modules.length === 0 && (
        // 🔑 Empty state text color
        <p className={`text-center transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Aucun module disponible.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((mod) => (
          <div
            key={mod.id}
            // 🔑 Module Card Styling
            className={`rounded-xl shadow-lg p-6 cursor-pointer hover:scale-105 transform transition duration-300 ring-1 ${
                theme === 'dark'
                ? 'bg-gray-800 ring-gray-700 text-gray-100 hover:bg-gray-700'
                : 'bg-white text-gray-800'
            }`}
            // 🔑 Inline style removed and replaced with conditional classes
            onClick={() => setSelectedModule({ ...mod, specialty: userSpecialty })}
          >
            {/* 🔑 Title Text Color (kept primary text color) */}
            <h2 className="text-2xl font-bold mb-2">{mod.name}</h2>
            {/* 🔑 Description Text Color */}
            <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-700'}`}>
              {mod.description ||
                "Explorez ce module pour découvrir ses leçons."}
            </p>
            {/* 🔑 Lesson Count Tag Styling */}
            <div className={`text-sm px-3 py-1 rounded-full inline-block ${
                theme === 'dark'
                ? 'bg-gray-700 text-emerald-400'
                : 'bg-white/40 text-gray-700'
            }`}>
              🌟 {mod.lessonsCount || 0} Leçons
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}