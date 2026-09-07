import { EventEmitter } from 'node:events'
import type { ChildProcess } from 'node:child_process'

const { createApiSupervisor } = require('../scripts/api-supervisor')

function setup() {
  let time = 100_000
  const probe = jest.fn<Promise<'ready' | 'missing' | 'occupied'>, []>().mockResolvedValue('missing')
  const children: ChildProcess[] = []
  const launch = jest.fn(() => {
    const child = Object.assign(new EventEmitter(), { exitCode: null, signalCode: null, kill: jest.fn() }) as unknown as ChildProcess
    children.push(child)
    return child
  })
  const log = jest.fn()
  const supervisor = createApiSupervisor({ probe, launch, log, now: () => time })
  return { probe, launch, log, children, ...supervisor, advance: () => { time += 61_000 } }
}

describe('Local chat server supervision', () => {
  it('starts one missing API and does not duplicate a still-starting process', async () => {
    const app = setup()
    await app.ensure(); await app.ensure()
    expect(app.launch).toHaveBeenCalledTimes(1)
    app.stop()
    expect(app.children[0].kill).toHaveBeenCalledTimes(1)
  })
  it('reuses an existing API and never stops someone else’s process', async () => {
    const app = setup(); app.probe.mockResolvedValue('ready')
    await app.ensure(); app.stop()
    expect(app.launch).not.toHaveBeenCalled()
  })
  it('recovers when the owned API exits', async () => {
    const app = setup(); await app.ensure()
    app.children[0].emit('exit', 1, null)
    await app.ensure()
    expect(app.launch).toHaveBeenCalledTimes(2)
    app.stop()
  })
  it('does not start a server on an occupied or unresponsive port', async () => {
    const app = setup(); app.probe.mockResolvedValue('occupied')
    await app.ensure()
    expect(app.launch).not.toHaveBeenCalled()
    expect(app.log).toHaveBeenCalledWith('port-unavailable')
  })
  it('caps crash retries and allows a later recovery attempt', async () => {
    const app = setup()
    for (let index = 0; index < 3; index++) { await app.ensure(); app.children[index].emit('exit', 1, null) }
    await app.ensure()
    expect(app.launch).toHaveBeenCalledTimes(3)
    expect(app.log).toHaveBeenCalledWith('restart-limit')
    app.advance(); await app.ensure()
    expect(app.launch).toHaveBeenCalledTimes(4)
    app.stop()
  })
  it('does not resurrect the API when Vite closes during a health check', async () => {
    const app = setup()
    let finish!: (value: 'missing') => void
    app.probe.mockReturnValue(new Promise(resolve => { finish = resolve }))
    const checking = app.ensure()
    app.stop(); finish('missing'); await checking
    expect(app.launch).not.toHaveBeenCalled()
  })
})
