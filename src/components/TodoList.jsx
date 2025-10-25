// src/components/TodoList.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import { subscribeToUserTasks, addTask, updateTask, deleteTask } from "../services/todoService";
import { format } from "date-fns";
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme

export default function TodoList({ onTasksChange }) {
  // 🔑 Get theme state
  const { theme } = useTheme();

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(""); // yyyy-MM-dd
  const [time, setTime] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [priority, setPriority] = useState("normal");

  useEffect(() => {
    const unsub = subscribeToUserTasks((snapTasks) => {
      setTasks(snapTasks);
      onTasksChange && onTasksChange(snapTasks);
    });
    return () => unsub();
  }, [onTasksChange]);

  const resetForm = () => {
    setTitle("");
    setDesc("");
    setDate("");
    setTime("");
    setPriority("normal");
    setEditingId(null);
  };

  const handleAddOrEdit = async (e) => {
    e?.preventDefault();
    // ⚠️ ORIGINAL ALERT RESTORED
    if (!title.trim()) return alert("Veuillez entrer un titre."); 

    try {
      if (editingId) {
        await updateTask(editingId, {
          title: title.trim(),
          description: desc.trim(),
          date: date || null,
          time: time || "",
          priority,
        });
      } else {
        await addTask({
          title: title.trim(),
          description: desc.trim(),
          date: date || null,
          time: time || "",
          priority,
        });
      }
      resetForm();
    } catch (err) {
      console.error("Save task error:", err);
      // ⚠️ ORIGINAL ALERT RESTORED
      alert("Erreur lors de l'enregistrement.");
    }
  };

  const handleToggle = async (task) => {
    try {
      await updateTask(task.id, { completed: !task.completed });
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const handleEdit = (task) => {
    setEditingId(task.id);
    setTitle(task.title || "");
    setDesc(task.description || "");
    setDate(task.date || "");
    setTime(task.time || "");
    setPriority(task.priority || "normal");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    // ⚠️ ORIGINAL CONFIRM RESTORED
    if (!window.confirm("Supprimer cette tâche ?")) return; 
    try {
      await deleteTask(id);
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Form */}
      <form 
        onSubmit={handleAddOrEdit} 
        // 🔑 Form Card Styling
        className={`p-4 rounded-2xl shadow-md mb-6 transition-colors duration-300 ${
          theme === 'dark'
          ? 'bg-gray-800 shadow-2xl ring-1 ring-gray-700'
          : 'bg-white'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          {/* 🔑 Input Styling */}
          <input
            className={`flex-1 px-3 py-2 rounded-lg border outline-none transition-colors duration-300 ${
              theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
              : 'border-gray-300 focus:ring-2 focus:ring-green-300'
            }`}
            placeholder="Titre de la tâche"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {/* 🔑 Select Styling */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className={`px-3 py-2 rounded-lg border outline-none transition-colors duration-300 ${
              theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-gray-100'
              : 'bg-white border-gray-300'
            }`}
            title="Priority"
          >
            <option value="low">Faible</option>
            <option value="normal">Normal</option>
            <option value="high">Important</option>
          </select>
        </div>

        {/* 🔑 Textarea Styling */}
        <textarea
          className={`w-full px-3 py-2 rounded-lg border mb-3 outline-none transition-colors duration-300 ${
            theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-emerald-500'
            : 'border-gray-300 focus:ring-2 focus:ring-green-300'
          }`}
          placeholder="Description (optionnelle)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <div className="flex gap-2 flex-wrap items-center">
          {/* 🔑 Date Input Styling */}
          <input
            type="date"
            className={`px-3 py-2 rounded-lg border outline-none transition-colors duration-300 ${
              theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-gray-100'
              : 'border-gray-300'
            }`}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          {/* 🔑 Time Input Styling */}
          <input
            type="time"
            className={`px-3 py-2 rounded-lg border outline-none transition-colors duration-300 ${
              theme === 'dark'
              ? 'bg-gray-700 border-gray-600 text-gray-100'
              : 'border-gray-300'
            }`}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <div className="ml-auto flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                // 🔑 Cancel Button Styling
                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  theme === 'dark'
                  ? 'bg-gray-600 hover:bg-gray-500 text-gray-100'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                <FaTimes /> Annuler
              </button>
            )}
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              {editingId ? <><FaCheck /> Sauvegarder</> : <><FaPlus /> Ajouter</>}
            </button>
          </div>
        </div>
      </form>

      {/* Summary */}
      <div className="flex items-center justify-between mb-4">
        <div>
          {/* 🔑 Summary Header Text */}
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-emerald-400' : 'text-green-700'}`}>Mes tâches</h3>
          {/* 🔑 Summary Text */}
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{tasks.length} tâches total</p>
        </div>
        <div className="text-right">
          {/* 🔑 Summary Text */}
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Complétées</p>
          {/* 🔑 Summary Count Text */}
          <p className={`text-xl font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-green-700'}`}>
            {tasks.filter((t) => t.completed).length} / {tasks.length}
          </p>
        </div>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              layout
              // 🔑 Task Card Background
              className={`flex justify-between items-start gap-3 p-3 rounded-xl shadow-sm border transition-colors duration-300 ${
                task.completed 
                  ? (theme === 'dark' ? 'bg-emerald-900/50 border-emerald-700' : 'bg-green-50 border-green-100')
                  : (theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(task)}
                    // 🔑 Toggle Button Styling
                    className={`p-2 rounded-md flex items-center justify-center transition ${
                      task.completed 
                        ? 'bg-green-600 text-white' 
                        : (theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-green-50 text-green-700 hover:bg-green-100')
                    }`}
                    title={task.completed ? "Marquer non fait" : "Marquer fait"}
                  >
                    <FaCheck />
                  </button>

                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      {/* 🔑 Task Title Text */}
                      <h4 className={`font-semibold ${task.completed ? 'line-through text-gray-500' : (theme === 'dark' ? 'text-gray-100' : 'text-gray-900')}`}>
                        {task.title}
                      </h4>
                      <span
                        className="text-xs px-2 py-0.5 rounded text-white"
                        style={{
                          background:
                            task.priority === "high" ? "#dc2626" : task.priority === "low" ? "#6b7280" : "#16a34a",
                        }}
                      >
                        {task.priority}
                      </span>
                    </div>
                    {/* 🔑 Task Description Text */}
                    {task.description && (
                      <p className={`text-sm ${task.completed ? 'line-through text-gray-500' : (theme === 'dark' ? 'text-gray-400' : 'text-gray-600')}`}>
                        {task.description}
                      </p>
                    )}
                    {/* 🔑 Task Date/Time Text */}
                    <p className={`text-xs text-gray-500 mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                      {task.date ? task.date : ""} {task.time ? `• ${task.time}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  {/* 🔑 Edit Button Color */}
                  <button onClick={() => handleEdit(task)} className={`transition-colors ${theme === 'dark' ? 'text-emerald-400 hover:text-emerald-300' : 'text-green-600 hover:text-green-800'}`}>
                    <FaEdit />
                  </button>
                  {/* 🔑 Delete Button Color */}
                  <button onClick={() => handleDelete(task.id)} className={`transition-colors ${theme === 'dark' ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}>
                    <FaTrash />
                  </button>
                </div>
                {/* 🔑 Timestamp Text */}
                <small className={`text-xs ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {task.createdAt?.toDate ? task.createdAt.toDate().toLocaleString() : ""}
                </small>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}