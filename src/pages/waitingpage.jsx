import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { auth, db } from "../firebase/config";
import {
  doc,
  getDoc,
  updateDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../style/WaveBackground.css";

export default function WaitingPage() {
  const [activationCode, setActivationCode] = useState("");
  const [message, setMessage] = useState("");
  const [userData, setUserData] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const navigate = useNavigate();

  // ✅ جلب بيانات المستخدم
  useEffect(() => {
    const fetchUser = async () => {
      if (!auth.currentUser) return;

      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);

        if (data.approved) {
          navigate("/");
        }
      }
    };

    fetchUser();
  }, [navigate]);

  // ✅ التفعيل بالكود
  const handleActivate = async () => {
    if (!activationCode) {
      setMessage("Veuillez entrer un code.");
      return;
    }

    try {
      const codesQuery = query(
        collection(db, "activationCodes"),
        where("code", "==", activationCode),
        where("valid", "==", true)
      );

      const snap = await getDocs(codesQuery);
      if (snap.empty) {
        setMessage("Code invalide ou expiré.");
        return;
      }

      const codeDoc = snap.docs[0];
      await updateDoc(doc(db, "activationCodes", codeDoc.id), {
        valid: false,
      });
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        approved: true,
      });

      setMessage("Compte activé avec succès !");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de l'activation.");
    }
  };

  // ✅ التفعيل بالدفع
  const handlePayment = async () => {
    if (!auth.currentUser) {
      setMessage("Vous devez être connecté.");
      return;
    }

    setLoadingPayment(true);
    try {
      // في handlePayment داخل WaitingPage
const res = await fetch("http://localhost:3000/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amount: 2000,
    currency: "dzd",
    userId: auth.currentUser.uid,
    success_url: window.location.origin + "/payment-success", // 👈 يروح لهنا بعد الدفع
    failure_url: window.location.origin + "/payment-failed",
  }),
});

      const data = await res.json();
      console.log("Charge Response:", data);

      if (data.checkout_url) window.location.href = data.checkout_url;
      else setMessage("Erreur: impossible de créer le paiement");
    } catch {
      setMessage("Erreur lors du paiement");
    }
    setLoadingPayment(false);
  };

  return (
    <>
      {/* الخلفية الموجية */}
      <div className="wave-bg">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>

      {/* المحتوى */}
      <div className="content-above-waves flex flex-col items-center justify-center min-h-screen px-4">
        <motion.h1
          className="text-3xl md:text-4xl font-bold text-center mb-4 text-green-600"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          ⏳ Votre compte est en attente d'activation
        </motion.h1>

        <motion.p
          className="text-gray-700 text-center mb-8 max-w-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Entrez un code d'activation fourni par l'administration ou activez via
          paiement.
        </motion.p>

        <motion.div
          className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.input
            type="text"
            placeholder="Entrez le code d'activation"
            value={activationCode}
            onChange={(e) => setActivationCode(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none mb-4"
          />

          <motion.button
            onClick={handleActivate}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition mb-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Activer avec code
          </motion.button>

          <motion.button
            onClick={handlePayment}
            disabled={loadingPayment}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loadingPayment ? "⏳ Redirection..." : "💳 Activer par paiement"}
          </motion.button>

          {message && (
            <motion.p className="text-center text-red-600 mt-2">
              {message}
            </motion.p>
          )}
        </motion.div>
      </div>
    </>
  );
}
