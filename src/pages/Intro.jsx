// src/pages/client/HomePage.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db, auth } from "../firebase/config";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { useTheme } from "../context/ThemeContext";
import {
  FaPuzzlePiece,
  FaClipboardList,
  FaBullhorn,
  FaFire,
  FaTrophy,
  FaCheckCircle,
} from "react-icons/fa";

// ─── Stat Card ─────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, theme }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`flex flex-col items-center justify-center p-5 rounded-2xl shadow-md ${
      theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"
    }`}
  >
    <div className={`text-3xl mb-2 ${color}`}>{icon}</div>
    <p className={`text-3xl font-extrabold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
      {value ?? <span className="animate-pulse text-gray-400">—</span>}
    </p>
    <p className={`text-xs mt-1 text-center font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
      {label}
    </p>
  </motion.div>
);

// ─── Announcement Card ──────────────────────────────────────────────────────
const AnnouncementCard = ({ title, body, date, pinned, theme }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.35 }}
    className={`relative p-4 rounded-2xl shadow border ${
      pinned
        ? theme === "dark"
          ? "border-emerald-600 bg-emerald-900/30"
          : "border-emerald-400 bg-emerald-50"
        : theme === "dark"
        ? "border-gray-700 bg-gray-800"
        : "border-gray-200 bg-white"
    }`}
  >
    {pinned && (
      <span className="absolute top-3 right-3 text-xs font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full">
        📌 Épinglé
      </span>
    )}
    <p className={`font-bold text-sm mb-1 pr-16 ${theme === "dark" ? "text-gray-100" : "text-gray-800"}`}>
      {title}
    </p>
    <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
      {body}
    </p>
    {date && (
      <p className={`text-xs mt-2 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>
        🗓 {date}
      </p>
    )}
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const { theme } = useTheme();
  const userId = auth.currentUser?.uid;

  const [userName, setUserName]           = useState("");
  const [stats, setStats]                 = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingStats, setLoadingStats]   = useState(true);
  const [loadingAnnounce, setLoadingAnnounce] = useState(true);

  // ─── Fetch user name ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", userId));
      if (snap.exists()) {
        const d = snap.data();
        setUserName(d.displayName || d.name || d.email?.split("@")[0] || "");
      }
    };
    fetchUser();
  }, [userId]);

  // ─── Fetch statistics from subcollections ────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      try {
        // Sessions
        const sessionsSnap = await getDocs(collection(db, "users", userId, "sessions"));
        const sessions = sessionsSnap.docs.map((d) => d.data());
        const totalSessions   = sessions.length;
        const finishedSessions = sessions.filter((s) => s.finished).length;

        // Count total questions answered across sessions
        let totalQuestionsAnswered = 0;
        sessions.forEach((s) => {
          const qCount = s.questions?.length || 0;
          if (s.finished) totalQuestionsAnswered += qCount;
          else if (s.progress?.currentQuestion) totalQuestionsAnswered += s.progress.currentQuestion;
        });

        // Exams
        const examsSnap = await getDocs(collection(db, "users", userId, "exams"));
        const exams = examsSnap.docs.map((d) => d.data());
        const totalExams    = exams.length;
        const finishedExams = exams.filter((e) => e.finished).length;

        // Average score (sessions only, finished)
        const finishedWithScore = sessions.filter((s) => s.finished && s.score != null);
        const avgScore = finishedWithScore.length > 0
          ? (finishedWithScore.reduce((acc, s) => acc + parseFloat(s.score), 0) / finishedWithScore.length).toFixed(1)
          : null;

        setStats({
          totalSessions,
          finishedSessions,
          totalExams,
          finishedExams,
          totalQuestionsAnswered,
          avgScore,
        });
      } catch (err) {
        console.error("Erreur stats:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [userId]);

  // ─── Fetch announcements from Firestore ──────────────────────────────────
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const q    = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(10));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAnnouncements(list);
      } catch (err) {
        // Collection might not exist yet — that's fine
        console.warn("Pas d'annonces trouvées:", err.message);
        setAnnouncements([]);
      } finally {
        setLoadingAnnounce(false);
      }
    };
    fetchAnnouncements();
  }, []);

  // ─── Greeting ─────────────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting =
    hour < 5  ? "Bonne nuit" :
    hour < 12 ? "Bonjour"   :
    hour < 18 ? "Bon après-midi" :
                "Bonsoir";

  // ─── Placeholder announcements when collection is empty ──────────────────
  const displayAnnouncements = announcements.length > 0
    ? announcements
    : [
        {
          id:     "placeholder",
          title:  "Bienvenue sur la plateforme ! 🎉",
          body:   "Explorez vos QCMs, suivez vos progrès et préparez vos examens efficacement.",
          pinned: true,
          date:   null,
        },
      ];

  return (
    <div className={`min-h-screen px-4 py-8 transition-colors duration-300 ${
      theme === "dark" ? "bg-gray-900" : "bg-green-50"
    }`}>
      <div className="max-w-5xl mx-auto space-y-10">

        {/* ── Greeting ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={`text-3xl font-extrabold ${theme === "dark" ? "text-emerald-400" : "text-green-700"}`}>
            {greeting}{userName ? `, ${userName}` : ""} 👋
          </h1>
          <p className={`mt-1 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            Voici un résumé de votre activité.
          </p>
        </motion.div>

        {/* ── Statistics ────────────────────────────────────────────────── */}
        <section>
          <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
            theme === "dark" ? "text-gray-200" : "text-gray-700"
          }`}>
            <FaFire className="text-orange-500" /> Vos statistiques
          </h2>

          {loadingStats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`h-28 rounded-2xl animate-pulse ${
                  theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                }`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard
                icon={<FaPuzzlePiece />}
                label="Sessions créées"
                value={stats?.totalSessions}
                color="text-emerald-500"
                theme={theme}
              />
              <StatCard
                icon={<FaCheckCircle />}
                label="Sessions terminées"
                value={stats?.finishedSessions}
                color="text-green-500"
                theme={theme}
              />
              <StatCard
                icon={<FaClipboardList />}
                label="Examens créés"
                value={stats?.totalExams}
                color="text-blue-500"
                theme={theme}
              />
              <StatCard
                icon={<FaCheckCircle />}
                label="Examens terminés"
                value={stats?.finishedExams}
                color="text-indigo-500"
                theme={theme}
              />
              <StatCard
                icon={<FaFire />}
                label="Questions répondues"
                value={stats?.totalQuestionsAnswered}
                color="text-orange-500"
                theme={theme}
              />
              <StatCard
                icon={<FaTrophy />}
                label="Score moyen"
                value={stats?.avgScore != null ? `${stats.avgScore}/20` : "—"}
                color="text-yellow-500"
                theme={theme}
              />
            </div>
          )}
        </section>

        {/* ── Progress bar (finished sessions) ─────────────────────────── */}
        {!loadingStats && stats?.totalSessions > 0 && (
          <section>
            <h2 className={`text-lg font-bold mb-3 flex items-center gap-2 ${
              theme === "dark" ? "text-gray-200" : "text-gray-700"
            }`}>
              <FaCheckCircle className="text-green-500" /> Progression des sessions
            </h2>
            <div className={`w-full rounded-full h-5 overflow-hidden ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}>
              <motion.div
                className="h-5 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(stats.finishedSessions / stats.totalSessions) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              {stats.finishedSessions} / {stats.totalSessions} sessions complétées (
              {Math.round((stats.finishedSessions / stats.totalSessions) * 100)}%)
            </p>
          </section>
        )}

        {/* ── Announcements ─────────────────────────────────────────────── */}
        <section>
          <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 ${
            theme === "dark" ? "text-gray-200" : "text-gray-700"
          }`}>
            <FaBullhorn className="text-yellow-500" /> Annonces
          </h2>

          {loadingAnnounce ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className={`h-20 rounded-2xl animate-pulse ${
                  theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                }`} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pinned first */}
              {[...displayAnnouncements]
                .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
                .map((ann) => (
                  <AnnouncementCard
                    key={ann.id}
                    title={ann.title}
                    body={ann.body || ann.content || ""}
                    date={
                      ann.createdAt?.toDate
                        ? ann.createdAt.toDate().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                        : ann.date || null
                    }
                    pinned={!!ann.pinned}
                    theme={theme}
                  />
                ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}