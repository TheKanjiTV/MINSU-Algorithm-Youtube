import { promises as fs } from "fs"
import path from "path"
import bcrypt from "bcryptjs"

export type AppUserRecord = {
  id: string
  name: string
  email: string
  passwordHash: string | null
  image?: string | null
  role?: "student" | "professor" | "user"
  roleId?: string
  createdAt: string
}

const DATA_DIR = path.join(process.cwd(), "data")
const USERS_PATH = path.join(DATA_DIR, "users.json")
const PASSWORD_RESETS_PATH = path.join(DATA_DIR, "password-resets.json")

type PasswordResetRecord = {
  email: string
  codeHash: string
  expiresAt: string
  createdAt: string
}

async function ensureUsersFile() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(USERS_PATH)
  } catch {
    await fs.writeFile(USERS_PATH, "[]", "utf8")
  }
}

async function readUsers() {
  await ensureUsersFile()
  const raw = await fs.readFile(USERS_PATH, "utf8")
  return JSON.parse(raw) as AppUserRecord[]
}

async function writeUsers(users: AppUserRecord[]) {
  await fs.writeFile(USERS_PATH, JSON.stringify(users, null, 2), "utf8")
}

async function ensurePasswordResetsFile() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(PASSWORD_RESETS_PATH)
  } catch {
    await fs.writeFile(PASSWORD_RESETS_PATH, "[]", "utf8")
  }
}

async function readPasswordResets() {
  await ensurePasswordResetsFile()
  const raw = await fs.readFile(PASSWORD_RESETS_PATH, "utf8")
  return JSON.parse(raw) as PasswordResetRecord[]
}

async function writePasswordResets(records: PasswordResetRecord[]) {
  await fs.writeFile(PASSWORD_RESETS_PATH, JSON.stringify(records, null, 2), "utf8")
}

function generateSixDigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function findUserByEmail(email: string) {
  const users = await readUsers()
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null
}

export async function registerUser(input: {
  name: string
  email: string
  password: string
  role?: "student" | "professor" | "user"
  roleId?: string
}) {
  const users = await readUsers()
  const normalizedEmail = input.email.trim().toLowerCase()
  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error("Email already registered")
  }

  const passwordHash = await bcrypt.hash(input.password, 10)
  const newUser: AppUserRecord = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash,
    role: input.role,
    roleId: input.roleId?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  await writeUsers(users)

  return newUser
}

export async function verifyCredentials(input: {
  email: string
  password: string
  role?: string
  roleId?: string
}) {
  const user = await findUserByEmail(input.email)
  if (!user || !user.passwordHash) return null

  const isMatch = await bcrypt.compare(input.password, user.passwordHash)
  if (!isMatch) return null

  if (user.role && input.role && user.role !== input.role) return null
  if (user.roleId && user.roleId.toLowerCase() !== (input.roleId || "").trim().toLowerCase()) {
    return null
  }

  return user
}

export async function upsertGoogleUser(input: {
  name?: string | null
  email?: string | null
  image?: string | null
}) {
  if (!input.email) return null

  const users = await readUsers()
  const normalizedEmail = input.email.toLowerCase()
  const existing = users.find((user) => user.email.toLowerCase() === normalizedEmail)

  if (existing) {
    existing.name = input.name || existing.name
    existing.image = input.image || existing.image
    await writeUsers(users)
    return existing
  }

  const created: AppUserRecord = {
    id: crypto.randomUUID(),
    name: input.name || "Google User",
    email: normalizedEmail,
    passwordHash: null,
    image: input.image,
    createdAt: new Date().toISOString(),
  }

  users.push(created)
  await writeUsers(users)
  return created
}

export async function updateUserDisplayName(input: { userId?: string; email?: string; name: string }) {
  const nextName = input.name.trim()
  if (!nextName) throw new Error("Display name is required")

  const users = await readUsers()
  const found = users.find((user) => {
    if (input.userId && user.id === input.userId) return true
    if (input.email && user.email.toLowerCase() === input.email.toLowerCase()) return true
    return false
  })

  if (!found) return null
  found.name = nextName
  await writeUsers(users)
  return found
}

export async function createPasswordResetCode(email: string) {
  const user = await findUserByEmail(email)
  if (!user) return null

  const code = generateSixDigitCode()
  const codeHash = await bcrypt.hash(code, 10)
  const now = Date.now()
  const expiresAt = new Date(now + 10 * 60 * 1000).toISOString()

  const records = await readPasswordResets()
  const nextRecords = records.filter((record) => record.email.toLowerCase() !== email.toLowerCase())
  nextRecords.push({
    email: email.toLowerCase(),
    codeHash,
    expiresAt,
    createdAt: new Date(now).toISOString(),
  })
  await writePasswordResets(nextRecords)

  return { code, userName: user.name || "User" }
}

export async function resetPasswordWithCode(input: { email: string; code: string; newPassword: string }) {
  const email = input.email.trim().toLowerCase()
  const records = await readPasswordResets()
  const record = records.find((entry) => entry.email.toLowerCase() === email)
  if (!record) {
    return { ok: false as const, error: "Invalid or expired code." }
  }

  if (Date.now() > new Date(record.expiresAt).getTime()) {
    const filtered = records.filter((entry) => entry.email.toLowerCase() !== email)
    await writePasswordResets(filtered)
    return { ok: false as const, error: "Code expired. Request a new one." }
  }

  const isMatch = await bcrypt.compare(input.code.trim(), record.codeHash)
  if (!isMatch) {
    return { ok: false as const, error: "Invalid or expired code." }
  }

  const users = await readUsers()
  const user = users.find((entry) => entry.email.toLowerCase() === email)
  if (!user) {
    return { ok: false as const, error: "Account not found." }
  }

  user.passwordHash = await bcrypt.hash(input.newPassword, 10)
  await writeUsers(users)

  const filtered = records.filter((entry) => entry.email.toLowerCase() !== email)
  await writePasswordResets(filtered)

  return { ok: true as const }
}
