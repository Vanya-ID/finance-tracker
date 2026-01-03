import { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export const signInWithGoogle = async (): Promise<User> => {
  try {
    // Проверяем, есть ли уже сессия
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      return session.user
    }

    // Инициируем OAuth вход
    // Формируем правильный redirect URL для GitHub Pages
    const basePath = import.meta.env.BASE_URL || '/'
    // Убираем лишние слеши
    const cleanBasePath = basePath.replace(/\/+$/, '')
    const redirectUrl = `${window.location.origin}${cleanBasePath}/login`
    
    console.log('🔑 [signInWithGoogle] Redirect URL:', redirectUrl)
    console.log('🔑 [signInWithGoogle] Origin:', window.location.origin)
    console.log('🔑 [signInWithGoogle] Base path:', cleanBasePath)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: false,
      },
    })

    if (error) {
      console.error('❌ [signInWithGoogle] Ошибка входа через Google:', error)
      throw error
    }

    // После редиректа пользователь будет авторизован
    // Но здесь мы не можем получить пользователя сразу, так как происходит редирект
    // Поэтому возвращаем null и обрабатываем это в компоненте
    throw new Error('Redirecting to Google...')
  } catch (error: any) {
    if (error.message === 'Redirecting to Google...') {
      throw error
    }
    console.error('❌ [signInWithGoogle] Ошибка входа через Google:', error)
    throw error
  }
}

export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Ошибка выхода:', error)
      throw error
    }
  } catch (error) {
    console.error('Ошибка выхода:', error)
    throw error
  }
}

export const getCurrentUser = (): User | null => {
  // Supabase не предоставляет синхронный метод получения пользователя
  // Используем getSession() через async/await в хуке
  return null
}

export const onAuthStateChanged = (
  callback: (user: User | null) => void
): (() => void) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })

  // Возвращаем функцию для отписки
  return () => {
    subscription.unsubscribe()
  }
}

