import bcrypt from 'bcryptjs'
import cors from 'cors'
import express, { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { z } from 'zod'
import { config, jwtSecret } from './config.js'
import { analyseMessage } from './rules.js'
import { aiSupportEnabled, createStudentReply, createReferenceReply } from './student-agent.js'
import type { KnowledgeSource, Resource } from './knowledge.js'
import { chatTransport } from './chat-transport.js'
import { warmLocalModel } from './ollama-warmup.js'

const app = express()
const PORT = config.PORT
type Role = 'STUDENT' | 'ADMIN'
type User = { id: string; name: string; email: string; passwordHash: string; role: Role }
type AuthedRequest = Request & { user?: { id: string; role: Role } }

const users: User[] = []
const chats: Array<{ id: string; userId: string; role: 'USER' | 'ASSISTANT'; message: string; category?: string; createdAt: string; assistantMode?: 'ai' | 'rules' | 'reference'; model?: string; sources?: KnowledgeSource[]; truncated?: boolean; needsHumanSupport?: boolean; language?: 'english' | 'tanglish' }> = []
const moods: Array<{ id: string; userId: string; score: number; label: string; note?: string; createdAt: string }> = []
let resources: Resource[] = [
  { id: 'counselling', title: 'Student Counselling Centre', description: 'Free, confidential short-term counselling and referrals.', contact: 'Book through the student portal', hours: 'Mon–Fri · 9:00–17:00', kind: 'counselling' },
  { id: 'wellness', title: 'Campus Wellness Hub', description: 'Peer groups, workshops, and wellbeing events.', contact: 'wellness@college.edu', hours: 'Mon–Fri · 10:00–18:00', kind: 'wellness' },
  { id: 'health', title: 'University Health Centre', description: 'Medical and mental-health consultations.', contact: 'healthcentre@college.edu', hours: 'Mon–Sat · 8:00–20:00', kind: 'health' }
]
let tips = [
  { id: 'sleep', category: 'Sleep', title: 'Create a wind-down cue', body: 'Choose one calming, screen-free activity for the 30 minutes before bed.' },
  { id: 'study', category: 'Study', title: 'Try the 25/5 rhythm', body: 'Focus for 25 minutes, then take a five-minute movement or water break.' },
  { id: 'reset', category: 'Reset', title: 'Lower the next step', body: 'When tasks feel too big, choose an action that takes under two minutes.' }
]
let exercises = [
  { id: 'box', name: 'Box breathing', inhale: 4, hold: 4, exhale: 4, pause: 4, cycles: 4, active: true },
  { id: 'four-six', name: '4–6 breathing', inhale: 4, hold: 0, exhale: 6, pause: 0, cycles: 5, active: true },
  { id: 'slow', name: 'Slow breathing', inhale: 5, hold: 0, exhale: 5, pause: 0, cycles: 5, active: true }
]

const requestWindows = new Map<string, { count: number; resetsAt: number }>()
const loginWindows = new Map<string, { count: number; resetsAt: number }>()
const aiRequestWindows = new Map<string, { count: number; resetsAt: number }>()
const activeChats = new Set<string>()
const activePreviews = new Set<string>()
const previewWindows = new Map<string, { count: number; resetsAt: number }>()
const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || 'unknown'
  const now = Date.now()
  const active = requestWindows.get(key)
  const bucket = !active || active.resetsAt < now ? { count: 0, resetsAt: now + 60_000 } : active
  bucket.count += 1
  requestWindows.set(key, bucket)
  res.setHeader('RateLimit-Limit', '120')
  res.setHeader('RateLimit-Remaining', String(Math.max(0, 120 - bucket.count)))
  if (bucket.count > 120) return res.status(429).json({ error: 'Too many requests. Please pause and try again in a minute.' })
  next()
}
const loginRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : 'unknown'
  const key = `${req.ip ?? 'unknown'}:${email}`
  const now = Date.now()
  const active = loginWindows.get(key)
  const bucket = !active || active.resetsAt < now ? { count: 0, resetsAt: now + 15 * 60_000 } : active
  bucket.count += 1
  loginWindows.set(key, bucket)
  if (bucket.count > 10) {
    res.setHeader('Retry-After', String(Math.ceil((bucket.resetsAt - now) / 1000)))
    return res.status(429).json({ error: 'Too many sign-in attempts. Wait before trying again.' })
  }
  next()
}
const consumeAiRequest = (userId: string) => {
  const now = Date.now(), active = aiRequestWindows.get(userId)
  const bucket = !active || active.resetsAt < now ? { count: 0, resetsAt: now + 15 * 60_000 } : active
  bucket.count += 1
  aiRequestWindows.set(userId, bucket)
  return bucket.count <= 30
}

