import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { getOrCreatePlaylistQuiz } from "@/lib/playlist-quiz"

type RequestBody = {
  playlistId?: string
  videos?: Array<{ id: string; title: string }>
  preview?: boolean
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  let body: RequestBody = {}
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const playlistId = body.playlistId?.trim()
  const videos = Array.isArray(body.videos) ? body.videos : []
  if (!playlistId || videos.length === 0) {
    return NextResponse.json({ error: "playlistId and videos are required." }, { status: 400 })
  }

  const startedAt = Date.now()
  const questions = await getOrCreatePlaylistQuiz({
    userId,
    playlistId,
    videos: videos.map((video) => ({ id: video.id, title: video.title })),
  })
  const generatedInMs = Date.now() - startedAt

  return NextResponse.json({ ok: true, questions, generatedInMs })
}
