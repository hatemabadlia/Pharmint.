// src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import Lottie from "lottie-react";
import LoginAnimation from "../assets/Login.json"; // ✅ hero animation
import { Eye, EyeOff } from "lucide-react"; // ✅ eye icons
import "../style/WaveBackground.css";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.approved) {
          navigate("/"); // ✅ Home page
        } else {
          navigate("/waiting"); // ✅ Waiting page
        }
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 relative">
      {/* ✅ Main Layout */}
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-5xl px-6 z-10">
        
        {/* ✅ Hero Section */}
        <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0">
          <Lottie animationData={LoginAnimation} loop={true} className="w-72 md:w-96" />
        </div>

        {/* ✅ Login Card */}
        <div className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full md:w-1/2 max-w-md">
          <h2 className="text-3xl font-bold text-green-600 mb-6 text-center">Connexion</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              required
            />

            {/* ✅ Password Input with Toggle */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-green-600"
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
          <p className="text-gray-600 mt-6 text-center">
            Pas encore de compte ?{" "}
            <Link to="/signup" className="text-green-600 hover:underline">
              S'inscrire
            </Link>
          </p>
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

export default Login;
