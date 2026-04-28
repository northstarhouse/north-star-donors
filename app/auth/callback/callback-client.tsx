'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function CallbackClient() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const [errorMsg, setError] = useState<string | null>(null)

  useEffect(() => {
    const tokenHash = searchParams.get('token_hash')
    const type      = searchParams.get('type')

    if (!tokenHash || !type) {
      setError('Sign-in link is missing required parameters. Try requesting a new one.')
      return
    }

    let cancelled = false

    ;(async () => {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type:       type as 'magiclink',
      })

      if (cancelled) return

      if (error) {
        setError(`Couldn't sign you in: ${error.message}. The link may have expired.`)
        return
      }

      router.replace('/donations')
    })()

    return () => { cancelled = true }
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-sm p-8 text-center">
        {errorMsg ? (
          <>
            <h1 className="text-lg font-semibold text-stone-800 mb-2">Sign-in failed</h1>
            <p className="text-sm text-stone-500 mb-4">{errorMsg}</p>
            <a href="/login" className="text-sm font-semibold underline" style={{ color: '#b8923a' }}>
              Request a new link
            </a>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-stone-800 mb-2">Signing you in…</h1>
            <p className="text-sm text-stone-500">One moment.</p>
          </>
        )}
      </div>
    </div>
  )
}
