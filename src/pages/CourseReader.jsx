// src/pages/CourseReader.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

export default function CourseReader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { pdfUrl, title } = location.state || {};

  if (!pdfUrl) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Aucun document trouvé</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">
          Retour
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">{title}</h1>

      <div 
        className="border rounded shadow-lg overflow-hidden"
        style={{ userSelect: "none" }} // bloque la sélection de texte
        onContextMenu={(e) => e.preventDefault()} // bloque clic droit
      >
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.8.162/build/pdf.worker.min.js">
          <Viewer fileUrl={pdfUrl} />
        </Worker>
      </div>

      <div className="text-center mt-4">
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-blue-600 text-white rounded">
          Retour aux cours
        </button>
      </div>
    </div>
  );
}
