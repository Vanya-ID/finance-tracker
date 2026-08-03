// Supabase configuration file
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Получаем конфигурацию из переменных окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Синхронизация — необязательная часть приложения: без ключей оно продолжает
// работать локально, поэтому здесь не бросаем исключение
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
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
