import React from "react";
import TextInput from "./TextInput";
import Button from "./Button";
import { Send, Square } from 'lucide-react'
import { StudentMessage } from "./StudentMessage";
import VoiceInputButton from './VoiceInputButton'
import type { ApiChat, ReplyLanguage } from "../../api";

type Props = {
  messages?: ApiChat[];
  draft?: string;
  pending?: boolean;
  preview?: boolean;
  onDraft?: (text: string) => void;
  onSend?: (event?: React.FormEvent, suggestion?: string, language?: ReplyLanguage) => void;
  onBreathing?: () => void;
  onStop?: () => void;
};

export default function ChatWindow({ messages = [], onSend, pending = false, draft = '', onDraft, onStop, preview }: Props) {
  const [language, setLanguage] = React.useState<ReplyLanguage>('auto')
  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  React.useEffect(() => { const area = scrollRef.current; if (area) area.scrollTop = area.scrollHeight }, [messages, pending])

  function submit(value: string) {
    if (pending || !value.trim()) return
    onSend?.(undefined, value.trim(), language)
  }

  const suggestions = ['I feel stressed about exams', 'I’m having trouble sleeping', 'I feel overwhelmed', 'Show me a breathing exercise', 'Where can I get support on campus?']
  return <div className="chat-window">
      <div className="messages" role="log" aria-label="Conversation messages" aria-live="polite" ref={scrollRef}>
        {messages.length === 0 && <div className="chat-empty"><h2>How are you feeling today?</h2><p>Ask a question, talk through a concern, or find campus support.</p><div className="suggested-prompts">{suggestions.map(text => <button type="button" key={text} disabled={pending} onClick={() => submit(text)}>{text}</button>)}</div></div>}
        {messages.map(message => <StudentMessage key={message.id} message={message} />)}
        {pending && !messages.some(message => message.streaming) && <div className="typing-indicator" role="status"><span/><span/><span/><span className="sr-only">Campus Care is preparing a reply.</span></div>}
      </div>
      <div className="chat-composer-wrap">
        <div className="chat-composer">
        <TextInput placeholder="Type a message in English or Tanglish" value={draft} onChange={onDraft} onSubmit={submit} disabled={pending} />
        <div className="composer-actions">
          <VoiceInputButton language={language} disabled={pending} onTranscript={transcript => onDraft?.(draft.trim() ? `${draft.trim()} ${transcript}` : transcript)} />
          {pending ? <Button variant="secondary" onClick={onStop}><Square size={15}/> Stop</Button> : <Button aria-label="Send message" onClick={() => submit(draft)} disabled={!draft.trim()}><Send size={17}/><span>Send</span></Button>}
        </div>
        </div>
        <div className="composer-meta"><label htmlFor="reply-language">Reply language</label><select id="reply-language" value={language} disabled={pending} onChange={event => setLanguage(event.target.value as ReplyLanguage)}><option value="auto">Auto-detect</option><option value="english">English</option><option value="tanglish">Tanglish</option></select><span>Enter to send · Shift + Enter for a new line</span></div>
        <p className="chat-limit">Campus Care provides general support and campus resources. It does not replace professional care. Voice input only fills the message box; review it before sending. {preview ? 'Preview messages are not saved after refresh.' : 'Messages are saved to your account.'}</p>
      </div>
    </div>
}
