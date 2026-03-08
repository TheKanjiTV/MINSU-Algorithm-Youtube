import { NextResponse } from "next/server"
import type { LibraryPlaylist } from "@/lib/types"
import { readGlobalCoursePlaylists, upsertGlobalCoursePlaylist } from "@/lib/global-course-playlists"
import { derivePlaylistTags } from "@/lib/search-tags"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const category = searchParams.get("category")
  const topic = searchParams.get("topic")

  const all = await readGlobalCoursePlaylists()
  const filtered = all.filter((playlist) => {
    if (id && playlist.id !== id) return false
    if (category && playlist.courseCategorySlug !== category) return false
    if (topic && playlist.courseTopicSlug !== topic) return false
    return true
  }).map((playlist) => ({
    ...playlist,
    title: playlist.title || "Untitled Playlist",
    description: playlist.description || "",
    channelTitle: playlist.channelTitle || "YouTube Channel",
    thumbnailUrl: playlist.thumbnailUrl || "",
    videos: Array.isArray(playlist.videos) ? playlist.videos : [],
    totalVideos:
      typeof playlist.totalVideos === "number"
        ? playlist.totalVideos
        : Array.isArray(playlist.videos)
          ? playlist.videos.length
          : 0,
    totalDuration: playlist.totalDuration || "",
    addedAt: playlist.addedAt || new Date().toISOString(),
    completedVideoIds: [],
    skippedVideoIds: [],
    lastVideoId: undefined,
    lastWatchedAt: undefined,
  }))

  return NextResponse.json({ playlists: filtered })
}

export async function POST(request: Request) {
  let payload: LibraryPlaylist | null = null

  try {
    payload = (await request.json()) as LibraryPlaylist
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  if (!payload?.id || !payload?.title || !payload?.courseCategorySlug || !payload?.courseTopicSlug) {
    return NextResponse.json(
      { error: "Missing required fields: id, title, courseCategorySlug, courseTopicSlug." },
      { status: 400 }
    )
  }

  payload.tags = payload.tags?.length ? payload.tags : derivePlaylistTags(payload)
  await upsertGlobalCoursePlaylist({
    ...payload,
    completedVideoIds: [],
    skippedVideoIds: [],
    lastVideoId: undefined,
    lastWatchedAt: undefined,
  })
  return NextResponse.json({ ok: true })
}
