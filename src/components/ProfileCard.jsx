// src/pages/Profile.jsx
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { motion } from "framer-motion";
import { FaUser } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme

export default function Profile() {
  // 🔑 Get theme state
  const { theme } = useTheme();

  const [userData, setUserData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [hovered, setHovered] = useState(false);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const fetchUser = async () => {
      try {
        const docRef = doc(db, "users", uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setFormData(data);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, [uid]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!uid) return;
    const docRef = doc(db, "users", uid);
    const { year, ...dataToUpdate } = formData;
    await updateDoc(docRef, dataToUpdate);
    setUserData(formData);
    setEditing(false);
  };

  // ✅ FIXED LOGOUT — clears Firestore session + localStorage
  const handleLogout = async () => {
    if (!uid) return;
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { sessionId: null }); // remove session
      localStorage.removeItem("device_session_id"); // clear local session id
      await signOut(auth);
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // 🔑 Loading state based on theme
  if (!userData)
    return (
      <p className={`text-center mt-20 transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading profile...</p>
    );

  return (
    // Outer container - padding added
    <div className="flex justify-center mt-16 p-4">
      {/* 🔑 Profile Card Styling */}
      <motion.div
        className={`shadow-lg rounded-xl w-full max-w-md p-6 relative transition-colors duration-300 ${
            theme === 'dark'
            ? 'bg-gray-800 shadow-emerald-900/30 ring-1 ring-gray-700' // Dark background and ring
            : 'bg-white' // Light background
        }`}
        whileHover={{ scale: 1.02 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
      >
        {/* 🔑 Avatar Styling */}
        <div className="flex justify-center -mt-16 relative z-10"> {/* Adjusted margin-top */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-md transition-colors ${
            theme === 'dark'
            ? 'bg-emerald-800 text-emerald-300' // Dark avatar background/text
            : 'bg-green-100 text-green-600' // Light avatar background/text
          }`}>
            <FaUser />
          </div>
        </div>

        {/* User Info */}
        <div className="mt-6 text-center space-y-2"> {/* Adjusted margin-top */}
          {editing ? (
            <div className="space-y-3">
              {["nom", "prenom", "username", "email", "specialite"].map(
                (field) => (
                  <input
                    key={field}
                    type={field === 'email' ? 'email' : 'text'}
                    name={field}
                    value={formData[field] || ""}
                    onChange={handleChange}
                    // 🔑 Input Styling
                    className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors ${
                        theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500' // Dark input
                        : 'border-gray-300 focus:ring-2 focus:ring-green-500' // Light input
                    }`}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  />
                )
              )}
              {/* Year (read-only) */}
              <input
                type="text"
                name="year"
                value={formData.year || ""}
                disabled
                // 🔑 Disabled Input Styling
                className={`w-full px-4 py-2 border rounded-lg cursor-not-allowed transition-colors ${
                    theme === 'dark'
                    ? 'bg-gray-600 border-gray-500 text-gray-400' // Dark disabled
                    : 'bg-gray-100 border-gray-300 text-gray-500' // Light disabled
                }`}
              />
            </div>
          ) : (
            // 🔑 Display Text Styling
            <div className="space-y-1">
              <h2 className={`text-2xl font-bold transition-colors ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                {userData.nom || "Utilisateur"} {userData.prenom || ""}
              </h2>
              <p className={`transition-colors ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>@{userData.username || "—"}</p>
              <p className={`transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{userData.email || "—"}</p>
              <p className={`transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {userData.specialite || "—"} {userData.year ? `- ${userData.year}` : ""}
              </p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-8 flex justify-center gap-4">
          {editing ? (
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Save
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              Edit
            </button>
          )}
          <button
            onClick={handleLogout}
            className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Disconnect
          </button>
        </div>

        {/* Hover Info */}
        {hovered && !editing && (
          <motion.div
            // 🔑 Hover Text Color
            className={`absolute bottom-4 left-0 right-0 w-full text-center text-sm transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{opacity: 0}}
          >
            Keep your profile updated!
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}