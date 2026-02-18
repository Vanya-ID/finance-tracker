import React from 'react'
import { NavLink } from 'react-router-dom'
import './Navigation.css'

export const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <NavLink to="/plan" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        План
      </NavLink>
      <NavLink to="/transactions" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        Транзакции
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
    </nav>
  )
}

