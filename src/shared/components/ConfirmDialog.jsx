import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

const ConfirmContext = createContext(null)

export function ConfirmProvider({ children }) {
  const [options, setOptions] = useState(null)
  const resolveRef = useRef(null)

  const confirm = useCallback((nextOptions) => new Promise((resolve) => {
    resolveRef.current = resolve
    setOptions(nextOptions)
  }), [])

  const close = useCallback((confirmed) => {
    resolveRef.current?.(confirmed)
    resolveRef.current = null
    setOptions(null)
  }, [])

  return <ConfirmContext.Provider value={confirm}>
    {children}
    <ConfirmDialog isOpen={Boolean(options)} title={options?.title} message={options?.message} confirmLabel={options?.confirmLabel} onCancel={() => close(false)} onConfirm={() => close(true)} />
  </ConfirmContext.Provider>
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm must be used within ConfirmProvider')
  return confirm
}

export default function ConfirmDialog({ isOpen, title = 'Confirmer l’action', message, confirmLabel = 'Confirmer', onCancel, onConfirm, loading = false }) {
  if (!isOpen) return null

  return <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
    <button className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" aria-label="Annuler" onClick={loading ? undefined : onCancel} />
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="h-1.5 bg-red-600" />
      <div className="p-6 sm:p-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600"><AlertTriangle className="h-7 w-7" /></div>
        <h2 id="confirm-dialog-title" className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={onCancel} disabled={loading} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Annuler</button>
          <button type="button" onClick={onConfirm} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{confirmLabel}</button>
        </div>
      </div>
    </div>
  </div>
}
