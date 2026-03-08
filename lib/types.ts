// ── Library Types ──

export interface LibraryVideo {
  id: string
  title: string
  thumbnailUrl: string
  duration: string
  position: number
}

export interface LibraryPlaylist {
  id: string
  title: string
  description: string
  channelTitle: string
  thumbnailUrl: string
  videos: LibraryVideo[]
  totalVideos: number
  totalDuration: string
  addedAt: string // ISO date
  lastWatchedAt?: string // ISO date
  lastVideoId?: string // resume from here
  completedVideoIds: string[] // video IDs marked as done
  skippedVideoIds?: string[] // video IDs marked as irrelevant
  courseCategorySlug?: string
  courseCategoryLabel?: string
  courseTopicSlug?: string
  courseTopicLabel?: string
  tags?: string[]
}

// ── Notes Types ──

export interface NoteFile {
  id: string
  title: string
  content: string
  playlistId?: string // optional link
  createdAt: string
  updatedAt: string
}

// ── Bookmarks ──

export interface VideoBookmark {
  id: string
  videoId: string
  playlistId: string
  timestamp: number // seconds
  label: string
  createdAt: string
}

// ── Activity ──

export type ActivityType =
  | "video_completed"
  | "playlist_added"
  | "playlist_completed"
  | "note_created"
  | "bookmark_added"

export interface ActivityEvent {
  id: string
  type: ActivityType
  title: string
  playlistId?: string
  videoId?: string
  timestamp: string // ISO date
}

// ── Settings ──

export interface UserSettings {
  playbackSpeed: number
  autoAdvance: boolean
}

// ── Daily Completions ──

export type DailyCompletions = Record<string, number> // "YYYY-MM-DD" → count

// ── Stats ──

export interface LearningStats {
  totalPlaylists: number
  completedPlaylists: number
  totalVideos: number
  completedVideos: number
  completionRate: number
  currentStreak: number
  lastActiveDate?: string
}
