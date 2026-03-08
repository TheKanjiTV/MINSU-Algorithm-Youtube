import { promises as fs } from "node:fs"
import path from "node:path"

export type ManualQuizQuestion = {
  id: string
  question: string
  options: string[]
  answerIndex: number
  explanation: string
}

export type TeamRecord = {
  id: string
  name: string
  professorId: string
  professorName: string
  joinCode: string
  playlistId?: string
  playlistTitle?: string
  quizMode: "generated" | "manual"
  manualQuestions: ManualQuizQuestion[]
  createdAt: string
  updatedAt: string
}

export type TeamMembership = {
  teamId: string
  userId: string
  userName: string
  userEmail: string
  joinedAt: string
}

type TeamStore = {
  teams: TeamRecord[]
  memberships: TeamMembership[]
}

const FILE_PATH = path.join(process.cwd(), "data", "teams.json")

async function ensureStoreFile() {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true })
  try {
    await fs.access(FILE_PATH)
  } catch {
    const initial: TeamStore = { teams: [], memberships: [] }
    await fs.writeFile(FILE_PATH, JSON.stringify(initial, null, 2), "utf8")
  }
}

async function readStore(): Promise<TeamStore> {
  await ensureStoreFile()
  try {
    const raw = await fs.readFile(FILE_PATH, "utf8")
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return { teams: [], memberships: [] }
    return {
      teams: Array.isArray(parsed.teams) ? (parsed.teams as TeamRecord[]) : [],
      memberships: Array.isArray(parsed.memberships) ? (parsed.memberships as TeamMembership[]) : [],
    }
  } catch {
    return { teams: [], memberships: [] }
  }
}

async function writeStore(store: TeamStore) {
  await fs.writeFile(FILE_PATH, JSON.stringify(store, null, 2), "utf8")
}

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

async function uniqueJoinCode() {
  const store = await readStore()
  let code = randomCode()
  const used = new Set(store.teams.map((team) => team.joinCode))
  while (used.has(code)) {
    code = randomCode()
  }
  return code
}

export async function createTeam(input: {
  name: string
  professorId: string
  professorName: string
}) {
  const store = await readStore()
  const now = new Date().toISOString()
  const team: TeamRecord = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    professorId: input.professorId,
    professorName: input.professorName,
    joinCode: await uniqueJoinCode(),
    quizMode: "generated",
    manualQuestions: [],
    createdAt: now,
    updatedAt: now,
  }
  store.teams.unshift(team)
  await writeStore(store)
  return team
}

export async function listTeamsByProfessor(professorId: string) {
  const store = await readStore()
  return store.teams.filter((team) => team.professorId === professorId)
}

export async function listTeamsByStudent(userId: string) {
  const store = await readStore()
  const teamIds = new Set(store.memberships.filter((m) => m.userId === userId).map((m) => m.teamId))
  return store.teams.filter((team) => teamIds.has(team.id))
}

export async function getTeamById(teamId: string) {
  const store = await readStore()
  return store.teams.find((team) => team.id === teamId) || null
}

export async function getTeamByJoinCode(joinCode: string) {
  const store = await readStore()
  return store.teams.find((team) => team.joinCode === joinCode.trim().toUpperCase()) || null
}

export async function joinTeam(input: {
  joinCode: string
  userId: string
  userName: string
  userEmail: string
}) {
  const store = await readStore()
  const team = store.teams.find((entry) => entry.joinCode === input.joinCode.trim().toUpperCase())
  if (!team) {
    return { ok: false as const, error: "Invalid join link or code." }
  }

  const exists = store.memberships.some((m) => m.teamId === team.id && m.userId === input.userId)
  if (!exists) {
    store.memberships.push({
      teamId: team.id,
      userId: input.userId,
      userName: input.userName,
      userEmail: input.userEmail,
      joinedAt: new Date().toISOString(),
    })
    await writeStore(store)
  }

  return { ok: true as const, team }
}

export async function updateTeamAssessment(input: {
  teamId: string
  professorId: string
  playlistId?: string
  playlistTitle?: string
  quizMode: "generated" | "manual"
  manualQuestions: ManualQuizQuestion[]
}) {
  const store = await readStore()
  const team = store.teams.find((entry) => entry.id === input.teamId)
  if (!team) return null
  if (team.professorId !== input.professorId) return null

  team.playlistId = input.playlistId?.trim() || undefined
  team.playlistTitle = input.playlistTitle?.trim() || undefined
  team.quizMode = input.quizMode
  team.manualQuestions = input.manualQuestions
  team.updatedAt = new Date().toISOString()
  await writeStore(store)
  return team
}

export async function listTeamMembers(teamId: string) {
  const store = await readStore()
  return store.memberships.filter((m) => m.teamId === teamId)
}

