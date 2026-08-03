import React from 'react'
import { NavLink } from 'react-router-dom'
import './Navigation.css'

export const Navigation: React.FC = () => {
  return (
    <nav className="navigation">
      <NavLink to="/plan" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        План
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
        Профиль
      </NavLink>
    </nav>
  )
}
