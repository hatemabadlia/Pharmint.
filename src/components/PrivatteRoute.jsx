// src/routes/PrivateRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";

const PrivateRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (!auth.currentUser) {
        setIsAllowed(false);
        setLoading(false);
        return;
      }

      const uid = auth.currentUser.uid;

      try {
        // ✅ Fetch user info
        const userDoc = await getDoc(doc(db, "users", uid));
        const userData = userDoc.exists() ? userDoc.data() : null;

        if (userData?.approved) {
          setIsAllowed(true);
          setLoading(false);
          return;
        }

        // ✅ Check free trial config
        const trialDoc = await getDoc(doc(db, "config", "trial"));
        if (trialDoc.exists()) {
          const trialData = trialDoc.data();
          const now = new Date();
          const start = trialData.start?.toDate();
          const end = trialData.end?.toDate();
          const isTrialActive = trialData.active;

          if (isTrialActive && now >= start && now <= end) {
            setIsAllowed(true);
            setLoading(false);
            return;
          }
        }

        // ❌ Not approved, not in trial → redirect to waiting
        setIsAllowed(false);
        setLoading(false);
      } catch (err) {
        console.error("Error checking access:", err);
        setIsAllowed(false);
        setLoading(false);
      }
    };

    checkAccess();
  }, []);

  if (loading) return <div className="text-center mt-10">Vérification de l'accès...</div>;
  return isAllowed ? children : <Navigate to="/waiting" />;
};

export default PrivateRoute;
