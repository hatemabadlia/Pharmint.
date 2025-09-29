import { useEffect, useState } from 'react';
import { subscribeToUserTasks } from '../services/todoService';
import TodoList from '../components/TodoList';
import TodoStats from '../components/TodoStats';

export default function TodoPage() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToUserTasks(setTasks);
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-4">
        <TodoList tasks={tasks} />
      <TodoStats tasks={tasks} />
      
    </div>
  );
}
