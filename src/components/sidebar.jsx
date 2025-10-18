// src/components/AnimatedSidebar.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  FaBook,
  FaTasks,
  FaClipboardList,
  FaPuzzlePiece,
  FaUser,
  FaCrown,
  FaListAlt,
  FaBars,
  FaHourglassHalf,
  FaClock,
} from "react-icons/fa";

// Menu en français + nouvelles sections
const menuItems = [
  { icon: <FaTasks />, label: "To-Do List", path: "/home/todo" },
  { icon: <FaBook />, label: "Résumés & Mindmaps", path: "/home/courses" },
  { icon: <FaPuzzlePiece />, label: "QCMs de Cours", path: "/home/sessions" },
  { icon: <FaClipboardList />, label: "QCMs TD/TP", path: "/home/tdtp" },
  { icon: <FaListAlt />, label: "Exam Simulation", path: "/home/examSession" },
  { icon: <FaHourglassHalf />, label: "Countdown Exam", path: "/home/exam-countdown" },
  { icon: <FaListAlt />, label: "Suivi des Cours", path: "/home/course-tracker" },
  { icon: <FaClock />, label: "Pomodoro", path: "/home/pomodoro" },
  { icon: <FaUser />, label: "Profil", path: "/home/profile" },
  { icon: <FaCrown />, label: "Abonnement", path: "/home/subscription" },
];

export default function AnimatedSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const location = useLocation();

  // Watch screen size
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Always open on desktop
  useEffect(() => {
    if (isDesktop) setIsOpen(true);
  }, [isDesktop]);

  const sidebarVariants = {
    open: { width: "240px", transition: { duration: 0.4, type: "spring" } },
    closed: { width: "70px", transition: { duration: 0.4, type: "spring" } },
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05 },
    }),
  };

  return (
    <motion.div
      initial={false}
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      className="h-screen flex flex-col p-3 shadow-lg z-40"
      style={{
        background:
          "linear-gradient(180deg, #e6fff3 0%, #bff6d8 50%, rgb(118, 255, 83) 100%)",
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      {/* Toggle button (mobile only) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center mb-6 p-2 rounded-full bg-white shadow-md hover:scale-110 transition-transform md:hidden"
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <FaBars size={20} className="text-green-700" />
        </motion.div>
      </button>

      {/* Menu Items */}
      <nav className="flex flex-col gap-2">
        {menuItems.map((item, i) => (
          <Link to={item.path} key={i}>
            <motion.div
              custom={i}
              initial="hidden"
              animate="visible"
              variants={menuItemVariants}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:scale-105 transition-transform hover:shadow-lg ${
                location.pathname === item.path
                  ? "bg-green-200"
                  : "bg-transparent"
              }`}
              style={{ color: "#064e3b" }}
            >
              <span className="text-xl">{item.icon}</span>
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        ))}
      </nav>
    </motion.div>
  );
}
