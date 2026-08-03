import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { PlanPage } from './pages/PlanPage'
import { ProfilePage } from './pages/ProfilePage'
import { startAutoSync, sync } from './services/supabaseSyncService'
import './App.css'

const App: React.FC = () => {
  // Используем base path из vite.config.ts для GitHub Pages
  const basePath = import.meta.env.BASE_URL || '/finance-tracker/'
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    const stopAutoSync = startAutoSync()

    sync().finally(() => {
      setBooting(false)
    })

    return stopAutoSync
  }, [])

  if (booting) {
    return (
      <div className="app-boot">
        <p>Загрузка данных…</p>
      </div>
    )
  }

  return (
    <BrowserRouter basename={basePath}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="plan" replace />} />
          <Route path="plan" element={<PlanPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        {/* Fallback для любых других маршрутов */}
        <Route path="*" element={<Navigate to="plan" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
