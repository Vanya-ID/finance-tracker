// Supabase configuration file
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Получаем конфигурацию из переменных окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Отсутствуют переменные окружения Supabase!\n' +
    'Создайте файл .env и добавьте:\n' +
    'VITE_SUPABASE_URL=ваш_project_url\n' +
    'VITE_SUPABASE_ANON_KEY=ваш_anon_key\n\n' +
    'См. SUPABASE_SETUP.md для инструкций'
  )
}

// Создаем клиент Supabase
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Используем PKCE для безопасности
    storage: window.localStorage, // Явно указываем хранилище
    storageKey: 'finance-tracker-auth', // Уникальный ключ для localStorage
    debug: true, // Включаем отладку для диагностики
  },
})

console.log('Supabase успешно инициализирован')

