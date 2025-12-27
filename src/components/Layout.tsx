import React from 'react'
import { Outlet } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useNotification } from '../contexts/NotificationContext'
import { Navigation } from './Navigation'
import { ToastContainer } from './Toast'
import './Layout.css'

export const Layout: React.FC = () => {
  const { theme, toggleTheme } = useTheme()
  const { notifications, removeNotification } = useNotification()

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1>💰 Учет доходов и расходов</h1>
            <p className="app-subtitle">Умное управление финансами с автоматическим распределением</p>
          </div>
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Переключить тему">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <div className="app-content">
        <Navigation />
        <Outlet />
      </div>
      <ToastContainer notifications={notifications} onRemove={removeNotification} />
    </div>
  )
}

