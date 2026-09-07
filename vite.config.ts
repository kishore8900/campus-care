import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { localApiPlugin } from './scripts/local-api-plugin.ts'

export default defineConfig(({ mode }) => {
  const local = loadEnv(mode, process.cwd(), ['PORT', 'VITE_API_URL'])
  const port = Number(process.env.PORT ?? local.PORT ?? 4000)
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid local API port.')
  const apiUrl = process.env.VITE_API_URL ?? local.VITE_API_URL
  const managed = !apiUrl || ['localhost', '127.0.0.1', '[::1]'].includes(new URL(apiUrl, 'http://localhost').hostname)
  return {
    plugins: [react(), localApiPlugin(port, managed)],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': { target: 'http://localhost:' + port },
        '/health': { target: 'http://localhost:' + port }
      }
    }
  }
})
