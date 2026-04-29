'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getAppToken, setAppToken, clearAppToken } from '@/lib/app-token'

type GateState = 'checking' | 'locked' | 'unlocked'

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [state, setState]       = useState<GateState>('checking')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [busy, setBusy]         = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // Clear any stale Supabase auth session left over from prior magic-link flow.
      // Idempotent and harmless if no session exists.
      try { await supabase.auth.signOut({ scope: 'local' }) } catch { /* ignore */ }

      const token = getAppToken()
      if (!token) { if (!cancelled) setState('locked'); return }

      const { data, error } = await supabase.rpc('has_valid_app_session')
      if (cancelled) return

      if (error || !data) {
        clearAppToken()
        setState('locked')
      } else {
        setState('unlocked')
      }
    })()
    return () => { cancelled = true }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { data, error } = await supabase.rpc('verify_app_password', {
        p_password:   password,
        p_user_agent: navigator.userAgent.slice(0, 200),
      })
      if (error) {
        setError('Something went wrong. Try again.')
        return
      }
      if (!data) {
        setError('Wrong password.')
        return
      }
      setAppToken(data as string)
      setPassword('')
      setState('unlocked')
    } finally {
      setBusy(false)
    }
  }

  if (state === 'checking') {
    return null
  }

  if (state === 'locked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-stone-800 mb-2">North Star House</h1>
          <p className="text-sm text-stone-500 mb-6">Enter the password to view donor data.</p>

          <label className="block text-sm font-medium text-stone-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={busy}
            autoFocus
            required
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
          />

          {error && (
            <p className="text-sm text-red-600 mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy || !password}
            className="w-full px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: '#b8923a' }}
          >
            {busy ? 'Checking…' : 'Sign in'}
          </button>

          <p className="text-xs text-stone-400 mt-6">Need access? Ask Haley.</p>
        </form>
      </div>
    )
  }

  return <>{children}</>
}
