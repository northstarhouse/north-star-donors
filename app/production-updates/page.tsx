'use client'

import Link from 'next/link'
import { CalendarDays, Clock3, GitBranch, LayoutList } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

type Category = 'App' | 'Tasks' | 'Data' | 'System'

interface ProductionUpdate {
  id: string
  time: string
  category: Category
  title: string
  summary: string
  details?: string[]
  href?: string
}

interface ProductionUpdateDay {
  date: string
  label: string
  items: ProductionUpdate[]
}

const CATEGORY_STYLES: Record<Category, string> = {
  App: 'border-sky-200 bg-sky-50 text-sky-800',
  Tasks: 'border-amber-200 bg-amber-50 text-amber-800',
  Data: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  System: 'border-stone-200 bg-stone-100 text-stone-700',
}

const UPDATES: ProductionUpdateDay[] = [
  {
    date: 'May 15, 2026',
    label: 'Today',
    items: [
      {
        id: 'linear-followup-sandbox-batch',
        time: '3:45 PM',
        category: 'Tasks',
        title: 'Second meeting-notes triage batch promoted',
        summary: 'The remaining May 14 follow-up issues were moved from Linear through sandbox into the dashboard.',
        details: [
          'Added printer sponsorship, legacy giving, archive/delete, sponsor classification, and campaign-to-donor record rule tasks.',
          'Updated grants to point toward a first-class Grants dashboard surface.',
          'Marked the Touch 1 Constant Contact draft task done and folded Touch 1 monitoring into the existing reply-monitoring task.',
          'Marked the production changelog MVP done; automatic row-level audit logging remains future work.',
        ],
        href: '/task/?taskId=354ec910-8afa-4000-9f6e-eeb32c06044b',
      },
      {
        id: 'sandbox-task-batch',
        time: '11:31 AM',
        category: 'Tasks',
        title: 'Meeting-notes task batch promoted',
        summary: 'Five new dashboard tasks and one sponsorship task update were promoted from the May 14 meeting notes.',
        details: [
          'Added Constant Contact analytics, 2FA cleanup, person-focused view, postal follow-up, and production changelog tasks.',
          'Updated Sponsor Packet V2 with the $300 formal sponsorship floor.',
        ],
        href: '/task/?taskId=d6e030e1-547a-468a-8f2f-8cca456b39be',
      },
      {
        id: 'production-updates-surface',
        time: '11:18 AM',
        category: 'App',
        title: 'Production Updates surface added',
        summary: 'A bottom-sidebar destination now shows a quiet day-by-day log for production-visible changes.',
        details: [
          'This first version is display-only.',
          'Promotion-generated manual entries come before automatic row-change logging.',
        ],
      },
      {
        id: 'sponsor-tier',
        time: '10:05 AM',
        category: 'Tasks',
        title: 'Sponsor tier decision recorded',
        summary: 'Formal sponsor recognition floor changed to $300 and Community Sponsor now spans $300-$999.',
      },
    ],
  },
  {
    date: 'May 14, 2026',
    label: 'Yesterday',
    items: [
      {
        id: 'meeting-brief',
        time: '5:48 PM',
        category: 'App',
        title: 'May 14 meeting brief added to Meetings',
        summary: 'The donor app development meeting brief now appears alongside the May 7 meeting notes.',
        details: [
          'The brief opens without a duplicate app shell.',
          'Protected document content is served from Supabase.',
        ],
        href: '/meetings/',
      },
      {
        id: 'membership-context',
        time: '2:10 PM',
        category: 'Data',
        title: 'Membership campaign follow-up context captured',
        summary: 'Warm, Cold, and Brick Buyer email cohorts were identified as the next results to watch before postal follow-up design.',
      },
    ],
  },
  {
    date: 'May 12, 2026',
    label: 'Earlier',
    items: [
      {
        id: 'sender-setup',
        time: '8:45 PM',
        category: 'System',
        title: 'Constant Contact sender setup verified',
        summary: 'info@ was verified for campaign sending and the first long-lapsed renewal send moved into monitoring.',
      },
    ],
  },
]

function CategoryPill({ category }: { category: Category }) {
  return (
    <span className={`inline-flex h-6 items-center rounded-md border px-2 text-[11px] font-semibold ${CATEGORY_STYLES[category]}`}>
      {category}
    </span>
  )
}

function UpdateCard({ item }: { item: ProductionUpdate }) {
  return (
    <article className="rounded-md border border-stone-200 bg-white px-4 py-3">
      <div className="flex flex-wrap items-start gap-3">
        <CategoryPill category={item.category} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h3 className="text-sm font-semibold text-stone-900">{item.title}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
              <Clock3 size={12} />
              {item.time}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-stone-600">{item.summary}</p>
          {item.details && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold text-[#886c44]">Details</summary>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-stone-500">
                {item.details.map(detail => <li key={detail}>- {detail}</li>)}
              </ul>
            </details>
          )}
        </div>
        {item.href && (
          <Link href={item.href} className="rounded-md border border-stone-200 px-2 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50">
            Open
          </Link>
        )}
      </div>
    </article>
  )
}

export default function ProductionUpdatesPage() {
  return (
    <>
      <Sidebar activePage="production-updates" />
      <main className="flex-1 overflow-auto px-10 py-9">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-start justify-between gap-6">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-500">
                <GitBranch size={14} />
                Production-visible changes
              </div>
              <h1 className="font-serif text-4xl font-bold leading-tight text-[#886c44]">Production Updates</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                A quiet log of what changed in the live donor app. This starts as promotion-generated notes and can grow into automatic task/data logging later.
              </p>
            </div>
            <div className="hidden rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-500 md:block">
              <div className="flex items-center gap-2 font-semibold text-stone-700">
                <LayoutList size={15} className="text-[#886c44]" />
                Manual MVP
              </div>
              <p className="mt-1 max-w-52 text-xs leading-5">
                Entries are added during promotion batches for now.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {UPDATES.map((day, dayIndex) => (
              <section key={day.date} className="rounded-lg border border-stone-200 bg-white/70">
                <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <CalendarDays size={17} className="text-[#886c44]" />
                    <div>
                      <h2 className="text-sm font-bold text-stone-800">{day.date}</h2>
                      <p className="text-xs text-stone-400">{day.label} - {day.items.length} updates</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  {(dayIndex === 0 ? day.items : day.items.slice(0, 1)).map(item => <UpdateCard key={item.id} item={item} />)}
                  {dayIndex > 0 && day.items.length > 1 && (
                    <details className="rounded-md border border-stone-200 bg-white px-4 py-3">
                      <summary className="cursor-pointer text-xs font-semibold text-stone-500">
                        Show {day.items.length - 1} more
                      </summary>
                      <div className="mt-3 space-y-3">
                        {day.items.slice(1).map(item => <UpdateCard key={item.id} item={item} />)}
                      </div>
                    </details>
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
