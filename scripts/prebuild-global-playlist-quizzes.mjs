import fs from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const playlistsPath = path.join(root, "data", "course-playlists.global.json")
const quizzesPath = path.join(root, "data", "playlist-quizzes.json")
const QUIZ_STORE_VERSION = 3

function shuffle(items) {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function cleanTitle(title) {
  return String(title || "")
    .replace(/\[[^\]]*]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function extractMainTopic(title) {
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

function generateFastTopicQuiz(videos) {
  const pool = (Array.isArray(videos) ? videos : [])
    .map((video) => ({
      id: video.id,
      title: cleanTitle(video.title),
      topic: extractMainTopic(video.title),
    }))
    .filter((video) => video.id && video.title)

  if (pool.length < 2) return []
  return pool.map((video, index) => {
    const distractors = shuffle(pool.filter((entry) => entry.id !== video.id).map((entry) => entry.topic)).slice(0, 3)
    const options = shuffle(Array.from(new Set([video.topic, ...distractors]))).slice(0, 4)
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

async function run() {
  const raw = await fs.readFile(playlistsPath, "utf8")
  const playlists = JSON.parse(raw)
  const globalBucket = {}
  for (const playlist of playlists) {
    globalBucket[playlist.id] = generateFastTopicQuiz(playlist.videos || [])
  }
  const payload = {
    __meta__: { version: QUIZ_STORE_VERSION, prebuiltAt: new Date().toISOString() },
    __global__: globalBucket,
  }
  await fs.writeFile(quizzesPath, JSON.stringify(payload, null, 2), "utf8")
  console.log(`Prebuilt quizzes for ${Object.keys(globalBucket).length} playlists.`)
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
