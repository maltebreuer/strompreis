import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function apiInfoDev() {
  return {
    name: 'api-info-dev',
    configureServer(server) {
      server.middlewares.use('/api/info', async (_req, res) => {
        const { getInfo } = await import('./api/_lib.js')
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store')
        res.end(JSON.stringify(getInfo()))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiInfoDev()],
})
