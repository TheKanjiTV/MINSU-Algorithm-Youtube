type WatchEventType = "progress" | "ended" | "reset"

export type ValidateWatchInput = {
  userId: string
  playlistId: string
  videoId: string
  event: WatchEventType
  currentTime: number
  duration: number
  playbackSpeed?: number
}

export type ValidateWatchResult = {
  invalidSkip: boolean
  canComplete: boolean
  completed: boolean
}

type WatchVideoState = {
  lastTime: number
  duration: number
  invalidSkip: boolean
  completed: boolean
  updatedAtMs: number
}

type WatchValidationStore = Record<string, Record<string, Record<string, WatchVideoState>>>

const ALLOWED_SKIP_SECONDS = 10
const STATE_TTL_MS = 1000 * 60 * 60 * 6
const CLEANUP_INTERVAL_MS = 1000 * 60 * 15

const globalStore = globalThis as unknown as {
  __yt_watch_validation_store?: WatchValidationStore
  __yt_watch_validation_last_cleanup_ms?: number
}

function getStore(): WatchValidationStore {
  if (!globalStore.__yt_watch_validation_store) {
    globalStore.__yt_watch_validation_store = {}
  }
  return globalStore.__yt_watch_validation_store
}

function cleanupExpired(store: WatchValidationStore, nowMs: number) {
  const lastCleanup = globalStore.__yt_watch_validation_last_cleanup_ms || 0
  if (nowMs - lastCleanup < CLEANUP_INTERVAL_MS) return

  for (const userId of Object.keys(store)) {
    const byPlaylist = store[userId]
    for (const playlistId of Object.keys(byPlaylist)) {
      const byVideo = byPlaylist[playlistId]
      for (const videoId of Object.keys(byVideo)) {
        if (nowMs - byVideo[videoId].updatedAtMs > STATE_TTL_MS) {
          delete byVideo[videoId]
        }
      }
      if (Object.keys(byVideo).length === 0) {
        delete byPlaylist[playlistId]
      }
    }
    if (Object.keys(byPlaylist).length === 0) {
      delete store[userId]
    }
  }

  globalStore.__yt_watch_validation_last_cleanup_ms = nowMs
}

export async function validateWatchEvent(input: ValidateWatchInput): Promise<ValidateWatchResult> {
  const store = getStore()
  const nowMs = Date.now()
  cleanupExpired(store, nowMs)

  const byUser = (store[input.userId] ||= {})
  const byPlaylist = (byUser[input.playlistId] ||= {})
  const safeTime = Number.isFinite(input.currentTime) ? Math.max(0, input.currentTime) : 0
  const safeDuration = Number.isFinite(input.duration) ? Math.max(0, input.duration) : 0
  const speed = Number.isFinite(input.playbackSpeed) ? Math.max(0.5, input.playbackSpeed || 1) : 1
  const allowedJump = ALLOWED_SKIP_SECONDS + speed * 1.5

  if (input.event === "reset") {
    const previous = byPlaylist[input.videoId]
    const restartingFromBeginning = safeTime <= 5
    byPlaylist[input.videoId] = {
      lastTime: safeTime,
      duration: safeDuration,
      // Keep invalid skip state when resuming near the end.
      // This prevents seek-to-end then revisit exploits.
      invalidSkip: restartingFromBeginning ? false : Boolean(previous?.invalidSkip),
      completed: Boolean(previous?.completed),
      updatedAtMs: nowMs,
    }
    return {
      invalidSkip: restartingFromBeginning ? false : Boolean(previous?.invalidSkip),
      canComplete: false,
      completed: Boolean(previous?.completed),
    }
  }

  const state = byPlaylist[input.videoId] || {
    lastTime: safeTime,
    duration: safeDuration,
    invalidSkip: false,
    completed: false,
    updatedAtMs: nowMs,
  }

  const delta = safeTime - state.lastTime
  if (delta > allowedJump) {
    state.invalidSkip = true
  }

  state.lastTime = safeTime
  state.duration = Math.max(state.duration || 0, safeDuration)
  state.updatedAtMs = nowMs

  let canComplete = false
  if (input.event === "ended") {
    const effectiveDuration = state.duration || safeDuration
    canComplete = !state.invalidSkip && effectiveDuration > 0 && safeTime >= Math.max(0, effectiveDuration - 3)
    if (canComplete) {
      state.completed = true
    }
  }

  byPlaylist[input.videoId] = state
  return {
    invalidSkip: state.invalidSkip,
    canComplete,
    completed: state.completed,
  }
}
