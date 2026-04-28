'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://northstarhouse.github.io/north-star-donors'

export default function LoginPage() {
  const [email, setEmail]    = useState('')
  const [status, setStatus]  = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${SITE_URL}/auth/callback`,
        shouldCreateUser: true,
      },
    })

    if (error) {
      setStatus('error')
      setError(error.message)
      return
    }
    setStatus('sent')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: '#b8923a' }}>
          North Star House
        </h1>
        <p className="text-sm text-stone-500 mb-6">
          Sign in to view donor data. We&rsquo;ll email you a one-time link.
        </p>

        {status === 'sent' ? (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
            Check <strong>{email}</strong> for a sign-in link.
            It works once and expires in 1 hour. You can close this tab.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs text-stone-500 font-medium">Email</span>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="haley@northstarhouse.org"
                className="mt-1 w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </label>

            <button
              type="submit"
              disabled={status === 'sending' || !email.trim()}
              className="w-full px-4 py-2 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
              style={{ background: '#b8923a' }}
            >
              {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
            </button>

            {status === 'error' && (
              <p className="text-xs text-red-600">
                {errorMsg ?? 'Something went wrong. Try again or contact Haley.'}
              </p>
            )}

            <p className="text-[11px] text-stone-400 pt-2">
              Only allowlisted emails can sign in. Need access? Ask Haley.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
