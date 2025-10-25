// src/pages/ExamCountdown.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme

export default function ExamCountdown() {
  // 🔑 Get theme state
  const { theme } = useTheme(); 

  const [exams, setExams] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [timeLeft, setTimeLeft] = useState({}); // store countdowns per exam

  // ✅ Load exams from localStorage
  useEffect(() => {
    try { // Added try-catch for localStorage safety
        const savedExams = localStorage.getItem("exams");
        if (savedExams) setExams(JSON.parse(savedExams));
    } catch (e) {
        console.error("Error loading exams from localStorage:", e);
    }
  }, []);

  // ✅ Save exams to localStorage when updated
  useEffect(() => {
    try { // Added try-catch for localStorage safety
        localStorage.setItem("exams", JSON.stringify(exams));
    } catch (e) {
        console.error("Error saving exams to localStorage:", e);
    }
  }, [exams]);

  // ✅ Countdown calculation
  const calculateTimeLeft = (examDate) => {
    const difference = new Date(examDate).getTime() - new Date().getTime();
    if (difference <= 0) return null;
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  // ✅ Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      const updated = {};
      exams.forEach((exam) => {
        updated[exam.id] = calculateTimeLeft(exam.date);
      });
      setTimeLeft(updated);
    }, 1000);

    return () => clearInterval(timer);
  }, [exams]);

  // ✅ Add new exam
  const addExam = () => {
    if (!title || !date) return;
    const newExam = {
      id: Date.now(),
      title,
      date,
    };
    setExams([...exams, newExam]);
    setTitle("");
    setDate("");
  };

  // ✅ Delete exam
  const deleteExam = (id) => {
    // In a real app, you'd use a confirmation modal here instead of alert/confirm.
    setExams(exams.filter((exam) => exam.id !== id));
  };

  return (
    // 🔑 Conditional background gradient
    <div className={`min-h-screen flex flex-col items-center p-6 transition-colors duration-300 ${
        theme === 'dark' 
        ? 'bg-gray-900' // Simple dark background
        : 'bg-gradient-to-br from-green-50 to-green-100' // Original light gradient
    }`}>
      <motion.h1
        // 🔑 Title text color
        className={`text-3xl font-extrabold mb-8 transition-colors ${
            theme === 'dark' ? 'text-emerald-400' : 'text-green-800'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        📅 Mes Examens
      </motion.h1>

      {/* Form */}
      <motion.div
        className="flex flex-col md:flex-row gap-3 mb-8 w-full max-w-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <input
          type="text"
          placeholder="Titre de l'examen"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          // 🔑 Input styling
          className={`flex-1 p-3 border rounded-xl shadow-sm outline-none transition-colors duration-300 ${
            theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
            : 'border-gray-300 focus:ring-2 focus:ring-green-500'
          }`}
        />
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          // 🔑 Input styling
          className={`p-3 border rounded-xl shadow-sm outline-none transition-colors duration-300 ${
            theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
            : 'border-gray-300 focus:ring-2 focus:ring-green-500'
          }`}
        />
        <button
          onClick={addExam}
          className="bg-green-600 text-white px-6 py-3 rounded-xl shadow hover:bg-green-700 transition"
        >
          Ajouter
        </button>
      </motion.div>

      {/* Exams List */}
      <div className="grid gap-6 w-full max-w-2xl">
        {exams.map((exam) => {
          const countdown = timeLeft[exam.id];
          return (
            <motion.div
              key={exam.id}
              // 🔑 Card styling
              className={`p-6 rounded-2xl shadow-md flex justify-between items-center border transition-colors duration-300 ${
                theme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-green-200'
              }`}
              whileHover={{ scale: 1.02 }}
            >
              <div>
                <h2 className={`text-xl font-bold transition-colors ${
                    theme === 'dark' ? 'text-gray-100' : 'text-green-800'
                }`}>
                  {exam.title}
                </h2>
                {countdown ? (
                  <p className="text-green-600 font-semibold dark:text-emerald-400">
                    {countdown.days}j : {countdown.hours}h : {countdown.minutes}m :{" "}
                    {countdown.seconds}s
                  </p>
                ) : (
                  <p className="text-red-500 font-semibold">🚨 Expiré</p>
                )}
              </div>
              <button
                onClick={() => deleteExam(exam.id)}
                className="text-red-500 hover:text-red-700 transition dark:text-red-400 dark:hover:text-red-300"
              >
                <Trash2 size={22} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}