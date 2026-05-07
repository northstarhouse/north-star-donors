'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, FileText, Loader2, TriangleAlert } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { supabase } from '@/lib/supabase'

interface ProtectedDocument {
  title: string
  status: string
  content_html: string
  updated_at: string
}

interface ProtectedDocumentPageProps {
  slug: string
  fallbackTitle: string
  backHref?: string
  backLabel?: string
  eyebrow?: string
  description?: string
  warning?: string
  actions?: Array<{
    href: string
    label: string
  }>
}

export default function ProtectedDocumentPage({
  slug,
  fallbackTitle,
  backHref = '/',
  backLabel = 'Fund Development',
  eyebrow = 'Protected review document',
  description = 'This page loads protected material from Supabase after the app password has been accepted.',
  warning = 'Draft operating overview. This is not final production copy.',
  actions = [],
}: ProtectedDocumentPageProps) {
  const [document, setDocument] = useState<ProtectedDocument | null>(null)
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
      } else {
        setDocument(data as ProtectedDocument)
      }

      setLoading(false)
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
        <div className="mx-auto max-w-5xl px-8 py-8">
          <Link href={backHref} className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-stone-500 hover:text-stone-800">
            <ArrowLeft size={14} />
            {backLabel}
          </Link>

          <section className="mb-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                  <FileText size={12} />
                  {eyebrow}
                </div>
                <h1 className="text-3xl font-semibold text-stone-900" style={{ fontFamily: 'var(--font-serif)' }}>
                  {document?.title ?? fallbackTitle}
                </h1>
                <p className="mt-2 text-sm leading-6 text-stone-500">
                  {description}
                </p>
                {actions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {actions.map(action => (
                      <Link
                        key={action.href}
                        href={action.href}
                        className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {document && (
                <div className="rounded-lg border border-stone-100 bg-stone-50 px-4 py-3 text-xs text-stone-500">
                  <p className="font-semibold text-stone-800">{document.status}</p>
                  <p className="mt-1">Updated {new Date(document.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <TriangleAlert size={17} className="mt-0.5 flex-shrink-0" />
              <p>{warning}</p>
            </div>
          </section>

          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-stone-400">
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
                title={document.title}
                sandbox="allow-top-navigation-by-user-activation"
                srcDoc={document.content_html}
                className="h-[1200px] w-full rounded-lg border border-stone-100 bg-white"
              />
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
