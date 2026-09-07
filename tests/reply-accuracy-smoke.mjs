import assert from 'node:assert/strict'

const base = process.env.TEST_API_URL ?? 'http://localhost:4000'
async function send(message, language = 'auto', history = []) {
  const started = performance.now()
  const response = await fetch(base + '/api/preview/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
    body: JSON.stringify({ message, language, history }), signal: AbortSignal.timeout(60_000)
  })
  assert.equal(response.status, 201, 'Preview request must succeed')
  let buffer = '', firstTextMs, deltas = ''
  const decoder = new TextDecoder()
  for await (const bytes of response.body) {
    buffer += decoder.decode(bytes, { stream: true })
    let newline
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const event = JSON.parse(buffer.slice(0, newline)); buffer = buffer.slice(newline + 1)
      if (event.type === 'error') throw new Error(event.error)
      if (event.type === 'delta') { firstTextMs ??= Math.round(performance.now() - started); deltas += event.text }
      if (event.type === 'done') {
        const totalMs = Math.round(performance.now() - started)
        console.log(JSON.stringify({ message, mode: event.data.assistantMode, language: event.data.reply.language, firstTextMs: firstTextMs ?? totalMs, totalMs }))
        return { ...event.data, deltas, firstTextMs, totalMs }
      }
    }
  }
  throw new Error('Missing completed reply')
}

for (const [message, language, expected] of [
  ['enna pandra', 'auto', /Ungaloda pesittu irukken/],
  ['enna panra?', 'auto', /Ungaloda pesittu irukken/],
  ['epdi iruka', 'auto', /Neenga epdi/],
  ['what are you doing?', 'english', /here chatting/],
  ['enna pandra', 'english', /here chatting/],
  ['what are you doing?', 'tanglish', /Ungaloda/],
  ['I feel sad today.', 'english', /today feels difficult/],
  ['Night thoonga mudiyala.', 'auto', /Thoonga mudiyama/]
]) {
  const result = await send(message, language)
  assert.equal(result.assistantMode, 'reference')
  assert.match(result.reply.message, expected)
  assert.ok(result.totalMs < 3000, 'Reviewed replies must not wait for model inference')
}
const urgent = await send('Hi, I want to hurt myself', 'tanglish')
assert.equal(urgent.urgent, true)
assert.equal(urgent.assistantMode, 'rules')
assert.match(urgent.reply.message, /Unga safety/)
const history = [{ role: 'USER', message: 'enna pandra' }, { role: 'ASSISTANT', message: 'Ungaloda pesittu irukken!' }]
assert.equal((await send('Hi', 'auto', history)).reply.language, 'tanglish')

// Synthetic non-sensitive knowledge question: verifies real inference, not a
// reference being labelled AI, and that generated text arrives before completion.
const knowledge = await send('What is photosynthesis? Explain it in two sentences.', 'english')
assert.equal(knowledge.assistantMode, 'ai')
assert.match(knowledge.reply.message, /sun|light/i)
assert.match(knowledge.reply.message, /plant/i)
assert.ok(knowledge.deltas.length > 0)
assert.equal(knowledge.deltas.trim(), knowledge.reply.message)
assert.ok(knowledge.firstTextMs < knowledge.totalMs)
console.log('Reply accuracy and streaming smoke checks passed.')
