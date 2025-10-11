// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { Link } from "react-scroll";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "../assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // ✅ Detect scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Colors based on scroll
  const textColor = scrolled ? "text-gray-800" : "text-green-700";
  const borderColor = scrolled
    ? "bg-green-600 text-white hover:bg-green-700"
    : "bg-white text-green-600 hover:bg-gray-100";
  const btnBg = scrolled
    ? "bg-green-600 text-white hover:bg-green-700"
    : "bg-white text-green-600 hover:bg-gray-100";

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/40 backdrop-blur-xl shadow-md fixed w-full z-50  "
          : "bg-gradient-to-r from-emerald-100/80 via-white/90 to-green-50/80 backdrop-blur-md shadow-md"
      }`}
    >
      <div className="container mx-auto flex justify-between items-center px-4 py-3">
        {/* ✅ Logo */}
        <img src={logo} alt="Logo" className="h-9 drop-shadow-md" />

        {/* ✅ Desktop Menu */}
        {/* ✅ Desktop Menu */}
        <ul className={`hidden md:flex gap-8 font-medium text-sm ${textColor}`}>
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
                  className={`absolute left-0 bottom-[-4px] w-0 h-[2px] ${
                    scrolled ? "bg-green-600" : "bg-white"
                  } group-hover:w-full transition-all duration-300`}
                ></span>
              </Link>
            </li>
          ))}
        </ul>

        {/* ✅ Desktop Buttons */}
        <div className="hidden md:flex gap-3 text-sm">
          <a
            href="/login"
            className={`px-4 py-1.5 rounded-lg hover:scale-105 transition font-medium border ${borderColor}`}
          >
            Connexion
          </a>
          <a
            href="/signup"
            className={`px-4 py-1.5 rounded-lg transition font-medium ${btnBg}`}
          >
            S'inscrire
          </a>
        </div>

        {/* ✅ Mobile Menu Button */}
        <button
          className={`md:hidden ${textColor}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* ✅ Mobile Dropdown with Animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-gradient-to-b from-green-600 to-emerald-500 px-4 py-4 space-y-4 text-white text-sm shadow-lg"
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
                className="px-3 py-2 border border-white text-white rounded-lg hover:bg-white hover:text-green-600 transition text-center"
              >
                Connexion
              </a>
              <a
                href="/signup"
                className="px-3 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition text-center"
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
