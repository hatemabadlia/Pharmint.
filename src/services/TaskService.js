import { db } from '../firebase/config';
import { collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

// Subscribe to tasks in real time
export const subscribeToTasks = (callback) => {
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(tasks);
  });
};

export const addTask = async (task) => {
  await addDoc(collection(db, 'tasks'), {
    ...task,
    createdAt: new Date()
  });
};

export const updateTask = async (id, updates) => {
  await updateDoc(doc(db, 'tasks', id), updates);
};

export const deleteTask = async (id) => {
  await deleteDoc(doc(db, 'tasks', id));
};
