import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import './LoginPage.css'

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Если пользователь уже авторизован, перенаправляем на главную
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log('✅ [LoginPage] Пользователь авторизован, перенаправляем на /plan')
      navigate('/plan', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔐 [LoginPage] Начинаем вход через Google...')
      const user = await login()
      // Если пользователь вернулся после редиректа, navigate уже произойдет автоматически
      // Если пользователь уже был авторизован, переходим на план
      if (user) {
        console.log('✅ [LoginPage] Пользователь получен, переходим на /plan')
        navigate('/plan')
      }
      // Если произошел редирект на Google, просто ждем возврата
    } catch (err: any) {
      // Игнорируем ошибку редиректа - это нормально
      if (err.message !== 'Redirecting to Google...') {
        console.error('❌ [LoginPage] Ошибка входа:', err)
        setError(err.message || 'Ошибка входа. Попробуйте еще раз.')
      } else {
        console.log('🔄 [LoginPage] Редирект на Google...')
      }
    } finally {
      setLoading(false)
    }
  }

  // Показываем загрузку, пока проверяем авторизацию
  if (authLoading) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h1>💰 Учет доходов и расходов</h1>
            <p>Проверка авторизации...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>💰 Учет доходов и расходов</h1>
          <p>Войдите, чтобы продолжить</p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <button
          className="login-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Вход...' : 'Войти через Google'}
        </button>
      </div>
    </div>
  )
}

