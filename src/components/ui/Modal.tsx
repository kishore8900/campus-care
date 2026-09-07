import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

export function Modal({ title, description, children, onClose, footer }: { title: string; description?: string; children: ReactNode; onClose: () => void; footer?: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { closeRef.current?.focus(); const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [onClose])
  return <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby={description ? 'modal-description' : undefined}>
      <header><div><h2 id="modal-title">{title}</h2>{description && <p id="modal-description">{description}</p>}</div><Button ref={closeRef} variant="ghost" className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18}/></Button></header>
      <div className="modal-body">{children}</div>
      {footer && <footer className="modal-footer">{footer}</footer>}
    </section>
  </div>
}
