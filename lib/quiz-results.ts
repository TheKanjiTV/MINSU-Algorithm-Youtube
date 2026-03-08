import { promises as fs } from "node:fs"
import path from "node:path"

export type QuizAttempt = {
  id: string
  userId: string
  userName: string
  userEmail: string
  playlistId: string
  playlistTitle: string
  teamId?: string
  teamName?: string
  professorId?: string
  totalQuestions: number
  score: number
  createdAt: string
}

const FILE_PATH = path.join(process.cwd(), "data", "quiz-results.json")

async function ensureStoreFile() {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true })
  try {
    await fs.access(FILE_PATH)
  } catch {
    await fs.writeFile(FILE_PATH, "[]", "utf8")
  }
}

async function readAttempts(): Promise<QuizAttempt[]> {
  await ensureStoreFile()
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8")
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as QuizAttempt[]
  } catch {
    return []
  }
}

async function writeAttempts(attempts: QuizAttempt[]) {
  await fs.writeFile(FILE_PATH, JSON.stringify(attempts, null, 2), "utf8")
}

export async function createQuizAttempt(input: Omit<QuizAttempt, "id" | "createdAt">) {
  const all = await readAttempts()
  const attempt: QuizAttempt = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  }
  all.unshift(attempt)
  await writeAttempts(all)
  return attempt
}

export async function createQuizAttemptOnce(input: Omit<QuizAttempt, "id" | "createdAt">) {
  const all = await readAttempts()
  const existing = all.find((attempt) => {
    if (attempt.userId !== input.userId) return false
    if (attempt.playlistId !== input.playlistId) return false
    return (attempt.teamId || "") === (input.teamId || "")
  })
  if (existing) {
    return { created: false as const, attempt: existing }
  }

  const attempt: QuizAttempt = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  }
  all.unshift(attempt)
  await writeAttempts(all)
  return { created: true as const, attempt }
}

export async function getQuizAttemptsByUser(userId: string) {
  const all = await readAttempts()
  return all.filter((attempt) => attempt.userId === userId)
}

export async function getAllQuizAttempts() {
  return readAttempts()
}

export async function getLatestQuizAttemptForUserPlaylist(userId: string, playlistId: string) {
  const all = await readAttempts()
  return (
    all.find((attempt) => attempt.userId === userId && attempt.playlistId === playlistId) || null
  )
}

export async function getQuizAttemptsByProfessor(professorId: string) {
  const all = await readAttempts()
  return all.filter((attempt) => attempt.professorId === professorId)
}
