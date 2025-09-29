// src/components/TodoStats.jsx
import React, { useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function TodoStats({ tasks = [] }) {
  // overall
  const totals = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.completed).length;
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }, [tasks]);

  // weekly (Mon-Sun)
  const weeklyData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });
    return days.map((day) => {
      const key = format(day, "yyyy-MM-dd");
      const completed = tasks.filter((t) => t.completed && t.date === key).length;
      return { name: format(day, "EEE"), completed };
    });
  }, [tasks]);

  // monthly: completed count per month (string yyyy-MM)
  const monthlyData = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      const key = t.date ? t.date.slice(0, 7) : null; // 'yyyy-MM'
      if (!key) return;
      map[key] = map[key] || { month: key, completed: 0, total: 0 };
      map[key].total += 1;
      if (t.completed) map[key].completed += 1;
    });
    const arr = Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
    return arr.slice(-6).map((m) => ({ name: m.month, completed: m.completed }));
  }, [tasks]);

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-green-700">Progress</h3>
          <p className="text-sm text-gray-600">Tâches complétées</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-700">{totals.done}/{totals.total}</p>
          <p className="text-sm text-gray-500">{totals.percent}%</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow">
        <h4 className="font-semibold text-green-700 mb-2">Weekly Completed</h4>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={weeklyData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="completed" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow">
        <h4 className="font-semibold text-green-700 mb-2">Monthly Completed (last months)</h4>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="completed" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
