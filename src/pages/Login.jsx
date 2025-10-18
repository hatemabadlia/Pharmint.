import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import Lottie from "lottie-react";
import LoginAnimation from "../assets/Login.json"; // ✅ hero animation
import { Eye, EyeOff } from "lucide-react"; // ✅ eye icons
import "../style/WaveBackground.css";
import { v4 as uuidv4 } from "uuid";

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

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        alert("Compte introuvable.");
        return;
      }

      const data = userDoc.data();
      const storedDeviceId = localStorage.getItem("device_session_id");
      const newDeviceId = storedDeviceId || uuidv4();

      // ✅ Save device ID in localStorage if not exists
      if (!storedDeviceId) localStorage.setItem("device_session_id", newDeviceId);

      // If a session is active and not this device → deny login
      if (data.sessionId && data.sessionId !== newDeviceId) {
        alert("⚠️ Votre compte est déjà actif sur un autre appareil !");
        await auth.signOut();
        return;
      }

      // ✅ Update Firestore with this device/session
      await updateDoc(userRef, { sessionId: newDeviceId });

      // ✅ Redirect based on approval
      if (data.approved) {
        navigate("/");
      } else {
        navigate("/waiting");
      }

    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 relative">
      <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-5xl px-6 z-10">
        <div className="w-full md:w-1/2 flex justify-center mb-8 md:mb-0">
          <Lottie animationData={LoginAnimation} loop={true} className="w-72 md:w-96" />
        </div>

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

      <div className="wave-bg fixed inset-0 z-0 pointer-events-none">
        <div className="wave wave-1"></div>
        <div className="wave wave-2"></div>
        <div className="wave wave-3"></div>
      </div>
    </div>
  );
};

export default Login;
