import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { join } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-404',
      closeBundle() {
        // Копируем 404.html в dist после сборки
        try {
          copyFileSync(
            join(__dirname, '404.html'),
            join(__dirname, 'dist', '404.html')
          )
          console.log('✅ 404.html скопирован в dist')
        } catch (error) {
          console.error('❌ Ошибка копирования 404.html:', error)
        }
      },
    },
  ],
  base: '/finance-tracker/', // Base path для GitHub Pages
})

