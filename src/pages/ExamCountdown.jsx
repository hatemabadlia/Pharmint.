// src/pages/ExamCountdown.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";

export default function ExamCountdown() {
  const [exams, setExams] = useState([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [timeLeft, setTimeLeft] = useState({}); // store countdowns per exam

  // ✅ Load exams from localStorage
  useEffect(() => {
    const savedExams = localStorage.getItem("exams");
    if (savedExams) setExams(JSON.parse(savedExams));
  }, []);

  // ✅ Save exams to localStorage when updated
  useEffect(() => {
    localStorage.setItem("exams", JSON.stringify(exams));
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
    setExams(exams.filter((exam) => exam.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center p-6">
      <motion.h1
        className="text-3xl font-extrabold mb-8 text-green-800"
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
          className="flex-1 p-3 border rounded-xl shadow-sm"
        />
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-3 border rounded-xl shadow-sm"
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
              className="p-6 rounded-2xl shadow-md bg-white flex justify-between items-center border border-green-200"
              whileHover={{ scale: 1.02 }}
            >
              <div>
                <h2 className="text-xl font-bold text-green-800">
                  {exam.title}
                </h2>
                {countdown ? (
                  <p className="text-green-700 font-semibold">
                    {countdown.days}j : {countdown.hours}h : {countdown.minutes}m :{" "}
                    {countdown.seconds}s
                  </p>
                ) : (
                  <p className="text-red-600 font-semibold">🚨 Expiré</p>
                )}
              </div>
              <button
                onClick={() => deleteExam(exam.id)}
                className="text-red-600 hover:text-red-800 transition"
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
