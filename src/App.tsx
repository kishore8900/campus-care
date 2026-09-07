import { useEffect, useRef, useState, type FormEvent } from 'react'
import { BookOpen, HelpCircle, History, LoaderCircle, LogIn, MessageSquare, Shield, UserPlus, Wind, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { apiError, authApi, sessionToken, setSessionToken, supportApi, type ApiChat, type ApiMood, type BreathingExercise, type CampusResource, type ReplyLanguage, type SessionUser, type WellnessTip } from './api'
import { studentRoute, studentViewFor, type StudentView } from './routes'
import { AppShell, PageHeader, type NavItem } from './components/layout/AppShell'
import ChatLayout from './components/ui/ChatLayout'
import Button from './components/ui/Button'
import { FormField } from './components/ui/FormField'
import { Modal } from './components/ui/Modal'
import { BreathingPage, HelpPage, HistoryPage, ResourcesPage } from './components/student/StudentPages'
import { AdminApp } from './components/admin/AdminApp'
import './app.css'

const studentNav: NavItem<StudentView>[] = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'resources', label: 'Resources', icon: BookOpen },
  { id: 'breathing', label: 'Breathing', icon: Wind },
  { id: 'help', label: 'Help', icon: HelpCircle },
  { id: 'history', label: 'History', icon: History }
]

