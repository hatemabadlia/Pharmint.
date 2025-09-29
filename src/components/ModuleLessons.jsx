// src/pages/ModuleLessons.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, getDocs,doc } from "firebase/firestore";
import LessonViewer from "./LessonViewer";

export default function ModuleLessons({ module, userYear, goBack }) {
  const [lessons, setLessons] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);

  useEffect(() => {
  const fetchLessons = async () => {
    try {
      const lessonsRef = collection(
        db,
        "courses",
        module.specialty?.toLowerCase() || "pharmacie",
        "years",
        `year_${userYear}`,
        "modules",
        module.id,
        "lessons"
      );

      const snapshot = await getDocs(lessonsRef);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setLessons(data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur récupération leçons/ebooks :", error);
      setLoading(false);
    }
  };

  if (module?.id) {
    fetchLessons();
  }
}, [module, userYear]);



  if (loading) return <p className="text-center mt-10">Chargement des contenus...</p>;

  if (selectedLesson) {
    return <LessonViewer lesson={selectedLesson} goBack={() => setSelectedLesson(null)} />;
  }

  return (
    <div className="p-6">
      <button
        className="mb-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
        onClick={goBack}
      >
        🔙 Retour aux modules
      </button>

      <h1 className="text-2xl font-bold mb-2 text-center">{module.name}</h1>

      {/* Module description */}
      <p className="text-center text-gray-700 mb-6">
        Bienvenue dans ce module ! Cliquez sur un cours ci-dessous pour l'ouvrir. Vous pouvez lire le contenu directement sur le site sans téléchargement et avec protection contre le copier/coller.
      </p>

      {/* Lessons */}
      {/* Lessons */}
{lessons.length === 0 ? (
  <p className="text-gray-500 text-center">Aucune leçon disponible.</p>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
    {lessons.map((lesson) => (
      <div
        key={lesson.id}
        onClick={() => setSelectedLesson(lesson)}
        className="bg-white border rounded-2xl shadow-md p-6 cursor-pointer
                   hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
      >
        <h2 className="font-bold text-lg mb-2 text-green-700">{lesson.title}</h2>
        <span className="inline-block px-3 py-1 mb-3 rounded-full text-sm font-semibold 
                        bg-gradient-to-r from-green-400 to-green-600 text-white shadow-sm">
          📖 Cours
        </span>
        <p className="text-gray-600">{lesson.description}</p>
      </div>
    ))}
  </div>
)}

{/* Divider */}
<hr className="my-10 border-gray-300" />

{/* Books 3D Slider Section */}
<h2 className="text-2xl font-bold mb-5 text-center">📚 Livres Disponibles</h2>
{books.length === 0 ? (
  <p className="text-gray-500 text-center">Aucun livre disponible pour ce module.</p>
) : (
  <div className="flex overflow-x-auto gap-6 px-4 pb-4 snap-x snap-mandatory scrollbar-hide">
    {books.map((book) => (
      <div
        key={book.id}
        className="min-w-[220px] border rounded-xl shadow-md p-4 flex-shrink-0 bg-white
                   transform transition duration-300 hover:scale-105 snap-center text-center"
      >
        <img
          src={book.img}
          alt={book.title}
          className="w-full h-44 object-cover rounded mb-3 shadow-sm"
        />
        <h3 className="font-semibold">{book.title}</h3>
      </div>
    ))}
  </div>
)}

      
    </div>
  );
}
