import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ToolManagement from './pages/ToolManagement';
import ToolDetail from './pages/ToolDetail';
import MaintenanceTools from './pages/MaintenanceTools'; 
import UserManagement from './pages/UserManagement'; // NUEVO: Importar la nueva página
import BorrowedTools from './pages/BorrowedTools'; // <-- NUEVO: Importar
import ActivateAccount from './pages/ActivateAccount';
import EditUser from './pages/EditUser'; // <--  Importar página de edición
import EditTool from './pages/EditTool'; // <--  Importar página de edición de herramienta
import AdminReports from './pages/AdminReports'; // <-- AÑADIR IMPORTACIÓN


import './App.css';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardAdmin from './pages/DashboardAdmin';
import Catalog from './pages/Catalog';
import MyTools from './pages/MyTools';

// Importar API y configurar la URL del backend
import api from './services/api';

// Asegurar que la API usa la URL correcta
api.defaults.baseURL = 'https://tools-autorx.onrender.com/api'; //ESTA LINEA DEBE DE DESCOMENTARSE PARA PRODUCCION

//api.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api'; // ESTA LINEA TIENE QUE COMENTARSE PARA USAR EN PRODUCCION


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
        <Route path="/activate/:userId/:token" element={<ActivateAccount />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {
                JSON.parse(localStorage.getItem('user') || '{}').role === 'admin'
                  ? <DashboardAdmin />
                  : <Dashboard />
              }
            </ProtectedRoute>
          }
        />
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
        {/* NUEVO: Ruta para la gestión de usuarios */}
        <Route path="/admin/users" element={
          <AdminRoute>
            <UserManagement />
          </AdminRoute>
        } />
        <Route path="/admin/borrowed-tools" element={ <AdminRoute> <BorrowedTools /> </AdminRoute> } />
        <Route path="/tools/:id" element={
          <ProtectedRoute>
            <ToolDetail />
          </ProtectedRoute>
        } />
        {/* NUEVO: Ruta para editar usuario */}
        <Route path="/admin/users/:id/edit" element={ <AdminRoute> <EditUser /> </AdminRoute> } />
        {/* NUEVO: Ruta para editar herramienta */}
        <Route path="/admin/tools/:id/edit" element={<AdminRoute><EditTool /></AdminRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
        {/* NUEVA RUTA PARA REPORTES */}
        <Route path="/admin/reports" element={ <AdminRoute> <AdminReports /> </AdminRoute> } />
        {/* FIN NUEVA RUTA */}

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;
