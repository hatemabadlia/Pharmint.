import { useState, useEffect } from "react";

const lessons = [
  "INTRODUCTION A L'ANATOMIE",
  "INTRODUCTION A L'OSTEOLOGIE",
  "La Clavicule",
  "LA SCAPULA",
  "L'Humérus",
  "Le Radius",
  "Ulna",
  "Les os de la main",
];

export default function CourseTracker() {
  const [progress, setProgress] = useState({});

  // 🔄 Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("courseProgress");
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, []);

  // 💾 Save to localStorage
  useEffect(() => {
    localStorage.setItem("courseProgress", JSON.stringify(progress));
  }, [progress]);

  const toggleCheckbox = (lesson, field) => {
    setProgress((prev) => {
      const updated = {
        ...prev,
        [lesson]: {
          ...prev[lesson],
          [field]: !prev[lesson]?.[field],
        },
      };
      return updated;
    });
  };

  const getStatus = (lesson) => {
    const data = progress[lesson] || {};
    const total = ["c1", "c2", "c3", "qcm"];
    const completed = total.filter((f) => data[f]).length;

    if (completed === 0) return "Not Started";
    if (completed < total.length) return "In Progress";
    return "Completed";
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-green-700 mb-6">
        📖 Suivi des Cours
      </h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse rounded-lg overflow-hidden shadow-md">
          <thead className="bg-green-600 text-white">
            <tr>
              <th className="p-3 text-left">Lesson Title</th>
              <th className="p-3 text-center">Couche 1</th>
              <th className="p-3 text-center">Couche 2</th>
              <th className="p-3 text-center">Couche 3</th>
              <th className="p-3 text-center">QCM</th>
              <th className="p-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((lesson, i) => (
              <tr
                key={i}
                className={`border-b hover:bg-green-50 transition ${
                  getStatus(lesson) === "Completed"
                    ? "bg-green-100"
                    : getStatus(lesson) === "In Progress"
                    ? "bg-yellow-50"
                    : "bg-white"
                }`}
              >
                <td className="p-3 font-medium">{lesson}</td>
                {["c1", "c2", "c3", "qcm"].map((field) => (
                  <td key={field} className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={progress[lesson]?.[field] || false}
                      onChange={() => toggleCheckbox(lesson, field)}
                      className="w-5 h-5 accent-green-600"
                    />
                  </td>
                ))}
                <td className="p-3 text-center font-semibold">
                  {getStatus(lesson) === "Completed" && (
                    <span className="text-green-700">✅ Completed</span>
                  )}
                  {getStatus(lesson) === "In Progress" && (
                    <span className="text-yellow-600">⏳ In Progress</span>
                  )}
                  {getStatus(lesson) === "Not Started" && (
                    <span className="text-gray-500">🚫 Not Started</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
