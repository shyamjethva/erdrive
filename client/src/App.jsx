import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Trash from './pages/Trash';
import Shared from './pages/Shared';
import Starred from './pages/Starred';
import Recents from './pages/Recents';
import Spam from './pages/Spam';
import Storage from './pages/Storage';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/shared" element={<Shared />} />
                <Route path="/starred" element={<Starred />} />
                <Route path="/trash" element={<Trash />} />
                <Route path="/recents" element={<Recents />} />
                <Route path="/spam" element={<Spam />} />
                <Route path="/storage" element={<Storage />} />
                <Route path="/profile" element={<Profile />} />

                <Route element={<ProtectedRoute adminOnly={true} />}>
                  <Route path="/admin" element={<AdminPanel />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
