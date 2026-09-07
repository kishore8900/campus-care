import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'
import type { ReplyLanguage } from '../../api'
import Button from './Button'

type SpeechResultEvent = Event & {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

type SpeechRecognitionLike = EventTarget & {
  continuous: boolean
  interimResults: boolean
  lang: string
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult: ((event: SpeechResultEvent) => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function getSpeechRecognition(): SpeechRecognitionConstructor | undefined {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
}

export default function VoiceInputButton({ language, disabled, onTranscript }: {
  language: ReplyLanguage
  disabled?: boolean
  onTranscript: (transcript: string) => void
}) {
  const recognition = useRef<SpeechRecognitionLike | null>(null)
  const [listening, setListening] = useState(false)
  const [status, setStatus] = useState('')
  const supported = typeof window !== 'undefined' && Boolean(getSpeechRecognition())

  useEffect(() => () => recognition.current?.stop(), [])

  if (!supported) return null

  function toggleListening() {
    if (listening) {
      recognition.current?.stop()
      setListening(false)
      return
    }

    const Recognition = getSpeechRecognition()
    if (!Recognition) return
    const next = new Recognition()
    next.continuous = false
    next.interimResults = false
    next.lang = language === 'tanglish' ? 'ta-IN' : 'en-IN'
    next.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0]?.transcript ?? '')
        .join(' ')
        .trim()
      if (transcript) onTranscript(transcript)
      setStatus(transcript ? 'Voice transcription added to your message.' : 'No speech was detected.')
    }
    next.onerror = () => {
      setListening(false)
      setStatus('Voice input could not start. Check microphone permission or type your message.')
    }
    next.onend = () => setListening(false)
    recognition.current = next
    try {
      setStatus('Listening. Speak now.')
      setListening(true)
      next.start()
    } catch {
      setListening(false)
      setStatus('Voice input could not start. Type your message instead.')
    }
  }

  return <>
    <Button
      variant={listening ? 'secondary' : 'ghost'}
      aria-label={listening ? 'Stop voice input' : 'Start voice input'}
      aria-pressed={listening}
      disabled={disabled}
      onClick={toggleListening}
      title={listening ? 'Stop voice input' : 'Speak your message'}
    >
      {listening ? <MicOff size={17}/> : <Mic size={17}/>}
      <span className="voice-button-label">{listening ? 'Stop' : 'Speak'}</span>
    </Button>
    <span className="sr-only" role="status" aria-live="polite">{status}</span>
  </>
}