async function bootstrapAdmin() {
  const email = config.ADMIN_EMAIL?.trim().toLowerCase()
  const password = config.ADMIN_PASSWORD
  if (!email || !password || users.some(user => user.email === email)) return
  if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.')
  users.push({ id: crypto.randomUUID(), name: 'CampusCare Admin', email, passwordHash: await bcrypt.hash(password, 12), role: 'ADMIN' })
}

app.disable('x-powered-by')
app.use((_, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site')
  next()
})
app.use(cors({ origin: config.CLIENT_ORIGIN }))
app.use(rateLimit)
app.use(express.json({ limit: '100kb' }))

const sign = (user: User) => jwt.sign({ sub: user.id, role: user.role }, jwtSecret, { expiresIn: '8h' })
const auth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Authentication required.' })
  try {
    const payload = jwt.verify(token, jwtSecret) as JwtPayload
    const user = users.find(item => item.id === String(payload.sub))
    if (!user) return res.status(401).json({ error: 'Your account is no longer available.' })
    req.user = { id: user.id, role: user.role }
    next()
  }
  catch { return res.status(401).json({ error: 'Your session is invalid or expired.' }) }
}
const admin = (req: AuthedRequest, res: Response, next: NextFunction) => req.user?.role === 'ADMIN' ? next() : res.status(403).json({ error: 'Admin access required.' })

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'CampusCare API' }))
app.post('/api/auth/register', async (req, res) => {
  const parsed = z.object({ name: z.string().min(2).max(80), email: z.string().email(), password: z.string().min(8).max(72) }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Enter a name, valid email, and password of at least 8 characters.' })
  if (config.ADMIN_EMAIL && parsed.data.email.toLowerCase() === config.ADMIN_EMAIL.toLowerCase()) return res.status(403).json({ error: 'This address is reserved for college administration.' })
  if (users.some(user => user.email === parsed.data.email.toLowerCase())) return res.status(409).json({ error: 'An account with this email already exists.' })
  const user: User = { id: crypto.randomUUID(), name: parsed.data.name, email: parsed.data.email.toLowerCase(), passwordHash: await bcrypt.hash(parsed.data.password, 12), role: 'STUDENT' }
  users.push(user); return res.status(201).json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})
app.post('/api/auth/login', loginRateLimit, async (req, res) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Enter your email and password.' })
  const user = users.find(item => item.email === parsed.data.email.toLowerCase())
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return res.status(401).json({ error: 'Incorrect email or password.' })
  return res.json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } })
})
app.get('/api/me', auth, (req: AuthedRequest, res) => { const user = users.find(item => item.id === req.user!.id); return user ? res.json({ id: user.id, name: user.name, email: user.email, role: user.role }) : res.status(404).json({ error: 'Account not found.' }) })
app.post('/api/preview/chat', async (req, res) => {
  const parsed = z.object({
    message: z.string().trim().min(1).max(4000),
    language: z.enum(['auto', 'english', 'tanglish']).default('auto'),
    history: z.array(z.object({ role: z.enum(['USER', 'ASSISTANT']), message: z.string().max(6000) })).max(8).default([])
  }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Send a message up to 4,000 characters with a short conversation history.' })
  const result = analyseMessage(parsed.data.message, parsed.data.language, parsed.data.history)
  const makeReply = (message: string, assistantMode: 'ai' | 'rules' | 'reference', details = {}) => ({ reply: { id: crypto.randomUUID(), role: 'ASSISTANT', message, category: result.category, createdAt: new Date().toISOString(), assistantMode, language: result.language, needsHumanSupport: result.needsHumanSupport, ...details }, urgent: result.category === 'crisis', assistantMode })
  if (result.category === 'crisis') return chatTransport(req, res).complete(makeReply(result.response, 'rules'))
  const reference = createReferenceReply(parsed.data.message, result.language, parsed.data.history)
  if (reference) {
    const { message, assistantMode, ...details } = reference
    return chatTransport(req, res).complete(makeReply(message, assistantMode, details))
  }
  // Anonymous preview may use only the local model; never spend cloud credits or send guest chats to a cloud provider.
  if (config.AI_PROVIDER !== 'ollama') return res.status(503).json({ error: 'Live preview requires local Ollama. Sign in to use the configured cloud assistant.' })
  const key = req.ip ?? 'local', now = Date.now(), previous = previewWindows.get(key)
  const window = previous && previous.resetsAt > now ? previous : { count: 0, resetsAt: now + 15 * 60_000 }
  if (activePreviews.has(key)) return res.status(409).json({ error: 'Your preview message is still being answered.' })
  if (window.count >= 20) { res.setHeader('Retry-After', Math.ceil((window.resetsAt - now) / 1000)); return res.status(429).json({ error: 'Preview has reached its message limit. Please try again later or sign in.' }) }
  window.count += 1
  previewWindows.set(key, window)
  for (const [ip, entry] of previewWindows) if (entry.resetsAt <= now) previewWindows.delete(ip)
  activePreviews.add(key)
  const transport = chatTransport(req, res)
  try {
    const generated = await createStudentReply({ message: parsed.data.message, category: result.category, recent: parsed.data.history, resources, tips, language: parsed.data.language, onText: transport.onText, signal: transport.signal })
    if (!generated) return transport.fail('The local assistant could not finish a reply. Please try again.')
    const { message, assistantMode, ...details } = generated
    return transport.complete(makeReply(message, assistantMode, details))
  } catch {
    return transport.fail(result.language === 'tanglish' ? 'Local AI ippo reply panna mudiyala. Konjam short-ah kelvi kettu marubadi try pannunga.' : 'The local assistant could not finish in time or is unavailable. Try a shorter question or try again shortly.')
  } finally { activePreviews.delete(key) }
})
app.post('/api/chat', auth, async (req: AuthedRequest, res) => {
  const parsed = z.object({ message: z.string().trim().min(1).max(4000), language: z.enum(['auto', 'english', 'tanglish']).default('auto') }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Please enter a message up to 4,000 characters.' })
  const userId = req.user!.id, recent = chats.filter(chat => chat.userId === userId).slice(-8)
  const result = analyseMessage(parsed.data.message, parsed.data.language, recent), now = new Date().toISOString()
  if (!users.some(user => user.id === userId)) return res.status(401).json({ error: 'Please sign in again.' })
  if (result.category !== 'crisis' && activeChats.has(userId)) return res.status(409).json({ error: 'Your previous message is still being answered.' })
  const userChat = { id: crypto.randomUUID(), userId, role: 'USER' as const, message: parsed.data.message, category: result.category, createdAt: now, needsHumanSupport: result.needsHumanSupport }
  const transport = chatTransport(req, res)
  let response = result.response, assistantMode: 'ai' | 'rules' | 'reference' = 'rules'
  let generated: Awaited<ReturnType<typeof createStudentReply>> = result.category === 'crisis' ? null : createReferenceReply(parsed.data.message, result.language, recent)
  if (generated) { response = generated.message; assistantMode = generated.assistantMode }
  if (!generated && result.category !== 'crisis' && aiSupportEnabled() && consumeAiRequest(userId)) {
    activeChats.add(userId)
    try {
      generated = await createStudentReply({
        message: parsed.data.message,
        language: parsed.data.language,
        category: result.category,
        recent,
        resources,
        tips,
        onText: transport.onText,
        signal: transport.signal
      })
      if (generated) { response = generated.message; assistantMode = generated.assistantMode }
    } catch { console.warn('Student assistant interrupted or unavailable. No message content logged.') }
    finally { activeChats.delete(userId) }
  }
  if (assistantMode === 'rules' && result.category === 'general') response = result.language === 'tanglish'
    ? 'Local AI ippo reply panna mudiyala. Konjam neram kazhichu try pannunga. Basic student support-kku enna help venum-nu sollunga.'
    : 'The local knowledge assistant is temporarily unavailable. Please try again shortly. I can still provide basic wellbeing support and campus guidance.'
  if (transport.signal.aborted) return
  const assistantChat = { id: crypto.randomUUID(), userId, role: 'ASSISTANT' as const, message: response, category: result.category, createdAt: new Date().toISOString(), assistantMode, model: generated?.model, sources: generated?.sources ?? [], truncated: generated?.truncated ?? false, language: result.language, needsHumanSupport: result.needsHumanSupport }
  chats.push(userChat, assistantChat); return transport.complete({ reply: assistantChat, urgent: result.category === 'crisis', assistantMode })
})
app.get('/api/chats', auth, (req: AuthedRequest, res) => res.json(chats.filter(chat => chat.userId === req.user!.id).slice(-100)))
app.post('/api/moods', auth, (req: AuthedRequest, res) => {
  const parsed = z.object({ score: z.number().int().min(1).max(5), label: z.string().min(1).max(30), note: z.string().max(500).optional() }).safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Choose a mood from 1 to 5.' })
  const mood = { id: crypto.randomUUID(), userId: req.user!.id, ...parsed.data, createdAt: new Date().toISOString() }; moods.push(mood); return res.status(201).json(mood)
})
app.get('/api/moods', auth, (req: AuthedRequest, res) => res.json(moods.filter(mood => mood.userId === req.user!.id).slice(-30)))
app.get('/api/resources', (_, res) => res.json(resources))
app.get('/api/tips', (_, res) => res.json(tips))
app.get('/api/exercises', (_, res) => res.json(exercises.filter(item => item.active)))

const resourceInput = z.object({ title: z.string().trim().min(2).max(120), description: z.string().trim().min(5).max(1500), contact: z.string().trim().min(2).max(200), hours: z.string().trim().min(2).max(120), kind: z.string().trim().min(2).max(30), verified: z.boolean().default(false) })
const tipInput = z.object({ category: z.string().trim().min(2).max(40), title: z.string().trim().min(2).max(120), body: z.string().trim().min(5).max(1200) })
const exerciseInput = z.object({ name: z.string().trim().min(2).max(80), inhale: z.number().int().min(1).max(20), hold: z.number().int().min(0).max(20), exhale: z.number().int().min(1).max(20), pause: z.number().int().min(0).max(20), cycles: z.number().int().min(1).max(20), active: z.boolean().default(true) })

app.get('/api/admin/analytics', auth, admin, (_, res) => {
  const categories = chats.filter(item => item.role === 'USER' && item.category).reduce<Record<string, number>>((all, item) => ({ ...all, [item.category!]: (all[item.category!] ?? 0) + 1 }), {})
  res.json({ registeredStudents: users.filter(user => user.role === 'STUDENT').length, messages: chats.length, moodCheckIns: moods.length, riskAlerts: chats.filter(item => item.role === 'USER' && item.needsHumanSupport).length, categories })
})
app.get('/api/admin/conversations', auth, admin, (_, res) => res.json(chats.slice(-250).map(item => { const user = users.find(entry => entry.id === item.userId); return { ...item, studentName: user?.name ?? 'Unknown student', studentEmail: user?.email ?? '' } })))
app.get('/api/admin/alerts', auth, admin, (_, res) => res.json(chats.filter(item => item.role === 'USER' && item.needsHumanSupport).slice(-100).map(item => { const user = users.find(entry => entry.id === item.userId); return { ...item, studentName: user?.name ?? 'Unknown student', studentEmail: user?.email ?? '' } })))
app.get('/api/admin/moods', auth, admin, (_, res) => res.json(moods.slice(-250).map(item => ({ ...item, studentName: users.find(user => user.id === item.userId)?.name ?? 'Unknown student' }))))
app.get('/api/admin/users', auth, admin, (_, res) => res.json(users.map(({ passwordHash: _, ...user }) => user)))
app.get('/api/admin/settings', auth, admin, (_, res) => res.json({ aiProvider: config.AI_PROVIDER, model: config.AI_PROVIDER === 'ollama' ? config.OLLAMA_MODEL : config.AI_MODEL, storage: 'In-memory development store', campusOrigin: config.CLIENT_ORIGIN }))

app.get('/api/admin/resources', auth, admin, (_, res) => res.json(resources))
app.post('/api/admin/resources', auth, admin, (req, res) => { const parsed = resourceInput.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: 'Complete every resource field.' }); const resource = { id: crypto.randomUUID(), ...parsed.data }; resources = [...resources, resource]; res.status(201).json(resource) })
app.patch('/api/admin/resources/:id', auth, admin, (req, res) => { const parsed = resourceInput.safeParse(req.body), index = resources.findIndex(item => item.id === req.params.id); if (index < 0) return res.status(404).json({ error: 'Resource not found.' }); if (!parsed.success) return res.status(400).json({ error: 'Complete every resource field.' }); resources[index] = { id: resources[index].id, ...parsed.data }; res.json(resources[index]) })
app.delete('/api/admin/resources/:id', auth, admin, (req, res) => { const before = resources.length; resources = resources.filter(item => item.id !== req.params.id); return resources.length === before ? res.status(404).json({ error: 'Resource not found.' }) : res.status(204).end() })

