import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNotification } from '../contexts/NotificationContext'
import { isSupabaseConfigured } from '../services/supabase'
import './SyncButton.css'

export const SyncButton: React.FC = () => {
  const { isAuthenticated, syncState, syncNow } = useAuth()
  const { showNotification } = useNotification()

  if (!isSupabaseConfigured || !isAuthenticated) {
    return null
  }

  const isSyncing = syncState.status === 'syncing'
  const hasError = syncState.status === 'error'

  const handleClick = async () => {
    const { changed } = await syncNow()

    if (changed) {
      showNotification('Данные обновлены с сервера', 'success')
      window.location.reload()
      return
    }

    showNotification('Синхронизация завершена', 'success')
  }

  return (
    <button
      onClick={handleClick}
      disabled={isSyncing}
      className={`sync-button ${isSyncing ? 'syncing' : ''} ${hasError ? 'error' : ''}`}
      aria-label="Синхронизировать данные"
      title={hasError ? syncState.error ?? 'Ошибка синхронизации' : 'Синхронизировать данные'}
    >
      {hasError ? '⚠️' : '🔄'}
    </button>
  )
}
