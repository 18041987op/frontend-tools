// src/components/TechnicianSelector.js (versión corregida)
import React, { useState, useEffect, useCallback } from 'react';
import { getTechnicians } from '../services/api';

const TechnicianSelector = ({ onSelect, currentTechnicianId, label = "Técnico Destino" }) => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');

  // Memoizar la función de selección para evitar recreaciones
  const handleInitialSelection = useCallback((techId) => {
    onSelect(techId);
  }, [onSelect]);

  useEffect(() => {
    const fetchTechnicians = async () => {
      try {
        setLoading(true);
        const response = await getTechnicians();
        
        // Filtrar para no mostrar el técnico actual en la lista
        const filteredTechnicians = response.data.filter(
          tech => tech._id !== currentTechnicianId
        );
        
        setTechnicians(filteredTechnicians);
        
        // Si hay técnicos, seleccionar el primero por defecto, pero solo una vez
        if (filteredTechnicians.length > 0 && !selectedTechnician) {
          setSelectedTechnician(filteredTechnicians[0]._id);
          handleInitialSelection(filteredTechnicians[0]._id);
        }
        
      } catch (err) {
        setError('Error al cargar la lista de técnicos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, [currentTechnicianId, handleInitialSelection, selectedTechnician]); // Dependencias corregidas

  const handleChange = (e) => {
    const techId = e.target.value;
    setSelectedTechnician(techId);
    onSelect(techId);
  };

  if (loading) {
    return <div className="text-gray-500">Cargando técnicos...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (technicians.length === 0) {
    return <div className="text-amber-500">No hay otros técnicos disponibles para transferencia</div>;
  }

  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="technicianSelect">
        {label} *
      </label>
      <select
        id="technicianSelect"
        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        value={selectedTechnician}
        onChange={handleChange}
        required
      >
        {technicians.map(tech => (
          <option key={tech._id} value={tech._id}>
            {tech.name} ({tech.email})
          </option>
        ))}
      </select>
    </div>
  );
};

export default TechnicianSelector;