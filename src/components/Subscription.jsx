// src/pages/Subscription.jsx
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme

export default function Subscription() {
  // 🔑 Get theme state
  const { theme } = useTheme(); 

  const [userData, setUserData] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const fetchUser = async () => {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);

        // Calculer la date de fin d'abonnement (3 ans après l'inscription)
        const joinDate = data.createdAt?.toDate();
        const end = new Date(joinDate);
        end.setFullYear(end.getFullYear() + 1);
        setEndDate(end);
      }
    };

    fetchUser();
  }, [uid]);

  // 🔑 Loading state based on theme
  if (!userData)
    return <p className={`text-center mt-10 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Chargement des informations...</p>;

  return (
    // Outer container - padding added
    <div className="flex justify-center mt-16 p-4">
      {/* 🔑 Subscription Card Styling */}
      <div className={`shadow-lg rounded-xl w-full max-w-md p-6 text-center transition-colors duration-300 ${
          theme === 'dark'
          ? 'bg-gray-800 shadow-emerald-900/30 ring-1 ring-gray-700' // Dark card
          : 'bg-white' // Light card
      }`}>
        {/* 🔑 Heading Text Color */}
        <h2 className={`text-2xl font-bold mb-4 transition-colors ${theme === 'dark' ? 'text-emerald-400' : 'text-green-700'}`}>
            Informations sur l'abonnement
        </h2>

        {/* 🔑 Text Color */}
        <p className={`mb-2 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          Date d'inscription : {userData.createdAt?.toDate().toLocaleDateString("fr-FR")}
        </p>

        {/* 🔑 Text Color */}
        <p className={`mb-4 transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          Votre abonnement prendra fin le :{" "}
          <span className={`font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{endDate?.toLocaleDateString("fr-FR") ?? 'N/A'}</span>
        </p>

        {/* 🔑 Text Color (Success message) */}
        <p className={`font-medium transition-colors ${theme === 'dark' ? 'text-emerald-400' : 'text-green-600'}`}>
          Merci pour votre confiance ! Profitez pleinement de nos services.
        </p>
      </div>
    </div>
  );
}