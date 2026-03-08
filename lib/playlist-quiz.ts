import { promises as fs } from "node:fs"
import path from "node:path"
import { readGlobalCoursePlaylists } from "@/lib/global-course-playlists"

export type QuizQuestion = {
  id: string
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

type PlaylistVideoInput = {
  id: string
  title: string
}

type QuizStore = {
  __global__?: Record<string, QuizQuestion[]>
  __meta__?: { version: number; prebuiltAt: string }
  [key: string]: unknown
}

const FILE_PATH = path.join(process.cwd(), "data", "playlist-quizzes.json")
const QUIZ_STORE_VERSION = 3
let memoryStore: QuizStore | null = null

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function cleanTitle(title: string) {
  return title
    .replace(/\[[^\]]*]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractMainTopic(title: string): string {
  const cleaned = cleanTitle(title)
  const chunks = cleaned
    .split(/[-|:]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
  if (chunks.length > 1) {
    return chunks[0].length >= chunks[1].length ? chunks[0] : chunks[1]
  }
  return cleaned || "Main topic"
}

function buildTopicPool(videos: PlaylistVideoInput[]) {
  return videos.map((video) => ({
    id: video.id,
    title: cleanTitle(video.title),
    topic: extractMainTopic(video.title),
  }))
}

function generateFastTopicQuiz(videos: PlaylistVideoInput[]): QuizQuestion[] {
  const pool = buildTopicPool(videos).filter((video) => video.id && video.title)
  if (pool.length < 2) return []

  return pool.map((video, index) => {
    const distractors = shuffle(
      pool
        .filter((entry) => entry.id !== video.id)
        .map((entry) => entry.topic)
        .filter(Boolean)
    ).slice(0, 3)

    const rawOptions = [video.topic, ...distractors]
    const uniqueOptions = Array.from(new Set(rawOptions))
    while (uniqueOptions.length < 4 && uniqueOptions.length < pool.length) {
      const fallback = pool[uniqueOptions.length]?.topic
      if (fallback && !uniqueOptions.includes(fallback)) {
        uniqueOptions.push(fallback)
      } else {
        break
      }
    }

    const options = shuffle(uniqueOptions).slice(0, 4)
    const answerIndex = Math.max(0, options.findIndex((option) => option === video.topic))

    const pattern = index % 4
    let question = `In video ${index + 1}, what is the main topic?`
    let explanation = `Video ${index + 1} is "${video.title}", which focuses on "${video.topic}".`

    if (pattern === 1) {
      question = `Which title best matches video ${index + 1}?`
      explanation = `The best matching title for video ${index + 1} is "${video.title}".`
    } else if (pattern === 2) {
      question = `Video ${index + 1} in this playlist focuses on which concept?`
      explanation = `Video ${index + 1} focuses on "${video.topic}" from "${video.title}".`
    } else if (pattern === 3) {
      question = `What is the likely lesson focus of playlist video ${index + 1}?`
      explanation = `Playlist video ${index + 1} highlights "${video.topic}".`
    }

    return {
      id: `${video.id}-topic-${index + 1}`,
      question,
      options,
      answerIndex,
      explanation,
    }
  })
}

async function ensureStoreFile() {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true })
  try {
    await fs.access(FILE_PATH)
  } catch {
    await fs.writeFile(FILE_PATH, "{}", "utf8")
  }
}

async function readStore(): Promise<QuizStore> {
  await ensureStoreFile()
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8")
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as QuizStore
  } catch {
    return {}
  }
}

async function readStoreCached(force = false): Promise<QuizStore> {
  if (!force && memoryStore) {
    return memoryStore
  }
  const store = await readStore()
  memoryStore = store
  return store
}

async function writeStore(store: QuizStore) {
  await fs.writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf8")
  memoryStore = store
}

export async function prebuildGlobalPlaylistQuizzes(force = false): Promise<void> {
  const store = await readStoreCached(force)
  const shouldSkip =
    !force &&
    store.__meta__?.version === QUIZ_STORE_VERSION &&
    store.__meta__?.prebuiltAt &&
    typeof store.__meta__.prebuiltAt === "string"
  if (shouldSkip) return

  const globals = await readGlobalCoursePlaylists()
  const globalBucket: Record<string, QuizQuestion[]> = {}
  for (const playlist of globals) {
    const videos = Array.isArray(playlist.videos)
      ? playlist.videos.map((video) => ({ id: video.id, title: video.title }))
      : []
    globalBucket[playlist.id] = generateFastTopicQuiz(videos)
  }

  store.__global__ = globalBucket
  store.__meta__ = { version: QUIZ_STORE_VERSION, prebuiltAt: new Date().toISOString() }
  await writeStore(store)
}

export async function getOrCreatePlaylistQuiz(input: {
  userId: string
  playlistId: string
  videos: PlaylistVideoInput[]
}): Promise<QuizQuestion[]> {
  const store = await readStoreCached(false)
  if (store.__meta__?.version !== QUIZ_STORE_VERSION) {
    store.__global__ = {}
    store.__meta__ = { version: QUIZ_STORE_VERSION, prebuiltAt: new Date().toISOString() }
  }
  const globalBucket = (store.__global__ ||= {})
  const shared = globalBucket[input.playlistId]
  if (shared?.length) {
    return shared
  }

  const questions = generateFastTopicQuiz(input.videos)
  globalBucket[input.playlistId] = questions
  await writeStore(store)
  return questions
}
