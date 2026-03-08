import type { LibraryVideo, LibraryPlaylist } from "./types"

const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || ""
const API_BASE = "https://www.googleapis.com/youtube/v3"

// ── Extract playlist ID from any YouTube URL ──

export function extractPlaylistId(input: string): string | null {
  const trimmed = input.trim()

  // Direct ID (no URL)
  if (/^[\w-]{10,}$/.test(trimmed)) return trimmed

  if (trimmed.startsWith("list=")) {
    return trimmed.slice(5) || null
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withProtocol)
    return url.searchParams.get("list")
  } catch {
    return null
  }
}

// ── ISO 8601 duration → human-readable ──

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  const h = match?.[1] ? parseInt(match[1]) : 0
  const m = match?.[2] ? parseInt(match[2]) : 0
  const s = match?.[3] ? parseInt(match[3]) : 0

  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  return `${m}:${s.toString().padStart(2, "0")}`
}

function durationToSeconds(duration: string): number {
  const parts = duration.split(":").map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

function formatTotalDuration(videos: LibraryVideo[]): string {
  const totalSec = videos.reduce((sum, v) => sum + durationToSeconds(v.duration), 0)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ── Fetch all playlist items with pagination (handles >50 videos) ──

async function fetchAllPlaylistItems(playlistId: string): Promise<any[]> {
  const items: any[] = []
  let pageToken = ""

  do {
    const url = `${API_BASE}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ""}`
    const data = await fetchYouTubeJson(url)
    if (!data.items) break

    items.push(...data.items)
    pageToken = data.nextPageToken || ""
  } while (pageToken)

  return items
}

// ── Fetch video durations in batches of 50 ──

async function fetchVideoDurations(videoIds: string[]): Promise<Record<string, string>> {
  const durations: Record<string, string> = {}

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50).join(",")
    const url = `${API_BASE}/videos?part=contentDetails&id=${batch}&key=${API_KEY}`
    const data = await fetchYouTubeJson(url)

    if (data.items) {
      for (const item of data.items) {
        durations[item.id] = formatDuration(item.contentDetails.duration)
      }
    }
  }

  return durations
}

// ── Main: fetch full playlist details ──

export async function fetchPlaylistDetails(playlistId: string): Promise<Omit<LibraryPlaylist, "addedAt" | "completedVideoIds">> {
  if (!API_KEY) {
    throw new Error("Missing YouTube API key. Set NEXT_PUBLIC_YOUTUBE_API_KEY in Yt-Learn/.env.local and restart the app.")
  }

  // Step 1: Playlist metadata
  const metaData = await fetchYouTubeJson(`${API_BASE}/playlists?part=snippet&id=${playlistId}&key=${API_KEY}`)

  if (!metaData.items?.length) throw new Error("Playlist not found")
  const info = metaData.items[0].snippet

  // Step 2: All playlist items (with pagination)
  const items = await fetchAllPlaylistItems(playlistId)

  // Step 3: Get durations
  const videoIds = items.map((item: any) => item.contentDetails.videoId)
  const durations = await fetchVideoDurations(videoIds)

  // Step 4: Build video list
  const videos: LibraryVideo[] = items.map((item: any, index: number) => {
    const vid = item.contentDetails.videoId
    return {
      id: vid,
      title: item.snippet.title,
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || "",
      duration: durations[vid] || "0:00",
      position: index + 1,
    }
  })

  return {
    id: playlistId,
    title: info.title,
    description: info.description,
    channelTitle: info.channelTitle,
    thumbnailUrl: info.thumbnails?.high?.url || info.thumbnails?.default?.url || "",
    videos,
    totalVideos: videos.length,
    totalDuration: formatTotalDuration(videos),
  }
}

async function fetchYouTubeJson(url: string): Promise<any> {
  const res = await fetch(url)
  const data = await res.json()

  if (!res.ok || data?.error) {
    const message = data?.error?.message || `YouTube API request failed (${res.status})`
    throw new Error(message)
  }

  return data
}
