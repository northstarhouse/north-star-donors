'use client'

import { Suspense } from 'react'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TaskDetailClient from './TaskDetailClient'
import { GRANTS_OVERVIEW_HREF, GRANTS_OVERVIEW_TASK_ID } from '@/lib/taskRoutes'

function TaskPageInner() {
  const router = useRouter()
  const params = useSearchParams()
  const taskId = params.get('taskId') ?? ''

  useEffect(() => {
    if (taskId === GRANTS_OVERVIEW_TASK_ID) router.replace(GRANTS_OVERVIEW_HREF)
  }, [router, taskId])

  if (taskId === GRANTS_OVERVIEW_TASK_ID) return null
  return <TaskDetailClient taskId={taskId} />
}

export default function TaskPage() {
  return (
    <Suspense fallback={null}>
      <TaskPageInner />
    </Suspense>
  )
}
