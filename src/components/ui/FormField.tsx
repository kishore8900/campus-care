import type { ReactNode } from 'react'

export function FormField({ label, htmlFor, hint, error, required, children }: { label: string; htmlFor: string; hint?: string; error?: string; required?: boolean; children: ReactNode }) {
  const description = error ? `${htmlFor}-error` : hint ? `${htmlFor}-hint` : undefined
  return <div className="form-field">
    <label htmlFor={htmlFor}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    {children}
    {hint && !error && <p id={`${htmlFor}-hint`} className="field-hint">{hint}</p>}
    {error && <p id={`${htmlFor}-error`} className="field-error" role="alert">{error}</p>}
    {description && <span className="sr-only">Field details are provided below.</span>}
  </div>
}
