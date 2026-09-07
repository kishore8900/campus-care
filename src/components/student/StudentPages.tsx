import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BookOpen, Building2, Moon, Pause, Phone, Play, RefreshCw, Search } from 'lucide-react'
import type { ApiChat, ApiMood, BreathingExercise, CampusResource, WellnessTip } from '../../api'
import Button from '../ui/Button'
import { Badge, EmptyState } from '../ui/Status'
import { PageHeader } from '../layout/AppShell'

export function ResourcesPage({ resources, tips, error }: { resources: CampusResource[]; tips: WellnessTip[]; error?: string }) {
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('All')
  const categories = useMemo(() => ['All', ...Array.from(new Set([...resources.map(item => item.kind), ...tips.map(item => item.category)]))], [resources, tips])
  const q = query.trim().toLowerCase()
  const matchingResources = resources.filter(item => (category === 'All' || item.kind === category) && (!q || `${item.title} ${item.description} ${item.contact}`.toLowerCase().includes(q)))
  const matchingTips = tips.filter(item => (category === 'All' || item.category === category) && (!q || `${item.title} ${item.body}`.toLowerCase().includes(q)))
  return <div className="page"><PageHeader title="Student resources" description="Information and support for common student concerns."/>
    <div className="filter-bar"><label className="search-field"><Search size={17}/><span className="sr-only">Search resources</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search resources"/></label><label><span className="sr-only">Filter by category</span><select value={category} onChange={event => setCategory(event.target.value)}>{categories.map(item => <option key={item}>{item}</option>)}</select></label></div>
    {error ? <div className="inline-alert" role="alert">{error}</div> : null}
    {!matchingResources.length && !matchingTips.length ? <EmptyState title="No resources found" description="Try a different search term or category."/> : <div className="resource-sections">
      {matchingResources.length > 0 && <section><h2>Campus services</h2><div className="resource-list">{matchingResources.map(item => <article key={item.id} className="resource-row"><Building2 size={20}/><div><div className="resource-title"><h3>{item.title}</h3>{item.verified && <Badge tone="success">Verified</Badge>}</div><p>{item.description}</p><dl><div><dt>Contact</dt><dd>{item.contact}</dd></div><div><dt>Hours</dt><dd>{item.hours}</dd></div></dl></div></article>)}</div></section>}
      {matchingTips.length > 0 && <section><h2>Practical guides</h2><div className="guide-grid">{matchingTips.map(item => <article key={item.id}><Badge>{item.category}</Badge><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section>}
    </div>}
  </div>
}

type Phase = { label: 'Inhale' | 'Hold' | 'Exhale' | 'Pause'; seconds: number }
export function BreathingPage({ exercises }: { exercises: BreathingExercise[] }) {
  const available = exercises.length ? exercises : [{ id: 'fallback', name: '4–6 breathing', inhale: 4, hold: 0, exhale: 6, pause: 0, cycles: 5, active: true }]
  const [selectedId, setSelectedId] = useState(available[0].id); const exercise = available.find(item => item.id === selectedId) ?? available[0]
  const phases = useMemo<Phase[]>(() => ([{ label: 'Inhale', seconds: exercise.inhale }, { label: 'Hold', seconds: exercise.hold }, { label: 'Exhale', seconds: exercise.exhale }, { label: 'Pause', seconds: exercise.pause }].filter(item => item.seconds > 0) as Phase[]), [exercise])
  const [running, setRunning] = useState(false); const [phaseIndex, setPhaseIndex] = useState(0); const [remaining, setRemaining] = useState(phases[0].seconds); const [cycle, setCycle] = useState(1)
  const restart = () => { setRunning(false); setPhaseIndex(0); setRemaining(phases[0].seconds); setCycle(1) }
  useEffect(() => { restart() }, [selectedId])
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setRemaining(value => {
      if (value > 1) return value - 1
      const nextIndex = (phaseIndex + 1) % phases.length
      if (nextIndex === 0) {
        if (cycle >= exercise.cycles) { setRunning(false); return phases[phaseIndex].seconds }
        setCycle(current => current + 1)
      }
      setPhaseIndex(nextIndex); return phases[nextIndex].seconds
    }), 1000)
    return () => window.clearInterval(timer)
  }, [running, phaseIndex, phases, cycle, exercise.cycles])
  const phase = phases[phaseIndex]
  return <div className="page breathing-page"><PageHeader title="Breathing exercise" description="Use a steady breathing pattern for a short reset."/>
    <div className="exercise-layout"><aside className="exercise-options"><h2>Choose an exercise</h2>{available.map(item => <button type="button" key={item.id} className={selectedId === item.id ? 'exercise-option active' : 'exercise-option'} onClick={() => setSelectedId(item.id)}><strong>{item.name}</strong><span>{item.inhale}s in · {item.exhale}s out · {item.cycles} cycles</span></button>)}</aside>
      <section className="breathing-workspace" aria-live="polite"><p className="phase-label">{running ? phase.label : cycle > exercise.cycles ? 'Complete' : 'Ready'}</p><div className={`breathing-circle phase-${phase.label.toLowerCase()} ${running ? 'running' : ''}`}><strong>{remaining}</strong><span>seconds</span></div><p>Cycle {Math.min(cycle, exercise.cycles)} of {exercise.cycles}</p><div className="button-row"><Button onClick={() => setRunning(value => !value)}>{running ? <><Pause size={17}/> Pause</> : <><Play size={17}/> {cycle > 1 ? 'Continue' : 'Start'}</>}</Button><Button variant="secondary" onClick={restart}><RefreshCw size={17}/> Restart</Button></div></section></div>
  </div>
}

