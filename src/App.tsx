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
  
  // Обрабатываем редирект с 404.html
  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const redirectPath = searchParams.get('p')
    
    if (redirectPath) {
      // Удаляем параметр p из URL
      searchParams.delete('p')
      const remainingParams = searchParams.toString()
      const newSearch = remainingParams ? '?' + remainingParams : ''
      const newUrl = redirectPath + newSearch + window.location.hash
      
      console.log('[App] 404 redirect detected, restoring path:', newUrl)
      window.history.replaceState(null, '', newUrl)
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
        {/* Fallback для любых других маршрутов */}
        <Route path="*" element={<Navigate to="/plan" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
