import React from 'react'
import { Notification } from '../contexts/NotificationContext'
import './Toast.css'

interface ToastProps {
  notification: Notification
  onClose: () => void
}

export const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      case 'info':
      default:
        return 'ℹ'
    }
  }

  return (
    <div className={`toast toast-${notification.type}`} onClick={onClose}>
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{notification.message}</span>
      <button className="toast-close" onClick={(e) => { e.stopPropagation(); onClose() }} aria-label="Закрыть">
        ×
      </button>
    </div>
  )
}

interface ToastContainerProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null

  return (
    <div className="toast-container">
      {notifications.map((notification) => (
        <Toast key={notification.id} notification={notification} onClose={() => onRemove(notification.id)} />
      ))}
    </div>
  )
}

