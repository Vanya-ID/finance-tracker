import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PlanPage } from './pages/PlanPage'
import { ProfilePage } from './pages/ProfilePage'
import { LoginPage } from './pages/LoginPage'
import { ReportsPage } from './pages/ReportsPage'
import { SavingsStatsPage } from './pages/SavingsStatsPage'
import './App.css'

const App: React.FC = () => {
  // Используем base path из vite.config.ts для GitHub Pages
  const basePath = import.meta.env.BASE_URL || '/finance-tracker/'
  
  // Редиректим с /index.html на корень
  React.useEffect(() => {
    if (window.location.pathname.endsWith('/index.html')) {
      const newPath = window.location.pathname.replace('/index.html', '/')
      window.history.replaceState(null, '', newPath + window.location.search + window.location.hash)
    }
  }, [])
  
  return (
    <BrowserRouter basename={basePath}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/plan" replace />} />
          <Route path="plan" element={<ProtectedRoute><PlanPage /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="savings-stats" element={<ProtectedRoute><SavingsStatsPage /></ProtectedRoute>} />
        </Route>
        {/* Fallback для любых других маршрутов, включая /index.html */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
