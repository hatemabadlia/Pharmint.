// src/pages/LandingPage.jsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Lottie from "lottie-react";
import AOS from "aos";
import "aos/dist/aos.css";
import { motion } from "framer-motion";
import {
  FaCogs,
  FaSync,
  FaBook,
  FaBell,
  FaProjectDiagram,
  FaHeadset,
} from "react-icons/fa";
import { Facebook, Instagram } from "lucide-react";
import { useTheme } from "../context/ThemeContext"; // 🔑 IMPORT useTheme
// ✅ Lottie Animations
import heroAnim from "../assets/health.json";
import planAnim from "../assets/plan.json";
import premiumAnim from "../assets/premium.json";
import studyAnim from "../assets/study.json";
import GazaSupportBanner from "../components/Gaza";

// ----------------- UI helpers -----------------

// 💡 SectionTitle: Now accepts the 'theme' prop
const SectionTitle = ({ overline, title, subtitle, theme }) => (
  <div className="text-center mb-10">
    {overline && (
      <p className="uppercase tracking-widest text-xs md:text-sm text-emerald-600 font-semibold">
        {overline}
      </p>
    )}
    <h2 className={`text-3xl md:text-4xl font-extrabold mt-1 ${
        theme === 'dark' ? 'text-gray-100' : 'text-gray-900' // Text color change
    }`}>
      {title}
    </h2>
    {subtitle && <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{subtitle}</p>}
  </div>
);

const motionCardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  show: (i = 1) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.05, duration: 0.4, ease: "easeOut" },
  }),
};

