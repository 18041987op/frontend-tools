import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ToolManagement from './pages/ToolManagement';
import ToolDetail from './pages/ToolDetail';
import MaintenanceTools from './pages/MaintenanceTools'; 

import './App.css';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import MyTools from './pages/MyTools';

// Importar API y configurar la URL del backend
import api from './services/api';

// Asegurar que la API usa la URL correcta
api.defaults.baseURL = 'https://tools-autorx.onrender.com/api';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Componente para rutas de administración
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/catalog" element={
          <ProtectedRoute>
            <Catalog />
          </ProtectedRoute>
        } />
        <Route path="/my-tools" element={
          <ProtectedRoute>
            <MyTools />
          </ProtectedRoute>
        } />
        <Route path="/admin/tools" element={
          <AdminRoute>
            <ToolManagement />
          </AdminRoute>
        } />
        <Route path="/admin/maintenance" element={
          <AdminRoute>
            <MaintenanceTools />
          </AdminRoute>
        } />
        <Route path="/tools/:id" element={
          <ProtectedRoute>
            <ToolDetail />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
