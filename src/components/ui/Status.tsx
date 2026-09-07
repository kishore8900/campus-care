import type { ReactNode } from 'react'
import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react'
import Button from './Button'

export function LoadingState({ label = 'Loading…' }: { label?: string }) { return <div className="state-block" role="status"><LoaderCircle className="spin" size={20}/><p>{label}</p></div> }
export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) { return <div className="state-block"><Inbox size={22}/><h3>{title}</h3><p>{description}</p>{action}</div> }
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) { return <div className="state-block state-error" role="alert"><AlertCircle size={22}/><h3>Could not load this page</h3><p>{message}</p>{onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}</div> }
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) { return <span className={`badge badge-${tone}`}>{children}</span> }
