import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PaymentFailed() {
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      navigate("/waiting");
    }, 2000);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold text-red-600">
        ❌ Paiement échoué
      </h1>
      <p className="mt-2">Redirection vers la page d'attente...</p>
    </div>
  );
}
