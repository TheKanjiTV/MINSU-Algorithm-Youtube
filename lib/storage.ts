import type {
  LibraryPlaylist,
  NoteFile,
  VideoBookmark,
  ActivityEvent,
  ActivityType,
  UserSettings,
  LearningStats,
  DailyCompletions,
} from "./types"

// ── Keys ──

const KEYS = {
  library: "ytlearn_library",
  notes: "ytlearn_notes",
  bookmarks: "ytlearn_bookmarks",
  activity: "ytlearn_activity",
  settings: "ytlearn_settings",
  streak: "ytlearn_streak",
  migrated: "ytlearn_migrated",
  videoPositions: "ytlearn_video_positions",
} as const

// ── Helpers ──

function get<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function set(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new CustomEvent("ytlearn:storage", { detail: key }))
  } catch {
    // Ignore storage quota/serialization errors so UI won't crash.
  }
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ── Library CRUD ──

export function getLibrary(): LibraryPlaylist[] {
  const raw = get<LibraryPlaylist[]>(KEYS.library, [])
  return raw
    .filter((item) => isRecord(item))
    .map((playlist) => {
      const videos = Array.isArray(playlist.videos)
        ? playlist.videos.filter((video) => isRecord(video)).map((video, index) => ({
            id: String(video.id || ""),
            title: String(video.title || "Untitled video"),
            thumbnailUrl: String(video.thumbnailUrl || ""),
            duration: String(video.duration || "0:00"),
            position: typeof video.position === "number" ? video.position : index + 1,
          }))
        : []

      return {
        ...(playlist as LibraryPlaylist),
        id: String(playlist.id || ""),
        title: String(playlist.title || "Untitled Playlist"),
        description: String(playlist.description || ""),
        channelTitle: String(playlist.channelTitle || "YouTube Channel"),
        thumbnailUrl: String(playlist.thumbnailUrl || ""),
        videos,
        totalVideos: typeof playlist.totalVideos === "number" ? playlist.totalVideos : videos.length,
        totalDuration: String(playlist.totalDuration || ""),
        addedAt: String(playlist.addedAt || new Date().toISOString()),
        completedVideoIds: Array.isArray(playlist.completedVideoIds)
          ? playlist.completedVideoIds.filter((id) => typeof id === "string")
          : [],
        skippedVideoIds: Array.isArray(playlist.skippedVideoIds)
          ? playlist.skippedVideoIds.filter((id) => typeof id === "string")
          : [],
      }
    })
    .filter((playlist) => playlist.id.length > 0)
}

export function getPlaylist(id: string): LibraryPlaylist | undefined {
  return getLibrary().find((p) => p.id === id)
}

export function addPlaylist(playlist: LibraryPlaylist) {
  const lib = getLibrary()
  if (lib.some((p) => p.id === playlist.id)) return // no dupes
  lib.push(playlist)
  set(KEYS.library, lib)
  logActivity("playlist_added", playlist.title, playlist.id)
}

export function removePlaylist(id: string) {
  set(
    KEYS.library,
    getLibrary().filter((p) => p.id !== id)
  )
}

export function updatePlaylist(id: string, updates: Partial<LibraryPlaylist>) {
  const lib = getLibrary().map((p) => (p.id === id ? { ...p, ...updates } : p))
  set(KEYS.library, lib)
}

export function getCoursePlaylists(categorySlug: string, topicSlug: string): LibraryPlaylist[] {
  return getLibrary().filter(
    (playlist) =>
      playlist.courseCategorySlug === categorySlug && playlist.courseTopicSlug === topicSlug
  )
}

export function getImportedCoursePlaylists(): LibraryPlaylist[] {
  return getLibrary().filter((playlist) => playlist.courseCategorySlug && playlist.courseTopicSlug)
}

export function resetAllPlaylistProgress() {
  const lib = getLibrary().map((playlist) => ({
    ...playlist,
    completedVideoIds: [],
    skippedVideoIds: [],
    lastVideoId: undefined,
    lastWatchedAt: undefined,
  }))
  set(KEYS.library, lib)
  set(KEYS.videoPositions, {})
}

export function toggleVideoComplete(playlistId: string, videoId: string) {
  const lib = getLibrary()
  const playlist = lib.find((p) => p.id === playlistId)
  if (!playlist) return

  const completed = new Set(playlist.completedVideoIds)
  if (completed.has(videoId)) {
    completed.delete(videoId)
  } else {
    completed.add(videoId)
    logActivity("video_completed", `Video in ${playlist.title}`, playlistId, videoId)
  }
  playlist.completedVideoIds = Array.from(completed)

  // Check if playlist is fully completed
  if (playlist.completedVideoIds.length === playlist.totalVideos) {
    logActivity("playlist_completed", playlist.title, playlistId)
  }

  set(KEYS.library, lib)
}

