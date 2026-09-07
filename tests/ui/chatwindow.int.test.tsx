import React from 'react'
import { renderToString } from 'react-dom/server'
import ChatWindow from '../../src/components/ui/ChatWindow'

// This server-render smoke test checks the shell; real Markdown is verified in the browser.
jest.mock('react-markdown', () => ({ __esModule: true, default: ({ children }: { children: string }) => children }))

describe('ChatWindow smoke server render', () => {
  it('renders composer and messages without jsdom', () => {
    const html = renderToString(<ChatWindow messages={[{ id: 'a', role: 'ASSISTANT', message: 'Hi', createdAt: new Date().toISOString() }]} draft={''} onDraft={() => {}} onSend={() => {}} pending={false} />)
    expect(html).toContain('Hi')
    expect(html).toContain('Message')
    expect(html).toContain('Reply language')
    expect(html).toContain('Tanglish')
  })
})
