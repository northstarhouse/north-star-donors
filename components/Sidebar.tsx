'use client'
import Link from 'next/link'
import { LayoutDashboard, Heart, List, Award } from 'lucide-react'

function CoordIcon({ size = 15, strokeWidth = 1.75 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="4"  r="2" />
      <circle cx="19" cy="16" r="2" />
      <circle cx="5"  cy="16" r="2" />
    </svg>
  )
}

const NAV = [
  { id: 'dashboard',   label: 'Development',       icon: LayoutDashboard, href: '/' },
  { id: 'donations',   label: 'Donations',          icon: Heart,           href: '/donations/' },
  { id: 'sponsors',    label: 'Sponsors',           icon: Award,           href: '/sponsors/' },
  { id: 'lists',       label: 'Lists',              icon: List,            href: '/lists/' },
  { id: 'coordination', label: 'Cross-Coordination', icon: CoordIcon,      href: '/coordination/' },
]

interface Props {
  activePage?: string
}

export default function Sidebar({ activePage }: Props) {
  return (
    <aside style={{ width: 220, background: '#2a2a2e', minHeight: '100vh', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 20px 14px' }}>
        <img src="/north-star-donors/assets/logo.png" alt="North Star House" style={{ width: 195 }} />
      </div>
      <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }} />
      <nav style={{ flex: 1, padding: '8px 8px 0' }}>
        {NAV.map(({ id, label, icon: Icon, href }) => {
          const active = activePage === id
          return (
            <Link
              key={id}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '9px 12px',
                borderRadius: 7,
                marginBottom: 2,
                fontSize: 12,
                fontWeight: active ? 600 : 400,
                background: active ? 'rgba(181,161,133,0.15)' : 'transparent',
                color: active ? '#f0ebe3' : 'rgba(255,255,255,0.5)',
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <Icon size={15} strokeWidth={1.75} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
