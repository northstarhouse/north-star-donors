'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, ExternalLink, FileText, Loader2, TriangleAlert } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

interface ProtectedDocument {
  title: string
  status: string
  content_html: string
  updated_at: string
}

interface ProtectedHtmlDocumentLauncherProps {
  slug: string
  fallbackTitle: string
  backHref?: string
  backLabel?: string
  eyebrow?: string
  description?: string
  warning?: string
}

export default function ProtectedHtmlDocumentLauncher({
  slug,
  fallbackTitle,
  backHref = '/',
  backLabel = 'Fund Development',
  eyebrow = 'Protected HTML document',
  description = 'This page loads protected HTML from Supabase after the app password has been accepted.',
  warning = 'Draft operating document. This is not final production copy.',
}: ProtectedHtmlDocumentLauncherProps) {
  const [document, setDocument] = useState<ProtectedDocument | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadDocument() {
      setLoading(true)
      setError(null)

      const { data, error: loadError } = await supabase
        .from('protected_documents')
        .select('title,status,content_html,updated_at')
        .eq('slug', slug)
        .single()

      if (cancelled) return

      if (loadError) {
        setError('The protected document could not be loaded.')
        setDocument(null)
        setLoading(false)
        return
      }

      const protectedDocument = data as ProtectedDocument
      const url = URL.createObjectURL(new Blob([protectedDocument.content_html], { type: 'text/html;charset=utf-8' }))

      setDocument(protectedDocument)
      setBlobUrl(url)
      setLoading(false)
      window.location.assign(url)
    }

    loadDocument()

    return () => {
      cancelled = true
    }
  }, [slug])

  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar activePage="dashboard" />

      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--page-bg)' }}>
        <div className="mx-auto max-w-3xl px-8 py-8">
          <Link href={backHref} className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-800">
            <ArrowLeft size={14} />
            {backLabel}
          </Link>

          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
              <FileText size={12} />
              {eyebrow}
            </div>

            <h1 className="text-3xl font-semibold text-stone-900" style={{ fontFamily: 'var(--font-serif)' }}>
              {document?.title ?? fallbackTitle}
            </h1>
            <p className="mt-2 text-sm leading-6 text-stone-500">{description}</p>

            <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <TriangleAlert size={17} className="mt-0.5 flex-shrink-0" />
              <p>{warning}</p>
            </div>

            {loading && (
              <div className="mt-6 flex items-center gap-2 text-sm text-stone-500">
                <Loader2 size={16} className="animate-spin" />
                Opening protected HTML document...
              </div>
            )}

            {!loading && error && (
              <div className="mt-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && blobUrl && (
              <a
                href={blobUrl}
                className="mt-6 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
              >
                <ExternalLink size={14} />
                Open document
              </a>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
