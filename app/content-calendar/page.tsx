'use client'
import { CalendarDays } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import ContentCalendar from '@/components/ContentCalendar'

export default function ContentCalendarPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar activePage="content-calendar" />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm">
              <CalendarDays size={16} className="text-stone-400" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold)' }}>
              Content Calendar
            </h1>
          </div>
          <p className="text-sm text-stone-400">Plan social media, email/newsletter, blog, and event content by month.</p>

          <ContentCalendar />
        </div>
      </div>
    </div>
  )
}
