import React, { useEffect } from "react";
import { auth, db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const approveUser = async () => {
      if (!auth.currentUser) return;

      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, { approved: true }); // ✅ user صار approved
        console.log("✅ User approved successfully");

        setTimeout(() => {
          navigate("/"); // يروح للـ home مباشرة
        }, 1500);
      } catch (err) {
        console.error("❌ Error approving user:", err);
      }
    };

    approveUser();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold text-green-600">
        ✅ Paiement réussi !
      </h1>
      <p className="mt-2">Redirection vers la page d'accueil...</p>
    </div>
  );
}
