import { Suspense } from 'react'
import CallbackClient from './callback-client'

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
          <p className="text-sm text-stone-400">Signing you in…</p>
        </div>
      }
    >
      <CallbackClient />
    </Suspense>
  )
}
