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
  FaHome,
} from "react-icons/fa";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const menuItems = [
  { icon: <FaHome />,          label: "Accueil",           path: "/home"                  },
  { icon: <FaTasks />,         label: "To-Do List",        path: "/home/todo"             },
  { icon: <FaBook />,          label: "Résumés & Mindmaps",path: "/home/courses"          },
  { icon: <FaPuzzlePiece />,   label: "QCMs de Cours",     path: "/home/sessions"         },
  { icon: <FaClipboardList />, label: "QCMs TD/TP",        path: "/home/tdtp"             },
  { icon: <FaListAlt />,       label: "Exam Simulation",   path: "/home/examSession"      },
  { icon: <FaHourglassHalf />, label: "Countdown Exam",    path: "/home/exam-countdown"   },
  { icon: <FaListAlt />,       label: "Suivi des Cours",   path: "/home/course-tracker"   },
  { icon: <FaClock />,         label: "Pomodoro",          path: "/home/pomodoro"         },
  { icon: <FaUser />,          label: "Profil",            path: "/home/profile"          },
  { icon: <FaCrown />,         label: "Abonnement",        path: "/home/subscription"     },
];

export default function AnimatedSidebar() {
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen]     = useState(true);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const location = useLocation();

  // Watch screen size
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (!desktop) setIsOpen(false); // auto-collapse on mobile
    };
    // set initial state correctly
    if (window.innerWidth < 1024) setIsOpen(false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Always open on desktop
  useEffect(() => {
    if (isDesktop) setIsOpen(true);
  }, [isDesktop]);

  // ✅ Auto-close sidebar on mobile when a menu item is clicked
  const handleMenuClick = () => {
    if (!isDesktop) setIsOpen(false);
  };

  const sidebarVariants = {
    open:   { width: "240px", transition: { duration: 0.4, type: "spring" } },
    closed: { width: "70px",  transition: { duration: 0.4, type: "spring" } },
  };

  const menuItemVariants = {
    hidden:  { opacity: 0, x: -20 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05 },
    }),
  };

  const getSidebarBgStyle = () => {
    if (theme === "dark") {
      return { background: "linear-gradient(180deg, #064e3b 0%, #052e16 100%)" };
    }
    return { background: "linear-gradient(180deg, #e6fff3 0%, #bff6d8 50%, rgb(118, 255, 83) 100%)" };
  };

  // Active check — exact match for /home, startsWith for others
  const isActive = (path) => {
    if (path === "/home") return location.pathname === "/home";
    return location.pathname.startsWith(path);
  };

  return (
    <motion.div
      initial={false}
      animate={isOpen ? "open" : "closed"}
      variants={sidebarVariants}
      className="h-screen flex flex-col p-3 shadow-lg z-40"
      style={{
        ...getSidebarBgStyle(),
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center mb-6 p-2 rounded-full shadow-md hover:scale-110 transition-transform ${
          theme === "dark" ? "bg-gray-700" : "bg-white"
        }`}
      >
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <FaBars size={20} className={theme === "dark" ? "text-emerald-300" : "text-green-700"} />
        </motion.div>
      </button>

      {/* Menu Items */}
      <nav className="flex flex-col gap-1 flex-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item, i) => (
          <Link to={item.path} key={i} onClick={handleMenuClick}>
            <motion.div
              custom={i}
              initial="hidden"
              animate="visible"
              variants={menuItemVariants}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                theme === "dark"
                  ? isActive(item.path)
                    ? "bg-emerald-700 text-white font-bold"
                    : "text-gray-200 hover:bg-emerald-800"
                  : isActive(item.path)
                  ? "bg-green-200 text-emerald-900 font-bold"
                  : "text-emerald-900 hover:bg-white/50 hover:shadow-lg"
              } ${!isOpen && "justify-center"}`}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-medium whitespace-nowrap text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="mt-4 pt-4 border-t border-gray-500/30">
        <motion.div
          custom={menuItems.length}
          initial="hidden"
          animate="visible"
          variants={menuItemVariants}
          onClick={toggleTheme}
          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
            theme === "dark"
              ? "text-gray-200 hover:bg-emerald-800"
              : "text-emerald-900 hover:bg-white/50 hover:shadow-lg"
          } ${!isOpen && "justify-center"}`}
        >
          <span className="text-xl flex-shrink-0">
            {theme === "light" ? <Moon size={22} /> : <Sun size={22} />}
          </span>
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="font-medium whitespace-nowrap text-sm"
              >
                {theme === "light" ? "Mode Sombre" : "Mode Clair"}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}