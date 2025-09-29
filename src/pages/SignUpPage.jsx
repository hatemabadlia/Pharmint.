// src/pages/SignUp.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import Lottie from "lottie-react";
import SignUpAnimation from "../assets/Login.json"; // ✅ hero animation
import "../style/WaveBackground.css";

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [year, setYear] = useState("");

  const yearsBySpecialite = {
    Pharmacie: ["1ʳᵉ Année", "2ᵉ Année", "3ᵉ Année", "4ᵉ Année", "5ᵉ Année", "Résidanat"],
    "Pharmacie Industrielle": ["1ʳᵉ Année", "2ᵉ Année", "3ᵉ Année"],
    "Pharmacie Auxiliaire": ["1ʳᵉ Année", "2ᵉ Année", "3ᵉ Année"],
  };

  useEffect(() => {
    if (location.state?.specialite) setSpecialite(location.state.specialite);
    if (location.state?.year) setYear(location.state.year);
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas !");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Store user in Firestore
      await setDoc(doc(db, "users", user.uid), {
        nom,
        prenom,
        username,
        email,
        specialite,
        year,
        approved: false, // admin approval
        createdAt: Timestamp.now(),
      });

      navigate("/waiting"); // ✅ Redirect to waiting
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 relative">
      {/* ✅ Main Layout */}
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-5xl px-6 z-10">

        {/* ✅ SignUp Card (Left in Desktop) */}
        <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full md:w-1/2 max-w-md">
          <h2 className="text-3xl font-bold text-green-600 mb-6">Inscription</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Nom" value={nom} onChange={e => setNom(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
              <input type="text" placeholder="Prénom" value={prenom} onChange={e => setPrenom(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
            </div>
            <input type="text" placeholder="Nom d'utilisateur" value={username} onChange={e => setUsername(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
            <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
            <input type="password" placeholder="Confirmer mot de passe" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
            
            <select value={specialite} onChange={e => { setSpecialite(e.target.value); setYear(""); }} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required>
              <option value="">Sélectionner spécialité</option>
              <option value="Pharmacie">Pharmacie</option>
              <option value="Pharmacie Industrielle">Pharmacie Industrielle</option>
              <option value="Pharmacie Auxiliaire">Pharmacie Auxiliaire</option>
            </select>
            
            <select value={year} onChange={e => setYear(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required disabled={!specialite}>
              <option value="">{specialite ? "Sélectionner l'année" : "Sélectionnez d'abord la spécialité"}</option>
              {specialite && yearsBySpecialite[specialite]?.map(y => (<option key={y} value={y}>{y}</option>))}
            </select>
            
            <button type="submit" className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              S'inscrire
            </button>
          </form>
          <p className="text-gray-600 mt-6 text-center">
            Déjà un compte ? <Link to="/login" className="text-green-600 hover:underline">Se connecter</Link>
          </p>
        </div>

        {/* ✅ Hero Section (Right in Desktop) */}
        <div className="w-full md:w-1/2 flex justify-center mt-8 md:mt-0">
          <Lottie animationData={SignUpAnimation} loop={true} className="w-72 md:w-96" />
        </div>
      </div>

      {/* ✅ Background Waves */}
      <div className="wave-bg fixed inset-0 z-0 pointer-events-none">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>
    </div>
  );
};

export default SignUp;
