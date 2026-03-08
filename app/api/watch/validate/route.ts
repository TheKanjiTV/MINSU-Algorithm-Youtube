import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { validateWatchEvent } from "@/lib/watch-validation"

type RequestBody = {
  playlistId?: string
  videoId?: string
  event?: "progress" | "ended" | "reset"
  currentTime?: number
  duration?: number
  playbackSpeed?: number
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

  if (!body.playlistId || !body.videoId || !body.event) {
    return NextResponse.json(
      { error: "Missing required fields: playlistId, videoId, event." },
      { status: 400 }
    )
  }

  const result = await validateWatchEvent({
    userId,
    playlistId: body.playlistId,
    videoId: body.videoId,
    event: body.event,
    currentTime: Number(body.currentTime || 0),
    duration: Number(body.duration || 0),
    playbackSpeed: Number(body.playbackSpeed || 1),
  })

  return NextResponse.json({ ok: true, ...result })
}

