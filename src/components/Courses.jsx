// src/pages/CoursesUser.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { auth } from "../firebase/config";
import ModuleLessons from "./ModuleLessons";

export default function CoursesUser() {
  const [userYear, setUserYear] = useState(null);
  const [userSpecialty, setUserSpecialty] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState(null);

  // 🟢 جلب بيانات المستخدم (specialite + year)
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

        setUserSpecialty(data.specialite.toLowerCase()); // "pharmacie" // fallback لو ما كانش
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
      }
    };

    fetchModules();
  }, [userYear, userSpecialty]);

  if (loading) return <p className="text-center mt-10">Chargement des modules...</p>;

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
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          📚 Mes Modules - {userSpecialty} - Année {userYear}
        </h1>
        <p className="text-gray-600 text-lg">
          Découvrez vos modules et explorez leurs leçons. Cliquez sur un module pour commencer !
        </p>
      </div>

      {modules.length === 0 && (
        <p className="text-center text-gray-500">Aucun module disponible.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((mod) => (
          <div
            key={mod.id}
            className="rounded-xl shadow-lg p-6 cursor-pointer hover:scale-105 transform transition duration-300 text-gray-800"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #d4f8d4 100%)",
            }}
            onClick={() => setSelectedModule({ ...mod, specialty: userSpecialty })}
          >
            <h2 className="text-2xl font-bold mb-2">{mod.name}</h2>
            <p className="mb-4">
              {mod.description ||
                "Explorez ce module pour découvrir ses leçons."}
            </p>
            <div className="text-sm bg-white/40 px-3 py-1 rounded-full inline-block">
              🌟 {mod.lessonsCount || 0} Leçons
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
