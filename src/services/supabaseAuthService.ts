import { SupabaseClient, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

const requireClient = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Синхронизация не настроена: не заданы ключи Supabase')
  }

  return supabase
}

const translateAuthError = (message: string): string => {
  if (/Invalid login credentials/i.test(message)) {
    return 'Неверный email или пароль'
  }
  if (/User already registered/i.test(message)) {
    return 'Пользователь с таким email уже зарегистрирован'
  }
  if (/Password should be at least/i.test(message)) {
    return 'Пароль должен быть не короче 6 символов'
  }
  if (/Email not confirmed/i.test(message)) {
    return 'Email не подтверждён — проверьте почту'
  }
  if (/Failed to fetch|NetworkError/i.test(message)) {
    return 'Сервер недоступен (возможно, проект Supabase на паузе)'
  }
  return message
}

export const signUpWithPassword = async (email: string, password: string): Promise<User | null> => {
  const { data, error } = await requireClient().auth.signUp({ email, password })

  if (error) {
    throw new Error(translateAuthError(error.message))
  }

  return data.user
}

export const signInWithPassword = async (email: string, password: string): Promise<User> => {
  const { data, error } = await requireClient().auth.signInWithPassword({ email, password })

  if (error) {
    throw new Error(translateAuthError(error.message))
  }

  return data.user
}

export const signOut = async (): Promise<void> => {
  const { error } = await requireClient().auth.signOut()

  if (error) {
    throw new Error(translateAuthError(error.message))
  }
}

export const getSessionUser = async (): Promise<User | null> => {
  if (!supabase) {
    return null
  }

  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Ошибка получения сессии:', error)
      return null
    }

    return data.session?.user ?? null
  } catch (error) {
    console.error('Ошибка получения сессии:', error)
    return null
  }
}

export const onAuthStateChanged = (callback: (user: User | null) => void): (() => void) => {
  if (!supabase) {
    return () => undefined
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })

  return () => {
    subscription.unsubscribe()
  }
}
