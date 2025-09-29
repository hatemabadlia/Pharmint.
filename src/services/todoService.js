// src/services/todoService.js
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase/config";

/**
 * Real-time subscription to current user's tasks.
 * callback receives array of tasks (most recent first).
 * Returns unsubscribe function.
 */
export const subscribeToUserTasks = (callback) => {
  const user = auth.currentUser;
  if (!user) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, "tasks"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const unsub = onSnapshot(
    q,
    (snap) => {
      const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(tasks);
    },
    (err) => {
      console.error("tasks onSnapshot error:", err);
      callback([]);
    }
  );

  return unsub;
};

export const addTask = async ({ title, description = "", date, time, priority = "normal" }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  // store 'date' as yyyy-MM-dd string if provided, else server will set created date
  const payload = {
    userId: user.uid,
    title,
    description,
    date: date || null, // keep null if not set
    time: time || "",
    priority: priority || "normal",
    completed: false,
    createdAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "tasks"), payload);
  return ref.id;
};

export const updateTask = async (taskId, updates) => {
  await updateDoc(doc(db, "tasks", taskId), updates);
};

export const deleteTask = async (taskId) => {
  await deleteDoc(doc(db, "tasks", taskId));
};
