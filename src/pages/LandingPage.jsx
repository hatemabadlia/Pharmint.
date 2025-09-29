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

// ✅ Lottie Animations
import heroAnim from "../assets/health.json";
import planAnim from "../assets/plan.json";
import premiumAnim from "../assets/premium.json";
import studyAnim from "../assets/study.json";

// ----------------- UI helpers -----------------
const SectionTitle = ({ overline, title, subtitle }) => (
  <div className="text-center mb-10">
    {overline && (
      <p className="uppercase tracking-widest text-xs md:text-sm text-emerald-600 font-semibold">
        {overline}
      </p>
    )}
    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-1">
      {title}
    </h2>
    {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
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

const OfferCard = ({ i, label, price, badge, onClick }) => (
  <motion.button
    type="button"
    className="group relative w-full bg-white/90 backdrop-blur rounded-2xl p-5 text-left shadow-sm ring-1 ring-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.2 }}
    variants={motionCardVariants}
    custom={i}
    onClick={onClick}
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-50 via-transparent to-sky-50 opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="relative">
      <p className="text-base md:text-lg font-semibold text-gray-900">{label}</p>
      {badge && (
        <span className="mt-2 inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-600 text-white">
          {badge}
        </span>
      )}
      <p className="mt-3 text-2xl md:text-3xl font-extrabold text-emerald-700">
        {price} <span className="text-base font-semibold text-emerald-700">DA</span>
      </p>
      <p className="mt-1 text-gray-500 text-sm">Accès aux cours & QCM</p>
      <div className="mt-4 inline-flex items-center gap-2 text-emerald-700 font-semibold">
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

const SpecCard = ({ i, icon, title, items }) => (
  <motion.div
    className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.2 }}
    variants={motionCardVariants}
    custom={i}
  >
    <div className="text-3xl text-emerald-600 mb-3">{icon}</div>
    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">{title}</h3>
    <ul className="space-y-1.5 text-gray-600 text-sm md:text-base">
      {items.map((x, idx) => (
        <li key={idx}>• {x}</li>
      ))}
    </ul>
  </motion.div>
);

// ------------------------------------------------

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  // helpers
  const goSignup = (specialite, year, price) =>
    navigate("/signup", { state: { specialite, year, price } });

  return (
    <div className="bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* HERO */}
      <section
        id="accueil"
        className="relative overflow-hidden min-h-[78vh] grid grid-cols-1 md:grid-cols-2 items-center gap-10 px-6 pt-28"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 md:h-[26rem] md:w-[26rem] rounded-full bg-gradient-to-tr from-emerald-200/70 via-sky-200/60 to-transparent blur-3xl"
        />
        <div data-aos="fade-right" className="order-2 md:order-1">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-gray-900">
            Bienvenue sur <span className="text-emerald-700">Pharmint</span>
          </h1>
          <p className="mt-4 text-gray-600 text-base md:text-lg">
            La plateforme éducative pour les étudiants en pharmacie en Algérie 🇩🇿.
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
              className="px-5 py-3 rounded-xl bg-white text-emerald-700 font-semibold shadow ring-1 ring-emerald-200 hover:ring-emerald-300 transition"
            >
              Spécifications
            </a>
          </div>
        </div>

        <div data-aos="fade-left" className="order-1 md:order-2 flex justify-center">
          <Lottie animationData={heroAnim} loop className="w-[320px] md:w-[460px]" />
        </div>
      </section>

      {/* OFFRES */}
      <section id="offres" className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <SectionTitle
            overline="offres"
            title="Choisissez votre spécialité"
            subtitle="Cartes animées • 100% responsive • Redirection directe vers l’inscription"
          />

          {/* Pharmacie (5 ans + Résidanat) */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <Lottie animationData={planAnim} loop className="w-12 md:w-14" />
              <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                Pharmacie — 5 ans + Résidanat
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "1ʳᵉ Année", price: 500 },
                { label: "2ᵉ Année", price: 500 },
                { label: "3ᵉ Année", price: 500 },
                { label: "4ᵉ Année", price: 500 },
                { label: "5ᵉ Année", price: 500 },
                { label: "Résidanat", price: 1500, badge: "Prépa concours" },
              ].map((x, i) => (
                <OfferCard
                  key={x.label}
                  i={i}
                  label={x.label}
                  price={x.price}
                  badge={x.badge}
                  onClick={() => goSignup("Pharmacie", x.label, x.price)}
                />
              ))}
            </div>
          </div>

          {/* Pharmacie Industrielle (3 ans) */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <Lottie animationData={premiumAnim} loop className="w-12 md:w-14" />
              <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                Pharmacie Industrielle — 3 ans
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {["1ʳᵉ Année", "2ᵉ Année", "3ᵉ Année"].map((label, i) => (
                <OfferCard
                  key={label}
                  i={i}
                  label={label}
                  price={500}
                  onClick={() =>
                    goSignup("Pharmacie Industrielle", label, 500)
                  }
                />
              ))}
            </div>
          </div>

          {/* Pharmacie Auxiliaire (3 ans) */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Lottie animationData={studyAnim} loop className="w-12 md:w-14" />
              <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                Pharmacie Auxiliaire — 3 ans
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {["1ʳᵉ Année", "2ᵉ Année", "3ᵉ Année"].map((label, i) => (
                <OfferCard
                  key={label}
                  i={i}
                  label={label}
                  price={500}
                  onClick={() => goSignup("Pharmacie Auxiliaire", label, 500)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SPÉCIFICATIONS (contenu original) */}
      <section id="specs" className="py-16 md:py-20 bg-gradient-to-b from-gray-50 to-emerald-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <SectionTitle
            overline="spécifications"
            title="Pensé pour la performance et la réussite"
            subtitle="Des bases techniques solides, des contenus vérifiés et un suivi constant."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SpecCard
              i={0}
              icon={<FaCogs />}
              title="Performance"
              items={[
                "Optimisations intelligentes côté front & back",
                "Disponibilité continue 24/7",
                "Temps de chargement minimisés",
                "Support d’un grand nombre d’utilisateurs",
              ]}
            />
            <SpecCard
              i={1}
              icon={<FaSync />}
              title="Évolutions & mises à jour"
              items={[
                "Ajout régulier de nouvelles questions",
                "Nouvelles fonctionnalités utiles",
                "Améliorations de performance",
                "Correctifs de sécurité",
              ]}
            />
            <SpecCard
              i={2}
              icon={<FaBook />}
              title="Qualité du contenu"
              items={[
                "Variété de scénarios & examens",
                "Questions revues par l’équipe",
                "Réponses précises & expliquées",
                "Annotations pédagogiques",
              ]}
            />
            <SpecCard
              i={3}
              icon={<FaBell />}
              title="Notifications utiles"
              items={[
                "Alerte nouveautés & guides",
                "Ajout des nouvelles questions",
                "Suivi des mises à jour",
                "Signalements traités rapidement",
              ]}
            />
            <SpecCard
              i={4}
              icon={<FaProjectDiagram />}
              title="Schématisation"
              items={[
                "Images explicatives",
                "Tableaux récap’ clairs",
                "Mindmaps de synthèse",
                "Schémas pédagogiques",
              ]}
            />
            <SpecCard
              i={5}
              icon={<FaHeadset />}
              title="Support dédié"
              items={[
                "Disponible par e-mail & téléphone",
                "Réponses rapides aux questions",
                "Aide à la résolution de problèmes",
                "Accompagnement personnalisé",
              ]}
            />
          </div>
        </div>
      </section>

      {/* POURQUOI NOUS */}
      <section id="pourquoi" className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <SectionTitle
            overline="pourquoi nous"
            title="Pourquoi choisir Pharmint ?"
            subtitle="Une plateforme claire, complète et efficace pour progresser."
          />
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              className="p-6 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={motionCardVariants}
              custom={0}
            >
              <h3 className="text-lg font-semibold mb-2">📚 +5000 QCM</h3>
              <p className="text-gray-600">
                Une grande banque de QCM/QCS avec corrections détaillées.
              </p>
            </motion.div>
            <motion.div
              className="p-6 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={motionCardVariants}
              custom={1}
            >
              <h3 className="text-lg font-semibold mb-2">🎯 Cours complets</h3>
              <p className="text-gray-600">
                Des cours mis à jour rédigés par des encadrants et praticiens.
              </p>
            </motion.div>
            <motion.div
              className="p-6 bg-white rounded-2xl shadow-sm ring-1 ring-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              variants={motionCardVariants}
              custom={2}
            >
              <h3 className="text-lg font-semibold mb-2">💡 Interface simple</h3>
              <p className="text-gray-600">
                Navigation fluide, modules clairs et progression visible.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-16 md:py-20 bg-gradient-to-b from-white to-emerald-50/60">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            Contactez-nous
          </h2>
          <p className="text-gray-600 mb-8">
            Une question ? Écrivez-nous sur WhatsApp ou envoyez un e-mail.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://wa.me/213650000000"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl shadow hover:bg-emerald-700 transition"
            >
              📱 WhatsApp
            </a>
            <a
              href="mailto:contact@pharmint.dz"
              className="px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl shadow ring-1 ring-emerald-200 hover:ring-emerald-300 transition"
            >
              ✉️ Envoyer un Email
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-6 text-center">
        <p>© {new Date().getFullYear()} Pharmint — Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
