import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { createCertificateOnce, getCertificateByUserPlaylist } from "@/lib/certificates"
import { getLatestQuizAttemptForUserPlaylist } from "@/lib/quiz-results"

type PostBody = {
  playlistId?: string
  course?: string
  recipientName?: string
  issuedDate?: string
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const playlistId = searchParams.get("playlistId")?.trim()
  if (!playlistId) {
    return NextResponse.json({ error: "playlistId is required." }, { status: 400 })
  }

  const [attempt, certificate] = await Promise.all([
    getLatestQuizAttemptForUserPlaylist(user.id, playlistId),
    getCertificateByUserPlaylist(user.id, playlistId),
  ])

  return NextResponse.json({
    hasQuizCompletion: Boolean(attempt),
    attempt,
    certificate,
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const user = session?.user
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: PostBody = {}
  try {
    body = (await request.json()) as PostBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const playlistId = body.playlistId?.trim()
  const course = body.course?.trim()
  const recipientName = body.recipientName?.trim()
  const issuedDate = body.issuedDate?.trim()

  if (!playlistId || !course || !recipientName || !issuedDate) {
    return NextResponse.json(
      { error: "Missing fields: playlistId, course, recipientName, issuedDate." },
      { status: 400 }
    )
  }

  const attempt = await getLatestQuizAttemptForUserPlaylist(user.id, playlistId)
  if (!attempt) {
    return NextResponse.json({ error: "Complete the quiz first." }, { status: 403 })
  }

  const result = await createCertificateOnce({
    userId: user.id,
    playlistId,
    course,
    recipientName,
    issuedDate,
  })

  if (!result.created) {
    return NextResponse.json(
      { error: "Certificate already generated for this playlist.", certificate: result.certificate },
      { status: 409 }
    )
  }

  return NextResponse.json({ ok: true, certificate: result.certificate })
}
