"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Attempt = {
  id: string
  playlistTitle: string
  score: number
  totalQuestions: number
  createdAt: string
}

export function StudentQuizInsights() {
  const [attempts, setAttempts] = useState<Attempt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/quiz/results", { cache: "no-store" })
        const data = await response.json()
        if (!mounted) return
        setAttempts(Array.isArray(data.attempts) ? data.attempts : [])
      } catch {
        if (!mounted) return
        setAttempts([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [])

  const summary = useMemo(() => {
    if (attempts.length === 0) return { total: 0, avgPercent: 0 }
    const totalPercent = attempts.reduce(
      (sum, attempt) => sum + (attempt.score / Math.max(1, attempt.totalQuestions)) * 100,
      0
    )
    return {
      total: attempts.length,
      avgPercent: Math.round(totalPercent / attempts.length),
    }
  }, [attempts])

  return (
    <Card className="border-slate-300">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-900">Quiz Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-slate-300 bg-white p-3">
            <p className="text-xs text-slate-700">Completed Quizzes</p>
            <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
          </div>
          <div className="rounded-md border border-slate-300 bg-white p-3">
            <p className="text-xs text-slate-700">Average Score</p>
            <p className="text-2xl font-bold text-slate-900">{summary.avgPercent}%</p>
          </div>
        </div>

        {loading ? <p className="text-sm text-slate-700">Loading quiz attempts...</p> : null}
        {!loading && attempts.length === 0 ? (
          <p className="text-sm text-slate-700">No completed quiz yet.</p>
        ) : null}

        {!loading && attempts.length > 0 ? (
          <div className="space-y-2">
            {attempts.slice(0, 6).map((attempt) => {
              const percent = Math.round((attempt.score / Math.max(1, attempt.totalQuestions)) * 100)
              return (
                <div key={attempt.id} className="rounded-md border border-slate-300 bg-white p-3">
                  <p className="text-sm font-semibold text-slate-900">{attempt.playlistTitle}</p>
                  <p className="text-xs text-slate-700">
                    Score: {attempt.score}/{attempt.totalQuestions} ({percent}%)
                  </p>
                  <p className="text-xs text-slate-700">
                    {new Date(attempt.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
