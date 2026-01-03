import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { signInWithGoogle, signOut, onAuthStateChanged } from '../services/supabaseAuthService'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Обрабатываем редирект после OAuth
    const handleAuthRedirect = async () => {
      const { supabase } = await import('../services/supabase')

      console.log('🔍 [useAuth] Проверка авторизации...')
      console.log('📍 [useAuth] URL:', window.location.href)
      console.log('📍 [useAuth] Pathname:', window.location.pathname)
      console.log('📍 [useAuth] Hash:', window.location.hash)
      console.log('📍 [useAuth] Search:', window.location.search)

      // Проверяем, есть ли code в query параметрах (PKCE OAuth редирект от Supabase)
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      // Если есть ошибка в URL, логируем её
      if (error) {
        console.error('❌ [useAuth] OAuth ошибка в URL:', {
          error,
          error_description: errorDescription
        })
      }

      // Обрабатываем PKCE code
      if (code) {
        console.log('✅ [useAuth] Найден OAuth code в query параметрах')
        console.log('🔄 [useAuth] Обмениваем code на сессию...')
        try {
          const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

          if (exchangeError) {
            console.error('❌ [useAuth] Ошибка обмена кода:', exchangeError)
            setUser(null)
            setLoading(false)
            return
          }

          if (session?.user) {
            console.log('✅ [useAuth] Сессия успешно получена!')
            console.log('👤 [useAuth] Пользователь:', session.user.email)
            console.log('🔑 [useAuth] Access token:', session.access_token ? 'присутствует' : 'отсутствует')

            if (mounted) {
              setUser(session.user)
              setLoading(false)
            }

            // Очищаем query параметры из URL
            const cleanUrl = window.location.pathname
            window.history.replaceState(null, '', cleanUrl)
            console.log('🧹 [useAuth] URL очищен:', cleanUrl)
            return
          }
        } catch (err) {
          console.error('❌ [useAuth] Исключение при обмене кода:', err)
          setUser(null)
          setLoading(false)
          return
        }
      }

      // Проверяем, есть ли hash параметры в URL (legacy implicit flow)
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('✅ [useAuth] Найден access_token в hash (implicit flow)')
        // Ждем, пока Supabase обработает hash через detectSessionInUrl
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // Получаем текущую сессию из localStorage
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('❌ [useAuth] Ошибка получения сессии:', sessionError)
      } else {
        console.log('📦 [useAuth] Проверка сессии:', session ? 'найдена' : 'не найдена')
        if (session?.user) {
          console.log('👤 [useAuth] Пользователь:', session.user.email)
          console.log('🔑 [useAuth] Expires at:', new Date(session.expires_at! * 1000).toLocaleString())
        }
      }

      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }

      // Очищаем hash из URL после обработки (если сессия найдена)
      if (window.location.hash && session?.user) {
        const cleanUrl = window.location.pathname + window.location.search
        window.history.replaceState(null, '', cleanUrl)
        console.log('🧹 [useAuth] Hash очищен из URL')
      }
    }

    handleAuthRedirect()

    // Подписываемся на изменения состояния авторизации
    const unsubscribe = onAuthStateChanged((user) => {
      console.log('🔄 [useAuth] Изменение состояния авторизации:', user ? `авторизован (${user.email})` : 'не авторизован')
      if (mounted) {
        setUser(user)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const login = async () => {
    try {
      setLoading(true)
      // signInWithGoogle может выбросить ошибку редиректа
      // Это нормально - пользователь будет перенаправлен на Google
      await signInWithGoogle()
      // Если дошли сюда, значит пользователь уже был авторизован
      const { data: { session } } = await import('../services/supabase').then(m => m.supabase.auth.getSession())
      if (session?.user) {
        setUser(session.user)
        return session.user
      }
      // Если редирект произошел, пользователь вернется на страницу после авторизации
      return null
    } catch (error: any) {
      // Если это ошибка редиректа, это нормально
      if (error.message === 'Redirecting to Google...') {
        // Редирект произойдет, пользователь вернется после авторизации
        return null
      }
      console.error('Ошибка входа:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setLoading(true)
      await signOut()
      setUser(null)
    } catch (error) {
      console.error('Ошибка выхода:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }
}

