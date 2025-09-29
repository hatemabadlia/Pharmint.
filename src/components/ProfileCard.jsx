// src/pages/Profile.jsx
import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { motion } from "framer-motion";
import { FaUser } from "react-icons/fa";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [hovered, setHovered] = useState(false);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const fetchUser = async () => {
      const docRef = doc(db, "users", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
        setFormData(docSnap.data());
      }
    };

    fetchUser();
  }, [uid]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    if (!uid) return;
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, formData);
    setUserData(formData);
    setEditing(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  if (!userData) return <p className="text-center mt-20 text-gray-500">Loading profile...</p>;

  return (
    <div className="flex justify-center mt-16">
      <motion.div
        className="bg-white shadow-lg rounded-xl w-full max-w-md p-6 relative cursor-pointer"
        whileHover={{ scale: 1.02 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
      >
        {/* Avatar */}
        <div className="flex justify-center -mt-12 relative z-10">
          <div className="w-24 h-24 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-4xl shadow-md">
            <FaUser />
          </div>
        </div>

        {/* User Info */}
        <div className="mt-4 text-center space-y-2">
          {editing ? (
            <div className="space-y-2">
              {["nom", "prenom", "username", "email", "specialite", "year"].map((field) => (
                <input
                  key={field}
                  type="text"
                  name={field}
                  value={formData[field] || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-800">{userData.nom} {userData.prenom}</h2>
              <p className="text-gray-600">@{userData.username}</p>
              <p className="text-gray-700">{userData.email}</p>
              <p className="text-gray-700">{userData.specialite} - {userData.year}</p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-center gap-4">
          {editing ? (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Save
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
            >
              Edit
            </button>
          )}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Disconnect
          </button>
        </div>

        {/* Hover Info */}
        {hovered && (
          <motion.div
            className="absolute bottom-4 left-0 w-full text-center text-gray-500 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Keep your profile updated!
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