// 💡 OfferCard: Now accepts the 'theme' prop
const OfferCard = ({ i, label, price, badge, onClick, theme }) => (
  <motion.button
    type="button"
    // 🔑 Card Background and shadow based on theme
    className={`group relative w-full backdrop-blur rounded-2xl p-5 text-left shadow-sm ring-1 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
        theme === 'dark'
        ? 'bg-gray-800/90 ring-gray-700'
        : 'bg-white/90 ring-gray-200'
    }`}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.2 }}
    variants={motionCardVariants}
    custom={i}
    onClick={onClick}
  >
    {/* 💡 Hover effect adjusted for dark mode visibility */}
    <div 
        className={`absolute inset-0 rounded-2xl bg-gradient-to-tr via-transparent opacity-0 group-hover:opacity-100 transition-opacity ${
            theme === 'dark' ? 'from-gray-700 to-gray-700/50' : 'from-emerald-50 via-transparent to-sky-50'
        }`}
    />
    <div className="relative">
      <p className={`text-base md:text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{label}</p>
      {badge && (
        <span className="mt-2 inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-600 text-white">
          {badge}
        </span>
      )}
      <p className="mt-3 text-2xl md:text-3xl font-extrabold text-emerald-500">
        {price} <span className="text-base font-semibold text-emerald-500">DA</span>
      </p>
      <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Accès aux Mindmap & QCM</p>
      <div className="mt-4 inline-flex items-center gap-2 text-emerald-500 font-semibold">
        <span className="underline decoration-emerald-300 group-hover:decoration-4">
          S’inscrire
        </span>
        <svg
          className="w-4 h-4 translate-x-0 group-hover:translate-x-0.5 transition-transform"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L12 6.414V17a1 1 0 11-2 0V6.414L6.707 9.707A1 1 0 115.293 8.293l5-5z" />
        </svg>
      </div>
    </div>
  </motion.button>
);

// 💡 SpecCard: Now accepts the 'theme' prop
const SpecCard = ({ i, icon, title, items, theme }) => (
  <motion.div
    // 🔑 Card Background and shadow based on theme
    className={`rounded-2xl p-6 shadow-sm ring-1 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
        theme === 'dark'
        ? 'bg-gray-800/90 ring-gray-700'
        : 'bg-white ring-gray-200'
    }`}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.2 }}
    variants={motionCardVariants}
    custom={i}
  >
    <div className="text-3xl text-emerald-500 mb-3">{icon}</div>
    <h3 className={`text-lg md:text-xl font-bold mb-3 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>{title}</h3>
    <ul className={`space-y-1.5 text-sm md:text-base ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
      {items.map((x, idx) => (
        <li key={idx}>• {x}</li>
      ))}
    </ul>
  </motion.div>
);

// ------------------------------------------------

const LandingPage = () => {
  const navigate = useNavigate();
  // 🔑 Use the theme hook
  const { theme } = useTheme(); 

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  // helpers
  const goSignup = (specialite, year, price) =>
    navigate("/signup", { state: { specialite, year, price } });

  return (
    // 🔑 Main page background changes here
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      
      {/* Navbar */}
      <Navbar />
      <br />
      <br />
      <br />

      <GazaSupportBanner />
      {/* HERO */}
      <section
        id="accueil"
        className="relative overflow-hidden min-h-[78vh] grid grid-cols-1 md:grid-cols-2 items-center gap-10 px-6 pt-28"
      >
        
        <div
          aria-hidden
          // 🔑 Hero gradient/blur effect changes in dark mode
          className={`pointer-events-none absolute -top-24 -right-24 h-72 w-72 md:h-[26rem] md:w-[26rem] rounded-full blur-3xl ${
            theme === 'dark'
            ? 'bg-gradient-to-tr from-gray-700/70 via-gray-800/60 to-transparent'
            : 'bg-gradient-to-tr from-emerald-200/70 via-sky-200/60 to-transparent'
          }`}
        />
        <div data-aos="fade-right" className="order-2 md:order-1">
          <h1 className={`text-4xl md:text-5xl font-extrabold leading-tight ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            Bienvenue sur <span className="text-emerald-500">Pharmint</span>
          </h1>
          <p className={`mt-4 text-base md:text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            La 1ère plateforme éducative dédiée aux étudiants de la faculté de pharmacie
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <a
              href="#offres"
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 transition"
            >
              Découvrir nos offres
            </a>
            <a
              href="#specs"
              // 🔑 Button background and ring changes in dark mode
              className={`px-5 py-3 rounded-xl font-semibold shadow ring-1 transition ${
                theme === 'dark' 
                ? 'bg-gray-800 text-emerald-500 ring-emerald-500/50 hover:ring-emerald-500'
                : 'bg-white text-emerald-700 ring-emerald-200 hover:ring-emerald-300'
              }`}
            >
              Spécifications
            </a>
          </div>
        </div>

        <div data-aos="fade-left" className="order-1 md:order-2 flex justify-center">
          <Lottie animationData={heroAnim} loop className="w-[320px] md:w-[460px]" />
        </div>
      </section>

      
      {/* SPÉCIFICATIONS (contenu original) */}
      <section 
        id="specs" 
        // 🔑 Section background changes here
        className={`py-16 md:py-20 ${
          theme === 'dark' 
          ? 'bg-gray-900/90' 
          : 'bg-gradient-to-b from-gray-50 to-emerald-50/50'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <SectionTitle
            overline="Spécifications"
            title="🚀 Boostez vos compétences et votre succès"
            subtitle="La plateforme vous offre une base solide, un contenu fiable et un suivi constant pour étudier efficacement, développer vos compétences et mieux gérer votre temps."
            theme={theme} // 🔑 Pass theme to helper component
          />

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SpecCard i={0} icon={<FaCogs />} title=" Performance Optimale" theme={theme}
              items={[
                "Optimisations front-end et back-end pour rapidité et stabilité",
                "Disponible 24/7 avec des temps de chargement ultra-rapides",
                "Support d’un grand nombre d’utilisateurs sans perte de fluidité",
              ]}
            />
            <SpecCard i={1} icon={<FaSync />} title="Développement Continu" theme={theme}
              items={[
                "Ajout régulier de nouvelles questions et fonctionnalités",
                "Amélioration constante de l’expérience utilisateur",
                "Évolution continue des outils pour maximiser vos bénéfices",
              ]}
            />
            <SpecCard i={2} icon={<FaBook />} title=" Contenu et Compétences" theme={theme}
              items={[
                "Simulations complètes des examens pour une expérience réaliste",
                "Contenu préparé et validé par l’équipe",
                "Outils pour organiser votre temps et gérer vos sessions",
                "Rapports détaillés et explications pédagogiques",
              ]}
            />
            <SpecCard i={3} icon={<FaBell />} title="Notifications et Alertes" theme={theme}
              items={[
                "Alertes instantanées pour chaque nouveauté",
                "Suivi régulier des mises à jour et des ajouts",
                "Traitement rapide des signalements et problèmes",
              ]}
            />
            <SpecCard i={4} icon={<FaProjectDiagram />} title=" Schématisation et Clarification" theme={theme}
              items={[
                "Résumés clairs et images explicatives",
                "Mindmaps pour mémoriser plus facilement",
                "Schémas pédagogiques pour simplifier l’information",
              ]}
            />
            <SpecCard i={5} icon={<FaHeadset />} title=" Support Dédié" theme={theme}
              items={[
                "Assistance disponible par e-mail et téléphone",
                "Réponses rapides et personnalisées",
                "Accompagnement pour résoudre vos problèmes et atteindre vos objectifs",
              ]}
            />
          </div>
        </div>
      </section>

      
      {/* POURQUOI NOUS */}
      <section 
        id="pourquoi" 
        // 🔑 Section background changes here
        className={`py-16 md:py-20 ${theme === 'dark' ? 'bg-gray-800/90' : 'bg-white'}`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <SectionTitle
            overline="pourquoi nous"
            title="Pourquoi choisir Pharmint ?"
            subtitle="Une plateforme éducative innovante, soutenue par une équipe engagée, pour vous accompagner vers la réussite."
            theme={theme} // 🔑 Pass theme to helper component
          />

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              // 🔑 Card background and shadow changes here
              className={`p-6 rounded-2xl shadow-sm ring-1 hover:shadow-xl hover:-translate-y-1 transition-all ${
                theme === 'dark'
                ? 'bg-gray-900/90 ring-gray-700'
                : 'bg-white ring-gray-200'
              }`}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={motionCardVariants}
              custom={0}
            >
              <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>➕ 25 000 QCM/QCS</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Une banque exceptionnelle avec corrections détaillées pour renforcer vos connaissances et réussir vos examens.
              </p>
            </motion.div>

            <motion.div
              // 🔑 Card background and shadow changes here
              className={`p-6 rounded-2xl shadow-sm ring-1 hover:shadow-xl hover:-translate-y-1 transition-all ${
                theme === 'dark'
                ? 'bg-gray-900/90 ring-gray-700'
                : 'bg-white ring-gray-200'
              }`}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={motionCardVariants}
              custom={1}
            >
              <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>🧠 Résumés & Mindmaps</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Des supports clairs et structurés pour réviser vite et mémoriser efficacement.
              </p>
            </motion.div>

            <motion.div
              // 🔑 Card background and shadow changes here
              className={`p-6 rounded-2xl shadow-sm ring-1 hover:shadow-xl hover:-translate-y-1 transition-all ${
                theme === 'dark'
                ? 'bg-gray-900/90 ring-gray-700'
                : 'bg-white ring-gray-200'
              }`}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={motionCardVariants}
              custom={2}
            >
              <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>💡 Expérience unique d’apprentissage</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Une interface moderne, fluide et pensée pour rendre vos révisions plus efficaces et agréables.
              </p>
            </motion.div>
          </div>

          {/* ✅ Texte en bas */}
          <div className="mt-10 text-center">
            <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-emerald-400' : 'text-green-600'}`}>
              🔑 Avec Pharmint, vous avez toutes les clés pour réussir.
            </p>
          </div>
        </div>
      </section>

      {/* OFFRES */}
      <section 
        id="offres" 
        // 🔑 Section background changes here
        className={`py-16 md:py-20 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <SectionTitle
            overline="offres"
            title="Choisissez votre spécialité"
            subtitle="Cartes animées • 100% responsive • Redirection directe vers l’inscription"
            theme={theme} // 🔑 Pass theme to helper component
          />

          {/* Pharmacie (5 ans + Résidanat) */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <Lottie animationData={planAnim} loop className="w-12 md:w-14" />
              <h3 className={`text-2xl md:text-3xl font-extrabold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                Pharmacie — 5 ans + Résidanat
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "1ʳᵉ Année", price: 1000 },
                { label: "2ᵉ Année", price: 1000 },
                { label: "3ᵉ Année", price: 1000 },
                { label: "4ᵉ Année", price: 1000 },
                { label: "5ᵉ Année", price: 1000 },
                { label: "Résidanat", price: 3000, badge: "Prépa concours" },
              ].map((x, i) => (
                <OfferCard
                  key={x.label}
                  i={i}
                  label={x.label}
                  price={x.price}
                  badge={x.badge}
                  onClick={() => goSignup("Pharmacie", x.label, x.price)}
                  theme={theme} // 🔑 Pass theme to helper component
                />
              ))}
            </div>
          </div>

          {/* Pharmacie Industrielle (3 ans) */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <Lottie animationData={premiumAnim} loop className="w-12 md:w-14" />
              <h3 className={`text-2xl md:text-3xl font-extrabold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                Pharmacie Industrielle — 3 ans
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {["1ʳᵉ Année", "2ᵉ Année", "3ᵉ Année"].map((label, i) => (
                <OfferCard
                  key={label}
                  i={i}
                  label={label}
                  price={1000}
                  onClick={() =>
                    goSignup("Pharmacie Industrielle", label, 500)
                  }
                  theme={theme} // 🔑 Pass theme to helper component
                />
              ))}
            </div>
          </div>

          {/* Pharmacie Auxiliaire (3 ans) */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Lottie animationData={studyAnim} loop className="w-12 md:w-14" />
              <h3 className={`text-2xl md:text-3xl font-extrabold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                Pharmacie Auxiliaire — 3 ans
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {["1ʳᵉ Année", "2ᵉ Année", "3ᵉ Année"].map((label, i) => (
                <OfferCard
                  key={label}
                  i={i}
                  label={label}
                  price={1000}
                  onClick={() => goSignup("Pharmacie Auxiliaire", label, 500)}
                  theme={theme} // 🔑 Pass theme to helper component
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* CONTACT */}
      <section 
        id="contact" 
        // 🔑 Section background changes here
        className={`py-16 md:py-20 ${
          theme === 'dark'
          ? 'bg-gray-800'
          : 'bg-gradient-to-b from-white to-emerald-50/60'
        }`}
      >
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className={`text-3xl md:text-4xl font-extrabold mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            Contactez-nous
          </h2>
          <p className={`mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Une question ? Écrivez-nous sur WhatsApp ou envoyez un e-mail.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://wa.me/213652790035"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl shadow hover:bg-emerald-700 transition"
            >
              📱 WhatsApp
            </a>
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=pharmint.plateforme@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              // 🔑 Button background and ring changes in dark mode
              className={`px-6 py-3 font-semibold rounded-xl shadow ring-1 transition ${
                theme === 'dark'
                ? 'bg-gray-900 text-emerald-500 ring-emerald-500/50 hover:ring-emerald-500 hover:bg-gray-700'
                : 'bg-white text-emerald-700 ring-emerald-200 hover:ring-emerald-300'
              }`}
            >
              ✉️ Envoyer un Email
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer 
        // 🔑 Footer background changes here
        className={`${
          theme === 'dark' 
          ? 'bg-gray-950 text-emerald-500 shadow-2xl'
          : 'bg-gradient-to-r from-emerald-100/80 via-white/90 to-green-50/80 backdrop-blur-md shadow-md text-green-700'
        } py-10 text-center`}
      >
        <div className="max-w-6xl mx-auto px-6">
          {/* © Text */}
          <p className={`mb-6 text-sm md:text-base font-medium ${theme === 'dark' ? 'text-gray-400' : ''}`}>
            © {new Date().getFullYear()}{" "}
            <span className={`font-bold ${theme === 'dark' ? 'text-emerald-500' : 'text-emerald-700'}`}>Pharmint</span> — Tous droits réservés.
          </p>

          {/* Social Icons */}
          <div className={`flex justify-center items-center gap-8 ${theme === 'dark' ? 'text-emerald-500' : 'text-green-700'}`}>
            {/* Facebook */}
            <a
              href="https://www.facebook.com/share/19qmqJA9t3/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-emerald-600 transition transform hover:scale-110"
            >
              <Facebook size={22} />
              <span className="hidden sm:inline">Facebook</span>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/pharmint.dz?igsh=MTBybDZvcTJhNnFpcA=="
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-emerald-600 transition transform hover:scale-110"
            >
              <Instagram size={22} />
              <span className="hidden sm:inline">Instagram</span>
            </a>

            {/* TikTok (icon fill color won't change, but text can) */}
            <a
              href="https://www.tiktok.com/@pharmint.dz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition transform hover:scale-110"
            >
              {/* SVG path is kept as is for multi-color gradient */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 256 256"
                className="w-6 h-6"
              >
                <defs>
                  <linearGradient id="tiktokGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#25F4EE" />
                    <stop offset="50%" stopColor="#FE2C55" />
                    <stop offset="100%" stopColor="#000000" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#tiktokGradient)"
                  d="M224 80.1a80.2 80.2 0 0 1-47.6-15.6v60.4a68.4 68.4 0 1 1-68.4-68.4c2.5 0 5 .2 7.4.4V92a28.2 28.2 0 1 0 18.8 26.6V28h41.6a38.4 38.4 0 0 0 38.4 38.4z"
                />
              </svg>
              <span className="hidden sm:inline">TikTok</span>
            </a>
          </div>

          {/* Tagline */}
          <p className={`mt-6 text-xs md:text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
            Merci de soutenir{" "}
            <span className={`font-semibold ${theme === 'dark' ? 'text-emerald-500' : 'text-emerald-700'}`}>Pharmint</span> — Ensemble pour une santé et un avenir meilleurs 💚
          </p>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;