// src/components/Navbar.jsx

import { useState, useEffect } from "react";
import { Link } from "react-scroll";
import { Menu, X, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/logo.png";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  // 🔑 Get theme state and toggle function
  const { theme, toggleTheme } = useTheme(); 
  
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // ✅ Detect scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 💡 Helper function to get classes for the main background
  const getNavBgClasses = () => {
    if (theme === 'dark') {
        // Dark Mode Styles (Ignoring scrolled state for simplicity, using a dark background)
        return scrolled 
            ? "bg-gray-900/80 backdrop-blur-xl shadow-xl border-b border-gray-800" 
            : "bg-gray-900/90 backdrop-blur-md shadow-xl";
    }
    // Light Mode Styles (Original logic)
    return scrolled
        ? "bg-white/40 backdrop-blur-xl shadow-md"
        : "bg-gradient-to-r from-emerald-100/80 via-white/90 to-green-50/80 backdrop-blur-md shadow-md";
  };
  
  // 💡 Helper function to get classes for menu links
  const getLinkClasses = () => {
      if (theme === 'dark') {
          return scrolled ? 'text-gray-100' : 'text-gray-300';
      }
      return scrolled ? 'text-gray-800' : 'text-green-700';
  };

  // 💡 Helper function for the "Connexion" button (Secondary)
  const getLoginButtonClasses = () => {
      if (theme === 'dark') {
          return scrolled
            ? 'bg-green-700 text-white hover:bg-green-600 border-green-700'
            : 'bg-gray-800 text-green-400 hover:bg-gray-700 border-gray-700';
      }
      return scrolled
        ? 'bg-green-600 text-white hover:bg-green-700 border-green-600'
        : 'bg-white text-green-600 hover:bg-gray-100 border-green-200';
  };

  // 💡 Helper function for the "S'inscrire" button (Primary CTA)
  const getSignupButtonClasses = () => {
      if (theme === 'dark') {
          return scrolled
            ? 'bg-green-700 text-white hover:bg-green-600'
            : 'bg-green-700 text-white hover:bg-green-600'; // Keep primary CTA bright
      }
      return scrolled
        ? 'bg-green-600 text-white hover:bg-green-700'
        : 'bg-white text-green-600 hover:bg-gray-100';
  };


  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      // 🔑 Use the JavaScript helper function here
      className={`fixed w-full z-50 transition-all duration-300 ${getNavBgClasses()}`}
    >
      <div className="container mx-auto flex justify-between items-center px-4 py-3">
        {/* ✅ Logo */}
        <img src={logo} alt="Logo" className="h-9 drop-shadow-md" />

        {/* ✅ Desktop Menu */}
        <ul className={`hidden md:flex gap-8 font-medium text-sm ${getLinkClasses()}`}>
          {[
            { id: "accueil", label: "Accueil" },
            { id: "specs", label: "Spécifications" },
            { id: "pourquoi", label: "Pourquoi nous" },
            { id: "offres", label: "Abonnements" },
            { id: "contact", label: "Contact" },
          ].map((item) => (
            <li key={item.id}>
              <Link
                to={item.id}
                smooth
                duration={600}
                className="cursor-pointer relative group"
              >
                {item.label}
                <span
                  // 🔑 Link underline color
                  className={`absolute left-0 bottom-[-4px] w-0 h-[2px] ${
                    theme === 'dark' ? 'bg-green-400' : (scrolled ? 'bg-green-600' : 'bg-white')
                  } group-hover:w-full transition-all duration-300`}
                ></span>
              </Link>
            </li>
          ))}
        </ul>

        {/* ✅ Desktop Buttons and Theme Toggle */}
        <div className="hidden md:flex gap-3 text-sm items-center">
          {/* 🔑 THEME TOGGLE BUTTON - Desktop */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${getLinkClasses()} hover:bg-gray-100 ${theme === 'dark' ? 'hover:bg-gray-700' : ''} transition`}
            aria-label="Toggle dark mode"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          
          {/* Connexion Button (Secondary Action) */}
          <a
            href="/login"
            // 🔑 Use JavaScript helper function here
            className={`px-4 py-1.5 rounded-lg hover:scale-105 transition font-medium border ${getLoginButtonClasses()}`}
          >
            Connexion
          </a>
          
          {/* S'inscrire Button (Primary CTA) */}
          <a
            href="/signup"
            // 🔑 Use JavaScript helper function here
            className={`px-4 py-1.5 rounded-lg transition font-medium ${getSignupButtonClasses()}`}
          >
            S'inscrire
          </a>
        </div>

        {/* ✅ Mobile Menu Button & Theme Toggle */}
        <div className="md:hidden flex items-center gap-2">
            {/* 🔑 MOBILE THEME TOGGLE BUTTON */}
            <button
                onClick={toggleTheme}
                className={`p-1 rounded-full ${getLinkClasses()}`}
                aria-label="Toggle dark mode"
            >
                {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            </button>
            
            {/* Mobile Menu Icon */}
            <button
              className={`${getLinkClasses()}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
        </div>
      </div>

      {/* ✅ Mobile Dropdown with Animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            // 🔑 Mobile Menu BG based on theme
            className={`md:hidden px-4 py-4 space-y-4 text-sm shadow-lg ${
                theme === 'dark' 
                ? 'bg-gradient-to-b from-gray-800 to-gray-900 text-gray-100'
                : 'bg-gradient-to-b from-green-600 to-emerald-500 text-white'
            }`}
          >
            {[
              { id: "accueil", label: "Accueil" },
              { id: "specs", label: "Spécifications" },
              { id: "pourquoi", label: "Pourquoi nous" },
              { id: "offres", label: "Abonnements" },
              { id: "contact", label: "Contact" },
            ].map((item) => (
              <Link
                key={item.id}
                to={item.id}
                smooth
                duration={600}
                // Links inside the dark mobile menu are always light text
                className="block hover:pl-2 transition-all"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {/* ✅ Mobile Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <a
                href="/login"
                className={`px-3 py-2 border rounded-lg transition text-center ${
                    theme === 'dark' 
                    ? 'border-gray-600 text-gray-100 hover:bg-gray-700'
                    : 'border-white text-white hover:bg-white hover:text-green-600'
                }`}
              >
                Connexion
              </a>
              <a
                href="/signup"
                className={`px-3 py-2 rounded-lg transition text-center ${
                    theme === 'dark' 
                    ? 'bg-green-700 text-white hover:bg-green-600'
                    : 'bg-white text-green-600 hover:bg-gray-100'
                }`}
              >
                S'inscrire
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;