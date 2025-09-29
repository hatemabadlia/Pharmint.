// src/pages/Subscription.jsx
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export default function Subscription() {
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

  if (!userData)
    return <p className="text-center mt-10 text-gray-500">Chargement des informations...</p>;

  return (
    <div className="flex justify-center mt-16">
      <div className="bg-white shadow-lg rounded-xl w-full max-w-md p-6 text-center">
        <h2 className="text-2xl font-bold text-green-700 mb-4">Informations sur l'abonnement</h2>

        <p className="text-gray-700 mb-2">
          Date d'inscription : {userData.createdAt?.toDate().toLocaleDateString("fr-FR")}
        </p>

        <p className="text-gray-700 mb-4">
          Votre abonnement prendra fin le :{" "}
          <span className="font-semibold">{endDate?.toLocaleDateString("fr-FR")}</span>
        </p>

        <p className="text-green-600 font-medium">
          Merci pour votre confiance ! Profitez pleinement de nos services.
        </p>
      </div>
    </div>
  );
}
