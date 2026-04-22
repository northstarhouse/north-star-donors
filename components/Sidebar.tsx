'use client'
import { Heart } from 'lucide-react'

const NAV = [
  { label: 'Donations', icon: Heart, active: true },
]

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen flex-shrink-0 flex flex-col" style={{ background: 'var(--sidebar-bg)' }}>
      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-base leading-none">✦</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
              North Star House
            </p>
            <p className="text-white/40 text-[10px] leading-tight mt-0.5">Julia Morgan · Est 1905</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              active
                ? 'bg-white text-[#1C1B1A] font-medium'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
