import type { Request, Response } from 'express'

// Opt-in newline-delimited JSON; existing JSON clients keep their response shape.
// Never persist partial output. Disconnects cancel inference, including JSON clients.
export function chatTransport(req: Request, res: Response) {
  const streaming = req.header('accept')?.includes('application/x-ndjson') === true
  const controller = new AbortController()
  const disconnect = () => { if (!res.writableFinished) controller.abort() }
  res.once('close', disconnect)
  const open = () => {
    if (!res.headersSent) {
      res.status(201).set({ 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' })
      res.flushHeaders()
    }
  }
  const event = (value: unknown) => {
    if (res.destroyed || controller.signal.aborted) return
    open()
    res.write(JSON.stringify(value) + '\n')
  }
  return {
    signal: controller.signal,
    onText: streaming ? (text: string) => event({ type: 'delta', text }) : undefined,
    complete: (data: unknown) => {
      if (res.destroyed || controller.signal.aborted) return
      if (streaming) { event({ type: 'done', data }); res.end() }
      else res.status(201).set('Cache-Control', 'no-store').json(data)
    },
    fail: (message: string) => {
      if (res.destroyed || controller.signal.aborted) return
      if (res.headersSent) { event({ type: 'error', error: message }); res.end() }
      else res.status(503).set('Cache-Control', 'no-store').json({ error: message })
    }
  }
}
