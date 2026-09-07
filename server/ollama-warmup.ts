import { config } from './config.js'

let warming: Promise<void> | undefined
export function warmLocalModel() {
  if (config.AI_PROVIDER !== 'ollama' || process.env.NODE_ENV === 'test') return Promise.resolve()
  if (warming) return warming
  // Empty request only: no student text, cloud credentials, or global Ollama changes.
  // https://docs.ollama.com/faq#how-can-i-preload-a-model-into-ollama-to-get-faster-response-times
  const endpoint = config.OLLAMA_BASE_URL.replace(/\/v1\/?$/, '').replace(/\/$/, '') + '/api/generate'
  warming = fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.OLLAMA_MODEL, stream: false, keep_alive: '30m' }),
    signal: AbortSignal.timeout(30_000)
  }).then(async response => {
    if (!response.ok) throw new Error('Warm-up unavailable')
    await response.arrayBuffer()
  }).catch(() => {
    console.warn('Local model warm-up unavailable. Conversation guides still work.')
  }).finally(() => { warming = undefined })
  return warming
}
