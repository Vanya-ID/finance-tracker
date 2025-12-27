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
    // Редиректим на /login, чтобы LoginPage мог обработать OAuth редирект
    // Учитываем base path для GitHub Pages
    const basePath = import.meta.env.BASE_URL || '/finance-tracker/'
    const redirectPath = basePath.endsWith('/') ? basePath.slice(0, -1) + '/login' : basePath + '/login'
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`,
      },
    })

    if (error) {
      console.error('Ошибка входа через Google:', error)
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
    console.error('Ошибка входа через Google:', error)
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

