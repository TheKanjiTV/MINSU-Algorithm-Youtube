import { promises as fs } from "node:fs"
import path from "node:path"
import type { LibraryPlaylist } from "@/lib/types"

const FILE_PATH = path.join(process.cwd(), "data", "course-playlists.global.json")

async function ensureStoreFile() {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true })
  try {
    await fs.access(FILE_PATH)
  } catch {
    await fs.writeFile(FILE_PATH, "[]", "utf8")
  }
}

export async function readGlobalCoursePlaylists(): Promise<LibraryPlaylist[]> {
  await ensureStoreFile()
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8")
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as LibraryPlaylist[]
  } catch {
    return []
  }
}

function sanitizeGlobalPlaylist(playlist: LibraryPlaylist): LibraryPlaylist {
  const videos = Array.isArray(playlist.videos) ? playlist.videos : []
  return {
    ...playlist,
    title: playlist.title || "Untitled Playlist",
    description: playlist.description || "",
    channelTitle: playlist.channelTitle || "YouTube Channel",
    thumbnailUrl: playlist.thumbnailUrl || "",
    videos,
    totalVideos: typeof playlist.totalVideos === "number" ? playlist.totalVideos : videos.length,
    totalDuration: playlist.totalDuration || "",
    addedAt: playlist.addedAt || new Date().toISOString(),
    completedVideoIds: [],
    skippedVideoIds: [],
    lastVideoId: undefined,
    lastWatchedAt: undefined,
  }
}

export async function upsertGlobalCoursePlaylist(playlist: LibraryPlaylist): Promise<void> {
  const all = (await readGlobalCoursePlaylists()).map((item) => sanitizeGlobalPlaylist(item))
  const next = all
    .filter((item) => item.id !== playlist.id)
  next.unshift(sanitizeGlobalPlaylist(playlist))
  await fs.writeFile(FILE_PATH, JSON.stringify(next, null, 2), "utf8")
}
