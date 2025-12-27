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
      // Очищаем hash параметры из URL перед редиректом
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname)
      }
      navigate('/plan', { replace: true })
    }
  }, [isAuthenticated, authLoading, navigate])
  
  // Обрабатываем редирект после OAuth и ошибки
  useEffect(() => {
    const checkAuthAfterRedirect = async () => {
      // Проверяем, есть ли hash параметры (OAuth редирект)
      if (window.location.hash) {
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)
        
        // Проверяем на ошибки
        if (params.get('error')) {
          const errorCode = params.get('error_code')
          const errorDesc = params.get('error_description')
          console.error('❌ OAuth ошибка:', {
            error: params.get('error'),
            error_code: errorCode,
            error_description: errorDesc
          })
          
          // Показываем понятное сообщение об ошибке
          if (errorCode === 'unexpected_failure' && errorDesc?.includes('Unable+to+exchange+external+code')) {
            setError('Ошибка авторизации: проверьте настройки Google OAuth в Supabase. Убедитесь, что Client ID и Client Secret правильные.')
          } else {
            setError(`Ошибка авторизации: ${params.get('error')}`)
          }
          
          // Очищаем URL от ошибок
          window.history.replaceState(null, '', '/login')
          return
        }
        
        // Если есть access_token, значит успешная авторизация
        if (hash.includes('access_token')) {
          console.log('🔄 Обнаружен OAuth редирект, проверяем сессию...')
          // Ждем, пока Supabase обработает сессию
          await new Promise(resolve => setTimeout(resolve, 1000))
          // Проверяем авторизацию снова
          const { supabase } = await import('../services/supabase')
          const { data: { session } } = await supabase.auth.getSession()
          console.log('📦 Сессия после редиректа:', session ? 'найдена' : 'не найдена')
          if (session?.user) {
            console.log('✅ Пользователь авторизован, перенаправляем на /plan')
            // Очищаем hash и редиректим
            window.history.replaceState(null, '', '/plan')
            navigate('/plan', { replace: true })
          } else {
            console.log('❌ Сессия не найдена после редиректа')
          }
        }
      }
    }
    
    checkAuthAfterRedirect()
  }, [navigate])

  const handleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      const user = await login()
      // Если пользователь вернулся после редиректа, navigate уже произойдет автоматически
      // Если пользователь уже был авторизован, переходим на план
      if (user) {
        navigate('/plan')
      }
      // Если произошел редирект на Google, просто ждем возврата
    } catch (err: any) {
      // Игнорируем ошибку редиректа - это нормально
      if (err.message !== 'Redirecting to Google...') {
        setError(err.message || 'Ошибка входа. Попробуйте еще раз.')
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

