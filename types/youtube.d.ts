interface YTPlayerEvent {
  target: YTPlayer
  data: number
}

interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  stopVideo(): void
  seekTo(seconds: number, allowSeekAhead?: boolean): void
  setPlaybackRate(rate: number): void
  getPlaybackRate(): number
  getAvailablePlaybackRates(): number[]
  getCurrentTime(): number
  getDuration(): number
  getPlayerState(): number
  getVideoUrl(): string
  destroy(): void
}

interface YTPlayerOptions {
  height?: string | number
  width?: string | number
  videoId?: string
  playerVars?: {
    autoplay?: 0 | 1
    cc_load_policy?: 0 | 1
    controls?: 0 | 1
    disablekb?: 0 | 1
    enablejsapi?: 1
    fs?: 0 | 1
    iv_load_policy?: 1 | 3
    modestbranding?: 1
    origin?: string
    rel?: 0 | 1
    start?: number
    playsinline?: 0 | 1
  }
  events?: {
    onReady?: (event: YTPlayerEvent) => void
    onStateChange?: (event: YTPlayerEvent) => void
    onError?: (event: YTPlayerEvent) => void
  }
}

interface YTPlayerConstructor {
  new (elementId: string | HTMLElement, options: YTPlayerOptions): YTPlayer
}

interface YTNamespace {
  Player: YTPlayerConstructor
  PlayerState: {
    UNSTARTED: -1
    ENDED: 0
    PLAYING: 1
    PAUSED: 2
    BUFFERING: 3
    CUED: 5
  }
}

interface Window {
  YT?: YTNamespace
  onYouTubeIframeAPIReady?: () => void
}
