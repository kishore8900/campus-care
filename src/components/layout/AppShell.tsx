import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { HelpCircle, LogOut, Menu, Shield, UserRound, X } from 'lucide-react'
import type { SessionUser } from '../../api'
import Button from '../ui/Button'

export type NavItem<T extends string> = { id: T; label: string; icon: ComponentType<{ size?: number }> ; badge?: number }

export function AppShell<T extends string>({ productName, user, active, navigation, onNavigate, onSignOut, children, urgentAction, footerNote }: { productName: string; user: SessionUser; active: T; navigation: NavItem<T>[]; onNavigate: (view: T) => void; onSignOut: () => void; children: ReactNode; urgentAction?: () => void; footerNote?: string }) {
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(false), [active])
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <aside className={`app-sidebar ${open ? 'is-open' : ''}`} aria-label={`${productName} navigation`}>
      <div className="sidebar-brand"><span className="brand-mark" aria-hidden="true"><Shield size={18}/></span><span>{productName}</span><Button variant="ghost" className="sidebar-close icon-button" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={20}/></Button></div>
      <nav className="nav-list">{navigation.map(({ id, label, icon: Icon, badge }) => <button key={id} type="button" className={active === id ? 'nav-item active' : 'nav-item'} aria-current={active === id ? 'page' : undefined} onClick={() => onNavigate(id)}><Icon size={18}/><span>{label}</span>{badge ? <strong aria-label={`${badge} items`}>{badge}</strong> : null}</button>)}</nav>
      <div className="sidebar-footer">
        {footerNote && <p className="privacy-summary"><Shield size={16}/>{footerNote}</p>}
        <div className="user-summary"><UserRound size={18}/><span><strong>{user.name}</strong><small>{user.email}</small></span></div>
        <button type="button" className="nav-item" onClick={onSignOut}><LogOut size={18}/><span>Sign out</span></button>
      </div>
    </aside>
    {open && <button type="button" className="sidebar-scrim" aria-label="Close navigation" onClick={() => setOpen(false)}/>} 
    <div className="app-main">
      <header className="mobile-header"><Button variant="ghost" className="icon-button" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20}/></Button><strong>{productName}</strong>{urgentAction ? <Button variant="ghost" className="icon-button urgent-icon" onClick={urgentAction} aria-label="Get urgent help"><HelpCircle size={20}/></Button> : <span/>}</header>
      <main id="main-content" tabIndex={-1}>{children}</main>
    </div>
  </div>
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) { return <header className="page-header"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="page-actions">{action}</div>}</header> }
