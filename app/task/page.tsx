'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import TaskDetailClient from './TaskDetailClient'

function TaskPageInner() {
  const params = useSearchParams()
  const taskId = params.get('taskId') ?? ''
  return <TaskDetailClient taskId={taskId} />
}

export default function TaskPage() {
  return (
    <Suspense fallback={null}>
      <TaskPageInner />
    </Suspense>
  )
}
