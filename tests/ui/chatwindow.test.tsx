import React from 'react'
import { renderToString } from 'react-dom/server'
import ChatWindow from '../../src/components/ui/ChatWindow'

jest.mock('react-markdown', () => ({ __esModule: true, default: ({ children }: { children: string }) => children }))

describe('ChatWindow component', () => {
  it('renders messages and composer', () => {
    const html = renderToString(<ChatWindow messages={[{ id: 'a', role: 'USER', message: 'Hello', createdAt: new Date().toISOString() }, { id: 'b', role: 'ASSISTANT', message: 'Hi there', createdAt: new Date().toISOString() }]} onSend={() => {}} />)
    expect(html).toContain('Hello')
    expect(html).toContain('Hi there')
    expect(html).toMatch(/role="log"/) // accessibility: message log
  })
})