export default function App() {
  const navigate = useNavigate(); const location = useLocation(); const active = studentViewFor(location.pathname)
  const sessionEpoch = useRef(0); const requestActive = useRef(false); const chatAbort = useRef<AbortController | null>(null)
  const [user, setUser] = useState<SessionUser | null>(() => new URLSearchParams(window.location.search).has('preview') ? previewUser : null)
  const [sessionLoading, setSessionLoading] = useState(Boolean(sessionToken())); const [pending, setPending] = useState(false); const [draft, setDraft] = useState(''); const [notice, setNotice] = useState(''); const [safetyOpen, setSafetyOpen] = useState(false)
  const [messages, setMessages] = useState<ApiChat[]>([]); const [moods, setMoods] = useState<ApiMood[]>([]); const [resources, setResources] = useState<CampusResource[]>([]); const [tips, setTips] = useState<WellnessTip[]>([]); const [exercises, setExercises] = useState<BreathingExercise[]>([]); const [contentError, setContentError] = useState('')

  useEffect(() => () => chatAbort.current?.abort(), [])
  useEffect(() => {
    let activeRequest = true
    Promise.all([supportApi.resources(), supportApi.tips(), supportApi.exercises()]).then(([resourceItems, tipItems, exerciseItems]) => { if (activeRequest) { setResources(resourceItems); setTips(tipItems); setExercises(exerciseItems) } }).catch(() => { if (activeRequest) setContentError('Some support information could not be loaded. Try again shortly.') })
    return () => { activeRequest = false }
  }, [])
  useEffect(() => {
    if (!sessionToken()) { setSessionLoading(false); return }
    authApi.me().then(next => { setUser(next); if (next.role === 'ADMIN' && !location.pathname.startsWith('/admin')) navigate('/admin', { replace: true }) }).catch(() => setSessionToken(null)).finally(() => setSessionLoading(false))
  }, [])
  useEffect(() => {
    if (!user || user.id === 'preview' || user.role === 'ADMIN') return
    let activeRequest = true
    Promise.all([supportApi.chats(), supportApi.moods()]).then(([chatItems, moodItems]) => { if (activeRequest) { setMessages(chatItems); setMoods(moodItems) } }).catch(error => { if (activeRequest) setNotice(apiError(error)) })
    return () => { activeRequest = false }
  }, [user])

  const go = (view: StudentView) => navigate(studentRoute(view, user?.id === 'preview'))
  const send = async (event?: FormEvent, suggestion?: string, language: ReplyLanguage = 'auto') => {
    event?.preventDefault(); const message = (suggestion ?? draft).trim()
    if (!message || !user || requestActive.current) return
    const epoch = sessionEpoch.current; requestActive.current = true; setPending(true); setNotice('')
    const sentAt = new Date().toISOString(); const temporary: ApiChat = { id: crypto.randomUUID(), role: 'USER', message, createdAt: sentAt }; const partial: ApiChat = { id: crypto.randomUUID(), role: 'ASSISTANT', message: '', createdAt: sentAt, streaming: true }
    const controller = new AbortController(); chatAbort.current = controller
    const history = messages
    setMessages(items => [...items, temporary]); setDraft('')
    try {
      const options = { signal: controller.signal, onText: (text: string) => { if (epoch !== sessionEpoch.current || controller.signal.aborted) return; setMessages(items => items.some(item => item.id === partial.id) ? items.map(item => item.id === partial.id ? { ...item, message: item.message + text } : item) : [...items, { ...partial, message: text }]) } }
      const response = user.id === 'preview' ? await supportApi.preview(message, history, language, options) : await supportApi.send(message, language, options)
      if (epoch !== sessionEpoch.current) return
      setMessages(items => [...items.filter(item => item.id !== partial.id), response.reply])
      if (response.urgent) setSafetyOpen(true)
    } catch (error) {
      if (epoch !== sessionEpoch.current) return
      setMessages(items => items.filter(item => item.id !== temporary.id && item.id !== partial.id)); setDraft(message)
      setNotice(controller.signal.aborted ? 'Reply stopped. Your message is ready to edit.' : apiError(error))
    } finally { if (epoch === sessionEpoch.current) { requestActive.current = false; chatAbort.current = null; setPending(false) } }
  }
  const recordMood = async (mood: { score: number; label: string }) => {
    if (!user || user.id === 'preview' || requestActive.current) return
    const epoch = sessionEpoch.current; requestActive.current = true; setPending(true); setNotice('')
    try { const saved = await supportApi.recordMood(mood); if (epoch === sessionEpoch.current) { setMoods(items => [...items, saved]); setNotice('Mood check-in saved.') } } catch (error) { if (epoch === sessionEpoch.current) setNotice(apiError(error)) } finally { if (epoch === sessionEpoch.current) { requestActive.current = false; setPending(false) } }
  }
  const endSession = () => { sessionEpoch.current += 1; requestActive.current = false; chatAbort.current?.abort(); chatAbort.current = null; setSessionToken(null); setUser(null); setMessages([]); setMoods([]); setDraft(''); setPending(false); setNotice(''); navigate('/') }
  const authenticated = (session: { token: string; user: SessionUser }) => { setSessionToken(session.token); setUser(session.user); navigate(session.user.role === 'ADMIN' ? '/admin' : '/chat', { replace: true }) }
  const preview = () => { setUser(previewUser); navigate(studentRoute('chat', true), { replace: true }) }

  if (sessionLoading) return <div className="full-loading"><LoaderCircle className="spin"/><span>Opening Campus Care…</span></div>
  if (!user) return <AuthPage onAuthenticated={authenticated} onPreview={preview}/>
  if (user.role === 'ADMIN') return <AdminApp user={user} onSignOut={endSession}/>
  return <AppShell productName="Campus Care" user={user} active={active} navigation={studentNav} onNavigate={go} onSignOut={endSession} urgentAction={() => setSafetyOpen(true)} footerNote={user.id === 'preview' ? 'Preview messages are temporary.' : 'Messages are stored in your account and visible to authorized administrators.'}>
    {user.id === 'preview' && <div className="preview-bar"><Shield size={16}/><span><strong>Preview mode.</strong> Messages are processed by {import.meta.env.DEV ? 'this computer' : 'the Campus Care service'} and are not saved after refresh.</span><Button variant="ghost" size="small" onClick={endSession}>Exit preview</Button></div>}
    {notice && <div className="notice" role="status"><span>{notice}</span><Button variant="ghost" className="icon-button" onClick={() => setNotice('')} aria-label="Dismiss message"><X size={17}/></Button></div>}
    {active === 'chat' && <div className="chat-page"><PageHeader title="Chat" description="Ask a study question, talk through a concern, or find campus support." action={<Button variant="secondary" onClick={() => go('help')}><HelpCircle size={17}/> Urgent help</Button>}/><ChatLayout messages={messages} draft={draft} pending={pending} preview={user.id === 'preview'} onDraft={setDraft} onSend={send} onStop={() => chatAbort.current?.abort()}/></div>}
    {active === 'resources' && <ResourcesPage resources={resources} tips={tips} error={contentError}/>} 
    {active === 'breathing' && <BreathingPage exercises={exercises}/>} 
    {active === 'help' && <HelpPage resources={resources}/>} 
    {active === 'history' && <HistoryPage messages={messages} moods={moods} preview={user.id === 'preview'} pending={pending} onMood={recordMood}/>} 
    {safetyOpen && <SafetyDialog resources={resources} onClose={() => setSafetyOpen(false)} onResources={() => { setSafetyOpen(false); go('help') }}/>} 
  </AppShell>
}

