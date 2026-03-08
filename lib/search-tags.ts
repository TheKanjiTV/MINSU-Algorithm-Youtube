import type { LibraryPlaylist } from "@/lib/types"

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function tokenize(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
}

const EXTRA_KEYWORDS = [
  "excel",
  "sql",
  "python",
  "javascript",
  "react",
  "node",
  "aws",
  "azure",
  "cybersecurity",
  "marketing",
  "business",
  "finance",
  "bookkeeping",
  "design",
  "ui",
  "ux",
  "music",
  "health",
  "fitness",
  "education",
]

export function derivePlaylistTags(playlist: Partial<LibraryPlaylist>): string[] {
  const raw = [
    playlist.courseCategoryLabel || "",
    playlist.courseTopicLabel || "",
    playlist.title || "",
    playlist.channelTitle || "",
    playlist.description || "",
    ...(playlist.tags || []),
  ].join(" ")

  const tokens = tokenize(raw)
  const unique = new Set<string>()

  tokens.forEach((token) => {
    if (token.length < 3 && token !== "ui" && token !== "ux") return
    unique.add(token)
  })

  const haystack = normalize(raw)
  EXTRA_KEYWORDS.forEach((keyword) => {
    if (haystack.includes(keyword)) unique.add(keyword)
  })

  return Array.from(unique).slice(0, 10)
}

export function searchPlaylistScore(playlist: LibraryPlaylist, query: string): number {
  const q = normalize(query)
  if (!q) return 0

  const title = normalize(playlist.title || "")
  const topic = normalize(playlist.courseTopicLabel || "")
  const category = normalize(playlist.courseCategoryLabel || "")
  const channel = normalize(playlist.channelTitle || "")
  const description = normalize(playlist.description || "")
  const tags = (playlist.tags || []).map(normalize)

  let score = 0

  if (title === q) score += 120
  else if (title.includes(q)) score += 90

  if (topic === q) score += 110
  else if (topic.includes(q)) score += 85

  if (category === q) score += 80
  else if (category.includes(q)) score += 60

  if (tags.includes(q)) score += 100
  score += tags.filter((tag) => tag.includes(q)).length * 20

  if (channel.includes(q)) score += 35
  if (description.includes(q)) score += 25

  return score
}
