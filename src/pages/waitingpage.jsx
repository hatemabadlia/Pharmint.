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
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme

export default function WaitingPage() {
  // 🔑 Get theme state
  const { theme } = useTheme(); 

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

  // ✅ التفعيل بالدفع (Your original function, unchanged)
  const handlePayment = async () => {
    if (!auth.currentUser) {
      setMessage("Vous devez être connecté.");
      return;
    }

    setLoadingPayment(true);
    try {
      const res = await fetch("http://localhost:3000/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 2000,
          currency: "dzd",
          userId: auth.currentUser.uid,
          success_url: window.location.origin + "/payment-success", 
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
      {/* 🔑 الخلفية الموجية (Wave Background with dark mode) */}
      <div 
        className={`wave-bg ${theme === 'dark' ? 'dark-waves' : ''}`}
      >
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>

      {/* المحتوى */}
      <div className="content-above-waves flex flex-col items-center justify-center min-h-screen px-4">
        <motion.h1
          // 🔑 Heading Text Color
          className={`text-3xl md:text-4xl font-bold text-center mb-4 transition-colors ${
            theme === 'dark' ? 'text-emerald-400' : 'text-green-600'
          }`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          ⏳ Votre compte est en attente d'activation
        </motion.h1>

        <motion.p
          // 🔑 Subtitle Text Color
          className={`text-center mb-8 max-w-2xl transition-colors ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Entrez un code d'activation fourni par l'administration ou activez via
          paiement.
        </motion.p>

        <motion.div
          // 🔑 Card Background and Shadow
          className={`p-8 rounded-2xl shadow-lg w-full max-w-md mb-6 transition-colors duration-300 ${
              theme === 'dark' 
              ? 'bg-gray-800/90 shadow-2xl shadow-emerald-900/50 ring-1 ring-gray-700' 
              : 'bg-white'
          }`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.input
            type="text"
            placeholder="Entrez le code d'activation"
            value={activationCode}
            onChange={(e) => setActivationCode(e.target.value)}
            // 🔑 Input Styling
            className={`w-full px-4 py-2 border rounded-lg outline-none mb-4 transition-colors duration-300 ${
                theme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
                : 'border-gray-300 focus:ring-2 focus:ring-green-500'
            }`}
          />

          <motion.button
            onClick={handleActivate}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition mb-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Activer avec code
          </motion.button>

          {/* Coming soon button */}
          <motion.button
            onClick={() => setMessage("💳 Activation par paiement : Coming Soon !")}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition mb-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            💳 Activer par paiement
          </motion.button>

          {/* Versment CCP button */}
          <motion.a
            href="https://t.me/Pharmint"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex justify-center py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition mb-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            💰 Versement CCP
          </motion.a>

          {message && (
            // 🔑 Message Text Color (lighter red for dark mode)
            <motion.p className={`text-center mt-2 transition-colors ${
              theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`}>
              {message}
            </motion.p>
          )}
        </motion.div>
      </div>
    </>
  );
}