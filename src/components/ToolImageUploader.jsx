// src/components/ToolImageUploader.jsx
// Componente reutilizable para subir una imagen y actualizar la herramienta en el backend.

import React, { useState } from "react";
import { uploadToolImage } from "../services/storage";

const MAX_MB = 5;

// Utiliza REACT_APP_API_BASE_URL o, si no está, intenta deducir host actual
const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (window.location.origin.includes("localhost")
    ? "http://localhost:5000/api"
    : `${window.location.origin.replace(/\/$/, "")}/api`);

export default function ToolImageUploader({ toolId, onSaved }) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecciona una imagen (jpg/png).");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`La imagen no debe superar ${MAX_MB}MB.`);
      return;
    }

    try {
      setUploading(true);
      setProgress(0);

      // Subir a Firebase Storage
      // (Subida sin barra de progreso granular en este comp; simple y confiable)
      const url = await uploadToolImage(file, toolId);
      setProgress(100);

      // Guardar URL en el backend (campo "image")
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/tools/${toolId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : undefined
        },
        body: JSON.stringify({ image: url })
      });

      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || "No se pudo actualizar la herramienta");
      }

      onSaved?.(url);
      setUploading(false);
    } catch (e) {
      console.error(e);
      setError(e?.message || "Error subiendo la imagen");
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Subir/Actualizar imagen
      </label>
      <input
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="block w-full text-sm text-gray-700"
      />
      {uploading && <div>Subiendo… {progress}%</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}
