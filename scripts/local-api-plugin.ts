import { spawn } from 'node:child_process'
import { join } from 'node:path'
import type { Plugin } from 'vite'
import { createApiSupervisor } from './api-supervisor.ts'

export function localApiPlugin(port: number, enabled = true): Plugin {
  return {
    name: 'campuscare-local-api',
    apply: 'serve',
    async configureServer(server) {
      if (!enabled) return
      const supervisor = createApiSupervisor({
        probe: async () => {
          try {
            const response = await fetch('http://localhost:' + port + '/health', { signal: AbortSignal.timeout(1500) })
            const data = await response.json().catch(() => null)
            return response.ok && data && typeof data === 'object' && 'service' in data && data.service === 'CampusCare API' ? 'ready' : 'occupied'
          } catch (error) {
            // A timeout isn't proof the port is free. Spawn only on refusal.
            return (error as { cause?: { code?: string } }).cause?.code === 'ECONNREFUSED' ? 'missing' : 'occupied'
          }
        },
        launch: () => spawn(process.execPath, ['--import', 'tsx', join(server.config.root, 'server/index.ts')], {
          cwd: server.config.root,
          env: { ...process.env, PORT: String(port) },
          windowsHide: true,
          stdio: ['ignore', 'inherit', 'inherit']
        }),
        log: event => {
          // Lifecycle only; no student messages, prompts, credentials or tokens.
          const line = '[CampusCare chat server] ' + event
          if (event === 'ready' || event === 'starting') server.config.logger.info(line)
          else server.config.logger.warn(line)
        }
      })
      const timer = setInterval(() => { void supervisor.ensure() }, 2500)
      timer.unref()
      const stop = () => {
        clearInterval(timer)
        supervisor.stop()
        process.off('exit', stop)
      }
      process.once('exit', stop)
      server.httpServer?.once('close', stop)
      await supervisor.ensure()
    }
  }
}
