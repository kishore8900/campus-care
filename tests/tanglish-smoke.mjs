// Test the exact live language issue without depending on long AI generations.
import assert from 'node:assert/strict'
const base = 'http://localhost:4000'
async function ask(message, language = 'auto') {
  const response = await fetch(base + '/api/preview/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, language }), signal: AbortSignal.timeout(130_000) })
  const result = await response.json()
  assert.ok(response.ok, JSON.stringify({ status: response.status, error: result.error }))
  assert.equal(result.reply.language, 'tanglish')
  assert.match(result.reply.message, /pann|iruk|unga|bayam|venum|kelunga/i)
  assert.doesNotMatch(result.reply.message, /[\u0900-\u0dff]/u, 'Tanglish must use Latin letters')
  console.log(JSON.stringify({ question: message, mode: result.assistantMode, reply: result.reply.message }))
  return result
}
for (const message of ['Naalaiku exam nu romba bayama iruku.', 'Enakku romba assignments irukku, enga start panrathune therila.', 'Night thoonga mudiyala.', 'Neraya naala romba down ah feel panren.']) {
  assert.equal((await ask(message)).assistantMode, 'reference')
}
assert.equal((await ask('Hi', 'tanglish')).assistantMode, 'reference')
assert.equal((await ask("I am scared about tomorrow's exam.", 'tanglish')).assistantMode, 'reference')
const crisis = await ask("I don't want to live anymore.", 'tanglish')
assert.equal(crisis.urgent, true)
assert.equal(crisis.assistantMode, 'rules')
assert.match(crisis.reply.message, /emergency/)
console.log('Tanglish examples, spelling variants, greeting, explicit language choice and crisis passed.')
