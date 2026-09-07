import { readChatResponse } from '../src/chat-stream'
import { chatTransport } from '../server/chat-transport.js'
import express from 'express'
import request from 'supertest'
import type { ChatReply } from '../src/api'

const data: ChatReply = { reply: { id: 'reply-test', role: 'ASSISTANT', message: 'Vanakkam! 🙂', createdAt: '2026-09-06', assistantMode: 'reference' }, urgent: false, assistantMode: 'reference' }
const encoder = new TextEncoder()
const streamResponse = (text: string, splitEvery = 1) => {
  const bytes = encoder.encode(text)
  return new Response(new ReadableStream({ start(controller) {
    for (let index = 0; index < bytes.length; index += splitEvery) controller.enqueue(bytes.slice(index, index + splitEvery))
    controller.close()
  } }), { headers: { 'Content-Type': 'application/x-ndjson' } })
}

describe('Progressive chat response protocol', () => {
  it('parses split UTF-8, escaped newlines and multiple events without losing text', async () => {
    const onText = jest.fn()
    const body = JSON.stringify({ type: 'delta', text: 'Vanakkam!\n🙂' }) + '\n'
      + JSON.stringify({ type: 'done', data }) + '\n'
    await expect(readChatResponse(streamResponse(body), onText)).resolves.toEqual(data)
    expect(onText).toHaveBeenCalledWith('Vanakkam!\n🙂')
  })
  it('supports ordinary JSON and instant reference responses', async () => {
    await expect(readChatResponse(Response.json(data))).resolves.toEqual(data)
    await expect(readChatResponse(streamResponse(JSON.stringify({ type: 'done', data }) + '\n', 500))).resolves.toEqual(data)
  })
  it('rejects incomplete streams instead of treating partial text as a completed answer', async () => {
    await expect(readChatResponse(streamResponse('{"type":"delta","text":"Incomplete"}\n'))).rejects.toThrow(/before the reply was complete/)
  })
  it('reports HTTP and mid-stream errors', async () => {
    await expect(readChatResponse(Response.json({ error: 'Please pause' }, { status: 429 }))).rejects.toThrow('Please pause')
    await expect(readChatResponse(streamResponse('{"type":"error","error":"Try again"}\n'))).rejects.toThrow('Try again')
    await expect(readChatResponse(streamResponse('{"type":"done","data":{}}\n'))).rejects.toThrow(/invalid/)
  })
  it('preserves the REST contract and frames opt-in deltas plus the final reply', async () => {
    const app = express().post('/chat', (req, res) => {
      const transport = chatTransport(req, res)
      transport.onText?.('Vanakkam!')
      transport.complete(data)
    })
    const json = await request(app).post('/chat').expect(201)
    expect(json.body).toEqual(data)
    const stream = await request(app).post('/chat').set('Accept', 'application/x-ndjson').expect(201)
    expect(stream.headers['cache-control']).toBe('no-store')
    expect(stream.text.trim().split('\n').map(line => JSON.parse(line))).toEqual([{ type: 'delta', text: 'Vanakkam!' }, { type: 'done', data }])
  })
})