export function setLastWatched(playlistId: string, videoId: string) {
  updatePlaylist(playlistId, {
    lastWatchedAt: new Date().toISOString(),
    lastVideoId: videoId,
  })
  updateStreak()
}

// ── Notes CRUD ──

export function getNotes(): NoteFile[] {
  const raw = get<NoteFile[]>(KEYS.notes, [])
  return raw
    .filter((item) => isRecord(item))
    .map((note) => ({
      ...(note as NoteFile),
      id: String(note.id || uid()),
      title: String(note.title || "Untitled Note"),
      content: String(note.content || ""),
      playlistId: typeof note.playlistId === "string" ? note.playlistId : undefined,
      createdAt: String(note.createdAt || new Date().toISOString()),
      updatedAt: String(note.updatedAt || new Date().toISOString()),
    }))
}

export function getNote(id: string): NoteFile | undefined {
  return getNotes().find((n) => n.id === id)
}

export function createNote(title: string, playlistId?: string): NoteFile {
  const now = new Date().toISOString()
  const note: NoteFile = {
    id: uid(),
    title,
    content: "",
    playlistId,
    createdAt: now,
    updatedAt: now,
  }
  const notes = getNotes()
  notes.unshift(note)
  set(KEYS.notes, notes)
  logActivity("note_created", title)
  return note
}

export function updateNote(id: string, updates: Partial<NoteFile>) {
  const notes = getNotes().map((n) =>
    n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
  )
  set(KEYS.notes, notes)
}

export function deleteNote(id: string) {
  set(
    KEYS.notes,
    getNotes().filter((n) => n.id !== id)
  )
}

// ── Bookmarks CRUD ──

export function getBookmarks(videoId?: string): VideoBookmark[] {
  const all = get<VideoBookmark[]>(KEYS.bookmarks, [])
  return videoId ? all.filter((b) => b.videoId === videoId) : all
}

export function addBookmark(videoId: string, playlistId: string, timestamp: number, label: string): VideoBookmark {
  const bookmark: VideoBookmark = {
    id: uid(),
    videoId,
    playlistId,
    timestamp,
    label,
    createdAt: new Date().toISOString(),
  }
  const bookmarks = getBookmarks()
  bookmarks.push(bookmark)
  set(KEYS.bookmarks, bookmarks)
  logActivity("bookmark_added", label, playlistId, videoId)
  return bookmark
}

export function deleteBookmark(id: string) {
  set(
    KEYS.bookmarks,
    get<VideoBookmark[]>(KEYS.bookmarks, []).filter((b) => b.id !== id)
  )
}

// ── Activity ──

export function getActivity(limit = 20): ActivityEvent[] {
  return get<ActivityEvent[]>(KEYS.activity, []).slice(0, limit)
}

function logActivity(type: ActivityType, title: string, playlistId?: string, videoId?: string) {
  const events = get<ActivityEvent[]>(KEYS.activity, [])
  events.unshift({
    id: uid(),
    type,
    title,
    playlistId,
    videoId,
    timestamp: new Date().toISOString(),
  })
  // Keep last 500
  set(KEYS.activity, events.slice(0, 500))
}

// ── Settings ──

const DEFAULT_SETTINGS: UserSettings = {
  playbackSpeed: 1,
  autoAdvance: true,
}

export function getSettings(): UserSettings {
  return get<UserSettings>(KEYS.settings, DEFAULT_SETTINGS)
}

export function updateSettings(updates: Partial<UserSettings>) {
  set(KEYS.settings, { ...getSettings(), ...updates })
}

// ── Streak ──

