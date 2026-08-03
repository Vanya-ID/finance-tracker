import React, { useRef, useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { useAppSettings } from '../hooks/useAppSettings'
import { useNotification } from '../contexts/NotificationContext'
import { downloadBackup, uploadBackup } from '../utils/backup'
import { isSupabaseConfigured } from '../services/supabase'
import './ProfilePage.css'

const formatSyncTime = (timestamp: number | null): string => {
  if (!timestamp) {
    return 'ещё не выполнялась'
  }

  return new Date(timestamp).toLocaleString('ru-RU')
}

export const ProfilePage: React.FC = () => {
  const { profile, updateProfile, loading } = useProfile()
  const { user, isAuthenticated, syncState, signIn, signUp, signOut, syncNow } = useAuth()
  const { rulesEnabled, setRulesEnabled } = useAppSettings()
  const { showNotification } = useNotification()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authPending, setAuthPending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile({ firstName: e.target.value })
  }

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateProfile({ lastName: e.target.value })
  }

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthPending(true)

    try {
      if (mode === 'sign-up') {
        const createdUser = await signUp(email, password)
        if (createdUser) {
          showNotification('Аккаунт создан. Если требуется подтверждение — проверьте почту', 'success')
        }
      } else {
        const { changed } = await signIn(email, password)
        showNotification('Вход выполнен', 'success')
        if (changed) {
          window.location.reload()
        }
      }
      setPassword('')
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Не удалось выполнить вход')
    } finally {
      setAuthPending(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      showNotification('Вы вышли из аккаунта. Данные остались на этом устройстве', 'success')
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Ошибка выхода', 'error')
    }
  }

  const handleSyncNow = async () => {
    const { changed } = await syncNow()

    if (changed) {
      showNotification('Данные обновлены с сервера', 'success')
      window.location.reload()
      return
    }

    showNotification('Синхронизация завершена', 'success')
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''

    if (!file) {
      return
    }

    try {
      await uploadBackup(file)
      showNotification('Данные загружены из файла', 'success')
      window.location.reload()
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Ошибка импорта', 'error')
    }
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

      <div className="profile-card">
        <h2 className="profile-title">Настройки плана</h2>
        <label className="setting-toggle">
          <input
            type="checkbox"
            checked={rulesEnabled}
            onChange={(e) => setRulesEnabled(e.target.checked)}
          />
          <span className="setting-toggle-text">
            <span className="setting-toggle-title">Правила распределения</span>
            <span className="setting-toggle-hint">
              Когда выключено, блок правил и рекомендуемые проценты не показываются — суммы задаются вручную
            </span>
          </span>
        </label>
      </div>

      <div className="profile-card">
        <h2 className="profile-title">Синхронизация</h2>

        {!isSupabaseConfigured ? (
          <p className="sync-hint">
            Синхронизация не настроена: не заданы ключи Supabase. Приложение работает локально,
            перенести данные можно через резервную копию ниже.
          </p>
        ) : isAuthenticated ? (
          <div className="sync-section">
            <p className="sync-account">
              Вход выполнен: <strong>{user?.email}</strong>
            </p>
            <p className="sync-meta">Последняя синхронизация: {formatSyncTime(syncState.lastSyncAt)}</p>
            {syncState.error && <p className="sync-error">{syncState.error}</p>}
            <div className="sync-actions">
              <button
                type="button"
                className="profile-button"
                onClick={handleSyncNow}
                disabled={syncState.status === 'syncing'}
              >
                {syncState.status === 'syncing' ? 'Синхронизация…' : 'Синхронизировать сейчас'}
              </button>
              <button type="button" className="profile-button secondary" onClick={handleSignOut}>
                Выйти
              </button>
            </div>
          </div>
        ) : (
          <form className="sync-section" onSubmit={handleAuthSubmit}>
            <p className="sync-hint">
              Войдите одним и тем же аккаунтом на компьютере и на телефоне — данные будут синхронизироваться.
              Без входа приложение работает локально на этом устройстве.
            </p>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="profile-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                minLength={6}
                required
                className="profile-input"
              />
            </div>
            {authError && <p className="sync-error">{authError}</p>}
            <div className="sync-actions">
              <button type="submit" className="profile-button" disabled={authPending}>
                {mode === 'sign-up' ? 'Зарегистрироваться' : 'Войти'}
              </button>
              <button
                type="button"
                className="profile-button secondary"
                onClick={() => {
                  setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')
                  setAuthError(null)
                }}
              >
                {mode === 'sign-up' ? 'У меня уже есть аккаунт' : 'Создать аккаунт'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="profile-card">
        <h2 className="profile-title">Резервная копия</h2>
        <p className="sync-hint">
          Выгрузите все данные в файл или восстановите их из ранее сохранённого файла.
          Импорт заменяет данные на этом устройстве.
        </p>
        <div className="sync-actions">
          <button type="button" className="profile-button" onClick={downloadBackup}>
            Скачать файл
          </button>
          <button type="button" className="profile-button secondary" onClick={handleImportClick}>
            Загрузить из файла
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileSelected}
            hidden
          />
        </div>
      </div>
    </div>
  )
}