const previewUser: SessionUser = { id: 'preview', name: 'Preview student', email: 'Not signed in', role: 'STUDENT' }

function AuthPage({ onAuthenticated, onPreview }: { onAuthenticated: (session: { token: string; user: SessionUser }) => void; onPreview: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login'); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setError(''); try { onAuthenticated(mode === 'register' ? await authApi.register({ name, email, password }) : await authApi.login({ email, password })) } catch (failure) { setError(apiError(failure)) } finally { setBusy(false) } }
  return <main className="auth-page"><section className="auth-card" aria-labelledby="auth-title"><div className="auth-brand"><span className="brand-mark"><Shield size={19}/></span><strong>Campus Care</strong></div><div className="auth-heading"><h1 id="auth-title">{mode === 'login' ? 'Sign in' : 'Create student account'}</h1><p>{mode === 'login' ? 'Access chat, resources, and your saved history.' : 'Create an account to save conversations and mood check-ins.'}</p></div><form className="form-stack" onSubmit={submit}>{mode === 'register' && <FormField label="Full name" htmlFor="auth-name" required><input id="auth-name" autoComplete="name" required minLength={2} value={name} onChange={event => setName(event.target.value)}/></FormField>}<FormField label="College email" htmlFor="auth-email" required><input id="auth-email" autoComplete="email" type="email" required value={email} onChange={event => setEmail(event.target.value)}/></FormField><FormField label="Password" htmlFor="auth-password" hint="Use at least 8 characters." required><input id="auth-password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} type="password" required minLength={8} maxLength={72} value={password} onChange={event => setPassword(event.target.value)}/></FormField>{error && <div className="inline-alert" role="alert">{error}</div>}<Button type="submit" disabled={busy}>{mode === 'login' ? <LogIn size={17}/> : <UserPlus size={17}/>} {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</Button></form><div className="auth-divider"><span>or</span></div><Button variant="secondary" onClick={onPreview}>Preview without an account</Button><button type="button" className="text-button" onClick={() => { setMode(value => value === 'login' ? 'register' : 'login'); setError('') }}>{mode === 'login' ? 'Create a student account' : 'Already have an account? Sign in'}</button><div className="auth-notice"><Shield size={16}/><p>Campus Care provides general support and resources. Signed-in messages are stored in the current data store and may be accessed by authorized administrators. It is not an emergency service.</p></div></section></main>
}

function SafetyDialog({ resources, onClose, onResources }: { resources: CampusResource[]; onClose: () => void; onResources: () => void }) {
  const primary = resources.find(item => item.kind === 'counselling')
  return <Modal title="Get immediate help" description="Campus Care cannot contact emergency services for you." onClose={onClose}><div className="safety-content"><p>If you may harm yourself or someone else, or you cannot stay safe, contact local emergency services now. Ask a trusted person to stay with you.</p>{primary && <div className="contact-box"><strong>{primary.title}</strong><span>{primary.contact}</span><small>{primary.hours}</small></div>}<div className="form-actions"><Button variant="secondary" onClick={onClose}>Close</Button><Button variant="danger" onClick={onResources}>View all help options</Button></div></div></Modal>
}
