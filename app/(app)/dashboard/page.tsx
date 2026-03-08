"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AddPlaylistDialog } from "@/components/add-playlist-dialog"
import { ProfessorQuizAnalytics } from "@/components/professor-quiz-analytics"
import { ProfessorTeamsPanel, StudentTeamsPanel } from "@/components/dashboard-teams"
import { StudentQuizInsights } from "@/components/student-quiz-insights"
import { EmptyState } from "@/components/empty-state"
import {
  getLibrary,
  getStats,
  getActivity,
  migrateFromOldStorage,
} from "@/lib/storage"
import type { LibraryPlaylist, LearningStats, ActivityEvent } from "@/lib/types"
import {
  LayoutDashboard,
  Play,
  BookOpen,
  CheckCircle2,
  Flame,
  TrendingUp,
  Clock,
} from "lucide-react"

export default function DashboardPage() {
  const { data: session } = useSession()
  const user = session?.user
  const isProfessor = user?.role === "professor"
  const [library, setLibrary] = useState<LibraryPlaylist[]>([])
  const [stats, setStats] = useState<LearningStats | null>(null)
  const [activity, setActivity] = useState<ActivityEvent[]>([])

  function refresh() {
    setLibrary(getLibrary())
    setStats(getStats())
    setActivity(getActivity(5))
  }

  useEffect(() => {
    migrateFromOldStorage()
    refresh()
  }, [])

  const continuePlaylist = library
    .filter((p) => p.lastWatchedAt)
    .sort((a, b) => (b.lastWatchedAt || "").localeCompare(a.lastWatchedAt || ""))[0]

  const topPlaylists = library.slice(0, 4)

  return (
    <div className="container px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isProfessor ? "Manage your teams and assessments." : "Pick up where you left off"}
          </p>
        </div>
        {isProfessor ? <AddPlaylistDialog onAdded={refresh} /> : null}
      </div>

      {isProfessor ? <ProfessorTeamsPanel /> : <StudentTeamsPanel />}

      {library.length === 0 ? (
        <EmptyState
          icon={LayoutDashboard}
          title="Get started"
          description="Add your first YouTube playlist to begin learning distraction-free."
        >
          {isProfessor ? <AddPlaylistDialog onAdded={refresh} /> : null}
        </EmptyState>
      ) : (
        <>
          {continuePlaylist && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Continue Learning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{continuePlaylist.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {continuePlaylist.channelTitle} &middot;{" "}
                      {continuePlaylist.completedVideoIds.length}/{continuePlaylist.totalVideos} videos
                    </p>
                    <Progress
                      value={
                        continuePlaylist.totalVideos > 0
                          ? (continuePlaylist.completedVideoIds.length / continuePlaylist.totalVideos) * 100
                          : 0
                      }
                      className="h-1.5 mt-2"
                    />
                  </div>
                  <Link href={`/watch/${continuePlaylist.id}`}>
                    <Button size="sm" className="gap-2">
                      <Play className="h-3.5 w-3.5" />
                      Resume
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalPlaylists}</p>
                      <p className="text-xs text-muted-foreground">Playlists</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.completedVideos}</p>
                      <p className="text-xs text-muted-foreground">Videos Done</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.currentStreak}</p>
                      <p className="text-xs text-muted-foreground">Day Streak</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.completionRate}%</p>
                      <p className="text-xs text-muted-foreground">Completion</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity yet. Start watching!</p>
                ) : (
                  <div className="space-y-3">
                    {activity.map((event) => (
                      <div key={event.id} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {event.type === "video_completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                          {event.type === "playlist_added" && <BookOpen className="h-4 w-4 text-blue-500" />}
                          {event.type === "playlist_completed" && <TrendingUp className="h-4 w-4 text-purple-500" />}
                          {event.type === "note_created" && <BookOpen className="h-4 w-4 text-yellow-500" />}
                          {event.type === "bookmark_added" && <BookOpen className="h-4 w-4 text-orange-500" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Your Playlists</CardTitle>
                <Link href="/library">
                  <Button variant="ghost" size="sm">
                    View all
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topPlaylists.map((p) => {
                    const progress =
                      p.totalVideos > 0
                        ? Math.round((p.completedVideoIds.length / p.totalVideos) * 100)
                        : 0
                    return (
                      <Link key={p.id} href={`/watch/${p.id}`} className="block">
                        <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{p.title}</p>
                            <p className="text-xs text-muted-foreground">{p.channelTitle}</p>
                          </div>
                          <span className="text-xs font-medium shrink-0">{progress}%</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {isProfessor ? <ProfessorQuizAnalytics /> : null}
      {!isProfessor ? <StudentQuizInsights /> : null}
    </div>
  )
}
