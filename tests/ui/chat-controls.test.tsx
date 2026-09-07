/** @jest-environment jsdom */
import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import ChatWindow from '../../src/components/ui/ChatWindow'

jest.mock('react-markdown', () => ({ __esModule: true, default: ({ children }: { children: string }) => children }))

describe('chat page controls', () => {
  afterEach(() => {
    delete (window as typeof window & { SpeechRecognition?: unknown }).SpeechRecognition
  })

  it('sends the selected language with the message', () => {
    const send = jest.fn()
    render(<ChatWindow draft="enna pandra" onSend={send} />)
    fireEvent.change(screen.getByLabelText('Reply language'), { target: { value: 'tanglish' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
    expect(send).toHaveBeenCalledWith(undefined, 'enna pandra', 'tanglish')
  })
  it('blocks duplicate submissions and supports stopping a reply', () => {
    const send = jest.fn(); const stop = jest.fn()
    render(<ChatWindow draft="hi" pending onSend={send} onStop={stop} />)
    fireEvent.submit(screen.getByRole('textbox').closest('form')!)
    expect(send).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Stop' }))
    expect(stop).toHaveBeenCalledTimes(1)
  })
  it('has one composer and does not submit whitespace', () => {
    const send = jest.fn()
    render(<ChatWindow draft="  " onSend={send} />)
    expect(screen.getAllByRole('textbox')).toHaveLength(1)
    fireEvent.submit(screen.getByRole('textbox').closest('form')!)
    expect(send).not.toHaveBeenCalled()
  })

  it('adds a voice transcription to the draft without sending it', () => {
    class MockSpeechRecognition extends EventTarget {
      static latest: MockSpeechRecognition
      continuous = false
      interimResults = false
      lang = ''
      onend: (() => void) | null = null
      onerror: (() => void) | null = null
      onresult: ((event: Event & { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null = null
      start = jest.fn()
      stop = jest.fn()
      constructor() { super(); MockSpeechRecognition.latest = this }
    }
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: MockSpeechRecognition })
    const onDraft = jest.fn(); const onSend = jest.fn()
    render(<ChatWindow draft="I feel" onDraft={onDraft} onSend={onSend} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start voice input' }))
    act(() => MockSpeechRecognition.latest.onresult?.({ results: [[{ transcript: 'stressed today' }]] } as unknown as Event & { results: ArrayLike<ArrayLike<{ transcript: string }>> }))
    expect(onDraft).toHaveBeenCalledWith('I feel stressed today')
    expect(onSend).not.toHaveBeenCalled()
  })
})
