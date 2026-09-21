"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, LoaderCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { AiApiError, aiClient } from "@/lib/ai/client"
import type { TaskRecord } from "@/lib/ai/types"
import { TaskDetail } from "@/components/workbench/workforce-dashboard"

function detailError(error: unknown) {
  if (error instanceof AiApiError) {
    if (error.status === 401) return "Authentication required to view this task."
    if (error.status === 403) return "You are not authorized to view this task."
    if (error.status === 404) return "Task not found."
    if (error.status >= 500) return "The backend could not load this task."
  }
  return "The backend could not load this task."
}

export default function TaskDetailPage() {
  const params = useParams<{ taskId: string }>()
  const router = useRouter()
  const { loading: authLoading } = useAuth()
  const [task, setTask] = React.useState<TaskRecord | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const taskId = params.taskId

  React.useEffect(() => {
    if (authLoading || !taskId) return
    let active = true
    setLoading(true)
    setError(null)
    void aiClient.getTask(taskId)
      .then((result) => {
        if (active) setTask(result)
      })
      .catch((requestError: unknown) => {
        if (active) setError(detailError(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [authLoading, taskId])

  return <main className="workbenchShell">
    <section className="workbenchContent">
      <header className="workbenchTopbar">
        <div><span className="workbenchEyebrow">AI WORKFORCE / TASK</span><h1>Task detail</h1></div>
        <button className="outlineButton" onClick={() => router.back()}><ArrowLeft className="size-4" /> Back to tasks</button>
      </header>
      <div className="workbenchPage taskDetailPage">
        {loading && <div className="loadingBox"><LoaderCircle className="size-5 spin" /> Loading task {taskId}...</div>}
        {!loading && error && <section className="surfacePanel taskDetailError"><strong>{error}</strong><p>Return to the Tasks page and try again.</p><button className="outlineButton" onClick={() => router.back()}><ArrowLeft className="size-4" /> Back to tasks</button></section>}
        {!loading && !error && task && <TaskDetail task={task} onClose={() => router.back()} />}
        <footer className="workbenchFooter">GritGrid Technologies · AI Workforce Control Center · <span>Server-side API gateway</span></footer>
      </div>
    </section>
  </main>
}
