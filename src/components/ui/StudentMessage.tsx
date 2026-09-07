import { memo, useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import { AlertTriangle, Check, Copy } from 'lucide-react'
import type { ApiChat } from '../../api'

export const StudentMessage = memo(function StudentMessage({ message }: { message: ApiChat }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(message.message); setCopied(true); setCopyError(false) }
    catch { setCopyError(true) }
  }
  useEffect(() => { if (!copied) return; const timer = window.setTimeout(() => setCopied(false), 2000); return () => window.clearTimeout(timer) }, [copied])
  return <article className={`chat-message ${message.role === 'USER' ? 'message-student' : 'message-care'} ${message.needsHumanSupport ? 'message-urgent' : ''}`} aria-busy={message.streaming || undefined}>
    <div className="message-label">{message.role === 'USER' ? 'You' : 'Campus Care'}{message.streaming && <span>Writing…</span>}</div>
    {message.role === 'USER' ? <p className="user-text">{message.message}</p> : <>
      {message.needsHumanSupport && <h3><AlertTriangle size={18}/> Get immediate help</h3>}
      <div className="reply-markdown"><Markdown skipHtml components={{
        img: () => null,
        a: ({ children, href }) => href?.startsWith('https://') ? <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span>
      }}>{message.message}</Markdown></div>
      {message.sources && message.sources.length > 0 && <details className="reply-references"><summary>Reference notes supplied · {message.sources.length}</summary><ul>{message.sources.map(source => <li key={source.id}>{source.title}</li>)}</ul><p>App guidance supplied as context, not live web search.</p></details>}
      {message.truncated && <p className="reply-limit">This reply reached its length limit. Ask “continue” for more.</p>}
      {!message.streaming && <div className="reply-footer"><button type="button" onClick={copy} aria-label="Copy response">{copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copied' : 'Copy'}</button>{copyError && <span role="status">Select the text to copy it manually.</span>}</div>}
    </>}
  </article>
})