app.get('/api/admin/tips', auth, admin, (_, res) => res.json(tips))
app.post('/api/admin/tips', auth, admin, (req, res) => { const parsed = tipInput.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: 'Complete every wellness tip field.' }); const item = { id: crypto.randomUUID(), ...parsed.data }; tips = [...tips, item]; res.status(201).json(item) })
app.patch('/api/admin/tips/:id', auth, admin, (req, res) => { const parsed = tipInput.safeParse(req.body), index = tips.findIndex(item => item.id === req.params.id); if (index < 0) return res.status(404).json({ error: 'Wellness tip not found.' }); if (!parsed.success) return res.status(400).json({ error: 'Complete every wellness tip field.' }); tips[index] = { id: tips[index].id, ...parsed.data }; res.json(tips[index]) })
app.delete('/api/admin/tips/:id', auth, admin, (req, res) => { const before = tips.length; tips = tips.filter(item => item.id !== req.params.id); return tips.length === before ? res.status(404).json({ error: 'Wellness tip not found.' }) : res.status(204).end() })

app.get('/api/admin/exercises', auth, admin, (_, res) => res.json(exercises))
app.post('/api/admin/exercises', auth, admin, (req, res) => { const parsed = exerciseInput.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: 'Enter a valid breathing pattern.' }); const item = { id: crypto.randomUUID(), ...parsed.data }; exercises = [...exercises, item]; res.status(201).json(item) })
app.patch('/api/admin/exercises/:id', auth, admin, (req, res) => { const parsed = exerciseInput.safeParse(req.body), index = exercises.findIndex(item => item.id === req.params.id); if (index < 0) return res.status(404).json({ error: 'Breathing exercise not found.' }); if (!parsed.success) return res.status(400).json({ error: 'Enter a valid breathing pattern.' }); exercises[index] = { id: exercises[index].id, ...parsed.data }; res.json(exercises[index]) })
app.delete('/api/admin/exercises/:id', auth, admin, (req, res) => { const before = exercises.length; exercises = exercises.filter(item => item.id !== req.params.id); return exercises.length === before ? res.status(404).json({ error: 'Breathing exercise not found.' }) : res.status(204).end() })
app.get('/api/openapi.json', (_, res) => res.json({ openapi: '3.0.3', info: { title: 'CampusCare API', version: '1.0.0', description: 'Early-support resource guidance. This API does not diagnose mental health conditions.' }, paths: { '/api/auth/register': { post: { summary: 'Create student account' } }, '/api/auth/login': { post: { summary: 'Sign in' } }, '/api/chat': { post: { summary: 'Submit a support check-in' } }, '/api/moods': { get: { summary: 'List mood history' }, post: { summary: 'Record a mood' } }, '/api/resources': { get: { summary: 'List campus resources' } } } }))
app.use((_: Request, res: Response) => res.status(404).json({ error: 'Route not found.' }))
await bootstrapAdmin()
if (!process.env.VERCEL) app.listen(PORT, () => {
  console.log(`CampusCare API listening on http://localhost:${PORT}`)
  void warmLocalModel()
})

export default app
