'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, ArrowRight, CheckCircle2, CircleDot, ExternalLink, FileText, Layers3, PauseCircle, ShieldQuestion } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

type LinearIssue = {
  identifier: string
  title: string
  state: string
  project: string | null
  priority: number
  assignee: string | null
  labels: string[]
  updatedAt: string
  description: string
  latestComments: Array<{ createdAt: string; user: string | null; body: string }>
}

type DashboardTask = {
  id: string
  title: string
  status: string
  label: string | null
  assigned_to: string | null
  due_date: string | null
  initiative: string | null
  area: string | null
  updated_at: string
  notes: string
}

type Snapshot = {
  generatedAt: string
  linearCount: number
  dashboardCount: number
  linear: LinearIssue[]
  tasks: DashboardTask[]
  sidecars: string[]
  logs: string[]
}

type Match = {
  issue: LinearIssue
  task: DashboardTask | null
  action: 'update' | 'port' | 'hold'
  sourceStatus: 'source found' | 'source needed' | 'needs review'
  reason: string
}

const variantLabels = [
  { id: 'matrix', label: 'Overview' },
  { id: 'board', label: 'Work Board' },
  { id: 'risk', label: 'Decisions' },
] as const

function isGrantLikeTask(task: DashboardTask) {
  const text = `${task.title} ${task.label || ''} ${task.notes}`.toLowerCase()
  if (/(email|membership|renewal|opt-in|opt in|constant contact)/.test(text)) return false
  return /(grant|fund|usda|bat|upstairs|door|pursued|community facilities|cultural district|arts council|nea|her)/.test(text)
}

function sourceStatus(issue: LinearIssue): Match['sourceStatus'] {
  const text = `${issue.title} ${issue.description} ${issue.latestComments.map(c => c.body).join(' ')}`.toLowerCase()
  if (text.includes('source needed') || text.includes('not verified') || text.includes('verify')) return 'source needed'
  if (text.includes('http') || text.includes('ca.gov') || text.includes('grants.gov') || text.includes('candid.org')) return 'source found'
  return 'needs review'
}

function directDashboardMatch(issue: LinearIssue, tasks: DashboardTask[]) {
  const title = issue.title.toLowerCase()
  const findTask = (pattern: RegExp) => tasks.find(task => pattern.test(task.title.toLowerCase()))

  if (title.includes('port current pursued grants')) return findTask(/port current pursued grants/)
  if (title.includes('usda community facilities')) return findTask(/usda community facilities/)
  if (title.includes('bat netting') || title.includes('upstairs doors')) return findTask(/bat netting|upstairs doors/)

  return null
}

function proposedAction(issue: LinearIssue, task: DashboardTask | null, status: Match['sourceStatus']): Match['action'] {
  if (issue.title.toLowerCase().includes('port current pursued grants')) return task ? 'update' : 'port'
  if (status === 'source needed') return 'hold'
  return task ? 'update' : 'port'
}

function buildMatches(snapshot: Snapshot): Match[] {
  const grantTasks = snapshot.tasks.filter(isGrantLikeTask)

  return snapshot.linear.map(issue => {
    const direct = directDashboardMatch(issue, grantTasks)
    const best = direct
    const status = sourceStatus(issue)
    const action = proposedAction(issue, best, status)
    const reason = best
      ? `Likely maps to existing dashboard task "${best.title}".`
      : status === 'source needed'
        ? 'Hold until public source/provenance is checked.'
        : 'No clear dashboard task match found.'

    return { issue, task: best, action, sourceStatus: status, reason }
  })
}

function badge(text: string, color = '#57534e', background = '#f5f5f4', border = '#e7e5e4') {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', border: `1px solid ${border}`, background, color, borderRadius: 999, padding: '3px 8px', fontSize: 11, fontWeight: 650 }}>
      {text}
    </span>
  )
}

