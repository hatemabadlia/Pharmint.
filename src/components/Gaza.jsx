import { motion } from "framer-motion";
import Lottie from "lottie-react";
import PalestineAnimation from "../assets/Palestine flag Lottie JSON animation.json"; // 🇵🇸 your Lottie JSON

export default function GazaSupportBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
      className="relative w-full overflow-hidden text-gray-900 text-center
                 py-6 px-4 sm:py-8 sm:px-6 md:py-10 md:px-10 font-semibold shadow-lg
                 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-8"
    >
      {/* 🌈 Animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-white to-emerald-400"
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
          opacity: 0.9,
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
        🇵🇸 <span className="text-emerald-800">Pharmint</span> célèbre avec fierté la{" "}
        <span className="text-green-800 font-extrabold">liberté de Gaza</span> 🌿 —{" "}
        Chaque achat contribue à{" "}
        <span className="underline decoration-emerald-700">reconstruire</span> et{" "}
        <span className="text-red-600">soutenir les familles</span> qui ont résisté
        avec courage 💚
      </motion.p>

      {/* 🇵🇸 Animated Lottie flag (right) */}
      <div className="w-20 sm:w-28 md:w-36 relative z-10 flex-shrink-0">
        <Lottie animationData={PalestineAnimation} loop={true} />
      </div>
    </motion.div>
  );
}
