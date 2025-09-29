// src/pages/Intro.jsx
export default function Intro() {
  return (
    <div className="p-6 space-y-6">
      {/* Announcements */}
      <section className="bg-green-100 border border-green-300 rounded-xl p-4 shadow-md">
        <h2 className="text-xl font-bold text-green-800">📢 Announcements & Events</h2>
        <ul className="list-disc list-inside text-green-900 mt-2">
          <li>🎉 New courses launching next week!</li>
          <li>📅 Webinar on mastering quizzes – Aug 25</li>
          <li>🔥 Limited-time subscription discount</li>
        </ul>
      </section>

      {/* Intro to the website */}
      <section className="flex flex-col md:flex-row items-center gap-6">
        <img
          src="https://via.placeholder.com/400x250"
          alt="Our Platform"
          className="rounded-xl shadow-md"
        />
        <div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">How Our Website Works</h2>
          <p className="text-gray-700">
            Our platform offers interactive courses, quizzes, and a personalized to-do list
            to track your learning journey. With our subscription plans, you can unlock
            premium content and join live training sessions.
          </p>
          <p className="mt-2 text-gray-600">
            Navigate using the sidebar to explore different sections like Courses, Modules,
            and your Profile. Keep an eye on announcements for the latest updates!
          </p>
        </div>
      </section>
    </div>
  );
}
