// src/components/GazaSupportBanner.jsx

import { motion } from "framer-motion";
import Lottie from "lottie-react";
import PalestineAnimation from "../assets/Palestine flag Lottie JSON animation.json"; 
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme

export default function GazaSupportBanner() {
  const { theme } = useTheme(); // 🔑 Get the current theme

  // 💡 Helper function to determine the text color based on the theme
  const getTextColor = () => {
    // In light mode, text is dark (gray-900).
    // In dark mode, text is light (gray-100) to stand out,
    // though the banner's internal colors are still used for contrast.
    return theme === 'dark' ? 'text-gray-100' : 'text-gray-900';
  }

  // 💡 Helper function to determine the main background gradient
  const getGradientClasses = () => {
    // Keep the original patriotic colors for the banner regardless of the main theme,
    // but darken the supporting colors slightly for visual contrast in dark mode.
    return theme === 'dark'
      ? 'from-emerald-700 via-gray-900 to-emerald-500' 
      : 'from-emerald-600 via-white to-emerald-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      className={`relative w-full overflow-hidden text-center
                 py-6 px-4 sm:py-8 sm:px-6 md:py-10 md:px-10 font-semibold shadow-lg
                 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8 ${getTextColor()}`}
    >
      {/* 🌈 Animated gradient background */}
      <motion.div
        // 🔑 Use the helper function for the gradient colors
        className={`absolute inset-0 bg-gradient-to-r ${getGradientClasses()}`}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          backgroundSize: "200% 200%",
          opacity: theme === 'dark' ? 0.7 : 0.9, // Lower opacity slightly in dark mode
        }}
      />

      {/* 🇵🇸 Animated Lottie flag (left) */}
      <div className="w-20 sm:w-28 md:w-36 relative z-10 flex-shrink-0">
        <Lottie animationData={PalestineAnimation} loop={true} />
      </div>

      {/* ❤️ Emotional message */}
      <motion.p
        className="relative z-10 text-base sm:text-lg md:text-2xl lg:text-3xl leading-snug max-w-3xl font-bold px-2"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ repeat: Infinity, duration: 4 }}
      >
        🇵🇸 <span className={`font-extrabold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-800'}`}>Pharmint</span> célèbre avec fierté la{" "}
        <span className={`font-extrabold ${theme === 'dark' ? 'text-green-300' : 'text-green-800'}`}>liberté de Gaza</span> 🌿 —{" "}
        Chaque achat contribue à{" "}
        <span className={`underline ${theme === 'dark' ? 'decoration-emerald-400' : 'decoration-emerald-700'}`}>reconstruire</span> et{" "}
        <span className={`font-extrabold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>soutenir les familles</span> qui ont résisté
        avec courage 💚
      </motion.p>

      {/* 🇵🇸 Animated Lottie flag (right) */}
      <div className="w-20 sm:w-28 md:w-36 relative z-10 flex-shrink-0">
        <Lottie animationData={PalestineAnimation} loop={true} />
      </div>
    </motion.div>
  );
}