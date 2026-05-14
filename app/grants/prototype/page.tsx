import { Suspense } from 'react'
import GrantsLinearPortPrototype from './prototype-client'
import snapshot from '@/prototype-data/grants-linear-dashboard-snapshot.json'

// PROTOTYPE - throwaway review route.
// Question: which Linear grant issues should become dashboard work, and what should the porting review surface look like?
// Three variants, switchable via ?variant=, on /grants/prototype.

export default function GrantsPrototypePage() {
  return (
    <Suspense fallback={null}>
      <GrantsLinearPortPrototype snapshot={snapshot} />
    </Suspense>
  )
}
