import { Outlet } from "react-router-dom";
import AnimatedSidebar from "../components/sidebar";
import { useTheme } from "../context/ThemeContext"; // 🔑 Import useTheme

export default function Home() {
  // 🔑 Get theme state
  const { theme } = useTheme(); 

  return (
    <div className="flex min-h-screen">
      <AnimatedSidebar />
      
      {/* 🔑 Apply conditional background color to the main content area */}
      <div className={`flex-1 ml-[70px] md:ml-[240px] transition-all duration-300 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <Outlet /> {/* This renders whatever child route is active */}
      </div>
    </div>
  );
}