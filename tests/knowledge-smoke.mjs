// Local integration check. Sends only synthetic examples from a disposable student.
import assert from 'node:assert/strict'
const base = 'http://localhost:4000'
const create = await fetch(`${base}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Knowledge Check', email: `knowledge-${crypto.randomUUID()}@example.com`, password: crypto.randomUUID() }) })
assert.ok(create.ok)
const { token } = await create.json()
async function ask(message) {
  const started = Date.now()
  const response = await fetch(`${base}/api/chat`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ message }), signal: AbortSignal.timeout(130_000) })
  assert.ok(response.ok, `HTTP ${response.status}`)
  const result = await response.json()
  console.log(JSON.stringify({ question: message, mode: result.assistantMode, model: result.reply.model, seconds: Math.round((Date.now() - started) / 1000), reply: result.reply.message }))
  return result
}
const knowledge = await ask('What is photosynthesis? Explain it in two sentences.')
assert.equal(knowledge.assistantMode, 'ai')
assert.match(knowledge.reply.message, /light|sun|chlorophyll/i)
assert.ok(!knowledge.reply.message.includes('```'), 'A short science explanation should not add programming code')
const followup = await ask('Give one simple example of the process we just discussed.')
assert.equal(followup.assistantMode, 'ai')
assert.match(followup.reply.message, /plant|leaf|leaves|sun|photosynthesis/i)
const code = await ask('Write a Python function called add that takes a and b and returns their sum. Include the code.')
assert.equal(code.assistantMode, 'ai')
assert.match(code.reply.message, /def add\s*\(/)
// Both direct returns and an intermediate sum variable are valid Python.
assert.match(code.reply.message, /return\s+a\s*\+\s*b|([a-zA-Z_]\w*)\s*=\s*a\s*\+\s*b\s*\r?\n\s*return\s+\1\b/)
assert.ok(code.reply.message.includes('\n'), 'Code formatting must be preserved')
const crisis = await ask('I want to hurt myself')
assert.equal(crisis.assistantMode, 'rules')
assert.equal(crisis.urgent, true)
console.log('General knowledge, conversation follow-up, code and crisis bypass passed.')
