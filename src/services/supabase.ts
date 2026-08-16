// Supabase configuration file
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Получаем конфигурацию из переменных окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Синхронизация — необязательная часть приложения: без ключей оно продолжает
// работать локально, поэтому здесь не бросаем исключение
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Проект на паузе не отвечает и не рвёт соединение — запрос висит до таймаута
// браузера (минуты). Обрываем сами, иначе приложение зависает на загрузке.
const REQUEST_TIMEOUT_MS = 8000

const fetchWithTimeout: typeof fetch = (input, init) => {
  const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal

  return fetch(input, { ...init, signal })
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: { fetch: fetchWithTimeout },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: window.localStorage,
        storageKey: 'finance-tracker-auth',
      },
    })
  : null

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase не настроен: нет VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
      'Приложение работает локально, синхронизация недоступна.'
  )
}