function issueSummary(issue: LinearIssue) {
  const first = issue.description.split('\n').find(line => line.trim().length > 40)
  return first?.replace(/[*`]/g, '').trim() || issue.description.slice(0, 160)
}

function section(issue: LinearIssue, heading: string) {
  const lines = issue.description.split('\n')
  const start = lines.findIndex(line => line.trim().toLowerCase() === `## ${heading}`.toLowerCase())
  if (start === -1) return ''

  const body: string[] = []
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('## ')) break
    const cleaned = line.replace(/^\*\s*/, '').replace(/`/g, '').replace(/\[([^\]]+)\]\(<([^>]+)>\)/g, '$1').trim()
    if (cleaned) body.push(cleaned)
  }
  return body.join(' ')
}

function grantName(issue: LinearIssue) {
  if (issue.title.toLowerCase().includes('port current pursued grants')) return 'Current pursued grants'

  return issue.title
    .replace(/\s+-\s+.+$/, '')
    .replace(' and 12 upstairs doors', ' / upstairs doors')
    .trim() || 'Current pursued grants'
}

function timing(issue: LinearIssue) {
  const context = section(issue, 'Source context')
  const amount = context.match(/Amount: ([^.]+)\./)?.[1]
  const deadline = context.match(/Deadline(?: noted in Plane)?: ([^.]+)\./)?.[1]
  const window = context.match(/Window: ([^.]+)\./)?.[1]
  const date = context.match(/(?:Intent\/application date noted in Plane|Fall cycle opens around): ([^.]+)\./)?.[1]
  return [amount, deadline || window || date].filter(Boolean).join(' / ') || 'Timing to confirm'
}

function plainNextMove(issue: LinearIssue) {
  return section(issue, 'Next action') || issueSummary(issue)
}

function plainDecision(issue: LinearIssue) {
  const blockers = section(issue, 'Blockers')
  if (blockers) return blockers
  if (issue.title.toLowerCase().includes('port current pursued grants')) return 'Decide what belongs on the public team grant board first.'
  return 'Decide whether this is active, later, or no-go.'
}

function workStatus(match: Match) {
  if (match.issue.title.toLowerCase().includes('port current pursued grants')) return 'Inventory cleanup'
  if (match.action === 'hold') return 'Needs decision'
  if (match.issue.state === 'Backlog') return 'Later / watchlist'
  return 'Active research'
}

function isVisibleOpportunity(match: Match) {
  const title = match.issue.title.toLowerCase()
  if (title.includes('port current pursued grants')) return false
  if (title.includes('ca arts council gos') || title.includes('impact projects')) return false
  return true
}

function statusBadge(match: Match) {
  const status = workStatus(match)
  if (status === 'Active research') return badge(status, '#047857', '#ecfdf5', '#bbf7d0')
  if (status === 'Needs decision') return badge(status, '#b45309', '#fffbeb', '#fde68a')
  if (status === 'Inventory cleanup') return badge(status, '#1d4ed8', '#eff6ff', '#bfdbfe')
  return badge(status, '#57534e', '#f5f5f4', '#e7e5e4')
}

function Header({ snapshot }: { snapshot: Snapshot }) {
  const matches = buildMatches(snapshot)
  const visible = matches.filter(isVisibleOpportunity)
  return (
    <header style={{ borderBottom: '1px solid #e7e5e4', background: '#fbfaf8' }}>
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 28px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#78716c', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0 }}>Grant work overview</div>
            <h1 style={{ fontSize: 26, lineHeight: 1.1, margin: '6px 0 8px', color: '#292524', letterSpacing: 0 }}>Current Grant Opportunities</h1>
            <p style={{ maxWidth: 760, color: '#57534e', fontSize: 14, lineHeight: 1.55, margin: 0 }}>
              A board-facing snapshot of the grants and funding routes currently in play: what each opportunity is, why it matters, what needs to happen next, and what decision is blocking progress.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(94px, 1fr))', gap: 8, minWidth: 330 }}>
            <Stat label="Opportunities" value={visible.length} />
            <Stat label="Active Now" value={visible.filter(m => workStatus(m) === 'Active research').length} />
            <Stat label="Need Decision" value={visible.filter(m => workStatus(m) === 'Needs decision').length} />
          </div>
        </div>
      </div>
    </header>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ border: '1px solid #e7e5e4', background: '#fff', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 22, fontWeight: 750, color: '#1c1917' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#78716c', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0 }}>{label}</div>
    </div>
  )
}

function MatrixVariant({ matches }: { matches: Match[] }) {
  const visible = matches.filter(isVisibleOpportunity)
  return (
    <section style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 140px 1.35fr 1.35fr', gap: 0, border: '1px solid #e7e5e4', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
        {['Opportunity', 'Amount / timing', 'Status', 'Next move', 'Decision needed'].map(h => (
          <div key={h} style={{ padding: '10px 12px', background: '#f5f5f4', fontSize: 11, fontWeight: 750, color: '#57534e', textTransform: 'uppercase', letterSpacing: 0 }}>{h}</div>
        ))}
        {visible.map(match => (
          <MatrixRow key={match.issue.identifier} match={match} />
        ))}
      </div>
    </section>
  )
}

function MatrixRow({ match }: { match: Match }) {
  const cells = [
    <div key="issue">
      <div style={{ fontWeight: 750, color: '#292524' }}>{grantName(match.issue)}</div>
      <div style={{ marginTop: 6, color: '#78716c', fontSize: 12, lineHeight: 1.35 }}>{section(match.issue, 'Outcome')}</div>
    </div>,
    <div key="timing" style={{ color: '#292524' }}>{timing(match.issue)}</div>,
    <div key="status">{statusBadge(match)}</div>,
    <div key="next" style={{ color: '#57534e', fontSize: 13, lineHeight: 1.4 }}>{plainNextMove(match.issue)}</div>,
    <div key="decision" style={{ color: '#57534e', fontSize: 13, lineHeight: 1.4 }}>{plainDecision(match.issue)}</div>,
  ]

  return cells.map((cell, index) => (
    <div key={index} style={{ minHeight: 92, padding: '12px', borderTop: '1px solid #e7e5e4', fontSize: 13, lineHeight: 1.35 }}>
      {cell}
    </div>
  ))
}

function BoardVariant({ matches }: { matches: Match[] }) {
  const groups = ['Active research', 'Needs decision', 'Later / watchlist'] as const
  const visible = matches.filter(isVisibleOpportunity)
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
      {groups.map(group => (
        <div key={group} style={{ border: '1px solid #e7e5e4', borderRadius: 8, background: '#fff', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e7e5e4', background: '#f5f5f4' }}>
            {group === 'Active research' ? <ArrowRight size={17} /> : group === 'Needs decision' ? <PauseCircle size={17} /> : <FileText size={17} />}
            <strong style={{ color: '#292524' }}>{group}</strong>
          </div>
          <div style={{ padding: 10, display: 'grid', gap: 10 }}>
            {visible.filter(m => workStatus(m) === group).map(match => (
              <div key={match.issue.identifier} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <strong style={{ fontSize: 13, color: '#292524' }}>{grantName(match.issue)}</strong>
                  {statusBadge(match)}
                </div>
                <div style={{ marginTop: 8, color: '#57534e', fontSize: 12, lineHeight: 1.45 }}>{plainNextMove(match.issue)}</div>
                <div style={{ marginTop: 10, color: '#78716c', fontSize: 12 }}>{timing(match.issue)}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

function RiskVariant({ matches }: { matches: Match[] }) {
  const visible = matches.filter(isVisibleOpportunity)
  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 330px', gap: 16 }}>
      <div style={{ display: 'grid', gap: 10 }}>
        {visible.map(match => (
          <div key={match.issue.identifier} style={{ border: '1px solid #e7e5e4', borderRadius: 8, background: '#fff', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  {statusBadge(match)}
                </div>
                <h2 style={{ fontSize: 17, margin: '8px 0 6px', color: '#292524', letterSpacing: 0 }}>{grantName(match.issue)}</h2>
              </div>
              {workStatus(match) === 'Active research' ? <CheckCircle2 color="#047857" /> : workStatus(match) === 'Needs decision' ? <AlertTriangle color="#b45309" /> : <ShieldQuestion color="#78716c" />}
            </div>
            <p style={{ color: '#57534e', fontSize: 13, lineHeight: 1.5, margin: '8px 0 0' }}>{section(match.issue, 'Outcome')}</p>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <MiniBlock title="Next move" body={plainNextMove(match.issue)} />
              <MiniBlock title="Decision needed" body={plainDecision(match.issue)} />
            </div>
          </div>
        ))}
      </div>
      <aside style={{ border: '1px solid #e7e5e4', borderRadius: 8, background: '#fff', padding: 14, alignSelf: 'start', position: 'sticky', top: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={18} />
          <strong>How to read this</strong>
        </div>
        <p style={{ color: '#78716c', fontSize: 12, lineHeight: 1.45 }}>
          This view is for a board or team conversation. It intentionally leaves out tracker IDs, import notes, and file provenance. The useful question is whether each opportunity is active, later, or a no-go.
        </p>
        <List title="Current split" items={[
          `${visible.filter(m => workStatus(m) === 'Active research').length} active research items`,
          `${visible.filter(m => workStatus(m) === 'Needs decision').length} need a decision before more work`,
          `${visible.filter(m => workStatus(m) === 'Later / watchlist').length} parked for later review`,
        ]} />
      </aside>
    </section>
  )
}

function MiniBlock({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: 8, padding: 10 }}>
      <div style={{ color: '#78716c', fontSize: 11, fontWeight: 750, textTransform: 'uppercase', letterSpacing: 0 }}>{title}</div>
      <div style={{ color: '#292524', fontSize: 13, lineHeight: 1.4, marginTop: 5 }}>{body}</div>
    </div>
  )
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 750, color: '#57534e', textTransform: 'uppercase', letterSpacing: 0 }}>{title}</div>
      <div style={{ marginTop: 8, display: 'grid', gap: 7 }}>
        {items.map(item => (
          <div key={item} style={{ fontSize: 12, color: '#292524', background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: 6, padding: '7px 8px', overflowWrap: 'anywhere' }}>{item}</div>
        ))}
      </div>
    </div>
  )
}

function VariantBar({ active }: { active: string }) {
  return (
    <nav style={{ position: 'fixed', left: '50%', bottom: 18, transform: 'translateX(-50%)', background: '#292524', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 999, padding: 6, display: 'flex', gap: 4, boxShadow: '0 18px 40px rgba(0,0,0,0.22)', zIndex: 50 }}>
      {variantLabels.map(variant => (
        <Link
          key={variant.id}
          href={`/grants/prototype/?variant=${variant.id}`}
          style={{
            color: active === variant.id ? '#292524' : '#f5f5f4',
            background: active === variant.id ? '#fbbf24' : 'transparent',
            textDecoration: 'none',
            fontSize: 13,
            fontWeight: 750,
            padding: '9px 13px',
            borderRadius: 999,
          }}
        >
          {variant.label}
        </Link>
      ))}
    </nav>
  )
}

export default function GrantsLinearPortPrototype({ snapshot }: { snapshot: Snapshot }) {
  const searchParams = useSearchParams()
  const variant = searchParams.get('variant') || undefined
  const active = variantLabels.some(v => v.id === variant) ? variant! : 'matrix'
  const matches = buildMatches(snapshot)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f4ef' }}>
      <Sidebar activePage="dashboard" />
      <main style={{ flex: 1, minWidth: 0, paddingBottom: 92 }}>
        <Header snapshot={snapshot} />
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#57534e', fontSize: 13 }}>
              <Layers3 size={16} />
              <span>Snapshot: {new Date(snapshot.generatedAt).toLocaleString()}</span>
            </div>
            <a href="/north-star-donors/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#57534e', fontSize: 13, textDecoration: 'none' }}>
              Dashboard <ExternalLink size={14} />
            </a>
          </div>
          {active === 'matrix' && <MatrixVariant matches={matches} />}
          {active === 'board' && <BoardVariant matches={matches} />}
          {active === 'risk' && <RiskVariant matches={matches} />}
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 8, color: '#78716c', fontSize: 12 }}>
            <CircleDot size={14} />
            <span>Prototype verdict placeholder: pick the board-facing shape, then turn it into the real grant overview.</span>
          </div>
        </div>
      </main>
      <VariantBar active={active} />
    </div>
  )
}
