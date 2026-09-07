export type StudentView = 'chat' | 'resources' | 'breathing' | 'help' | 'history'
export type AdminView = 'overview' | 'conversations' | 'alerts' | 'resources' | 'tips' | 'exercises' | 'moods' | 'users' | 'settings'

const studentPaths: Record<StudentView, string> = {
  chat: '/chat', resources: '/resources', breathing: '/breathing', help: '/help', history: '/history'
}
const adminPaths: Record<AdminView, string> = {
  overview: '/admin', conversations: '/admin/conversations', alerts: '/admin/alerts', resources: '/admin/resources', tips: '/admin/tips', exercises: '/admin/exercises', moods: '/admin/moods', users: '/admin/users', settings: '/admin/settings'
}

const clean = (pathname: string) => pathname.replace(/\/+$/, '') || '/'

export function studentViewFor(pathname: string): StudentView {
  const path = clean(pathname)
  return (Object.keys(studentPaths) as StudentView[]).find(view => studentPaths[view] === path) ?? 'chat'
}

export function adminViewFor(pathname: string): AdminView {
  const path = clean(pathname)
  return (Object.keys(adminPaths) as AdminView[]).find(view => adminPaths[view] === path) ?? 'overview'
}

export function studentRoute(view: StudentView, preview = false): string { return studentPaths[view] + (preview ? '?preview=1' : '') }
export function adminRoute(view: AdminView): string { return adminPaths[view] }
