import type { ChatReply } from './api'

export class ChatRequestError extends Error {}

const isReply = (value: unknown): value is ChatReply => {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<ChatReply>
  return typeof data.urgent === 'boolean' && ['ai', 'rules', 'reference'].includes(String(data.assistantMode))
    && typeof data.reply?.id === 'string' && data.reply.role === 'ASSISTANT' && typeof data.reply.message === 'string'
}

export async function readChatResponse(response: Response, onText?: (text: string) => void): Promise<ChatReply> {
  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new ChatRequestError(typeof data?.error === 'string' ? data.error : 'Could not send your message. Please try again.')
  }
  if (!response.headers.get('content-type')?.includes('application/x-ndjson')) {
    const data: unknown = await response.json()
    if (!isReply(data)) throw new ChatRequestError('The assistant returned an incomplete reply. Please try again.')
    return data
  }
  if (!response.body) throw new ChatRequestError('The reply stream did not start. Please try again.')
  const reader = response.body.getReader(), decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })
      if (buffer.length > 128_000) throw new ChatRequestError('The reply exceeded its size limit. Please ask a shorter question.')
      let boundary: number
      while ((boundary = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, boundary).trim()
        buffer = buffer.slice(boundary + 1)
        if (!line) continue
        const event = JSON.parse(line)
        if (event.type === 'delta' && typeof event.text === 'string') onText?.(event.text)
        else if (event.type === 'done' && isReply(event.data)) return event.data
        else if (event.type === 'error') throw new ChatRequestError(typeof event.error === 'string' ? event.error : 'The reply was interrupted. Please try again.')
        else throw new ChatRequestError('The reply stream was invalid. Please try again.')
      }
      if (done) throw new ChatRequestError('The connection ended before the reply was complete. Please try again.')
    }
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
