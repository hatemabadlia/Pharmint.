// src/components/TodoList.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import { subscribeToUserTasks, addTask, updateTask, deleteTask } from "../services/todoService";
import { format } from "date-fns";

export default function TodoList({ onTasksChange }) {
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
      <form onSubmit={handleAddOrEdit} className="bg-white p-4 rounded-2xl shadow-md mb-6">
        <div className="flex items-center gap-3 mb-3">
          <input
            className="flex-1 px-3 py-2 rounded-lg border focus:ring-2 focus:ring-green-300"
            placeholder="Titre de la tâche"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3 py-2 rounded-lg border bg-white"
            title="Priority"
          >
            <option value="low">Faible</option>
            <option value="normal">Normal</option>
            <option value="high">Important</option>
          </select>
        </div>

        <textarea
          className="w-full px-3 py-2 rounded-lg border mb-3 focus:ring-2 focus:ring-green-300"
          placeholder="Description (optionnelle)"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <div className="flex gap-2 flex-wrap items-center">
          <input
            type="date"
            className="px-3 py-2 rounded-lg border"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            type="time"
            className="px-3 py-2 rounded-lg border"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <div className="ml-auto flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-100 px-3 py-2 rounded-lg flex items-center gap-2"
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
          <h3 className="text-lg font-semibold text-green-700">Mes tâches</h3>
          <p className="text-sm text-gray-600">{tasks.length} tâches total</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Complétées</p>
          <p className="text-xl font-bold text-green-700">
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
              className={`flex justify-between items-start gap-3 p-3 rounded-xl shadow-sm ${
                task.completed ? "bg-green-50 border border-green-100" : "bg-white border"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(task)}
                    className={`p-2 rounded-md flex items-center justify-center transition ${
                      task.completed ? "bg-green-600 text-white" : "bg-green-50 text-green-700"
                    }`}
                    title={task.completed ? "Marquer non fait" : "Marquer fait"}
                  >
                    <FaCheck />
                  </button>

                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <h4 className={`font-semibold ${task.completed ? "line-through text-gray-400" : ""}`}>
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
                    {task.description && (
                      <p className={`text-sm ${task.completed ? "line-through text-gray-400" : "text-gray-600"}`}>
                        {task.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {task.date ? task.date : ""} {task.time ? `• ${task.time}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(task)} className="text-green-600 hover:text-green-800">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(task.id)} className="text-red-500 hover:text-red-700">
                    <FaTrash />
                  </button>
                </div>
                <small className="text-xs text-gray-400">
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
