import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Navigation.css'

export const Navigation: React.FC = () => {
  const navigate = useNavigate()
  const { logout, isAuthenticated } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Ошибка выхода:', error)
    }
  }

  return (
    <nav className="navigation">
      <NavLink to="/plan" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        План
      </NavLink>
      <NavLink to="/reports" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        Отчеты
      </NavLink>
      <NavLink to="/savings-stats" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        Копилки
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        Профиль
      </NavLink>
      {isAuthenticated && (
        <button onClick={handleLogout} className="logout-btn">
          Выйти
        </button>
      )}
    </nav>
  )
}

