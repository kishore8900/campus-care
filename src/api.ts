import axios from 'axios'
import { ChatRequestError, readChatResponse } from './chat-stream'

export type SessionUser = { id: string; name: string; email: string; role: 'STUDENT' | 'ADMIN' }
export type ReplyLanguage = 'auto' | 'english' | 'tanglish'
export type ApiChat = { id: string; role: 'USER' | 'ASSISTANT'; message: string; category?: string; createdAt: string; assistantMode?: 'ai' | 'rules' | 'reference'; model?: string; sources?: { id: string; title: string }[]; truncated?: boolean; needsHumanSupport?: boolean; language?: 'english' | 'tanglish'; streaming?: boolean }
export type ChatReply = { reply: ApiChat; urgent: boolean; assistantMode: 'ai' | 'rules' | 'reference' }
export type ApiMood = { id: string; score: number; label: string; note?: string; createdAt: string }
export type CampusResource = { id: string; title: string; description: string; contact: string; hours: string; kind: string; verified?: boolean }
export type WellnessTip = { id: string; category: string; title: string; body: string }
export type BreathingExercise = { id: string; name: string; inhale: number; hold: number; exhale: number; pause: number; cycles: number; active: boolean }
export type Analytics = { registeredStudents: number; messages: number; moodCheckIns: number; riskAlerts: number; categories: Record<string, number> }
export type AdminConversation = ApiChat & { userId: string; studentName: string; studentEmail: string }
export type AdminMood = ApiMood & { userId: string; studentName: string }
export type AdminUser = SessionUser & { createdAt?: string; updatedAt?: string }
export type AdminSettings = { aiProvider: string; model: string; storage: string; campusOrigin: string }

// In development, use the website's API proxy so the chat shares its origin.
const client = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '' })
let token = localStorage.getItem('campuscare.token')

client.interceptors.request.use(config => {
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const sessionToken = () => token
export const setSessionToken = (next: string | null) => {
  token = next
  if (next) localStorage.setItem('campuscare.token', next)
  else localStorage.removeItem('campuscare.token')
}
export const apiError = (error: unknown) => error instanceof ChatRequestError ? error.message : axios.isAxiosError(error) ? String(error.response?.data?.error ?? 'Something went wrong. Please try again.') : 'Something went wrong. Please try again.'
type ChatOptions = { signal?: AbortSignal; onText?: (text: string) => void }
async function requestChat(path: string, payload: unknown, options: ChatOptions = {}) {
  const signal = AbortSignal.any([AbortSignal.timeout(60_000), ...(options.signal ? [options.signal] : [])])
  try {
    const response = await fetch((client.defaults.baseURL ?? '').replace(/\/$/, '') + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: JSON.stringify(payload), signal
    })
    return await readChatResponse(response, options.onText)
  } catch (error) {
    if (error instanceof ChatRequestError || options.signal?.aborted) throw error
    throw new ChatRequestError(signal.aborted ? 'The reply took too long. Please try a shorter question.' : 'The chat server is reconnecting. Your message has been kept—please try sending it again in a moment.')
  }
}
export const authApi = {
  register: (payload: { name: string; email: string; password: string }) => client.post<{ token: string; user: SessionUser }>('/api/auth/register', payload).then(r => r.data),
  login: (payload: { email: string; password: string }) => client.post<{ token: string; user: SessionUser }>('/api/auth/login', payload).then(r => r.data),
  me: () => client.get<SessionUser>('/api/me').then(r => r.data)
}
export const supportApi = {
  chats: () => client.get<ApiChat[]>('/api/chats').then(r => r.data),
  send: (message: string, language: ReplyLanguage = 'auto', options?: ChatOptions) => requestChat('/api/chat', { message, language }, options),
  preview: (message: string, history: ApiChat[], language: ReplyLanguage = 'auto', options?: ChatOptions) => requestChat('/api/preview/chat', { message, language, history: history.filter(item => !item.streaming).slice(-8).map(item => ({ role: item.role, message: item.message.slice(0, 6000) })) }, options),
  moods: () => client.get<ApiMood[]>('/api/moods').then(r => r.data),
  recordMood: (payload: { score: number; label: string }) => client.post<ApiMood>('/api/moods', payload).then(r => r.data),
  resources: () => client.get<CampusResource[]>('/api/resources').then(r => r.data),
  tips: () => client.get<WellnessTip[]>('/api/tips').then(r => r.data),
  exercises: () => client.get<BreathingExercise[]>('/api/exercises').then(r => r.data)
}

export const adminApi = {
  analytics: () => client.get<Analytics>('/api/admin/analytics').then(r => r.data),
  conversations: () => client.get<AdminConversation[]>('/api/admin/conversations').then(r => r.data),
  alerts: () => client.get<AdminConversation[]>('/api/admin/alerts').then(r => r.data),
  moods: () => client.get<AdminMood[]>('/api/admin/moods').then(r => r.data),
  users: () => client.get<AdminUser[]>('/api/admin/users').then(r => r.data),
  settings: () => client.get<AdminSettings>('/api/admin/settings').then(r => r.data),
  resources: () => client.get<CampusResource[]>('/api/admin/resources').then(r => r.data),
  addResource: (payload: Omit<CampusResource, 'id'>) => client.post<CampusResource>('/api/admin/resources', payload).then(r => r.data),
  updateResource: (id: string, payload: Omit<CampusResource, 'id'>) => client.patch<CampusResource>(`/api/admin/resources/${id}`, payload).then(r => r.data),
  deleteResource: (id: string) => client.delete(`/api/admin/resources/${id}`),
  tips: () => client.get<WellnessTip[]>('/api/admin/tips').then(r => r.data),
  addTip: (payload: Omit<WellnessTip, 'id'>) => client.post<WellnessTip>('/api/admin/tips', payload).then(r => r.data),
  updateTip: (id: string, payload: Omit<WellnessTip, 'id'>) => client.patch<WellnessTip>(`/api/admin/tips/${id}`, payload).then(r => r.data),
  deleteTip: (id: string) => client.delete(`/api/admin/tips/${id}`),
  exercises: () => client.get<BreathingExercise[]>('/api/admin/exercises').then(r => r.data),
  addExercise: (payload: Omit<BreathingExercise, 'id'>) => client.post<BreathingExercise>('/api/admin/exercises', payload).then(r => r.data),
  updateExercise: (id: string, payload: Omit<BreathingExercise, 'id'>) => client.patch<BreathingExercise>(`/api/admin/exercises/${id}`, payload).then(r => r.data),
  deleteExercise: (id: string) => client.delete(`/api/admin/exercises/${id}`)
}
