import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import Lottie from "lottie-react";
import SignUpAnimation from "../assets/Login.json"; 
import { Eye, EyeOff, XCircle } from "lucide-react"; // 🔑 Import XCircle
import { motion, AnimatePresence } from "framer-motion"; // 🔑 Import motion
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme
import "../style/WaveBackground.css";

// 💡 Custom Error/Message Box Component (replaces alert())
const ErrorMessage = ({ message, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="fixed top-4 left-1/2 -translate-x-1/2 p-4 bg-red-600 text-white rounded-xl shadow-2xl flex items-center gap-3 z-50 max-w-sm w-11/12 sm:w-auto ring-4 ring-red-400"
  >
    <XCircle size={24} />
    <span className="font-medium text-sm">{message}</span>
    <button onClick={onClose} className="ml-auto p-1 rounded-full hover:bg-red-700 transition">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
  </motion.div>
);

const SignUp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // 🔑 Get theme state
  const { theme } = useTheme(); 

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [year, setYear] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 🔑 State for custom error message
  const [errorMessage, setErrorMessage] = useState(null);
  
  const closeError = () => setErrorMessage(null);

  // 💡 Error handling utility
  const displayError = (message) => {
    setErrorMessage(message);
    setTimeout(closeError, 5000); // Auto-dismiss after 5 seconds
  };

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
    setErrorMessage(null); // Clear previous errors

    if (password !== confirmPassword) {
      displayError("Les mots de passe ne correspondent pas !"); // ❌ Replaced alert()
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        nom,
        prenom,
        username,
        email,
        specialite,
        year,
        approved: false,
        createdAt: Timestamp.now(),
      });

      navigate("/waiting");
    } catch (error) {
      // ❌ Replaced alert() with a more specific error
      if (error.code === 'auth/email-already-in-use') {
        displayError("Cet email est déjà utilisé.");
      } else {
        displayError(error.message);
      }
    }
  };

  return (
    // 🔑 Conditional background color
    <div className={`min-h-screen flex items-center justify-center relative transition-colors duration-500 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-green-50'
    }`}>
      
      {/* 🔑 Custom Error Message Display */}
      <AnimatePresence>
        {errorMessage && <ErrorMessage message={errorMessage} onClose={closeError} />}
      </AnimatePresence>
      
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-5xl px-6 z-10 py-12">

        {/* ✅ SignUp Card */}
        <div className={`backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full md:w-1/2 max-w-md transition-colors duration-300 ${
            theme === 'dark' 
            ? 'bg-gray-800/90 shadow-2xl shadow-emerald-900/50 ring-1 ring-gray-700' 
            : 'bg-white/90'
        }`}>
          {/* 🔑 Heading Text Color */}
          <h2 className={`text-3xl font-bold mb-6 transition-colors ${
              theme === 'dark' ? 'text-emerald-400' : 'text-green-600'
          }`}>Inscription</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* 🔑 Input Styling */}
              <input type="text" placeholder="Nom" value={nom} onChange={e => setNom(e.target.value)} 
                className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors duration-300 ${
                    theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-green-500'
                }`} required />
              <input type="text" placeholder="Prénom" value={prenom} onChange={e => setPrenom(e.target.value)} 
                className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors duration-300 ${
                    theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-green-500'
                }`} required />
            </div>
            {/* 🔑 Input Styling */}
            <input type="text" placeholder="Nom d'utilisateur" value={username} onChange={e => setUsername(e.target.value)} 
                className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors duration-300 ${
                    theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-green-500'
                }`} required />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} 
                className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors duration-300 ${
                    theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-green-500'
                }`} required />

            {/* ✅ Password Input with Toggle */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                // 🔑 Input Styling
                className={`w-full px-4 py-2 border rounded-lg outline-none pr-10 transition-colors duration-300 ${
                    theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-green-500'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                // 🔑 Icon Color
                className={`absolute right-3 top-2.5 transition-colors ${
                    theme === 'dark' ? 'text-gray-400 hover:text-emerald-400' : 'text-gray-500 hover:text-green-600'
                }`}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* ✅ Confirm Password Input with Toggle */}
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmer mot de passe"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                // 🔑 Input Styling
                className={`w-full px-4 py-2 border rounded-lg outline-none pr-10 transition-colors duration-300 ${
                    theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-green-500'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                // 🔑 Icon Color
                className={`absolute right-3 top-2.5 transition-colors ${
                    theme === 'dark' ? 'text-gray-400 hover:text-emerald-400' : 'text-gray-500 hover:text-green-600'
                }`}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* 🔑 Select Styling */}
            <select value={specialite} onChange={e => { setSpecialite(e.target.value); setYear(""); }} 
                className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors duration-300 ${
                    theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-green-500'
                }`} required>
              <option value="">Sélectionner spécialité</option>
              <option value="Pharmacie">Pharmacie</option>
              <option value="Pharmacie Industrielle">Pharmacie Industrielle</option>
              <option value="Pharmacie Auxiliaire">Pharmacie Auxiliaire</option>
            </select>

            {/* 🔑 Select Styling */}
            <select value={year} onChange={e => setYear(e.target.value)} 
                className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors duration-300 ${
                    theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-green-500'
                }`} required disabled={!specialite}>
              <option value="">{specialite ? "Sélectionner l'année" : "Sélectionnez d'abord la spécialité"}</option>
              {specialite && yearsBySpecialite[specialite]?.map(y => (<option key={y} value={y}>{y}</option>))}
            </select>
            
            <button type="submit" className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              S'inscrire
            </button>
          </form>
          {/* 🔑 Supporting Text Color */}
          <p className={`mt-6 text-center transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Déjà un compte ? <Link to="/login" className={`hover:underline transition-colors ${theme === 'dark' ? 'text-emerald-400 hover:text-emerald-300' : 'text-green-600'}`}>Se connecter</Link>
          </p>
        </div>

        {/* ✅ Hero Section */}
        <div className="w-full md:w-1/2 flex justify-center mt-8 md:mt-0">
          <Lottie animationData={SignUpAnimation} loop={true} className="w-72 md:w-96" />
        </div>
      </div>

      {/* ✅ Background Waves */}
      {/* 🔑 Conditional class for wave background styling */}
      <div 
        className={`wave-bg fixed inset-0 z-0 pointer-events-none ${
          theme === 'dark' ? 'dark-waves' : ''
        }`}
      >
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>
    </div>
  );
};

export default SignUp;