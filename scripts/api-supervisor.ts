import type { ChildProcess } from 'node:child_process'

type Probe = 'ready' | 'missing' | 'occupied'
type Options = {
  probe: () => Promise<Probe>
  launch: () => ChildProcess
  log: (event: string) => void
  now?: () => number
}

// Development-only supervision. Never kill/restart a server we did not launch,
// and never create an unlimited crash/restart loop.
export function createApiSupervisor({ probe, launch, log, now = Date.now }: Options) {
  let child: ChildProcess | undefined
  let checking = false, stopped = false, reported: string | undefined
  let attempts: number[] = []
  const report = (event: string) => { if (reported !== event) { log(event); reported = event } }
  async function ensure() {
    if (checking || stopped) return
    checking = true
    try {
      const health = await probe()
      if (stopped) return
      if (health === 'ready') { report('ready'); return }
      if (child) return // Still starting, or unhealthy: don't duplicate the process.
      if (health === 'occupied') { report('port-unavailable'); return }
      attempts = attempts.filter(time => now() - time < 60_000)
      if (attempts.length >= 3) { report('restart-limit'); return }
      attempts.push(now())
      const started = launch()
      child = started
      report('starting')
      started.once('exit', (code, signal) => {
        if (child === started) child = undefined
        if (!stopped) report('exited (code=' + code + ', signal=' + signal + ')')
      })
      started.once('error', () => {
        if (child === started) child = undefined
        if (!stopped) report('launch-failed')
      })
    } catch { report('check-failed') }
    finally { checking = false }
  }
  function stop() {
    stopped = true
    if (child && child.exitCode === null && child.signalCode === null) child.kill()
    child = undefined
  }
  return { ensure, stop }
}
