// Explicit integration check: creates a disposable student in the development API.
import assert from 'node:assert/strict'

const base = 'http://localhost:4000'
async function request(path, body, token) {
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(135_000)
  })
  assert.ok(response.ok, `${path}: HTTP ${response.status}`)
  return response.json()
}
const session = await request('/api/auth/register', {
  name: 'Local Model Check', email: `local-${crypto.randomUUID()}@example.com`, password: crypto.randomUUID()
})
const start = Date.now()
const reply = await request('/api/chat', { message: 'I have three assignments due tomorrow. Help me choose a realistic first step.' }, session.token)
assert.equal(reply.assistantMode, 'ai', 'Expected local AI reply, received rule fallback')
assert.ok(reply.reply.message.trim().length > 10)
console.log(JSON.stringify({ mode: reply.assistantMode, seconds: Math.round((Date.now() - start) / 1000), reply: reply.reply.message }))
const crisis = await request('/api/chat', { message: 'I want to hurt myself' }, session.token)
assert.equal(crisis.urgent, true)
assert.equal(crisis.assistantMode, 'rules')
console.log('Crisis guidance bypass verified.')
