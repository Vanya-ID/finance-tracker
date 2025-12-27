import React from 'react'
import { useProfile } from '../hooks/useProfile'
import './ProfilePage.css'

export const ProfilePage: React.FC = () => {
  const { profile, updateProfile, loading } = useProfile()

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile({ firstName: e.target.value })
  }

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile({ lastName: e.target.value })
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p>Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2 className="profile-title">Профиль</h2>
        <div className="profile-form">
          <div className="form-group">
            <label htmlFor="firstName">Имя</label>
            <input
              id="firstName"
              type="text"
              value={profile.firstName}
              onChange={handleFirstNameChange}
              placeholder="Введите имя"
              className="profile-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Фамилия</label>
            <input
              id="lastName"
              type="text"
              value={profile.lastName}
              onChange={handleLastNameChange}
              placeholder="Введите фамилию"
              className="profile-input"
            />
          </div>
          {(profile.firstName || profile.lastName) && (
            <div className="profile-greeting">
              Привет, {profile.firstName} {profile.lastName}! 👋
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

