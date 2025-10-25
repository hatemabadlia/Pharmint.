import React, { useMemo } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme

export default function TodoStats({ tasks = [] }) {
  // 🔑 Get theme state
  const { theme } = useTheme(); 

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
  
  // 💡 --- Chart Style Definitions ---
  // Define colors for charts based on theme
  const axisStrokeColor = theme === 'dark' ? '#9ca3af' : '#6b7280'; // gray-400 / gray-500
  const tooltipBg = theme === 'dark' ? '#1f2937' : '#ffffff'; // gray-800 / white
  const tooltipColor = theme === 'dark' ? '#f9fafb' : '#1f2937'; // gray-100 / gray-800
  // ------------------------------------

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {/* 🔑 Progress Card */}
      <div className={`rounded-2xl p-4 shadow-md flex items-center justify-between transition-colors ${
        theme === 'dark' ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white'
      }`}>
        <div>
          {/* 🔑 Text */}
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-emerald-400' : 'text-green-700'}`}>Progress</h3>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tâches complétées</p>
        </div>
        <div className="text-right">
          {/* 🔑 Text */}
          <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-green-700'}`}>{totals.done}/{totals.total}</p>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{totals.percent}%</p>
        </div>
      </div>

      {/* 🔑 Weekly Chart Card */}
      <div className={`rounded-2xl p-4 shadow-md transition-colors ${
        theme === 'dark' ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white'
      }`}>
        {/* 🔑 Text */}
        <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-emerald-400' : 'text-green-700'}`}>Weekly Completed</h4>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={weeklyData}>
              {/* 🔑 Chart Axis & Tooltip Styling */}
              <XAxis dataKey="name" stroke={axisStrokeColor} />
              <YAxis allowDecimals={false} stroke={axisStrokeColor} />
              <Tooltip 
                contentStyle={{ 
                  background: tooltipBg, 
                  border: 'none', 
                  borderRadius: '0.5rem', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                }} 
                labelStyle={{ color: tooltipColor, fontWeight: 'bold' }} 
              />
              <Bar dataKey="completed" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 🔑 Monthly Chart Card */}
      <div className={`rounded-2xl p-4 shadow-md transition-colors ${
        theme === 'dark' ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white'
      }`}>
        {/* 🔑 Text */}
        <h4 className={`font-semibold mb-2 ${theme === 'dark' ? 'text-emerald-400' : 'text-green-700'}`}>Monthly Completed (last months)</h4>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={monthlyData}>
              {/* 🔑 Chart Axis & Tooltip Styling */}
              <XAxis dataKey="name" stroke={axisStrokeColor} />
              <YAxis allowDecimals={false} stroke={axisStrokeColor} />
              <Tooltip 
                contentStyle={{ 
                  background: tooltipBg, 
                  border: 'none', 
                  borderRadius: '0.5rem', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                }} 
                labelStyle={{ color: tooltipColor, fontWeight: 'bold' }} 
              />
              <Bar dataKey="completed" fill="#059669" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}