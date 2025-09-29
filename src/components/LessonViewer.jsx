// src/pages/LessonViewer.jsx
import React, { useEffect } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

export default function LessonViewer({ lesson, goBack }) {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  // 🔒 Disable right-click (copy/download prevention)
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);

    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  return (
    <div className="p-6">
      <button
        className="mb-4 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
        onClick={goBack}
      >
        🔙 Retour aux leçons
      </button>

      <h1 className="text-2xl font-bold mb-4 text-center">{lesson.title}</h1>
      <p className="text-gray-600 mb-4 text-center">{lesson.description}</p>

      {/* ✅ PDF viewer */}
      {lesson.fileUrl && lesson.fileType?.includes("pdf") && (
        <div className="border rounded shadow-lg w-full h-[80vh]">
          <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
            <Viewer
              fileUrl={lesson.fileUrl}
              plugins={[defaultLayoutPluginInstance]}
            />
          </Worker>
        </div>
      )}

      {/* Non-PDF files */}
      {lesson.fileUrl && !lesson.fileType?.includes("pdf") && (
        <p className="text-center text-blue-600 underline">
          Fichier non-PDF (pas encore pris en charge)
        </p>
      )}
    </div>
  );
}
