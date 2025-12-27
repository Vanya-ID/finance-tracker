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
      console.log('📍 [useAuth] Hash:', window.location.hash)
      console.log('📍 [useAuth] Search:', window.location.search)

      // Проверяем, есть ли code в query параметрах (OAuth редирект от Supabase)
      const searchParams = new URLSearchParams(window.location.search)
      const code = searchParams.get('code')

      if (code) {
        console.log('✅ [useAuth] Найден OAuth code в query параметрах, обмениваем на сессию...')
        try {
          const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error('❌ [useAuth] Ошибка обмена кода:', error)
          } else if (session) {
            console.log('✅ [useAuth] Сессия получена после обмена кода')
            // Очищаем query параметры
            const basePath = import.meta.env.BASE_URL || '/finance-tracker/'
            window.history.replaceState(null, '', basePath + 'login')
          }
        } catch (err) {
          console.error('❌ [useAuth] Ошибка при обмене кода:', err)
        }
      }

      // Проверяем, есть ли hash параметры в URL (Supabase использует их для OAuth)
      if (window.location.hash) {
        console.log('✅ [useAuth] Найден hash в URL, обрабатываем OAuth редирект...')
        // Supabase автоматически обработает hash параметры через detectSessionInUrl
        // Ждем немного, чтобы Supabase успел обработать сессию
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Получаем текущую сессию
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('❌ [useAuth] Ошибка получения сессии:', error)
      } else {
        console.log('📦 [useAuth] Сессия:', session ? 'найдена' : 'не найдена')
        if (session?.user) {
          console.log('👤 [useAuth] Пользователь:', session.user.email)
        }
      }

      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }

      // Очищаем hash из URL после обработки (но только если сессия найдена)
      if (window.location.hash && session?.user) {
        const cleanUrl = window.location.pathname + window.location.search
        window.history.replaceState(null, '', cleanUrl)
        console.log('🧹 [useAuth] URL очищен:', cleanUrl)
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