export function HelpPage({ resources }: { resources: CampusResource[] }) {
  return <div className="page"><PageHeader title="Help and urgent support" description="Use the options below to contact a person or service."/>
    <section className="urgent-panel"><AlertTriangle size={24}/><div><h2>Get immediate help</h2><p>If you may harm yourself or someone else, or you cannot stay safe, call your local emergency number now. Ask a trusted person to stay with you while help arrives.</p><div className="button-row"><a className="button button-danger button-default" href="#campus-support"><Phone size={17}/> View support contacts</a></div></div></section>
    <section className="help-section" id="campus-support"><h2>Campus support</h2><p>These contacts are configured for this Campus Care installation. Confirm contact details with your college before a public launch.</p><div className="resource-list">{resources.map(item => <article className="resource-row" key={item.id}><Building2 size={20}/><div><h3>{item.title}</h3><p>{item.description}</p><p><strong>{item.contact}</strong><br/>{item.hours}</p></div></article>)}</div></section>
    <section className="help-section"><h2>When to seek urgent help</h2><ul><li>You feel unable to keep yourself or someone else safe.</li><li>You have severe chest pain or difficulty breathing.</li><li>You are confused, injured, or in immediate danger.</li></ul><p>Campus Care is not an emergency service and cannot contact emergency responders for you.</p></section>
  </div>
}

const moodChoices = [{ score: 1, label: 'Very low' }, { score: 2, label: 'Low' }, { score: 3, label: 'Okay' }, { score: 4, label: 'Good' }, { score: 5, label: 'Very good' }]
export function HistoryPage({ messages, moods, preview, pending, onMood }: { messages: ApiChat[]; moods: ApiMood[]; preview: boolean; pending: boolean; onMood: (mood: { score: number; label: string }) => void }) {
  const userMessages = messages.filter(item => item.role === 'USER')
  return <div className="page"><PageHeader title="History" description={preview ? 'Preview activity is temporary and will be removed when you refresh.' : 'Review your recent conversations and mood check-ins.'}/>
    <section className="history-section"><h2>How are you feeling today?</h2><div className="mood-scale" role="group" aria-label="Record today’s mood">{moodChoices.map(item => <Button key={item.score} variant={moods.at(-1)?.score === item.score ? 'primary' : 'secondary'} disabled={pending || preview} onClick={() => onMood(item)}><span>{item.score}</span>{item.label}</Button>)}</div>{preview && <p className="section-note">Create an account to save mood check-ins.</p>}</section>
    <section className="history-section"><h2>Recent conversations</h2>{userMessages.length ? <div className="history-list">{userMessages.slice().reverse().map(item => <article key={item.id}><BookOpen size={18}/><div><p>{item.message}</p><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</time></div></article>)}</div> : <EmptyState title="No conversations yet" description="Start a conversation when you are ready."/>}</section>
    <section className="history-section"><h2>Mood check-ins</h2>{moods.length ? <div className="history-list">{moods.slice().reverse().map(item => <article key={item.id}><Moon size={18}/><div><p>{item.label} · {item.score}/5</p><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString()}</time></div></article>)}</div> : <EmptyState title="No mood check-ins yet" description="Choose a mood above to create your first entry."/>}</section>
  </div>
}
