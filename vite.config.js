import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the site from /Booker-react/; dev and e2e stay at /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Booker-react/' : '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
}))
