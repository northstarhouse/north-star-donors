'use client'

import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Props {
  children: React.ReactNode
  redirectTo?: string
}

export default function RequireAuthStatic({ children, redirectTo = '/login' }: Props) {
  const router = useRouter()
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    let mounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setUser(data.user ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (user === null) router.replace(redirectTo)
  }, [user, router, redirectTo])

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-sm text-stone-400">Checking sign-in…</p>
      </div>
    )
  }

  if (user === null) {
    return null
  }

  return <>{children}</>
}
