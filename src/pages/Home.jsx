import { Outlet } from "react-router-dom";
import AnimatedSidebar from "../components/sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen">
      <AnimatedSidebar />
      <div className="flex-1 ml-[70px] md:ml-[240px] transition-all duration-300 bg-gray-50">
        <Outlet /> {/* This renders whatever child route is active */}
      </div>
    </div>
  );
}
