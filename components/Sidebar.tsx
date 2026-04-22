'use client'
import { Heart } from 'lucide-react'

const NAV = [
  { id: 'donors', label: 'Donations', icon: Heart, active: true },
]

export default function Sidebar() {
  return (
    <aside style={{ width: 220, background: '#2a2a2e', minHeight: '100vh', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 20px 14px' }}>
        <img src="/north-star-donors/assets/logo.png" alt="North Star House" style={{ width: 195 }} />
      </div>
      <div style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }} />
      <nav style={{ flex: 1, padding: '8px 8px 0' }}>
        {NAV.map(({ id, label, icon: Icon, active }) => (
          <div
            key={id}
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
              cursor: 'default',
            }}
          >
            <Icon size={15} strokeWidth={1.75} />
            {label}
          </div>
        ))}
      </nav>
    </aside>
  )
}
