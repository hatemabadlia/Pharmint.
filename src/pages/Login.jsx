import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import Lottie from "lottie-react";
import LoginAnimation from "../assets/Login.json"; 
import { Eye, EyeOff, XCircle } from "lucide-react"; // Import XCircle for error
import { motion, AnimatePresence } from "framer-motion"; // Import motion for error
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme
import "../style/WaveBackground.css";
import { v4 as uuidv4 } from "uuid";

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


const Login = () => {
  const navigate = useNavigate();
  // 🔑 Get theme state
  const { theme } = useTheme(); 
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // 🔑 State for custom error message
  const [errorMessage, setErrorMessage] = useState(null);
  
  const closeError = () => setErrorMessage(null);

  // 💡 Error handling utility
  const displayError = (message) => {
    setErrorMessage(message);
    setTimeout(closeError, 5000); // Auto-dismiss after 5 seconds
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null); // Clear previous errors

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        displayError("Compte introuvable."); // ❌ Replaced alert()
        return;
      }

      const data = userDoc.data();
      const storedDeviceId = localStorage.getItem("device_session_id");
      const newDeviceId = storedDeviceId || uuidv4();

      if (!storedDeviceId) localStorage.setItem("device_session_id", newDeviceId);

      if (data.sessionId && data.sessionId !== newDeviceId) {
        displayError("⚠️ Votre compte est déjà actif sur un autre appareil !"); // ❌ Replaced alert()
        await auth.signOut();
        return;
      }

      await updateDoc(userRef, { sessionId: newDeviceId });

      if (data.approved) {
        navigate("/");
      } else {
        navigate("/waiting");
      }

    } catch (err) {
      // ❌ Replaced alert() with a more specific error for common login failures
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        displayError("Email ou mot de passe incorrect.");
      } else {
        displayError(err.message);
      }
    }
  };

  return (
    // 🔑 Conditional background color for the main container
    <div className={`min-h-screen flex items-center justify-center relative transition-colors duration-500 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-green-50'
    }`}>
      
      {/* 🔑 Custom Error Message Display */}
      <AnimatePresence>
        {errorMessage && <ErrorMessage message={errorMessage} onClose={closeError} />}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-5xl px-6 z-10">
        <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0">
          <Lottie animationData={LoginAnimation} loop={true} className="w-72 md:w-96" />
        </div>

        {/* 🔑 Card Background and Shadow */}
        <div className={`backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full md:w-1/2 max-w-md transition-colors duration-300 ${
            theme === 'dark' 
            ? 'bg-gray-800/90 shadow-2xl shadow-emerald-900/50 ring-1 ring-gray-700' 
            : 'bg-white/90'
        }`}>
          {/* 🔑 Heading Text Color */}
          <h2 className={`text-3xl font-bold mb-6 text-center transition-colors ${
              theme === 'dark' ? 'text-emerald-400' : 'text-green-600'
          }`}>
            Connexion
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              // 🔑 Input Styling
              className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors duration-300 ${
                  theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
                  : 'border-gray-300 focus:ring-2 focus:ring-green-500'
              }`}
              required
            />
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

            <button
              type="submit"
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Se connecter
            </button>
          </form>
          {/* 🔑 Supporting Text Color */}
          <p className={`mt-6 text-center transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            Pas encore de compte ?{" "}
            {/* 🔑 Link Color */}
            <Link to="/signup" className={`hover:underline transition-colors ${theme === 'dark' ? 'text-emerald-400 hover:text-emerald-300' : 'text-green-600'}`}>
              S'inscrire
            </Link>
          </p>
        </div>
      </div>

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

export default Login;