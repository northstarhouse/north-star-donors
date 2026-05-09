'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

interface ProtectedDocument {
  title: string
  content_html: string
}

interface ProtectedBareDocumentPageProps {
  slug: string
  backHref?: string
  backLabel?: string
}

export default function ProtectedBareDocumentPage({
  slug,
  backHref = '/',
  backLabel = 'Development Dashboard',
}: ProtectedBareDocumentPageProps) {
  const [document, setDocument] = useState<ProtectedDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [frameHeight, setFrameHeight] = useState(1200)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    let cancelled = false

    async function loadDocument() {
      setLoading(true)
      setError(null)

      const { data, error: loadError } = await supabase
        .from('protected_documents')
        .select('title,content_html')
        .eq('slug', slug)
        .single()

      if (cancelled) return

      if (loadError) {
        setError('The protected document could not be loaded.')
        setDocument(null)
      } else {
        setDocument(data as ProtectedDocument)
        setFrameHeight(1200)
      }

      setLoading(false)
    }

    loadDocument()

    return () => {
      cancelled = true
    }
  }, [slug])

  function resizeFrame() {
    const body = iframeRef.current?.contentDocument?.body
    const root = iframeRef.current?.contentDocument?.documentElement
    const height = Math.max(
      body?.scrollHeight ?? 0,
      root?.scrollHeight ?? 0,
      1200,
    )

    setFrameHeight(height + 8)
  }

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar activePage="dashboard" />

      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--page-bg)' }}>
        <div className="mx-auto max-w-7xl px-8 py-8">
          <Link href={backHref} className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-800">
            <ArrowLeft size={14} />
            {backLabel}
          </Link>

          {loading && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-16 text-sm text-stone-400 shadow-sm">
              <Loader2 size={16} className="animate-spin" />
              Loading protected document...
            </div>
          )}

          {!loading && error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && document && (
            <iframe
              ref={iframeRef}
              title={document.title}
              sandbox="allow-same-origin allow-top-navigation-by-user-activation"
              srcDoc={document.content_html}
              className="w-full rounded-xl border border-stone-200 bg-white shadow-sm"
              style={{ height: frameHeight }}
              onLoad={resizeFrame}
            />
          )}
        </div>
      </main>
    </div>
  )
}