interface StreakData {
  currentStreak: number
  lastActiveDate: string // YYYY-MM-DD
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function updateStreak() {
  const data = get<StreakData>(KEYS.streak, { currentStreak: 0, lastActiveDate: "" })
  const today = todayStr()

  if (data.lastActiveDate === today) return // already counted today

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  if (data.lastActiveDate === yesterdayStr) {
    data.currentStreak += 1
  } else {
    data.currentStreak = 1
  }
  data.lastActiveDate = today
  set(KEYS.streak, data)
}

// ── Stats ──

export function getStats(): LearningStats {
  const library = getLibrary()
  const streak = get<StreakData>(KEYS.streak, { currentStreak: 0, lastActiveDate: "" })

  const totalPlaylists = library.length
  const totalVideos = library.reduce((sum, p) => sum + p.totalVideos, 0)
  const completedVideos = library.reduce((sum, p) => sum + p.completedVideoIds.length, 0)
  const completedPlaylists = library.filter(
    (p) => p.completedVideoIds.length === p.totalVideos && p.totalVideos > 0
  ).length

  return {
    totalPlaylists,
    completedPlaylists,
    totalVideos,
    completedVideos,
    completionRate: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0,
    currentStreak: streak.currentStreak,
    lastActiveDate: streak.lastActiveDate || undefined,
  }
}

// ── Video Resume Positions ──

export function getVideoPosition(videoId: string): number {
  const positions = get<Record<string, number>>(KEYS.videoPositions, {})
  return positions[videoId] || 0
}

export function saveVideoPosition(videoId: string, seconds: number) {
  const positions = get<Record<string, number>>(KEYS.videoPositions, {})
  positions[videoId] = Math.floor(seconds)
  set(KEYS.videoPositions, positions)
}

export function clearVideoPosition(videoId: string) {
  const positions = get<Record<string, number>>(KEYS.videoPositions, {})
  delete positions[videoId]
  set(KEYS.videoPositions, positions)
}

// ── Skip / Irrelevant Videos ──

export function toggleVideoSkip(playlistId: string, videoId: string) {
  const lib = getLibrary()
  const playlist = lib.find((p) => p.id === playlistId)
  if (!playlist) return

  const skipped = new Set(playlist.skippedVideoIds || [])
  if (skipped.has(videoId)) {
    skipped.delete(videoId)
  } else {
    skipped.add(videoId)
    // Also remove from completed if it was completed
    const completed = new Set(playlist.completedVideoIds)
    completed.delete(videoId)
    playlist.completedVideoIds = Array.from(completed)
  }
  playlist.skippedVideoIds = Array.from(skipped)
  set(KEYS.library, lib)
}

// ── Time Remaining ──

function durationToSeconds(duration: string): number {
  const parts = duration.split(":").map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return 0
}

export function getTimeRemaining(playlist: LibraryPlaylist): string {
  const done = new Set(playlist.completedVideoIds)
  const skipped = new Set(playlist.skippedVideoIds || [])
  let remainingSec = 0

  for (const video of playlist.videos) {
    if (!done.has(video.id) && !skipped.has(video.id)) {
      remainingSec += durationToSeconds(video.duration)
    }
  }

  if (remainingSec === 0) return "Done"
  const h = Math.floor(remainingSec / 3600)
  const m = Math.floor((remainingSec % 3600) / 60)
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

// ── Effective video counts (excluding skipped) ──

export function getEffectiveCounts(playlist: LibraryPlaylist) {
  const skipped = new Set(playlist.skippedVideoIds || [])
  const totalActive = playlist.videos.filter((v) => !skipped.has(v.id)).length
  const completedActive = playlist.completedVideoIds.filter((id) => !skipped.has(id)).length
  const progress = totalActive > 0 ? Math.round((completedActive / totalActive) * 100) : 0
  return { totalActive, completedActive, progress }
}

// ── Daily Completions (derived from activity log) ──

export function getDailyCompletions(): DailyCompletions {
  const events = get<ActivityEvent[]>(KEYS.activity, [])
  const counts: DailyCompletions = {}
  for (const event of events) {
    if (event.type === "video_completed") {
      const day = event.timestamp.slice(0, 10)
      counts[day] = (counts[day] || 0) + 1
    }
  }
  return counts
}

// ── Migration from old format ──

export function migrateFromOldStorage() {
  if (typeof window === "undefined") return
  if (localStorage.getItem(KEYS.migrated)) return

  try {
    const old = localStorage.getItem("userPlaylists")
    if (old) {
      const parsed = JSON.parse(old)
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const playlist: LibraryPlaylist = {
            id: item.id || item.playlistId || uid(),
            title: item.title || "Untitled Playlist",
            description: item.description || "",
            channelTitle: item.channelTitle || "",
            thumbnailUrl: item.thumbnailUrl || "",
            videos: (item.videos || []).map((v: any, i: number) => ({
              id: v.id || v.videoId || "",
              title: v.title || "",
              thumbnailUrl: v.thumbnailUrl || v.thumbnail || "",
              duration: v.duration || "0:00",
              position: v.position || i + 1,
            })),
            totalVideos: item.videoCount || item.totalVideos || (item.videos || []).length,
            totalDuration: item.totalDuration || "",
            addedAt: new Date().toISOString(),
            completedVideoIds: [],
          }
          addPlaylist(playlist)
        }
      }
    }
  } catch {
    // ignore migration errors
  }

  localStorage.setItem(KEYS.migrated, "true")
}
